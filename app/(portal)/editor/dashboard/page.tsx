import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { manuscriptScope } from "@/lib/editor-scope";
import { PTitle } from "@/components/portal";
import { Stat, Card, StatusBadge, Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";

export default async function EditorDashboard() {
  const u = await requireAnyPermission(["manuscripts.view_all", "manuscripts.view_assigned"]);
  const scope = manuscriptScope(u);
  const counts = await db.manuscript.groupBy({ by: ["status"], where: scope, _count: true });
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  const [mine, overdue, needsDecision] = await Promise.all([
    db.manuscript.findMany({ where: { ...scope, handlingEditorId: u.id, status: { notIn: ["PUBLISHED", "REJECTED", "WITHDRAWN"] } }, orderBy: { updatedAt: "desc" }, take: 10 }),
    db.reviewerAssignment.findMany({ where: { manuscript: scope, status: { in: ["INVITED", "ACCEPTED"] }, dueAt: { lt: new Date() } }, include: { manuscript: true, reviewer: true }, take: 10 }),
    db.manuscript.findMany({
      where: { ...scope, status: { in: ["UNDER_REVIEW", "REVISED_SUBMITTED"] }, assignments: { some: { status: "COMPLETED" }, none: { status: { in: ["INVITED", "ACCEPTED"] } } } },
      take: 10,
    }),
  ]);
  return (
    <>
      <PTitle title="Editor dashboard" actions={<Link href="/editor/manuscripts" className="btn-primary">All manuscripts</Link>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {(["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW", "REVISION_REQUIRED", "REVISED_SUBMITTED", "ACCEPTED", "IN_PRODUCTION", "REJECTED"] as const).map((s) => (
          <Stat key={s} label={MANUSCRIPT_STATUSES[s]} value={c(s)} href={`/editor/manuscripts?status=${s}`} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card title="Assigned to me">
          {mine.length ? <ul className="divide-y divide-line text-sm">{mine.map((m) => <li key={m.id} className="flex items-center justify-between gap-2 py-2"><Link className="link" href={`/editor/manuscripts/${m.id}`}><span className="font-mono text-xs">{m.code}</span> {m.title}</Link><StatusBadge status={m.status} /></li>)}</ul> : <Empty title="Nothing assigned" />}
        </Card>
        <Card title="Ready for decision">
          {needsDecision.length ? <ul className="divide-y divide-line text-sm">{needsDecision.map((m) => <li key={m.id} className="py-2"><Link className="link" href={`/editor/manuscripts/${m.id}`}><span className="font-mono text-xs">{m.code}</span> {m.title}</Link></li>)}</ul> : <Empty title="No manuscripts awaiting decision" />}
        </Card>
        <Card title="Overdue reviews">
          {overdue.length ? <ul className="divide-y divide-line text-sm">{overdue.map((a) => <li key={a.id} className="py-2"><Link className="link" href={`/editor/manuscripts/${a.manuscriptId}`}>{a.manuscript.code}</Link> — {a.reviewer.fullName} <span className="text-red-700">(due {formatDate(a.dueAt)})</span></li>)}</ul> : <Empty title="No overdue reviews" />}
        </Card>
      </div>
    </>
  );
}
