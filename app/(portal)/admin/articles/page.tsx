import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const TONE = { DRAFT: "amber", PUBLISHED: "green", RETRACTED: "red" } as const;

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePermission("publishing.manage");
  const sp = await searchParams;
  const [arts, production] = await Promise.all([
    db.article.findMany({
      where: { ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}) },
      orderBy: { updatedAt: "desc" },
      include: { issue: { include: { volume: true } }, doiRecords: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 }, authors: { select: { fullName: true }, orderBy: { order: "asc" } } },
    }),
    db.manuscript.findMany({ where: { status: { in: ["ACCEPTED", "IN_PRODUCTION"] }, article: null } }),
  ]);
  return (
    <>
      <PTitle title="Articles" actions={<Link href="/admin/articles/new" className="btn-primary">New article</Link>} />
      {production.length > 0 && (
        <Card title="Accepted manuscripts awaiting production" className="mb-6">
          <ul className="space-y-1 text-sm">{production.map((m) => <li key={m.id}><Link className="link" href={`/editor/manuscripts/${m.id}`}>{m.code} — {m.title}</Link></li>)}</ul>
          <p className="hint">Open a manuscript and click “Send to production” to create its article record.</p>
        </Card>
      )}
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search title" className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-xs"><option value="">All</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="RETRACTED">Retracted</option></select>
        <button className="btn-secondary">Filter</button>
      </form>
      {arts.length === 0 ? <Empty title="No articles" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Title</th><th>Issue</th><th>Published</th><th>DOI</th><th>Views / DL</th><th>Status</th></tr></thead>
            <tbody>{arts.map((a) => (
              <tr key={a.id}>
                <td className="min-w-72"><Link className="link font-medium" href={`/admin/articles/${a.id}`}>{a.title}</Link><div className="text-xs text-muted">{a.authors.map((x) => x.fullName).join(", ")}</div></td>
                <td className="whitespace-nowrap text-xs">{a.issue ? `Vol ${a.issue.volume.number}(${a.issue.number})` : "—"}</td>
                <td className="whitespace-nowrap text-xs">{formatDate(a.publishedAt)}</td>
                <td className="text-xs">{a.doi ? <>{a.doi}<br /><Badge tone={a.doiRecords[0]?.status === "REGISTERED" ? "green" : "amber"}>{a.doiRecords[0]?.status?.toLowerCase() ?? "not deposited"}</Badge></> : "—"}</td>
                <td className="text-xs">{a.views} / {a.downloads}</td>
                <td className="space-x-1"><Badge tone={TONE[a.status as keyof typeof TONE]}>{a.status.toLowerCase()}</Badge>{a.isSample && <Badge tone="amber">sample</Badge>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
