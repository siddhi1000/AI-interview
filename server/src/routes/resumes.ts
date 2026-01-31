import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../db/prisma";
import { assertPdf } from "../lib/fileValidation";

export const resumesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

resumesRouter.get("/", async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string };
    const resumes = await prisma.resume.findMany({
      where: { userId: dbUser.id },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        sha256: true,
        uploadedAt: true,
      },
    });
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
});

resumesRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const dbUser = (req as any).dbUser as { id: string };
    const file = req.file as Express.Multer.File;
    assertPdf(file);

    const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const id = crypto.randomUUID();
    const userDir = path.join(process.cwd(), "server", "uploads", dbUser.id);
    await fs.mkdir(userDir, { recursive: true });
    const storagePath = path.join(userDir, `${id}.pdf`);
    await fs.writeFile(storagePath, file.buffer);

    const resume = await prisma.resume.create({
      data: {
        id,
        userId: dbUser.id,
        originalName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sha256,
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        sha256: true,
        uploadedAt: true,
      },
    });

    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
});

