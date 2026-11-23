import { NextRequest, NextResponse } from "next/server";
import { getPublicArticle, toCite } from "@/lib/article";
import { getJournal } from "@/lib/journal";
import { bibtex, ris, FORMATS } from "@/lib/citations";
import { appUrl } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [a, j] = await Promise.all([getPublicArticle(slug), getJournal()]);
  if (!a) return new NextResponse("Not found", { status: 404 });
  const c = toCite(a);
  const fmt = req.nextUrl.searchParams.get("format") ?? "bibtex";
  if (fmt === "bibtex")
    return new NextResponse(bibtex(c, j), { headers: { "content-type": "application/x-bibtex; charset=utf-8", "content-disposition": `attachment; filename="${a.slug}.bib"` } });
  if (fmt === "ris")
    return new NextResponse(ris(c, j, `${appUrl()}/article/${a.slug}`), { headers: { "content-type": "application/x-research-info-systems; charset=utf-8", "content-disposition": `attachment; filename="${a.slug}.ris"` } });
  const f = FORMATS[fmt as keyof typeof FORMATS];
  if (!f) return new NextResponse("Unknown format", { status: 400 });
  return new NextResponse(f.fn(c, j), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
