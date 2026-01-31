import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { HttpError } from "../lib/httpError";
import { publishInterviewEvent } from "../realtime/interviewEvents";

export const interviewsRouter = Router();

const createInterviewSchema = z.object({
  userId: z.string().uuid().optional(),
  jobRoleId: z.string().uuid().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  interviewerName: z.string().trim().max(120).optional().nullable(),
  interviewerEmail: z.string().trim().email().max(254).optional().nullable(),
  meetingLink: z.string().trim().url().max(1000).optional().nullable(),
});

const updateInterviewSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  startedAt: z.string().datetime().optional().nullable(),
  endedAt: z.string().datetime().optional().nullable(),
});

const feedbackSchema = z.object({
  overallScore: z.number().int().min(0).max(100).optional().nullable(),
  outcome: z.enum(["PASS", "FAIL", "PENDING"]).optional().nullable(),
  notes: z.string().trim().max(10000).optional().nullable(),
  categoryScores: z.record(z.any()).optional().nullable(),
});

interviewsRouter.get("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const all = req.query.all === "true";

    const where =
      all && dbUser.role === "ADMIN"
        ? { ...(status ? { status: status as any } : {}) }
        : { userId: dbUser.id, ...(status ? { status: status as any } : {}) };

    const interviews = await prisma.interview.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
      },
    });

    res.json({ interviews });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.post("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const input = createInterviewSchema.parse(req.body ?? {});

    const targetUserId = input.userId && dbUser.role === "ADMIN" ? input.userId : dbUser.id;

    const interview = await prisma.interview.create({
      data: {
        userId: targetUserId,
        jobRoleId: input.jobRoleId ?? null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        interviewerName: input.interviewerName ?? null,
        interviewerEmail: input.interviewerEmail ?? null,
        meetingLink: input.meetingLink ?? null,
        status: input.scheduledAt ? "SCHEDULED" : "IN_PROGRESS",
      },
      include: {
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
      },
    });

    await prisma.interviewEvent.create({
      data: { interviewId: interview.id, type: "CREATED", payload: { status: interview.status } },
    });
    publishInterviewEvent({ interviewId: interview.id, type: "CREATED", payload: { status: interview.status } });

    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.get("/:id", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: {
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
        documents: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");
    res.json({ interview });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.patch("/:id", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const input = updateInterviewSchema.parse(req.body ?? {});

    const existing = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && existing.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    const interview = await prisma.interview.update({
      where: { id: req.params.id },
      data: {
        status: input.status ?? undefined,
        startedAt: input.startedAt === undefined ? undefined : input.startedAt ? new Date(input.startedAt) : null,
        endedAt: input.endedAt === undefined ? undefined : input.endedAt ? new Date(input.endedAt) : null,
      },
      include: {
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
      },
    });

    await prisma.interviewEvent.create({
      data: { interviewId: interview.id, type: "UPDATED", payload: { status: interview.status } },
    });
    publishInterviewEvent({ interviewId: interview.id, type: "UPDATED", payload: { status: interview.status } });

    res.json({ interview });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.put("/:id/feedback", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const input = feedbackSchema.parse(req.body ?? {});

    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    const feedback = await prisma.interviewFeedback.upsert({
      where: { interviewId: req.params.id },
      create: {
        interviewId: req.params.id,
        overallScore: input.overallScore ?? null,
        outcome: input.outcome ?? null,
        notes: input.notes ?? null,
        categoryScores: input.categoryScores ?? undefined,
      },
      update: {
        overallScore: input.overallScore ?? undefined,
        outcome: input.outcome ?? undefined,
        notes: input.notes ?? undefined,
        categoryScores: input.categoryScores ?? undefined,
      },
    });

    await prisma.interviewEvent.create({
      data: { interviewId: req.params.id, type: "FEEDBACK", payload: { outcome: feedback.outcome } },
    });
    publishInterviewEvent({
      interviewId: req.params.id,
      type: "FEEDBACK",
      payload: { outcome: feedback.outcome, overallScore: feedback.overallScore },
    });

    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.get("/:id/events", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    res.write(`event: ping\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const listener = (event: any) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.payload ?? {})}\n\n`);
    };

    const { interviewEvents } = await import("../realtime/interviewEvents");
    interviewEvents.on(req.params.id, listener);

    req.on("close", () => {
      interviewEvents.off(req.params.id, listener);
    });
  } catch (err) {
    next(err);
  }
});

