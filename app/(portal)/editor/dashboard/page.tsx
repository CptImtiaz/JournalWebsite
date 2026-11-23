import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { manuscriptScope } from "@/lib/editor-scope";
import { PTitle } from "@/components/portal";
import { Stat, Card, Empty, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

const COLUMNS = [
  { title: "New & screening", statuses: ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR"], tone: "border-t-amber-500" },
  { title: "With editor", statuses: ["EDITOR_ASSIGNED", "REVISED_SUBMITTED"], tone: "border-t-brand" },
  { title: "In peer review", statuses: ["UNDER_REVIEW"], tone: "border-t-navy" },
  { title: "With authors", statuses: ["REVISION_REQUIRED"], tone: "border-t-slate-400" },
  { title: "Accepted / production", statuses: ["ACCEPTED", "IN_PRODUCTION"], tone: "border-t-emerald-600" },
];

export default async function EditorDashboard() {
  const u = await requireAnyPermission(["manuscripts.view_all", "manuscripts.view_assigned"]);
  const scope = manuscriptScope(u);
  const [active, overdue, needsDecision, mineCount] = await Promise.all([
    db.manuscript.findMany({
      where: { ...scope, status: { in: COLUMNS.flatMap((c) => c.statuses) } },
      orderBy: { updatedAt: "desc" },
      include: { handlingEditor: { select: { fullName: true } }, assignments: { select: { status: true } } },
    }),
    db.reviewerAssignment.findMany({ where: { manuscript: scope, status: { in: ["INVITED", "ACCEPTED"] }, dueAt: { lt: new Date() } }, include: { manuscript: true, reviewer: true }, take: 10 }),
    db.manuscript.findMany({ where: { ...scope, status: { in: ["UNDER_REVIEW", "REVISED_SUBMITTED"] }, assignments: { some: { status: "COMPLETED" }, none: { status: { in: ["INVITED", "ACCEPTED"] } } } }, take: 10 }),
    db.manuscript.count({ where: { ...scope, handlingEditorId: u.id, status: { notIn: ["PUBLISHED", "REJECTED", "WITHDRAWN"] } } }),
  ]);
  return (
    <>
      <PTitle title="Editorial office" subtitle="Your manuscript pipeline at a glance." actions={<Link href="/editor/manuscripts" className="btn-primary"><Icon name="list" size={16} />All manuscripts</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="inbox" label="Active manuscripts" value={active.length} />
        <Stat icon="user" tone="blue" label="Assigned to me" value={mineCount} />
        <Stat icon="check" tone="green" label="Ready for decision" value={needsDecision.length} />
        <Stat icon="clock" tone="red" label="Overdue reviews" value={overdue.length} />
      </div>

      {(needsDecision.length > 0 || overdue.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {needsDecision.length > 0 && (
            <Card title="Ready for decision" subtitle="All invited reviews are complete">
              <ul className="divide-y divide-line text-sm">{needsDecision.map((m) => <li key={m.id} className="py-2"><Link className="font-medium hover:text-brand" href={`/editor/manuscripts/${m.id}`}><span className="font-mono text-xs text-muted">{m.code}</span> {m.title}</Link></li>)}</ul>
            </Card>
          )}
          {overdue.length > 0 && (
            <Card title="Overdue reviews">
              <ul className="divide-y divide-line text-sm">{overdue.map((a) => <li key={a.id} className="flex justify-between gap-2 py-2"><Link className="font-medium hover:text-brand" href={`/editor/manuscripts/${a.manuscriptId}`}>{a.manuscript.code} · {a.reviewer.fullName}</Link><span className="whitespace-nowrap text-red-700">due {formatDate(a.dueAt)}</span></li>)}</ul>
            </Card>
          )}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Pipeline</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((c) => {
          const list = active.filter((m) => c.statuses.includes(m.status));
          return (
            <div key={c.title} className={`w-64 shrink-0 rounded-xl border border-line border-t-4 bg-white/60 2xl:w-auto 2xl:flex-1 ${c.tone}`}>
              <div className="flex items-center justify-between px-4 py-3"><span className="text-sm font-semibold">{c.title}</span><span className="rounded-full bg-app px-2 text-xs font-semibold text-muted">{list.length}</span></div>
              <div className="space-y-2 px-3 pb-3">
                {list.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted">Empty</p>}
                {list.slice(0, 8).map((m) => {
                  const done = m.assignments.filter((a) => a.status === "COMPLETED").length;
                  const live = m.assignments.filter((a) => a.status === "INVITED" || a.status === "ACCEPTED").length;
                  return (
                    <Link key={m.id} href={`/editor/manuscripts/${m.id}`} className="block rounded-lg border border-line bg-white p-3 shadow-sm transition hover:border-brand">
                      <div className="font-mono text-[11px] text-muted">{m.code}</div>
                      <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{m.title}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StatusBadge status={m.status} />
                        {(done + live > 0) && <span className="text-[11px] text-muted">{done}/{done + live} reviews</span>}
                      </div>
                      <div className="mt-1 text-[11px] text-muted">{m.handlingEditor?.fullName ?? "No editor"} · {formatDate(m.updatedAt, { day: "numeric", month: "short" })}</div>
                    </Link>
                  );
                })}
                {list.length > 8 && <Link href={`/editor/manuscripts?status=${c.statuses[0]}`} className="block text-center text-xs font-medium text-brand">+{list.length - 8} more</Link>}
              </div>
            </div>
          );
        })}
      </div>
      {active.length === 0 && <div className="mt-4"><Empty title="No active manuscripts" /></div>}
    </>
  );
}
