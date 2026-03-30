import { NextResponse } from "next/server";

export type ApiMeta = {
  page?: number;
  total?: number;
  requestId?: string;
  [key: string]: unknown;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiMeta;
};

function resolveRequestId(meta?: ApiMeta) {
  return String(meta?.requestId || crypto.randomUUID());
}

export function apiSuccess<T>(data: T, meta?: ApiMeta, status = 200) {
  const requestId = resolveRequestId(meta);
  const payload: ApiEnvelope<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      requestId,
    },
  };

  const response = NextResponse.json(payload, { status });
  response.headers.set("X-Request-ID", requestId);
  return response;
}

export function apiError(
  code: string,
  message: string,
  details?: unknown,
  status = 400,
  meta?: ApiMeta,
) {
  const requestId = resolveRequestId(meta);
  const payload: ApiEnvelope<null> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      ...meta,
      requestId,
    },
  };

  const response = NextResponse.json(payload, { status });
  response.headers.set("X-Request-ID", requestId);
  return response;
}
