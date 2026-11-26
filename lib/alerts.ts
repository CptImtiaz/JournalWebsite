import "server-only";
import { db } from "./db";
import { sendTemplate } from "./email";
import { appUrl } from "./utils";

/** Emails every confirmed subscriber about a newly published article. */
export async function notifySubscribers(articleId: string) {
  const a = await db.article.findUnique({ where: { id: articleId }, include: { authors: { orderBy: { order: "asc" } } } });
  if (!a || a.status !== "PUBLISHED" || a.isSample) return 0;
  const subs = await db.newsletterSubscriber.findMany({ where: { confirmedAt: { not: null }, unsubscribedAt: null } });
  const authors = a.authors.length ? a.authors.map((x) => x.fullName).join(", ") : "";
  for (const s of subs) {
    await sendTemplate("alert_new_article", s.email, {
      title: a.title, authors, abstract: a.abstract.length > 600 ? a.abstract.slice(0, 600) + "…" : a.abstract,
      url: `${appUrl()}/article/${a.slug}`, unsubscribe_url: `${appUrl()}/alerts/unsubscribe?token=${s.token}`,
    });
  }
  return subs.length;
}
