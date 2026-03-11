import { NextResponse } from "next/server";

export function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    const redirectPath = pathname.startsWith("/verification")
      ? "/register"
      : "/login";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/verification/:path*",
    "/buyer/:path*",
    "/seller/:path*",
    "/financier/:path*",
  ],
};
