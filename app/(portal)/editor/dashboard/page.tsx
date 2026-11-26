import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { manuscriptScope } from "@/lib/editor-scope";
import { PTitle } from "@/components/portal";
import { Stat, StatStrip, Card, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";

const FOLDERS: { group: string; items: (keyof typeof MANUSCRIPT_STATUSES)[] }[] = [
  { group: "Incoming", items: ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR"] },
  { group: "In review", items: ["EDITOR_ASSIGNED", "UNDER_REVIEW", "REVISED_SUBMITTED"] },
  { group: "With authors", items: ["REVISION_REQUIRED"] },
  { group: "Decided", items: ["ACCEPTED", "IN_PRODUCTION", "PUBLISHED", "REJECTED", "WITHDRAWN"] },
];
const days = (d: Date) => Math.max(0, Math.floor((Date.now() - d.getTime()) / 864e5));

export default async function EditorDashboard() {
  const u = await requireAnyPermission(["manuscripts.view_all", "manuscripts.view_assigned"]);
  const scope = manuscriptScope(u);
  const [counts, mine, decide, overdue, incoming] = await Promise.all([
    db.manuscript.groupBy({ by: ["status"], where: scope, _count: true }),
    db.manuscript.count({ where: { ...scope, handlingEditorId: u.id, status: { notIn: ["PUBLISHED", "REJECTED", "WITHDRAWN"] } } }),
    db.manuscript.findMany({ where: { ...scope, status: { in: ["UNDER_REVIEW", "REVISED_SUBMITTED"] }, assignments: { some: { status: "COMPLETED" }, none: { status: { in: ["INVITED", "ACCEPTED"] } } } }, orderBy: { updatedAt: "asc" }, take: 15 }),
    db.reviewerAssignment.findMany({ where: { manuscript: scope, status: { in: ["INVITED", "ACCEPTED"] }, dueAt: { lt: new Date() } }, include: { manuscript: true, reviewer: { select: { fullName: true } } }, orderBy: { dueAt: "asc" }, take: 15 }),
    db.manuscript.findMany({ where: { ...scope, status: { in: ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR"] } }, orderBy: { submittedAt: "asc" }, take: 15 }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  const active = counts.filter((x) => !["PUBLISHED", "REJECTED", "WITHDRAWN"].includes(x.status)).reduce((n, x) => n + x._count, 0);
  const queue = [
    ...incoming.map((m) => ({ id: m.id, code: m.code, title: m.title, status: m.status, task: "Screen new submission", since: m.submittedAt })),
    ...decide.map((m) => ({ id: m.id, code: m.code, title: m.title, status: m.status, task: "Make a decision", since: m.updatedAt })),
    ...overdue.map((a) => ({ id: a.manuscriptId, code: a.manuscript.code, title: a.manuscript.title, status: a.manuscript.status, task: `Chase overdue review (${a.reviewer.fullName})`, since: a.dueAt! })),
  ];

  return (
    <>
      <PTitle title="Editor dashboard" subtitle={`${active} active manuscript${active === 1 ? "" : "s"} in the editorial office`} actions={<Link href="/editor/manuscripts" className="btn-primary">All manuscripts</Link>} />
      <StatStrip cols={4}>
        <Stat label="New submissions" value={c("SUBMITTED") + c("TECHNICAL_CHECK") + c("AWAITING_EDITOR")} href="/editor/manuscripts?status=SUBMITTED" />
        <Stat label="Assigned to me" value={mine} href="/editor/manuscripts" />
        <Stat label="Ready for decision" value={decide.length} tone={decide.length ? "amber" : undefined} />
        <Stat label="Overdue reviews" value={overdue.length} tone={overdue.length ? "red" : undefined} />
      </StatStrip>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card title="Manuscript folders" flush>
          {FOLDERS.map((f) => (
            <div key={f.group}>
              <div className="border-b border-line bg-white px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{f.group}</div>
              <ul>
                {f.items.map((s) => (
                  <li key={s}>
                    <Link href={`/editor/manuscripts?status=${s}`} className="flex items-center justify-between border-b border-line px-4 py-2 text-[13.5px] hover:bg-surface">
                      <span className={c(s) ? "text-ink" : "text-muted"}>{MANUSCRIPT_STATUSES[s]}</span>
                      <span className={`tabular-nums ${c(s) ? "font-semibold text-link" : "text-muted"}`}>({c(s)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>

        <Card title="Requires attention" subtitle="Oldest items first" flush>
          {queue.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Nothing needs your attention right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Manuscript</th><th>Task</th><th>Status</th><th className="text-right">Waiting</th></tr></thead>
                <tbody>
                  {queue.map((q, i) => (
                    <tr key={i}>
                      <td className="min-w-72">
                        <Link href={`/editor/manuscripts/${q.id}`} className="font-medium text-ink hover:text-link hover:underline">{q.title}</Link>
                        <div className="font-mono text-[11px] text-muted">{q.code}</div>
                      </td>
                      <td className="whitespace-nowrap text-sm">{q.task}</td>
                      <td><StatusBadge status={q.status} /></td>
                      <td className="whitespace-nowrap text-right text-sm tabular-nums"><span className={days(q.since) > 14 ? "font-semibold text-red-700" : ""}>{days(q.since)} d</span><div className="text-[11px] text-muted">since {formatDate(q.since, { day: "numeric", month: "short" })}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
