import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

export type ServerSession = {
  userId: string;
  tenantId: string;
  role: string;
};

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function getServerSession(request: NextRequest): Promise<ServerSession | null> {
  try {
    const bearerToken = getBearerToken(request);
    const cookieToken = request.cookies.get("accessToken")?.value || null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return null;
    }

    const claims = await verifyAccessToken(token);

    if (!claims.userId || !claims.tenantId || !claims.role) {
      return null;
    }

    return {
      userId: claims.userId,
      tenantId: claims.tenantId,
      role: claims.role,
    };
  } catch {
    return null;
  }
}
