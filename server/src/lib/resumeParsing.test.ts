import { describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    async getText() {
      return { text: "PDF TEXT" };
    }
    async destroy() {}
  },
}));
vi.mock("mammoth", () => ({ default: { extractRawText: vi.fn(async () => ({ value: "DOCX TEXT" })) } }));

const makeFile = (overrides: Partial<Express.Multer.File>) =>
  ({
    originalname: "resume.pdf",
    mimetype: "application/pdf",
    size: 100,
    buffer: Buffer.from("%PDF-1.4"),
    ...overrides,
  }) as any;

describe("resumeParsing", () => {
  it("detects pdf", async () => {
    const { detectResumeFileType } = await import("./resumeParsing");
    expect(detectResumeFileType(makeFile({ originalname: "a.pdf" }))).toBe("pdf");
  });

  it("detects docx", async () => {
    const { detectResumeFileType } = await import("./resumeParsing");
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(
      detectResumeFileType(makeFile({ originalname: "a.docx", mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: buf }))
    ).toBe("docx");
  });

  it("detects txt", async () => {
    const { detectResumeFileType } = await import("./resumeParsing");
    expect(detectResumeFileType(makeFile({ originalname: "a.txt", mimetype: "text/plain", buffer: Buffer.from("hello") }))).toBe("txt");
  });

  it("extracts text for txt", async () => {
    const { extractResumeText } = await import("./resumeParsing");
    const text = await extractResumeText(makeFile({ originalname: "a.txt", mimetype: "text/plain", buffer: Buffer.from(" hello \n\n\nworld ") }), "txt");
    expect(text).toBe("hello\n\nworld");
  });
});
