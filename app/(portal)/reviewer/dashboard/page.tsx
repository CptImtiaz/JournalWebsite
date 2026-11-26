import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Stat, StatStrip, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const TONE = { INVITED: "amber", ACCEPTED: "blue", COMPLETED: "green", DECLINED: "gray", CANCELLED: "gray" } as const;
const LABEL = { INVITED: "Invitation", ACCEPTED: "In progress", COMPLETED: "Submitted", DECLINED: "Declined", CANCELLED: "Cancelled" } as const;
const left = (d: Date | null) => (d ? Math.ceil((d.getTime() - Date.now()) / 864e5) : null);

export default async function ReviewerDashboard() {
  const u = await requireUser();
  const as = await db.reviewerAssignment.findMany({ where: { reviewerId: u.id }, orderBy: { invitedAt: "desc" }, include: { manuscript: { select: { code: true, title: true, articleType: true } } } });
  const open = as.filter((a) => a.status === "INVITED" || a.status === "ACCEPTED");
  const past = as.filter((a) => !open.includes(a));
  const Row = ({ a }: { a: (typeof as)[number] }) => {
    const d = left(a.dueAt);
    return (
      <tr>
        <td className="min-w-72"><Link href={`/reviewer/assignments/${a.id}`} className="font-medium text-ink hover:text-link hover:underline">{a.manuscript.title}</Link><div className="font-mono text-[11px] text-muted">{a.manuscript.code} · round {a.revision + 1} · {a.manuscript.articleType}</div></td>
        <td><Badge tone={TONE[a.status as keyof typeof TONE] ?? "gray"}>{LABEL[a.status as keyof typeof LABEL] ?? a.status}</Badge></td>
        <td className="whitespace-nowrap text-sm">{formatDate(a.dueAt)}{open.includes(a) && d !== null && <div className={`text-[11px] ${d < 0 ? "font-semibold text-[#7A5A12]" : d <= 3 ? "text-amber-700" : "text-muted"}`}>{d < 0 ? `${-d} days overdue` : `${d} days left`}</div>}</td>
        <td className="whitespace-nowrap text-right"><Link href={`/reviewer/assignments/${a.id}`} className={open.includes(a) ? "btn-primary btn-sm" : "text-sm text-link hover:underline"}>{a.status === "INVITED" ? "Respond" : a.status === "ACCEPTED" ? "Write review" : "View"}</Link></td>
      </tr>
    );
  };
  return (
    <>
      <PTitle title="Review assignments" subtitle="Reviews are double anonymous. Author names are not shown to reviewers." />
      <StatStrip cols={4}>
        <Stat label="New invitations" value={as.filter((a) => a.status === "INVITED").length} />
        <Stat label="In progress" value={as.filter((a) => a.status === "ACCEPTED").length} />
        <Stat label="Overdue" value={open.filter((a) => (left(a.dueAt) ?? 1) < 0).length} tone={open.some((a) => (left(a.dueAt) ?? 1) < 0) ? "red" : undefined} />
        <Stat label="Completed" value={as.filter((a) => a.status === "COMPLETED").length} />
      </StatStrip>
      <Card title="Open assignments" className="mt-6" flush>
        {open.length ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Manuscript</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>{open.map((a) => <Row key={a.id} a={a} />)}</tbody></table></div> : <p className="px-4 py-10 text-center text-sm text-muted">No open review requests. Thank you for supporting peer review.</p>}
      </Card>
      {past.length > 0 && (
        <Card title="History" className="mt-6" flush>
          <div className="overflow-x-auto"><table className="table"><thead><tr><th>Manuscript</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>{past.map((a) => <Row key={a.id} a={a} />)}</tbody></table></div>
        </Card>
      )}
    </>
  );
}
