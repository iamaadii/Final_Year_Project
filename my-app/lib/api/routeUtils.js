import crypto from "crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getUserFromToken } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import Notification from "@/models/Notification";
import redis from "@/lib/redis";

export async function requireAuth(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const user = await getUserFromToken(req);

  if (!user) {
    return {
      ok: false,
      requestId,
      response: errorResponse("UNAUTHORIZED", "Authentication required", 401, requestId),
    };
  }

  await dbConnect();

  return {
    ok: true,
    requestId,
    user,
    companyId: String(user.effectiveCompanyId || user.companyId || ""),
  };
}

export async function parseBody(req, schema, requestId) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: errorResponse("VALIDATION_ERROR", "Invalid request body", 400, requestId, result.error.flatten()),
    };
  }

  return { ok: true, data: result.data };
}

export function successResponse(data, status = 200, requestId) {
  const response = NextResponse.json({ success: true, data, error: null }, { status });
  response.headers.set("X-Request-ID", requestId || crypto.randomUUID());
  return response;
}

export function errorResponse(code, message, status = 400, requestId, details = null) {
  const response = NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
  response.headers.set("X-Request-ID", requestId || crypto.randomUUID());
  return response;
}

export async function writeAudit({ user, companyId, action, resource, resourceId, details, req, status = "success" }) {
  await logAudit({
    userId: user?._id,
    userName: user?.name || user?.email || "Unknown",
    companyId,
    action,
    resource,
    resourceId,
    details,
    status,
    req,
  });
}

export async function createNotification({ userId, companyId, type, priority = "medium", title, body, entityType = null, entityId = null, actionUrl = null, metadata = {} }) {
  const notification = await Notification.create({
    userId: String(userId),
    companyId: String(companyId),
    type,
    priority,
    title,
    body,
    entityType,
    entityId,
    actionUrl,
    metadata,
  });

  if (redis) {
    try {
      await redis.publish(`notifications:${String(userId)}`, JSON.stringify(notification));
    } catch {
      // no-op: notification persistence is still successful even if pubsub fails
    }
  }

  return notification;
}

export function ensureCompanyAccess(entityCompanyId, companyId) {
  return String(entityCompanyId || "") === String(companyId || "");
}

export function toObjectIdString(value) {
  return String(value || "");
}

export const commonQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
