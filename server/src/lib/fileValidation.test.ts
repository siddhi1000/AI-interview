import { describe, expect, it } from "vitest";
import { assertPdf } from "./fileValidation";

describe("assertPdf", () => {
  it("accepts valid pdf header", () => {
    const file = {
      size: 100,
      mimetype: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    } as any;
    expect(() => assertPdf(file)).not.toThrow();
  });

  it("rejects invalid mime", () => {
    const file = {
      size: 100,
      mimetype: "text/plain",
      buffer: Buffer.from("%PDF-1.4"),
    } as any;
    expect(() => assertPdf(file)).toThrow();
  });
});

