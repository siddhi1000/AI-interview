import { Router } from "express";
import { prisma } from "../db/prisma";

export const adminRouter = Router();

adminRouter.get("/candidates", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const take = Math.min(100, Math.max(1, Number(req.query.take ?? 25)));
    const skip = Math.max(0, Number(req.query.skip ?? 0));

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { profile: { firstName: { contains: q, mode: "insensitive" } } },
              { profile: { lastName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        profile: true,
        interviews: {
          where: { status: "COMPLETED" },
          include: { feedback: true },
        },
      },
    });

    const candidates = users.map((u) => {
      const completed = u.interviews.length;
      const scores = u.interviews.map((i) => i.feedback?.overallScore).filter((s): s is number => typeof s === "number");
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || null,
        interviewsCompleted: completed,
        avgScore,
        createdAt: u.createdAt,
      };
    });

    res.json({ candidates });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/interviews", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const interviews = await prisma.interview.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, role: true } },
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
      },
      take: 200,
    });
    res.json({ interviews });
  } catch (err) {
    next(err);
  }
});

