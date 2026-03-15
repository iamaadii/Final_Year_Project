import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * Verifies the HMAC-SHA256 signature from Razorpay or other webhooks.
 * @param {string} body - Raw string body of the request
 * @param {string} signature - Signature from the header (e.g. x-razorpay-signature)
 * @param {string} secret - Shared secret/webhook token
 * @returns {boolean}
 */
export function verifyHmacSignature(body, signature, secret) {
  if (!signature || !secret) return false;
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
    
  return expectedSignature === signature;
}

/**
 * Middleware-style wrapper for validating webhooks.
 */
export async function validateRazorpayWebhook(req, secret) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) return false;
  
  const body = await req.text();
  return verifyHmacSignature(body, signature, secret);
}
