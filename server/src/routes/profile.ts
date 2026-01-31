import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { decryptString, encryptString } from "../lib/crypto";

export const profileRouter = Router();

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  education: z.string().trim().max(200).optional().nullable(),
  experienceLevel: z
    .enum(["ZERO_TO_ONE", "ONE_TO_THREE", "THREE_TO_FIVE", "FIVE_TO_TEN", "TEN_PLUS"])
    .optional()
    .nullable(),
  skills: z.string().trim().max(2000).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
  accountSettings: z.record(z.any()).optional().nullable(),
});

profileRouter.get("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string };
    const profile = await prisma.profile.findUnique({ where: { userId: dbUser.id } });

    if (!profile) {
      return res.json({ profile: null });
    }

    const phone = profile.phoneEncrypted ? decryptString(profile.phoneEncrypted) : null;
    return res.json({
      profile: {
        ...profile,
        phone,
        phoneEncrypted: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

profileRouter.put("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string };
    const input = profileUpdateSchema.parse(req.body ?? {});

    const phoneEncrypted =
      input.phone === undefined ? undefined : input.phone ? encryptString(input.phone) : null;

    const profile = await prisma.profile.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phoneEncrypted: phoneEncrypted ?? null,
        location: input.location ?? null,
        education: input.education ?? null,
        experienceLevel: input.experienceLevel ?? null,
        skills: input.skills ?? null,
        bio: input.bio ?? null,
        preferences: input.preferences ?? undefined,
        accountSettings: input.accountSettings ?? undefined,
      },
      update: {
        firstName: input.firstName ?? undefined,
        lastName: input.lastName ?? undefined,
        phoneEncrypted,
        location: input.location ?? undefined,
        education: input.education ?? undefined,
        experienceLevel: input.experienceLevel ?? undefined,
        skills: input.skills ?? undefined,
        bio: input.bio ?? undefined,
        preferences: input.preferences ?? undefined,
        accountSettings: input.accountSettings ?? undefined,
      },
    });

    const phone = profile.phoneEncrypted ? decryptString(profile.phoneEncrypted) : null;
    return res.json({
      profile: {
        ...profile,
        phone,
        phoneEncrypted: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

