// import { useAuth } from "@clerk/clerk-react";

// const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001";

// type ApiError = {
//   error?: string;
//   issues?: unknown;
// };

// export const useApi = () => {
//   const { getToken } = useAuth();

//   const authFetch = async (input: string, init?: RequestInit) => {
//     const token = await getToken();
//     const headers = new Headers(init?.headers);
//     if (token) headers.set("Authorization", `Bearer ${token}`);

//     const res = await fetch(`${apiBaseUrl}${input}`, { ...init, headers });
//     const contentType = res.headers.get("content-type") ?? "";
//     const data = contentType.includes("application/json") ? await res.json() : null;

//     if (!res.ok) {
//       const err = (data ?? {}) as ApiError;
//       throw new Error(err.error || res.statusText);
//     }

//     return data;
//   };

//   return {
//     getInterview: (id: string) => authFetch(`/api/interviews/${id}`),
//     getProfile: () => authFetch("/api/profile"),
//     upsertProfile: (payload: unknown) =>
//       authFetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
//     listResumes: () => authFetch("/api/resumes"),
//     uploadResume: (file: File) => {
//       const form = new FormData();
//       form.append("file", file);
//       return authFetch("/api/resumes", { method: "POST", body: form });
//     },
//     listJobRoles: (params?: { q?: string; category?: string; active?: boolean }) => {
//       const qs = new URLSearchParams();
//       if (params?.q) qs.set("q", params.q);
//       if (params?.category) qs.set("category", params.category);
//       if (params?.active !== undefined) qs.set("active", String(params.active));
//       const suffix = qs.toString() ? `?${qs.toString()}` : "";
//       return authFetch(`/api/job-roles${suffix}`);
//     },
//     listInterviews: (params?: { status?: string; all?: boolean }) => {
//       const qs = new URLSearchParams();
//       if (params?.status) qs.set("status", params.status);
//       if (params?.all) qs.set("all", "true");
//       const suffix = qs.toString() ? `?${qs.toString()}` : "";
//       return authFetch(`/api/interviews${suffix}`);
//     },
//     createInterview: (payload: unknown) =>
//       authFetch("/api/interviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
//     updateInterview: (id: string, payload: unknown) =>
//       authFetch(`/api/interviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
//     upsertInterviewFeedback: (id: string, payload: unknown) =>
//       authFetch(`/api/interviews/${id}/feedback`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
//     generateInterviewQuestions: (id: string, payload?: unknown) =>
//       authFetch(`/api/interviews/${id}/questions/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload ?? {}) }),
//     listInterviewQuestions: (id: string) => authFetch(`/api/interviews/${id}/questions`),
//     submitInterviewAnswers: (id: string, payload: unknown) =>
//       authFetch(`/api/interviews/${id}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
//     generateInterviewAssessment: (id: string) =>
//       authFetch(`/api/interviews/${id}/assessment/generate`, { method: "POST" }),

//     // ── Admin methods ────────────────────────────────────────
//     listCandidatesAdmin: (params?: { q?: string; skip?: number; take?: number }) => {
//       const qs = new URLSearchParams();
//       if (params?.q) qs.set("q", params.q);
//       if (params?.skip !== undefined) qs.set("skip", String(params.skip));
//       if (params?.take !== undefined) qs.set("take", String(params.take));
//       const suffix = qs.toString() ? `?${qs.toString()}` : "";
//       return authFetch(`/api/admin/candidates${suffix}`);
//     },

//     listInterviewsAdmin: (params?: { status?: string }) => {
//       const qs = new URLSearchParams();
//       if (params?.status) qs.set("status", params.status);
//       const suffix = qs.toString() ? `?${qs.toString()}` : "";
//       return authFetch(`/api/admin/interviews${suffix}`);
//     },

//     // ── NEW METHOD ADDED HERE ────────────────────────────────
//     deleteInterview: (id: string) =>
//       authFetch(`/api/admin/interviews/${id}`, { method: "DELETE" }),
//   };
// };

import { useAuth } from "@clerk/clerk-react";
import { useCallback, useRef } from 'react';

const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001";

type ApiError = {
  error?: string;
  issues?: unknown;
};

