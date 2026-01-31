import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { prisma } from "../db/prisma";
import { HttpError } from "../lib/httpError";

export const requireClerkAuth = () => requireAuth();

export const attachDbUser = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) throw new HttpError(401, "Unauthorized");

    let email =
      ((auth.sessionClaims as any)?.email as string | undefined) ??
      ((auth.sessionClaims as any)?.primaryEmailAddress as string | undefined) ??
      "";
    if (!email) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    }
    const allowlistRaw = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
    const allowlistedEmails = allowlistRaw
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const isAllowlistedAdmin = email ? allowlistedEmails.includes(email.toLowerCase()) : false;

    const roleClaim = ((auth.sessionClaims as any)?.publicMetadata?.role as string | undefined) ?? undefined;
    const role = isAllowlistedAdmin ? "ADMIN" : roleClaim === "admin" ? "ADMIN" : "CANDIDATE";

    const user = await prisma.user.upsert({
      where: { clerkUserId: auth.userId },
      create: { clerkUserId: auth.userId, email: email || auth.userId, role },
      update: { email: email || auth.userId, role },
      include: { profile: true },
    });

    (req as any).dbUser = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const dbUser = (req as any).dbUser as { role?: string } | undefined;
  if (!dbUser) return next(new HttpError(401, "Unauthorized"));
  if (dbUser.role !== "ADMIN") return next(new HttpError(403, "Forbidden"));
  return next();
};

