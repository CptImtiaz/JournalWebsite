import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, Empty } from "@/components/ui";
import { IssueCover } from "@/components/issue-cover";
import { issuePath } from "@/lib/journal";

export const metadata = { title: "Archives", description: "All past volumes and issues of the journal.", alternates: { canonical: "/archives" } };

export default async function Archives() {
  const issues = await db.issue.findMany({
    where: { isPublished: true },
    orderBy: [{ year: "desc" }, { volume: { number: "desc" } }, { number: "desc" }],
    include: { volume: true, _count: { select: { articles: { where: { status: { in: ["PUBLISHED", "RETRACTED"] } } } } } },
  });
  const years = [...new Set(issues.map((i) => i.year))];
  return (
    <>
      <PageHeader title="Journal Archives" subtitle="Browse all published volumes and issues." crumbs={[{ label: "Archives" }]} />
      <div className="container-x space-y-10 py-10">
        {years.length === 0 && <Empty title="No issues have been published yet" />}
        {years.map((y) => (
          <section key={y} id={`y${y}`}>
            <h2 className="mb-4 border-b border-line pb-2 text-xl font-semibold text-ink">{y}</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {issues.filter((i) => i.year === y).map((i) => (
                <Link key={i.id} href={issuePath(i)} className="group">
                  <IssueCover issue={i} />
                  <div className="mt-2 text-sm font-semibold text-ink group-hover:text-brand">Volume {i.volume.number}, Issue {i.number}</div>
                  <div className="text-xs text-muted">{i._count.articles} articles{i.title ? ` · ${i.title}` : ""}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
