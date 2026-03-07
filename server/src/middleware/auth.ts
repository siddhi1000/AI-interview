import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { prisma } from "../db/prisma";

/**
 * Require authentication
 */
export const requireClerkAuth = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  };
};

/**
 * Attach DB user + Sync real name from Clerk (ONE-TIME)
 */
export const attachDbUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch real user data from Clerk (only if needed)
    const clerkUser = await clerkClient.users.getUser(userId);

    // Build clean display name (never use user_xxx)
    const firstName = clerkUser.firstName?.trim() || "";
    const lastName = clerkUser.lastName?.trim() || "";
    const username = clerkUser.username?.trim() || "";
    
    const cleanName = [firstName, lastName].filter(Boolean).join(" ") || 
                     username || 
                     clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || 
                     "Candidate";

    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || 
                        clerkUser.emailAddresses[0]?.emailAddress || 
                        `${userId}@placeholder.com`;

    // Upsert with REAL name (this is the key fix)
    const user = await prisma.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email: primaryEmail,
        name: cleanName,           // ← Real name stored here
        role: "CANDIDATE",
      },
      update: {
        email: primaryEmail,
        name: cleanName,           // ← Update name if changed in Clerk
      },
      include: { profile: true },
    });

    (req as any).dbUser = user;

    next();
  } catch (error) {
    console.error("attachDbUser error:", error);
    next(error);
  }
};

/**
 * Require admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const dbUser = (req as any).dbUser;

  if (!dbUser || dbUser.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};