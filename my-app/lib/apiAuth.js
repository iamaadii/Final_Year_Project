import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyAccessToken } from "./auth/jwt";

/**
 * Shared helper — extracts and verifies the JWT from request cookies,
 * connects to DB, and returns the full User document (or null).
 * Use this in every API route instead of duplicating the logic.
 */
export async function getUserFromToken(req) {
  // 1. Try to get from headers first (Middleware injected)
  const headerUserId = req.headers.get("x-user-id");
  const headerTenantId = req.headers.get("x-tenant-id");

  if (headerUserId) {
    await dbConnect();
    const user = await User.findById(headerUserId);
    if (user) {
      // Attach companyId for isolation if available; fallback to user._id for solos
      user.effectiveCompanyId = headerTenantId || user.companyId || user._id;
      return user;
    }
  }

  // 2. Fallback to direct cookie check (for routes bypassing middleware or non-edge environments)
  const token = req.cookies.get("accessToken")?.value || req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const session = await verifyAccessToken(token);
    if (!session?.userId) return null;
    
    await dbConnect();
    const user = await User.findById(session.userId);
    if (user) {
      user.effectiveCompanyId = session.tenantId || user.companyId || user._id;
    }
    return user;
  } catch (err) {
    console.error("API Auth Fallback Error:", err);
    return null;
  }
}

/**
 * Returns a decrypted version of the user object (PII fields).
 */
export function getDecryptedUser(user) {
  if (!user) return null;
  return {
    ...user.toObject(),
    ...user.getDecryptedData()
  };
}

/**
 * Returns a 401 Unauthorized NextResponse — import NextResponse in call-site.
 */
export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function forbidden(msg = "Forbidden") {
  return NextResponse.json({ message: msg }, { status: 403 });
}

export function notFound(msg = "Not found") {
  return NextResponse.json({ message: msg }, { status: 404 });
}

export function serverError(msg = "Server error") {
  return NextResponse.json({ message: msg }, { status: 500 });
}
