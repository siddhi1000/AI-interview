import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { HttpError } from "../lib/httpError";
import { publishInterviewEvent } from "../realtime/interviewEvents";
import { geminiRateLimit } from "../middleware/geminiRateLimit";
import { geminiGenerateStructured, getGeminiModelUsed } from "../llm/geminiClient";
import { assessmentSchema, generatedQuestionsSchema, answerFeedbackSchema } from "../llm/schemas";
import {
  buildAssessmentSystemPrompt,
  buildAssessmentUserPrompt,
  buildQuestionGenerationSystemPrompt,
  buildQuestionGenerationUserPrompt,
  buildAnswerFeedbackSystemPrompt,
  buildAnswerFeedbackUserPrompt,
} from "../llm/prompts";

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

const generateQuestionsSchema = z.object({
  jobRoleId: z.string().uuid().optional().nullable(),
  questionCount: z.number().int().min(8).max(10).optional(),
  difficultyTarget: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        answerText: z.string().trim().min(1).max(20000),
        audioUrl: z.string().optional().nullable(),
      })
    )
    .min(1)
    .max(20),
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
        assessment: true,
        questions: { orderBy: { order: "asc" } },
        answers: { orderBy: { submittedAt: "asc" } },
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

interviewsRouter.post("/:id/questions/generate", geminiRateLimit("questions.generate"), async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: { jobRole: true },
    });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    // Check if questions already exist to prevent repetitive generation
    // Optimized: Only count if no body override provided (forcing regen?)
    // Actually, for safety, let's always check first.
    const existingCount = await prisma.interviewQuestion.count({ where: { interviewId: interview.id } });
    if (existingCount > 0) {
      const questions = await prisma.interviewQuestion.findMany({
        where: { interviewId: interview.id },
        orderBy: { order: "asc" },
      });
      res.json({ questions });
      return;
    }

    const input = generateQuestionsSchema.parse(req.body ?? {});
    const role = input.jobRoleId
      ? await prisma.jobRole.findUnique({ where: { id: input.jobRoleId } })
      : interview.jobRoleId
        ? await prisma.jobRole.findUnique({ where: { id: interview.jobRoleId } })
        : null;

    const profile = await prisma.profile.findUnique({ where: { userId: interview.userId } });
    const resume = await prisma.resume.findFirst({
      where: { userId: interview.userId },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, originalName: true, fileExt: true, extractedText: true, uploadedAt: true },
    });

    const candidate = {
      profile,
      resume: resume
        ? {
            id: resume.id,
            originalName: resume.originalName,
            fileExt: resume.fileExt,
            uploadedAt: resume.uploadedAt,
            extractedTextSnippet: (resume.extractedText ?? "").slice(0, 8000),
          }
        : null,
    };

    const result = await geminiGenerateStructured({
      system: buildQuestionGenerationSystemPrompt(),
      user: buildQuestionGenerationUserPrompt({
        candidate,
        role,
        questionCount: input.questionCount ?? 8,
        difficultyTarget: input.difficultyTarget,
      }),
      schema: generatedQuestionsSchema,
      action: "questions.generate",
      userId: interview.userId,
      temperature: 0.3,
    });

    const toCreate = result.questions.map((q, idx) => ({
      interviewId: interview.id,
      order: idx + 1,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic ?? null,
      question: q.question,
      expectedSignals: q.expectedSignals ?? undefined,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.interviewQuestion.deleteMany({ where: { interviewId: interview.id } });
      await tx.interviewAnswer.deleteMany({ where: { interviewId: interview.id } });
      await tx.interviewQuestion.createMany({ data: toCreate });
      await tx.interviewEvent.create({
        data: { interviewId: interview.id, type: "QUESTIONS_GENERATED", payload: { count: toCreate.length } },
      });
    });

    publishInterviewEvent({
      interviewId: interview.id,
      type: "QUESTIONS_GENERATED",
      payload: { count: toCreate.length },
    });

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: interview.id },
      orderBy: { order: "asc" },
    });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.get("/:id/questions", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: req.params.id },
      orderBy: { order: "asc" },
    });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.post("/:id/answers", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    const input = submitAnswersSchema.parse(req.body ?? {});

    const questionIds = input.answers.map((a) => a.questionId);
    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId: interview.id, id: { in: questionIds } },
      select: { id: true },
    });
    const allowed = new Set(questions.map((q) => q.id));
    for (const a of input.answers) {
      if (!allowed.has(a.questionId)) throw new HttpError(400, "Invalid questionId for this interview.");
    }

    // Log the answer submission for debugging
    console.log(`[Answers] Received ${input.answers.length} answers for interview ${interview.id}`);

    await prisma.$transaction(async (tx) => {
      await tx.interviewAnswer.deleteMany({ where: { interviewId: interview.id, questionId: { in: questionIds } } });
      await tx.interviewAnswer.createMany({
        data: input.answers.map((a) => ({
          interviewId: interview.id,
          questionId: a.questionId,
          answerText: a.answerText,
          audioUrl: a.audioUrl,
        })),
      });
      await tx.interviewEvent.create({
        data: { interviewId: interview.id, type: "ANSWERS_SUBMITTED", payload: { count: input.answers.length } },
      });
    });

    publishInterviewEvent({
      interviewId: interview.id,
      type: "ANSWERS_SUBMITTED",
      payload: { count: input.answers.length },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

interviewsRouter.post("/:id/assessment/generate", geminiRateLimit("assessment.generate"), async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string; role: "ADMIN" | "CANDIDATE" };
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: { jobRole: true },
    });
    if (!interview) throw new HttpError(404, "Not found");
    if (dbUser.role !== "ADMIN" && interview.userId !== dbUser.id) throw new HttpError(403, "Forbidden");

    const [profile, resume, questions, answers] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: interview.userId } }),
      prisma.resume.findFirst({
        where: { userId: interview.userId },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, fileExt: true, originalName: true, extractedText: true },
      }),
      prisma.interviewQuestion.findMany({ where: { interviewId: interview.id }, orderBy: { order: "asc" } }),
      prisma.interviewAnswer.findMany({ where: { interviewId: interview.id }, orderBy: { submittedAt: "asc" } }),
    ]);

    if (questions.length === 0) throw new HttpError(400, "No questions found for this interview.");
    if (answers.length === 0) throw new HttpError(400, "No answers found for this interview.");

    const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));
    const qa = questions.map((q) => {
      const ans = answersByQuestion.get(q.id);
      return {
        order: q.order,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        question: q.question,
        expectedSignals: q.expectedSignals,
        answer: ans?.answerText ?? "",
        preliminaryFeedback: ans?.feedback ?? null,
        preliminaryScore: ans?.score ?? null,
      };
    });

    const candidate = {
      profile,
      resume: resume
        ? {
            id: resume.id,
            originalName: resume.originalName,
            fileExt: resume.fileExt,
            extractedTextSnippet: (resume.extractedText ?? "").slice(0, 8000),
          }
        : null,
    };

    const result = await geminiGenerateStructured({
      system: buildAssessmentSystemPrompt(),
      user: buildAssessmentUserPrompt({ candidate, role: interview.jobRole, questionsAndAnswers: qa }),
      schema: assessmentSchema,
      action: "assessment.generate",
      userId: interview.userId,
      temperature: 0.2,
    });

    const saved = await prisma.$transaction(async (tx) => {
      const assessment = await tx.interviewAssessment.upsert({
        where: { interviewId: interview.id },
        create: {
          interviewId: interview.id,
          overallScore: result.overallScore,
          rubricScores: result.rubricScores,
          strengths: result.strengths,
          improvements: result.improvements,
          summary: result.summary,
          modelInfo: { model: getGeminiModelUsed() ?? process.env.GEMINI_MODEL ?? null },
        },
        update: {
          overallScore: result.overallScore,
          rubricScores: result.rubricScores,
          strengths: result.strengths,
          improvements: result.improvements,
          summary: result.summary,
          modelInfo: { model: getGeminiModelUsed() ?? process.env.GEMINI_MODEL ?? null },
        },
      });

      await tx.interviewFeedback.upsert({
        where: { interviewId: interview.id },
        create: {
          interviewId: interview.id,
          overallScore: result.overallScore,
          outcome: result.overallScore >= 80 ? "PASS" : result.overallScore >= 60 ? "PENDING" : "FAIL",
          notes: result.summary,
          categoryScores: {
            rubricScores: result.rubricScores,
            strengths: result.strengths,
            improvements: result.improvements,
          },
        },
        update: {
          overallScore: result.overallScore,
          outcome: result.overallScore >= 80 ? "PASS" : result.overallScore >= 60 ? "PENDING" : "FAIL",
          notes: result.summary,
          categoryScores: {
            rubricScores: result.rubricScores,
            strengths: result.strengths,
            improvements: result.improvements,
          },
        },
      });

      await tx.interviewEvent.create({
        data: { interviewId: interview.id, type: "ASSESSMENT_GENERATED", payload: { overallScore: result.overallScore } },
      });

      return assessment;
    });

    publishInterviewEvent({
      interviewId: interview.id,
      type: "ASSESSMENT_GENERATED",
      payload: { overallScore: result.overallScore },
    });

    res.json({ assessment: saved });
  } catch (err) {
    next(err);
  }
});
