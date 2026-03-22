import { z } from "zod";

export const questionSchema = z.object({
  type: z.enum(["TECHNICAL", "CULTURE"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.string().min(1).max(120).optional().nullable(),
  question: z.string().min(10).max(1000),
  expectedSignals: z.array(z.string().min(1).max(200)).max(12).optional().nullable(),
});

export const generatedQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(8).max(10),
});

export const assessmentSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  rubricScores: z.object({
    technicalAccuracy: z.number().int().min(0).max(100),
    communication: z.number().int().min(0).max(100),
    problemSolving: z.number().int().min(0).max(100),
    culturalFit: z.number().int().min(0).max(100),
  }),
  strengths: z.array(z.string().min(1).max(300)).min(2).max(8),
  improvements: z.array(z.string().min(1).max(300)).min(2).max(8),
  summary: z.string().min(10).max(2000),
});

export const answerFeedbackSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(10).max(1000),
  keyGap: z.string().optional(),
  isStrongAnswer: z.boolean(),
});

