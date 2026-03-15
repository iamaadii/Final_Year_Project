import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * Shared helper — extracts and verifies the JWT from request cookies,
 * connects to DB, and returns the full User document (or null).
 * Use this in every API route instead of duplicating the logic.
 */
export async function getUserFromToken(req) {
  // 1. Try to get from headers first (Middleware injected)
  const headerUserId = req.headers.get("x-user-id");
  const headerCompanyId = req.headers.get("x-company-id");

  if (headerUserId) {
    await dbConnect();
    const user = await User.findById(headerUserId);
    if (user) {
      // Attach companyId for isolation if available
      user.effectiveCompanyId = headerCompanyId || user.companyId;
      return user;
    }
  }

  // 2. Fallback to direct cookie check (for routes bypassing middleware or non-edge environments)
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.id) return null;
    await dbConnect();
    const user = await User.findById(payload.id);
    if (user) {
      user.effectiveCompanyId = payload.companyId || user.companyId;
    }
    return user;
  } catch {
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
  const { NextResponse } = require("next/server");
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function forbidden(msg = "Forbidden") {
  const { NextResponse } = require("next/server");
  return NextResponse.json({ message: msg }, { status: 403 });
}

export function notFound(msg = "Not found") {
  const { NextResponse } = require("next/server");
  return NextResponse.json({ message: msg }, { status: 404 });
}

export function serverError(msg = "Server error") {
  const { NextResponse } = require("next/server");
  return NextResponse.json({ message: msg }, { status: 500 });
}
