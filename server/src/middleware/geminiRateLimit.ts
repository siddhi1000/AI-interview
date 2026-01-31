import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError";

type Bucket = {
  minuteWindowStart: number;
  minuteCount: number;
  dayWindowStart: number;
  dayCount: number;
};

const buckets = new Map<string, Bucket>();

const minuteMs = 60_000;
const dayMs = 24 * 60 * 60_000;

const getLimits = () => {
  const rpm = Number(process.env.GEMINI_RPM_PER_USER ?? 8);
  const rpd = Number(process.env.GEMINI_RPD_PER_USER ?? 200);
  return { rpm, rpd };
};

export const geminiRateLimit = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const dbUser = (req as any).dbUser as { id: string } | undefined;
      if (!dbUser?.id) throw new HttpError(401, "Unauthorized");

      const now = Date.now();
      const key = `${dbUser.id}:${action}`;
      const existing = buckets.get(key);
      const bucket: Bucket = existing ?? {
        minuteWindowStart: now,
        minuteCount: 0,
        dayWindowStart: now,
        dayCount: 0,
      };

      if (now - bucket.minuteWindowStart >= minuteMs) {
        bucket.minuteWindowStart = now;
        bucket.minuteCount = 0;
      }

      if (now - bucket.dayWindowStart >= dayMs) {
        bucket.dayWindowStart = now;
        bucket.dayCount = 0;
      }

      const { rpm, rpd } = getLimits();
      if (bucket.minuteCount >= rpm || bucket.dayCount >= rpd) {
        throw new HttpError(429, "Rate limit exceeded. Please retry later.");
      }

      bucket.minuteCount += 1;
      bucket.dayCount += 1;
      buckets.set(key, bucket);
      next();
    } catch (err) {
      next(err);
    }
  };
};

