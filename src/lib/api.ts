import { useAuth } from "@clerk/clerk-react";

const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001";

type ApiError = {
  error?: string;
  issues?: unknown;
};

export const useApi = () => {
  const { getToken } = useAuth();

  const authFetch = async (input: string, init?: RequestInit) => {
    const token = await getToken();
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${apiBaseUrl}${input}`, { ...init, headers });
    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await res.json() : null;

    if (!res.ok) {
      const err = (data ?? {}) as ApiError;
      throw new Error(err.error || res.statusText);
    }

    return data;
  };

  return {
    getInterview: (id: string) => authFetch(`/api/interviews/${id}`),
    getProfile: () => authFetch("/api/profile"),
    upsertProfile: (payload: unknown) =>
      authFetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    listResumes: () => authFetch("/api/resumes"),
    uploadResume: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return authFetch("/api/resumes", { method: "POST", body: form });
    },
    uploadAudio: (blob: Blob) => {
      const form = new FormData();
      form.append("file", blob, "recording.webm");
      return authFetch("/api/upload/audio", { method: "POST", body: form });
    },
    listJobRoles: (params?: { q?: string; category?: string; active?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.category) qs.set("category", params.category);
      if (params?.active !== undefined) qs.set("active", String(params.active));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/job-roles${suffix}`);
    },
    listInterviews: (params?: { status?: string; all?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.all) qs.set("all", "true");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/interviews${suffix}`);
    },
    createInterview: (payload: unknown) =>
      authFetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    updateInterview: (id: string, payload: unknown) =>
      authFetch(`/api/interviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    upsertInterviewFeedback: (id: string, payload: unknown) =>
      authFetch(`/api/interviews/${id}/feedback`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    generateInterviewQuestions: async (id: string, payload?: unknown) => {
      // Increase timeout for generation if possible, or handle retry
      // Frontend fetch defaults are browser dependent.
      // We can implement a polling mechanism or just wait longer.
      return authFetch(`/api/interviews/${id}/questions/generate`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload ?? {}) 
      });
    },
    listInterviewQuestions: (id: string) => authFetch(`/api/interviews/${id}/questions`),
    submitInterviewAnswers: (id: string, payload: unknown) =>
      authFetch(`/api/interviews/${id}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    generateInterviewAssessment: (id: string) =>
      authFetch(`/api/interviews/${id}/assessment/generate`, { method: "POST" }),
    listCandidatesAdmin: (params?: { q?: string; skip?: number; take?: number }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.skip !== undefined) qs.set("skip", String(params.skip));
      if (params?.take !== undefined) qs.set("take", String(params.take));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/admin/candidates${suffix}`);
    },
    listInterviewsAdmin: (params?: { status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/admin/interviews${suffix}`);
    },
  };
};

