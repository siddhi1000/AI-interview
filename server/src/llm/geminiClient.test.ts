import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

describe("geminiClient", () => {
  it("parses structured JSON from Gemini response", async () => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ ok: true }) }],
                },
              },
            ],
          }),
      } as any;
    });

    (globalThis as any).fetch = fetchMock;

    const { geminiGenerateStructured } = await import("./geminiClient");
    const result = await geminiGenerateStructured({
      system: "sys",
      user: "user",
      schema: z.object({ ok: z.boolean() }),
      action: "test",
      temperature: 0.1,
    });

    expect(result.ok).toBe(true);
  });

  it("parses JSON embedded in markdown", async () => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

    (globalThis as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "Here is the JSON:\n```json\n{ \"ok\": true }\n```\nHope this helps!",
                    },
                  ],
                },
              },
            ],
          }),
      } as any;
    });

    const { geminiGenerateStructured } = await import("./geminiClient");
    const result = await geminiGenerateStructured({
      system: "sys",
      user: "user",
      schema: z.object({ ok: z.boolean() }),
      action: "test",
    });

    expect(result.ok).toBe(true);
  });

  it("throws HttpError on invalid JSON output", async () => {
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";

    (globalThis as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            candidates: [
              {
                content: { parts: [{ text: "not-json" }] },
              },
            ],
          }),
      } as any;
    });

    const { geminiGenerateStructured } = await import("./geminiClient");
    await expect(
      geminiGenerateStructured({
        system: "sys",
        user: "user",
        schema: z.object({ ok: z.boolean() }),
        action: "test",
      })
    ).rejects.toMatchObject({ name: "HttpError", status: 502 });
  });
});
