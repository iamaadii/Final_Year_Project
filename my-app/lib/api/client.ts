export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type ApiListResponse<T> = {
  data: T[];
  next_cursor?: string | null;
  has_more?: boolean;
  total?: number;
};

type ApiError = { message?: string };

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
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ApiError;
    const message = err?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
