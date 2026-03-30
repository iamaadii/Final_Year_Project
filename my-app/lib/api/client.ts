export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type ApiListResponse<T> = {
  data: T[];
  next_cursor?: string | null;
  has_more?: boolean;
  total?: number;
};

type ApiError = { message?: string };

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  } | null;
};

const buildUrl = (path: string) => {
  if (!API_BASE) return path;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { ...options, headers });
  const payload = (await res.json().catch(() => ({}))) as ApiEnvelope<T> | ApiError | T;

  if (!res.ok) {
    const message =
      (payload as ApiEnvelope<T>)?.error?.message ||
      (payload as ApiError)?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success === false) {
      throw new Error(envelope.error?.message || "Request failed");
    }
    return (envelope.data ?? ({} as T)) as T;
  }

  return payload as T;
}
