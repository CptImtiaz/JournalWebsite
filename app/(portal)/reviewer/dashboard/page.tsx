import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const TONE = { INVITED: "amber", ACCEPTED: "blue", COMPLETED: "green", DECLINED: "gray", CANCELLED: "gray" } as const;

export default async function ReviewerDashboard() {
  const u = await requireUser();
  const as = await db.reviewerAssignment.findMany({ where: { reviewerId: u.id }, orderBy: { invitedAt: "desc" }, include: { manuscript: { select: { code: true, title: true, articleType: true } } } });
  return (
    <>
      <PTitle title="Review assignments" subtitle="Manuscripts you have been invited to review. Author identities are withheld (double-anonymous review)." />
      {as.length === 0 ? <Empty title="No review assignments" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Manuscript</th><th>Title</th><th>Round</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {as.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs">{a.manuscript.code}</td>
                  <td className="min-w-64">{a.manuscript.title}<div className="text-xs text-muted">{a.manuscript.articleType}</div></td>
                  <td>{a.revision + 1}</td>
                  <td className={`whitespace-nowrap ${a.dueAt && a.dueAt < new Date() && a.status === "ACCEPTED" ? "font-semibold text-red-700" : ""}`}>{formatDate(a.dueAt)}</td>
                  <td><Badge tone={TONE[a.status as keyof typeof TONE] ?? "gray"}>{a.status.toLowerCase()}</Badge></td>
                  <td className="text-right"><Link href={`/reviewer/assignments/${a.id}`} className="btn-primary btn-sm">{a.status === "INVITED" ? "Respond" : a.status === "ACCEPTED" ? "Review" : "View"}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