export const useApi = () => {
  const { getToken, userId, isSignedIn } = useAuth();
  const tokenPromiseRef = useRef<Promise<string | null> | null>(null);
  const tokenTimestampRef = useRef<number>(0);
  const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const requestCountRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);
  const pendingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

  const getCachedToken = useCallback(async () => {
    const now = Date.now();
    
    // If we have a valid token and it's not expired, use it
    if (tokenPromiseRef.current && (now - tokenTimestampRef.current) < TOKEN_REFRESH_INTERVAL) {
      return tokenPromiseRef.current;
    }

    // Get new token
    tokenPromiseRef.current = getToken();
    tokenTimestampRef.current = now;
    
    return tokenPromiseRef.current;
  }, [getToken]);

  // Rate limiting function
  const checkRateLimit = () => {
    const now = Date.now();
    const timeWindow = 1000; // 1 second
    const maxRequests = 10; // Max 10 requests per second
    
    if (now - lastRequestTimeRef.current < timeWindow) {
      requestCountRef.current++;
      if (requestCountRef.current > maxRequests) {
        // Wait a bit instead of throwing
        return new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      requestCountRef.current = 1;
      lastRequestTimeRef.current = now;
    }
    return Promise.resolve();
  };

  // Deduplicate identical requests
  const dedupeRequest = (key: string, requestFn: () => Promise<any>) => {
    if (pendingRequestsRef.current.has(key)) {
      return pendingRequestsRef.current.get(key);
    }
    
    const promise = requestFn().finally(() => {
      pendingRequestsRef.current.delete(key);
    });
    
    pendingRequestsRef.current.set(key, promise);
    return promise;
  };

  const authFetch = async (input: string, init?: RequestInit) => {
    // Create a unique key for this request
    const requestKey = `${input}-${JSON.stringify(init)}`;
    
    return dedupeRequest(requestKey, async () => {
      try {
        // Check if user is signed in
        if (!isSignedIn) {
          console.warn('User is not signed in');
          throw new Error('Not authenticated');
        }

        // Check rate limit
        await checkRateLimit();
        
        // Get token with retry
        let token = null;
        try {
          token = await getCachedToken();
        } catch (tokenError) {
          console.error('Failed to get token:', tokenError);
          throw new Error('Authentication failed');
        }
        
        const headers = new Headers(init?.headers || {});
        
        // Add authorization header if we have a token
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        } else {
          console.warn('No token available for request:', input);
        }
        
        // Set content type if needed
        if (init?.body && !headers.has("Content-Type")) {
          if (!(init.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
          }
        }

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        console.log(`🌐 Fetching: ${apiBaseUrl}${input}`, { 
          method: init?.method || 'GET',
          hasToken: !!token,
          userId 
        });
        
        const res = await fetch(`${apiBaseUrl}${input}`, { 
          ...init, 
          headers,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'include'
        });
        
        clearTimeout(timeoutId);

        // Handle 401 Unauthorized - token might be expired
        if (res.status === 401) {
          console.warn('Received 401 Unauthorized, token might be expired');
          // Clear cached token to force refresh
          tokenPromiseRef.current = null;
          throw new Error('Unauthorized - please refresh the page');
        }

        const contentType = res.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json") ? await res.json() : null;

        if (!res.ok) {
          const err = (data ?? {}) as ApiError;
          
          // Handle specific error codes
          if (res.status === 403) {
            throw new Error('Access denied - admin privileges required');
          }
          if (res.status === 429) {
            throw new Error('Too many requests. Please wait a moment.');
          }
          if (res.status === 504) {
            throw new Error('Server timeout. Please try again.');
          }
          if (res.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          
          throw new Error(err.error || res.statusText || `HTTP error ${res.status}`);
        }

        return data;
      } catch (error: any) {
        // Handle abort errors (timeouts)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        
        // Log error with context
        console.error(`❌ Fetch error for ${input}:`, {
          message: error.message,
          status: error.status,
          userId
        });
        
        throw error;
      }
    });
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
    generateInterviewQuestions: (id: string, payload?: unknown) =>
      authFetch(`/api/interviews/${id}/questions/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload ?? {}) }),
    listInterviewQuestions: (id: string) => authFetch(`/api/interviews/${id}/questions`),
    submitInterviewAnswers: (id: string, payload: unknown) =>
      authFetch(`/api/interviews/${id}/answers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    generateInterviewAssessment: (id: string) =>
      authFetch(`/api/interviews/${id}/assessment/generate`, { method: "POST" }),

    // Admin methods
    listCandidatesAdmin: (params?: { q?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(Math.min(params.limit, 10)));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/admin/candidates${suffix}`);
    },

    listInterviewsAdmin: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        qs.set("status", params.status);
      }
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(Math.min(params.limit, 10)));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return authFetch(`/api/admin/interviews${suffix}`);
    },

    deleteInterview: (id: string) =>
      authFetch(`/api/admin/interviews/${id}`, { method: "DELETE" }),

    getAdminStats: async () => {
      return authFetch('/api/admin/stats');
    },

    deleteCandidate: (candidateId: string) =>
      authFetch(`/api/admin/candidates/${candidateId}`, { method: "DELETE" }),

    suspendCandidate: (candidateId: string) =>
      authFetch(`/api/admin/candidates/${candidateId}/suspend`, { method: "POST" }),

    activateCandidate: (candidateId: string) =>
      authFetch(`/api/admin/candidates/${candidateId}/activate`, { method: "POST" }),

    getCandidateDetails: (candidateId: string) =>
      authFetch(`/api/admin/candidates/${candidateId}`),
  };
};