import { describe, expect, it, vi } from "vitest";

describe("crypto", () => {
  it("encrypts and decrypts roundtrip", async () => {
    vi.resetModules();
    process.env.FIELD_ENCRYPTION_KEY = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
    const { encryptString, decryptString } = await import("./crypto");
    const cipher = encryptString("hello");
    const plain = decryptString(cipher);
    expect(plain).toBe("hello");
  });
});

