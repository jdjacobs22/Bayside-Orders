import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const referer = request.headers.get("referer");
  const url = request.nextUrl.origin;

  return NextResponse.json({
    origin,
    host,
    referer,
    url,
    headers: Object.fromEntries(request.headers.entries()),
    env: {
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
