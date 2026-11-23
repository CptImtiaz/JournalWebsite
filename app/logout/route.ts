import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return new NextResponse("Bad origin", { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
