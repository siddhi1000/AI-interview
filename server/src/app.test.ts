import { describe, expect, it, vi } from "vitest";
import request from "supertest";

describe("API", () => {
  it(
    "responds to health",
    async () => {
    vi.resetModules();
    process.env.SKIP_CLERK = "true";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
    process.env.CORS_ORIGIN = "http://localhost:5173";

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    },
    20000
  );
});

