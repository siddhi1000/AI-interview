// routes/profile.ts  (or wherever your profile router lives)

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";           // ← your singleton import
import { decryptString, encryptString } from "../lib/crypto";

export const profileRouter = Router();

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")
    .optional()
    .nullable(),

  location: z.string().trim().max(120).optional().nullable(),
  education: z.string().trim().max(200).optional().nullable(),

  preferences: z
    .object({
      currentRole: z.string().trim().max(120).optional().nullable(),
      experience: z.number().int().min(0).max(60).optional().nullable(),
      // you can add more later: industry, preferredLocation, etc.
    })
    .optional()
    .nullable(),
});

profileRouter.get("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser; // { id: string } – clerkId

    const profile = await prisma.profile.findUnique({
      where: { userId: dbUser.id },
      select: {
        firstName: true,
        lastName: true,
        phoneEncrypted: true,
        location: true,
        education: true,
        preferences: true,
        // createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return res.status(200).json({ profile: null });
    }

    const phone = profile.phoneEncrypted ? decryptString(profile.phoneEncrypted) : null;

    res.json({
      profile: {
        ...profile,
        phone,
        phoneEncrypted: undefined, // never send encrypted value
      },
    });
  } catch (err) {
    next(err);
  }
});

profileRouter.put("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser; // { id: string }

    const input = profileUpdateSchema.parse(req.body);

    const phoneEncrypted =
      input.phone === undefined
        ? undefined
        : input.phone
          ? encryptString(input.phone)
          : null;

    const profile = await prisma.profile.upsert({
      where: { userId: dbUser.id },

      create: {
        userId: dbUser.id,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        phoneEncrypted,
        location: input.location ?? null,
        education: input.education ?? null,
        preferences: input.preferences ?? undefined,
      },

      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        phoneEncrypted,
        location: input.location,
        education: input.education,
        // preferences: input.preferences,
      },

      select: {
        firstName: true,
        lastName: true,
        phoneEncrypted: true,
        location: true,
        education: true,
        preferences: true,
      },
    });

    const phone = profile.phoneEncrypted ? decryptString(profile.phoneEncrypted) : null;

    res.json({
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