import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

const TONE = { INVITED: "amber", ACCEPTED: "blue", COMPLETED: "green", DECLINED: "gray", CANCELLED: "gray" } as const;
const LABEL = { INVITED: "Invitation pending", ACCEPTED: "Review in progress", COMPLETED: "Review submitted", DECLINED: "Declined", CANCELLED: "Cancelled" } as const;

function daysLeft(d: Date | null) {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 864e5);
}

export default async function ReviewerDashboard() {
  const u = await requireUser();
  const as = await db.reviewerAssignment.findMany({ where: { reviewerId: u.id }, orderBy: { invitedAt: "desc" }, include: { manuscript: { select: { code: true, title: true, articleType: true, abstract: true, keywords: true } } } });
  const open = as.filter((a) => a.status === "INVITED" || a.status === "ACCEPTED");
  const past = as.filter((a) => !(a.status === "INVITED" || a.status === "ACCEPTED"));
  return (
    <>
      <PTitle title="Review assignments" subtitle="Reviews are double anonymous. You will not see the authors' names." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="bell" tone="amber" label="New invitations" value={as.filter((a) => a.status === "INVITED").length} />
        <Stat icon="review" tone="blue" label="Reviews in progress" value={as.filter((a) => a.status === "ACCEPTED").length} />
        <Stat icon="check" tone="green" label="Completed reviews" value={as.filter((a) => a.status === "COMPLETED").length} />
        <Stat icon="clock" label="Overdue" value={open.filter((a) => (daysLeft(a.dueAt) ?? 1) < 0).length} />
      </div>
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted">Open ({open.length})</h2>
      {open.length === 0 ? <Empty title="No open review requests">Thank you for supporting the journal&apos;s peer review.</Empty> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {open.map((a) => {
            const d = daysLeft(a.dueAt);
            return (
              <div key={a.id} className="app-card flex flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{a.manuscript.code} · round {a.revision + 1}</span>
                  <Badge tone={TONE[a.status as keyof typeof TONE]}>{LABEL[a.status as keyof typeof LABEL]}</Badge>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{a.manuscript.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-ink/75">{a.manuscript.abstract}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <span className={`inline-flex items-center gap-1.5 text-sm ${d !== null && d < 0 ? "font-semibold text-red-700" : d !== null && d <= 3 ? "font-semibold text-amber-700" : "text-muted"}`}>
                    <Icon name="clock" size={15} />{d === null ? "No deadline" : d < 0 ? `${-d} day${d === -1 ? "" : "s"} overdue` : `Due in ${d} day${d === 1 ? "" : "s"} · ${formatDate(a.dueAt)}`}
                  </span>
                  <Link href={`/reviewer/assignments/${a.id}`} className="btn-primary btn-sm">{a.status === "INVITED" ? "Respond to invitation" : "Continue review"}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted">History ({past.length})</h2>
          <div className="app-card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Manuscript</th><th>Invited</th><th>Status</th><th></th></tr></thead>
              <tbody>{past.map((a) => (
                <tr key={a.id}>
                  <td className="min-w-64"><span className="font-medium">{a.manuscript.title}</span><div className="font-mono text-[11px] text-muted">{a.manuscript.code}</div></td>
                  <td className="whitespace-nowrap text-muted">{formatDate(a.invitedAt)}</td>
                  <td><Badge tone={TONE[a.status as keyof typeof TONE]}>{LABEL[a.status as keyof typeof LABEL]}</Badge></td>
                  <td className="text-right"><Link href={`/reviewer/assignments/${a.id}`} className="text-sm font-medium text-brand hover:underline">View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
