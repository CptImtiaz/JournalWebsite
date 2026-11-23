import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { appUrl, escapeXml } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const j = await getJournal();
  const items = await db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 50, include: { authors: { orderBy: { order: "asc" } } } });
  const base = appUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(j.name)}</title>
<link>${base}</link>
<atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
<description>${escapeXml(j.description ?? "")}</description>
<language>en</language>
${items.map((a) => `<item><title>${escapeXml(a.title)}</title><link>${base}/article/${a.slug}</link><guid isPermaLink="true">${base}/article/${a.slug}</guid>${a.publishedAt ? `<pubDate>${a.publishedAt.toUTCString()}</pubDate>` : ""}${a.authors.map((x) => `<dc:creator>${escapeXml(x.fullName)}</dc:creator>`).join("")}<description>${escapeXml(a.abstract)}</description></item>`).join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
