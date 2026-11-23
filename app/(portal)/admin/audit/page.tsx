import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Pagination } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("audit.view");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.AuditLogWhereInput = sp.q ? { OR: [{ action: { contains: sp.q } }, { entityId: sp.q }, { actorId: sp.q }, { entityType: { contains: sp.q, mode: "insensitive" } }] } : {};
  const [total, logs] = await Promise.all([db.auditLog.count({ where }), db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50, include: { actor: { select: { fullName: true, email: true } } } })]);
  return (
    <>
      <PTitle title="Audit logs" subtitle={`${total} entries`} />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Action (e.g. manuscript.decision), entity or user id" className="input max-w-md" /><button className="btn-secondary">Filter</button></form>
      <div className="card overflow-x-auto">
        <table className="table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr></thead>
          <tbody>{logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td><td className="text-xs">{l.actor ? `${l.actor.fullName}` : "system"}</td><td className="font-mono text-xs">{l.action}</td><td className="text-xs">{l.entityType} <span className="text-muted">{l.entityId}</span></td><td className="max-w-xs truncate font-mono text-[11px] text-muted">{l.details ? JSON.stringify(l.details) : ""}</td><td className="text-xs">{l.ip}</td></tr>)}</tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / 50)} makeHref={(p) => `/admin/audit?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`} />
    </>
  );
}
