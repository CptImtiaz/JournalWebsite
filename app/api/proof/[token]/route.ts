import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFileStream } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = token ? await db.article.findFirst({ where: { proofToken: token } }) : null;
  if (!a?.proofFileId) return new NextResponse("Not found", { status: 404 });
  const f = await db.storedFile.findUnique({ where: { id: a.proofFileId } });
  const stream = f ? await readFileStream(f.storageKey) : null;
  if (!f || !stream) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(stream, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="proof.pdf"`, "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
}
