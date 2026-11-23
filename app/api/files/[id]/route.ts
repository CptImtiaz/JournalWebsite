import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canReadFile } from "@/lib/access";
import { readFileStream } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const { file, ok } = await canReadFile(user, id);
  if (!file) return new NextResponse("Not found", { status: 404 });
  if (!ok) return new NextResponse(user ? "Forbidden" : "Sign in required", { status: user ? 403 : 401 });
  const stream = await readFileStream(file.storageKey);
  if (!stream) return new NextResponse("File missing from storage", { status: 404 });
  const inline = file.mimeType.startsWith("image/") || req.nextUrl.searchParams.get("inline") === "1";
  const isPublic = file.visibility === "PUBLIC";
  return new NextResponse(stream, {
    headers: {
      "content-type": file.mimeType,
      "content-length": String(file.size),
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${file.originalName.replace(/["\\\r\n]/g, "_")}"`,
      "cache-control": isPublic ? "public, max-age=86400" : "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
