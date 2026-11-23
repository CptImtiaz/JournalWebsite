import { cache } from "react";
import { db } from "./db";

export const getPublicArticle = cache(async (slug: string) => {
  return db.article.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "RETRACTED"] } },
    include: {
      authors: { orderBy: { order: "asc" } },
      references: { orderBy: { order: "asc" } },
      files: { include: { file: true }, orderBy: { sortOrder: "asc" } },
      doiRecords: { orderBy: { createdAt: "desc" } },
      category: true,
      issue: { include: { volume: true } },
    },
  });
});

export type PublicArticle = NonNullable<Awaited<ReturnType<typeof getPublicArticle>>>;

export function doiRegistered(a: { doi: string | null; doiRecords: { status: string; doi: string }[] }) {
  return !!a.doi && a.doiRecords.some((r) => r.status === "REGISTERED" && r.doi === a.doi);
}

export function toCite(a: PublicArticle) {
  return { ...a, doiRegistered: doiRegistered(a) };
}
