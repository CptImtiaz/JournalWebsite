import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { db } from "@/lib/db";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPage((await params).slug);
  if (!p || !p.isPublished) return {};
  return { title: p.title, description: p.seoDescription || p.body.slice(0, 160).replace(/[#*_\n]/g, " "), alternates: { canonical: `/${p.slug}` } };
}

export default async function CmsPage({ params }: P) {
  const { slug } = await params;
  const p = await getPage(slug);
  if (!p || !p.isPublished) notFound();
  const policies = p.kind === "POLICY" ? await db.page.findMany({ where: { kind: "POLICY", isPublished: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, title: true } }) : [];
  return (
    <>
      <PageHeader title={p.title} crumbs={p.kind === "POLICY" ? [{ label: "Policies", href: "/policies" }, { label: p.title }] : [{ label: p.title }]} />
      <div className={`container-x py-10 ${policies.length ? "grid gap-10 lg:grid-cols-[1fr_260px]" : ""}`}>
        <div>
          <div className="prose prose-slate max-w-none prose-headings:text-navy prose-headings:font-semibold prose-a:text-brand prose-h2:mt-8 prose-h2:text-xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
          <p className="mt-10 text-xs text-muted">Last updated {formatDate(p.updatedAt)}</p>
        </div>
        {policies.length > 0 && (
          <aside>
            <nav className="card sticky top-4 p-4" aria-label="Policies">
              <h2 className="mb-2 text-sm font-semibold text-navy">Journal Policies</h2>
              <ul className="space-y-1 text-sm">
                {policies.map((x) => (
                  <li key={x.slug}><Link href={`/${x.slug}`} className={x.slug === slug ? "font-semibold text-brand" : "text-ink hover:text-brand"}>{x.title}</Link></li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </>
  );
}
