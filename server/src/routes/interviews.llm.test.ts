import { describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../llm/geminiClient", () => {
  return {
    geminiGenerateStructured: vi.fn(async () => {
      return {
        questions: Array.from({ length: 8 }).map((_, i) => ({
          type: i < 6 ? "TECHNICAL" : "CULTURE",
          difficulty: "MEDIUM",
          topic: "General",
          question: `Question ${i + 1}?`,
          expectedSignals: ["Signal 1", "Signal 2"],
        })),
      };
    }),
  };
});

describe("interviews LLM endpoints", () => {
  it("generates and stores questions", async () => {
    vi.resetModules();
    process.env.SKIP_CLERK = "true";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
    process.env.CORS_ORIGIN = "http://localhost:5173";

    const { createApp } = await import("../app");
    const app = createApp();

    const create = await request(app)
      .post("/api/interviews")
      .set("x-test-user-id", "00000000-0000-0000-0000-000000000111")
      .set("x-test-email", "candidate@example.com")
      .send({});
    expect(create.status).toBe(201);
    const id = create.body?.interview?.id as string;
    expect(id).toBeTruthy();

    const gen = await request(app)
      .post(`/api/interviews/${id}/questions/generate`)
      .set("x-test-user-id", "00000000-0000-0000-0000-000000000111")
      .set("x-test-email", "candidate@example.com")
      .send({ questionCount: 8, difficultyTarget: "MEDIUM" });
    expect(gen.status).toBe(200);
    expect(gen.body.questions.length).toBe(8);

    const list = await request(app)
      .get(`/api/interviews/${id}/questions`)
      .set("x-test-user-id", "00000000-0000-0000-0000-000000000111")
      .set("x-test-email", "candidate@example.com");
    expect(list.status).toBe(200);
    expect(list.body.questions.length).toBe(8);
  });
});

