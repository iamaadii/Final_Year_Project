import crypto from "crypto";
import { successResponse } from "@/lib/api/routeUtils";

export async function POST() {
  const requestId = crypto.randomUUID();
  const res = successResponse({ message: "Logged out" }, 200, requestId);

  res.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}

