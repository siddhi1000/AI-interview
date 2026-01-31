import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAdmin } from "../middleware/auth";

export const jobRolesRouter = Router();

const upsertJobRoleSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(50).optional().nullable(),
  isActive: z.boolean().optional(),
});

jobRolesRouter.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;
    const active = typeof req.query.active === "string" ? req.query.active : undefined;

    const roles = await prisma.jobRole.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        tags: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ roles });
  } catch (err) {
    next(err);
  }
});

jobRolesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const input = upsertJobRoleSchema.parse(req.body ?? {});
    const role = await prisma.jobRole.create({
      data: {
        title: input.title,
        category: input.category ?? null,
        description: input.description ?? null,
        tags: input.tags ?? undefined,
        isActive: input.isActive ?? true,
      },
    });
    res.status(201).json({ role });
  } catch (err) {
    next(err);
  }
});

jobRolesRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const input = upsertJobRoleSchema.parse(req.body ?? {});
    const role = await prisma.jobRole.update({
      where: { id: req.params.id },
      data: {
        title: input.title,
        category: input.category ?? null,
        description: input.description ?? null,
        tags: input.tags ?? undefined,
        isActive: input.isActive ?? undefined,
      },
    });
    res.json({ role });
  } catch (err) {
    next(err);
  }
});

