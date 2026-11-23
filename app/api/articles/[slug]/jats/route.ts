import { NextResponse } from "next/server";
import { getPublicArticle, doiRegistered } from "@/lib/article";
import { getJournal } from "@/lib/journal";
import { buildJats } from "@/lib/jats";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [a, j] = await Promise.all([getPublicArticle(slug), getJournal()]);
  if (!a) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(buildJats(a, j, doiRegistered(a)), { headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `inline; filename="${a.slug}.xml"` } });
}
