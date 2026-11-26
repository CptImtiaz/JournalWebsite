import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAnyPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { manuscriptScope } from "@/lib/editor-scope";
import { PTitle } from "@/components/portal";
import { StatusBadge, Empty, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";

export default async function ManuscriptList({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const u = await requireAnyPermission(["manuscripts.view_all", "manuscripts.view_assigned"]);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.ManuscriptWhereInput = { ...manuscriptScope(u) };
  if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { code: { contains: sp.q, mode: "insensitive" } }, { authors: { some: { fullName: { contains: sp.q, mode: "insensitive" } } } }];
  const [total, ms] = await Promise.all([
    db.manuscript.count({ where }),
    db.manuscript.findMany({ where, orderBy: { submittedAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { handlingEditor: { select: { fullName: true } }, category: { select: { name: true } }, _count: { select: { assignments: true } } } }),
  ]);
  return (
    <>
      <PTitle title="Manuscripts" subtitle={`${total} manuscript${total === 1 ? "" : "s"}`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search ID, title or author" className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-xs">
          <option value="">All statuses</option>
          {Object.entries(MANUSCRIPT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      {ms.length === 0 ? <Empty title="No manuscripts match" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>ID</th><th>Title</th><th>Submitted</th><th>Handling editor</th><th>Reviews</th><th>Status</th></tr></thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap font-mono text-xs"><Link className="link" href={`/editor/manuscripts/${m.id}`}>{m.code}</Link></td>
                  <td className="min-w-64"><Link href={`/editor/manuscripts/${m.id}`} className="font-medium text-ink hover:text-brand">{m.title}</Link><div className="text-xs text-muted">{m.articleType} · {m.category?.name}</div></td>
                  <td className="whitespace-nowrap">{formatDate(m.submittedAt)}</td>
                  <td>{m.handlingEditor?.fullName ?? <span className="text-muted">—</span>}</td>
                  <td>{m._count.assignments}</td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / 25)} makeHref={(p) => `/editor/manuscripts?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`} />
    </>
  );
}
