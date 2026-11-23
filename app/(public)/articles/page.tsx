import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PageHeader, Empty, Pagination } from "@/components/ui";
import { ArticleRow } from "@/components/article-card";
import { articleCardInclude, PUBLIC_ARTICLE } from "@/lib/queries";
import { ARTICLE_TYPES } from "@/lib/constants";

export const metadata = { title: "Articles", description: "Search all published articles by title, author, keyword, abstract, DOI, volume, issue, year or research area.", alternates: { canonical: "/articles" } };

type SP = Promise<Record<string, string | undefined>>;
const PER = 10;

export default async function Articles({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 200);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.ArticleWhereInput = { ...PUBLIC_ARTICLE };
  const and: Prisma.ArticleWhereInput[] = [];
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 8);
    for (const t of terms) {
      const c = { contains: t, mode: "insensitive" as const };
      and.push({ OR: [{ title: c }, { abstract: c }, { keywords: c }, { doi: c }, { authors: { some: { fullName: c } } }, { category: { name: c } }] });
    }
  }
  if (sp.year) {
    const y = parseInt(sp.year, 10);
    if (y) and.push({ publishedAt: { gte: new Date(Date.UTC(y, 0, 1)), lt: new Date(Date.UTC(y + 1, 0, 1)) } });
  }
  if (sp.type) and.push({ articleType: sp.type });
  if (sp.category) and.push({ category: { slug: sp.category } });
  if (sp.author) and.push({ authors: { some: { fullName: { contains: sp.author, mode: "insensitive" } } } });
  if (sp.issue) and.push({ issueId: sp.issue });
  if (sp.volume) {
    const v = parseInt(sp.volume, 10);
    if (v) and.push({ issue: { volume: { number: v } } });
  }
  if (and.length) where.AND = and;
  const sort = sp.sort === "oldest" ? { publishedAt: "asc" as const } : sp.sort === "views" ? { views: "desc" as const } : { publishedAt: "desc" as const };

  const [total, items, cats, issues, years] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({ where, include: articleCardInclude, orderBy: sort, skip: (page - 1) * PER, take: PER }),
    db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.issue.findMany({ where: { isPublished: true }, include: { volume: true }, orderBy: [{ year: "desc" }, { number: "desc" }] }),
    db.$queryRaw<{ y: number }[]>`SELECT DISTINCT EXTRACT(YEAR FROM "publishedAt")::int AS y FROM "Article" WHERE status IN ('PUBLISHED','RETRACTED') AND "publishedAt" IS NOT NULL ORDER BY y DESC`,
  ]);
  const pages = Math.ceil(total / PER);
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/articles?${u}`;
  };

  return (
    <>
      <PageHeader title="Articles" subtitle="Search the journal's published research." crumbs={[{ label: "Articles" }]} />
      <div className="container-x py-8">
        <form className="mb-8 grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-6" role="search">
          <input name="q" defaultValue={q} placeholder="Search title, author, keywords, abstract or DOI" className="input md:col-span-4" aria-label="Search" />
          <select name="sort" defaultValue={sp.sort ?? ""} className="input" aria-label="Sort">
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most viewed</option>
          </select>
          <button className="btn-primary">Search</button>
          <select name="year" defaultValue={sp.year ?? ""} className="input" aria-label="Publication year">
            <option value="">Any year</option>
            {years.map((y) => <option key={y.y} value={y.y}>{y.y}</option>)}
          </select>
          <select name="type" defaultValue={sp.type ?? ""} className="input" aria-label="Article type">
            <option value="">Any article type</option>
            {ARTICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select name="category" defaultValue={sp.category ?? ""} className="input md:col-span-2" aria-label="Research area">
            <option value="">Any research area</option>
            {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select name="issue" defaultValue={sp.issue ?? ""} className="input" aria-label="Issue">
            <option value="">Any issue</option>
            {issues.map((i) => <option key={i.id} value={i.id}>Vol. {i.volume.number}, Iss. {i.number} ({i.year})</option>)}
          </select>
          <input name="author" defaultValue={sp.author ?? ""} placeholder="Author name" className="input" aria-label="Author" />
        </form>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>{total} result{total === 1 ? "" : "s"}{q ? ` for “${q}”` : ""}</span>
          {Object.values(sp).some(Boolean) && <Link className="link" href="/articles">Clear filters</Link>}
        </div>
        {items.length ? <div className="border-t border-line pt-5">{items.map((a) => <ArticleRow key={a.id} a={a} snippet />)}</div> : <Empty title="No articles found">Try different search terms or remove filters.</Empty>}
        <Pagination page={page} pages={pages} makeHref={qs} />
      </div>
    </>
  );
}
