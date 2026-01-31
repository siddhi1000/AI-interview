import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { HttpError } from "./httpError";

export type ResumeFileType = "pdf" | "docx" | "txt";

const normalizeText = (text: string) => {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 200_000);
};

const isPdf = (buf: Buffer) => buf.subarray(0, 4).toString("utf8") === "%PDF";
const isZip = (buf: Buffer) => buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

export const detectResumeFileType = (file: Express.Multer.File): ResumeFileType => {
  if (!file) throw new HttpError(400, "File is required.");
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, "File too large.");

  const name = (file.originalname ?? "").toLowerCase();
  if (isPdf(file.buffer)) return "pdf";
  if (isZip(file.buffer) && name.endsWith(".docx")) return "docx";
  if (file.mimetype.startsWith("text/") || name.endsWith(".txt")) return "txt";

  throw new HttpError(400, "Unsupported resume file format. Upload PDF, DOCX, or TXT.");
};

export const extractResumeText = async (file: Express.Multer.File, fileType: ResumeFileType) => {
  try {
    if (fileType === "pdf") {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const data = await parser.getText();
        return normalizeText((data as any)?.text ?? "");
      } finally {
        await parser.destroy().catch(() => {});
      }
    }

    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return normalizeText(result.value ?? "");
    }

    const text = file.buffer.toString("utf8");
    return normalizeText(text);
  } catch {
    throw new HttpError(400, "Failed to extract text from resume.");
  }
};
