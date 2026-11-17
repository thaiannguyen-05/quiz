import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    "dev";
  return NextResponse.json({ buildId });
}