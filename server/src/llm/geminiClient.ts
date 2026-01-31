import { z } from "zod";
import { HttpError } from "../lib/httpError";
import { prisma } from "../db/prisma";

const geminiApiKey = process.env.GEMINI_API_KEY;
const configuredModel = process.env.GEMINI_MODEL;
let resolvedModel: string | null = null;

export const getGeminiModelUsed = () => {
  return resolvedModel ?? configuredModel ?? null;
};

const generateResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })),
        }),
      })
    )
    .optional(),
});

class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(capacity: number) {
    this.available = capacity;
  }

  async acquire() {
    if (this.available > 0) {
      this.available -= 1;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.available -= 1;
  }

  release() {
    this.available += 1;
    const next = this.queue.shift();
    if (next) next();
  }
}

const semaphore = new Semaphore(Number(process.env.GEMINI_MAX_CONCURRENCY ?? 2));

const listModels = async () => {
  if (!geminiApiKey) throw new HttpError(500, "Gemini API key is not configured.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiApiKey)}`;
  

  const controller = new AbortController();
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new HttpError(502, "Failed to list Gemini models.");
    return json as any;
  } catch (err: any) {
    if (err?.name === "AbortError") throw new HttpError(504, "Gemini request timed out.");
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, "Gemini request failed.");
  } finally {
    clearTimeout(timeout);
  }
};

const resolveModelName = async () => {
  if (resolvedModel) return resolvedModel;

  const preferred = configuredModel ? [configuredModel] : [];
  const candidates = ["gemini-1.5-flash", "gemini-1.5-flash", "gemini-1.5-pro-latest", "gemini-pro"];
  const preference = [...preferred, ...candidates];

  const modelsResponse = await listModels();
  const models = Array.isArray(modelsResponse?.models) ? modelsResponse.models : [];

  const supported = models
    .filter((m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m: any) => String(m.name || ""));

  const pick =
    preference.find((p) => supported.includes(`models/${p}`) || supported.includes(p)) ??
    supported.find((n) => n.includes("flash")) ??
    supported[0];

  if (!pick) throw new HttpError(500, "No Gemini models available for generateContent.");
  resolvedModel = pick.startsWith("models/") ? pick.slice("models/".length) : pick;
  return resolvedModel;
};

const callGemini = async (payload: unknown) => {
  if (!geminiApiKey) throw new HttpError(500, "Gemini API key is not configured.");

  const modelToUse = resolvedModel ?? configuredModel ?? "gemini-1.5-flash";
  // const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
  //   modelToUse
  // )}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
  modelToUse
)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;


  const controller = new AbortController();
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 20000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  await semaphore.acquire();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const messageFromApi =
        typeof json?.error?.message === "string"
          ? json.error.message
          : typeof json?.message === "string"
            ? json.message
            : typeof json?.raw === "string"
              ? json.raw.slice(0, 400)
              : res.statusText;

      if (res.status === 429) throw new HttpError(429, "Gemini quota exceeded. Please retry later.");
      if (res.status === 401 || res.status === 403) throw new HttpError(500, `Gemini API key is not authorized. ${messageFromApi}`);
      if (res.status === 404) {
        resolvedModel = null;
        const nextModel = await resolveModelName();
        if (nextModel && nextModel !== modelToUse) {
          return callGemini(payload);
        }
      }
      if (res.status >= 500) throw new HttpError(502, "Gemini service temporarily unavailable.");
      throw new HttpError(502, `Gemini request failed. ${messageFromApi}`);
    }

    resolvedModel = modelToUse;
    return json;
  } catch (err: any) {
    if (err?.name === "AbortError") throw new HttpError(504, "Gemini request timed out.");
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, "Gemini request failed.");
  } finally {
    clearTimeout(timeout);
    semaphore.release();
  }
};

const extractFirstText = (raw: unknown) => {
  const parsed = generateResponseSchema.parse(raw);
  const text =
    parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ?? "";
  if (!text) throw new HttpError(502, "Gemini returned an empty response.");
  return text;
};

const stripJsonFence = (text: string) => {
  const cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const withoutStart = cleaned.replace(/^```[a-zA-Z]*\n?/, "");
    const withoutEnd = withoutStart.replace(/\n?```$/, "");
    return withoutEnd.trim();
  }
  return cleaned;
};

const parseJsonLenient = (text: string) => {
  const candidates: string[] = [];
  const cleaned = text.trim();
  candidates.push(cleaned);
  candidates.push(stripJsonFence(cleaned));

  // Try to find the first '{' or '['
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  
  if (firstBrace !== -1) {
     const lastBrace = cleaned.lastIndexOf("}");
     if (lastBrace > firstBrace) candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  if (firstBracket !== -1) {
     const lastBracket = cleaned.lastIndexOf("]");
     if (lastBracket > firstBracket) candidates.push(cleaned.slice(firstBracket, lastBracket + 1));
  }
  
  // Try to find JSON code block with regex
  const jsonBlock = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlock && jsonBlock[1]) {
    candidates.push(jsonBlock[1].trim());
  }

  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      continue;
    }
  }
  const snippet = text.slice(0, 200).replace(/\n/g, " ");
  throw new HttpError(502, `Gemini returned invalid JSON: "${snippet}..."`);
};

export const geminiGenerateStructured = async <T>(
  params: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    action: string;
    userId?: string;
    temperature?: number;
  }
) => {
  const makePayload = (text: string, temperature: number) => ({
    contents: [
      {
        role: "user",
        parts: [{ text }],
      },
    ],
    generationConfig: {
      temperature,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  });

  const initialPrompt = `${params.system}\n\n${params.user}`;
  const raw = await callGemini(makePayload(initialPrompt, params.temperature ?? 0.4));
  const text = extractFirstText(raw);
  
  // Log truncated raw response for debugging
  console.log(`[Gemini] Raw response (first 500 chars): ${text.slice(0, 500)}`);

  const parseAndValidate = (t: string) => {
    const parsedJson: unknown = parseJsonLenient(t);
    return params.schema.parse(parsedJson);
  };

  let result: T;
  try {
    result = parseAndValidate(text);
  } catch {
    const repairPrompt = [
      params.system,
      "",
      "Your previous response was not valid JSON or did not match the required JSON shape.",
      "Return valid JSON only. Do not include markdown, explanations, or code fences.",
      "The very first character of your response must be '{' and the last must be '}'.",
      "",
      "Original instruction:",
      params.user,
      "",
      "Invalid output to repair:",
      text.slice(0, 12000),
    ].join("\n");

    const repairedRaw = await callGemini(makePayload(repairPrompt, 0.0));
    const repairedText = extractFirstText(repairedRaw);
    result = parseAndValidate(repairedText);
  }

  if (params.userId) {
    prisma.apiUsageLog
      .create({
        data: { userId: params.userId, provider: "gemini", action: params.action },
      })
      .catch(() => {});
  }

  return result;
};
