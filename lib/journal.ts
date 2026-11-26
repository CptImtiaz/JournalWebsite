import { cache } from "react";
import { db } from "./db";

export const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Editorial Board", href: "/editorial-board" },
  { label: "Aims & Scope", href: "/aims-scope" },
  { label: "Current Issue", href: "/current-issue" },
  { label: "Archives", href: "/archives" },
  { label: "Articles", href: "/articles" },
  { label: "For Authors", href: "/for-authors" },
  { label: "Publication Ethics", href: "/publication-ethics" },
  { label: "Contact", href: "/contact" },
];

export const DEFAULT_FOOTER = [
  { label: "About the Journal", href: "/about" },
  { label: "Editorial Board", href: "/editorial-board" },
  { label: "Submission Guidelines", href: "/for-authors" },
  { label: "Peer Review Policy", href: "/peer-review" },
  { label: "Publication Ethics", href: "/publication-ethics" },
  { label: "Open Access Policy", href: "/open-access" },
  { label: "Publication Fees", href: "/publication-fees" },
  { label: "Copyright & Licensing", href: "/copyright" },
  { label: "All Policies", href: "/policies" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Announcements", href: "/announcements" },
];

export type NavLink = { label: string; href: string };
export type HomepageConfig = { headline?: string; description?: string; showAnnouncements?: boolean; heroImageFileId?: string | null; heroImageAlt?: string };

export const getJournal = cache(async () => {
  const j = await db.journal.findUnique({ where: { id: "journal" } });
  if (j) return j;
  return db.journal.create({ data: { id: "journal", name: "International Journal of Computer Science and Technology", shortName: "IJCST" } });
});

export function navOf(j: { navMenu: unknown }): NavLink[] {
  return Array.isArray(j.navMenu) && j.navMenu.length ? (j.navMenu as NavLink[]) : DEFAULT_NAV;
}
export function footerOf(j: { footerLinks: unknown }): NavLink[] {
  return Array.isArray(j.footerLinks) && j.footerLinks.length ? (j.footerLinks as NavLink[]) : DEFAULT_FOOTER;
}
export function homepageOf(j: { homepage: unknown }): HomepageConfig {
  return (j.homepage && typeof j.homepage === "object" ? j.homepage : {}) as HomepageConfig;
}

export const getCurrentIssue = cache(async () => {
  const include = {
    volume: true,
    articles: { where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" as const }, { publishedAt: "asc" as const }], include: { authors: { orderBy: { order: "asc" as const } } } },
  };
  return (
    (await db.issue.findFirst({ where: { isPublished: true, isCurrent: true }, include })) ??
    (await db.issue.findFirst({ where: { isPublished: true }, orderBy: [{ year: "desc" }, { publishedAt: "desc" }], include }))
  );
});

export function fileUrl(id?: string | null) {
  return id ? `/api/files/${id}` : null;
}

export function issueLabel(i: { volume: { number: number }; number: number; year: number }) {
  return `Volume ${i.volume.number}, Issue ${i.number} (${i.year})`;
}
export function issuePath(i: { year: number; slug: string }) {
  return `/archives/${i.year}/${i.slug}`;
}
