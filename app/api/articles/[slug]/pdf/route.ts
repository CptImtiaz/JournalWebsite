import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readFileStream } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.article.findFirst({ where: { slug, status: { in: ["PUBLISHED", "RETRACTED"] } }, include: { files: { where: { kind: "PDF" }, include: { file: true } } } });
  const f = a?.files[0]?.file;
  if (!a || !f) return new NextResponse("Not found", { status: 404 });
  const stream = await readFileStream(f.storageKey);
  if (!stream) return new NextResponse("Not found", { status: 404 });
  await db.article.update({ where: { id: a.id }, data: { downloads: { increment: 1 } } });
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(stream, {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(f.size),
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${a.slug}.pdf"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
