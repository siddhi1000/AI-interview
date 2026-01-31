import { HttpError } from "./httpError";

export const assertPdf = (file: Express.Multer.File) => {
  if (!file) throw new HttpError(400, "File is required.");
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, "File too large.");
  if (file.mimetype !== "application/pdf") throw new HttpError(400, "Only PDF files are allowed.");
  const header = file.buffer.subarray(0, 4).toString("utf8");
  if (header !== "%PDF") throw new HttpError(400, "Invalid PDF file.");
};

