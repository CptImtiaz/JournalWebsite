import Link from "next/link";
import { db } from "@/lib/db";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Aims & Scope", description: "Research fields accepted by the journal.", alternates: { canonical: "/aims-scope" } };

export default async function AimsScope() {
  const [page, cats] = await Promise.all([getPage("aims-scope"), db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } })]);
  return (
    <>
      <PageHeader title="Aims & Scope" crumbs={[{ label: "Aims & Scope" }]} />
      <div className="container-x py-10">
        {page && <div className="prose prose-slate max-w-none prose-headings:text-navy prose-headings:font-semibold prose-a:text-brand prose-h2:mt-8 prose-h2:text-xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />}
        <h2 className="mt-10 text-xl font-semibold text-navy">Research Areas</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <Link key={c.id} href={`/articles?category=${c.slug}`} className="card flex gap-4 p-4 transition hover:border-brand">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-brand-light text-sm font-semibold text-brand">{i + 1}</span>
              <div>
                <h3 className="font-medium text-navy">{c.name}</h3>
                {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
