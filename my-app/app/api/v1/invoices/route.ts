import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/v1/", "/api/");
  return NextResponse.redirect(url, 301);
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/v1/", "/api/");
  return NextResponse.redirect(url, 301);
}

export async function PUT(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/v1/", "/api/");
  return NextResponse.redirect(url, 301);
}

export async function DELETE(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/v1/", "/api/");
  return NextResponse.redirect(url, 301);
}

export async function PATCH(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/v1/", "/api/");
  return NextResponse.redirect(url, 301);
}
