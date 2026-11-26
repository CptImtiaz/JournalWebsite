import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const [pages, articles, issues, ann] = await Promise.all([
    db.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { status: { in: ["PUBLISHED", "RETRACTED"] }, isSample: false }, select: { slug: true, updatedAt: true } }),
    db.issue.findMany({ where: { isPublished: true, isSample: false }, select: { slug: true, year: true, publishedAt: true } }),
    db.announcement.findMany({ where: { isPublished: true, isSample: false }, select: { slug: true, publishedAt: true } }),
  ]);
  const fixed = ["", "/editorial-board", "/aims-scope", "/current-issue", "/archives", "/articles", "/policies", "/announcements", "/contact"];
  return [
    ...fixed.map((p) => ({ url: base + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...pages.filter((p) => !["aims-scope", "contact"].includes(p.slug)).map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
    ...issues.map((i) => ({ url: `${base}/archives/${i.year}/${i.slug}`, lastModified: i.publishedAt ?? undefined, priority: 0.7 })),
    ...articles.map((a) => ({ url: `${base}/article/${a.slug}`, lastModified: a.updatedAt, priority: 0.9 })),
    ...ann.map((a) => ({ url: `${base}/announcements/${a.slug}`, lastModified: a.publishedAt ?? undefined, priority: 0.3 })),
  ];
}
