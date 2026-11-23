import { db } from "./db";

export const articleCardInclude = {
  authors: { orderBy: { order: "asc" as const }, select: { fullName: true } },
  files: { select: { kind: true, fileId: true } },
  doiRecords: { select: { status: true } },
  issue: { select: { number: true, year: true, volume: { select: { number: true } } } },
};

export const PUBLIC_ARTICLE = { status: { in: ["PUBLISHED", "RETRACTED"] } };

export async function latestArticles(n = 6) {
  return db.article.findMany({ where: PUBLIC_ARTICLE, orderBy: { publishedAt: "desc" }, take: n, include: articleCardInclude });
}
