import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { z, type ZodSchema } from "zod";
import { apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { getServerSession, type ServerSession } from "@/lib/auth/session";
import { getRedisClient } from "@/lib/cache/redis";

export type ApiContext = {
  requestId: string;
  params?: Record<string, string>;
  session?: ServerSession;
  validated?: unknown;
};

export type ApiHandler = (request: NextRequest, context: ApiContext) => Promise<Response>;
export type Middleware = (handler: ApiHandler) => ApiHandler;

function getRequestId(request: NextRequest, context?: Partial<ApiContext>) {
  return context?.requestId || request.headers.get("x-request-id") || randomUUID();
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function normalizeError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.errorCode, error.message, error.details, error.statusCode);
  }

  if (error instanceof z.ZodError) {
    return apiError("VALIDATION_ERROR", "Validation failed", error.flatten(), 400);
  }

  return apiError("INTERNAL_ERROR", "Internal server error", undefined, 500);
}

export function composeMiddleware(...middlewares: Middleware[]) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight((nextHandler, middleware) => middleware(nextHandler), handler);
  };
}

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const requestId = getRequestId(request, context);

    try {
      const session = await getServerSession(request);
      if (!session) {
        return apiError("UNAUTHORIZED", "Authentication required", undefined, 401, { requestId });
      }

      return await handler(request, { ...context, requestId, session });
    } catch (error) {
      return normalizeError(error);
    }
  };
}

export function withValidation<TSchema extends ZodSchema>(schema: TSchema) {
  return (handler: ApiHandler): ApiHandler => {
    return async (request, context) => {
      const requestId = getRequestId(request, context);

      try {
        const query = Object.fromEntries(request.nextUrl.searchParams.entries());
        const params = context?.params || {};
        let body: unknown = undefined;

        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase())) {
          try {
            body = await request.json();
          } catch {
            body = undefined;
          }
        }

        const result = await schema.safeParseAsync({ body, query, params });
        if (!result.success) {
          return apiError("VALIDATION_ERROR", "Validation failed", result.error.flatten(), 400, { requestId });
        }

        return await handler(request, { ...context, requestId, validated: result.data });
      } catch (error) {
        return normalizeError(error);
      }
    };
  };
}

export function withRateLimit(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    const requestId = getRequestId(request, context);

    try {
      const redis = getRedisClient();
      if (!redis) {
        return handler(request, { ...context, requestId });
      }

      const session = context?.session;
      const subject = session?.userId || `ip:${getClientIp(request)}`;
      const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
      const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);
      const now = Date.now();
      const windowStart = now - windowMs;
      const key = `n3:ratelimit:${subject}`;

      await redis.zremrangebyscore(key, 0, windowStart);
      await redis.zadd(key, now, `${now}:${requestId}`);
      const requestCount = await redis.zcard(key);
      await redis.pexpire(key, windowMs);

      if (requestCount > maxRequests) {
        return apiError("RATE_LIMIT_EXCEEDED", "Too many requests", { maxRequests, windowMs }, 429, { requestId });
      }

      return await handler(request, { ...context, requestId });
    } catch (error) {
      return normalizeError(error);
    }
  };
}
