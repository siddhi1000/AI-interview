import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../db/prisma";
import { detectResumeFileType, extractResumeText } from "../lib/resumeParsing";

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
        fileExt: true,
        sizeBytes: true,
        sha256: true,
        parsedAt: true,
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
    const fileType = detectResumeFileType(file);
    const extractedText = await extractResumeText(file, fileType);

    const sha256 = crypto.createHash("sha256").update(file.buffer).digest("hex");
    const id = crypto.randomUUID();
    const userDir = path.join(process.cwd(), "server", "uploads", dbUser.id);
    await fs.mkdir(userDir, { recursive: true });
    const storagePath = path.join(userDir, `${id}.${fileType}`);
    await fs.writeFile(storagePath, file.buffer);

    const resume = await prisma.resume.create({
      data: {
        id,
        userId: dbUser.id,
        originalName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        fileExt: fileType,
        sizeBytes: file.size,
        sha256,
        extractedText,
        parsedAt: new Date(),
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        fileExt: true,
        sizeBytes: true,
        sha256: true,
        parsedAt: true,
        uploadedAt: true,
      },
    });

    res.status(201).json({ resume });
  } catch (err) {
    next(err);
  }
});

