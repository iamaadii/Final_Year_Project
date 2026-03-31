import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = [
  "/",
  "/menu",
  "/login",
  "/register",
  "/forgot-password",
  "/forgotPassword",
  "/reset-password",
  "/resetPassword",
  "/verification",
  "/api/health",
  "/api/login",
  "/api/register",
  "/api/verification",
  "/api/forgot-password",
  "/api/invoices/reminders/run",
  "/api/compliance/run",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
];

function isPublicRoute(pathname: string) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/public") || pathname.includes(".")) {
    return true;
  }
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.razorpay.com",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  return response;
}

function withRequestId(response: NextResponse, requestId: string) {
  response.headers.set("X-Request-ID", requestId);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  if (isPublicRoute(pathname)) {
    return applySecurityHeaders(withRequestId(NextResponse.next({ request: { headers: requestHeaders } }), requestId));
  }

  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const accessToken = request.cookies.get("accessToken")?.value || bearerToken;

  if (!accessToken) {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(
        withRequestId(
          NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" }, meta: { requestId } },
            { status: 401 },
          ),
          requestId,
        ),
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return applySecurityHeaders(withRequestId(response, requestId));
  }

  try {
    const session = await verifyAccessToken(accessToken);
    if (session.tenantId) requestHeaders.set("x-tenant-id", session.tenantId);
    if (session.userId) requestHeaders.set("x-user-id", session.userId);
    if (session.role) requestHeaders.set("x-user-role", session.role);
    if (session.userType) requestHeaders.set("x-user-type", session.userType);

    const onboardingComplete = Boolean(session.hasCompletedOnboarding);
    const isOnboardingPath = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

    const ut = session.userType || "";
    const isApi = pathname.startsWith("/api/");

    if (pathname.startsWith("/api/buyer/") && ut !== "Buyer") {
      return applySecurityHeaders(withRequestId(NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only buyers can access this resource" } }, { status: 403 }), requestId));
    }
    if (pathname.startsWith("/api/seller/") && ut !== "Seller") {
      return applySecurityHeaders(withRequestId(NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only sellers can access this resource" } }, { status: 403 }), requestId));
    }
    if (!isApi && !isOnboardingPath && !onboardingComplete) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return applySecurityHeaders(withRequestId(NextResponse.redirect(url), requestId));
    }
    if (!isApi && pathname.startsWith("/buyer/") && ut !== "Buyer") {
      const url = request.nextUrl.clone();
      url.pathname = ut ? `/${ut.toLowerCase()}/dashboard` : "/login";
      return applySecurityHeaders(withRequestId(NextResponse.redirect(url), requestId));
    }
    if (!isApi && pathname.startsWith("/seller/") && ut !== "Seller") {
      const url = request.nextUrl.clone();
      url.pathname = ut ? `/${ut.toLowerCase()}/dashboard` : "/login";
      return applySecurityHeaders(withRequestId(NextResponse.redirect(url), requestId));
    }

    return applySecurityHeaders(
      withRequestId(
        NextResponse.next({
          request: { headers: requestHeaders },
        }),
        requestId,
      ),
    );
  } catch {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(
        withRequestId(
          NextResponse.json(
            { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired session" }, meta: { requestId } },
            { status: 401 },
          ),
          requestId,
        ),
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return applySecurityHeaders(withRequestId(response, requestId));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
