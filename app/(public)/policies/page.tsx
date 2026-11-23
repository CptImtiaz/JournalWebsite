import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Journal Policies", description: "Publication ethics, peer review, open access, copyright and other journal policies." };

export default async function Policies() {
  const ps = await db.page.findMany({ where: { kind: "POLICY", isPublished: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Journal Policies" subtitle="The standards and procedures that govern publication in the journal." crumbs={[{ label: "Policies" }]} />
      <div className="container-x grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {ps.map((p) => (
          <Link key={p.id} href={`/${p.slug}`} className="card p-5 transition hover:border-brand">
            <h2 className="font-semibold text-navy">{p.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{p.body.replace(/[#*_\[\]()]/g, "").slice(0, 160)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
