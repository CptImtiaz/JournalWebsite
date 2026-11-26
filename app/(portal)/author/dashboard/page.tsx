import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { StatusBadge, Stat, StatStrip, Card } from "@/components/ui";
import { StageBar } from "@/components/progress";
import { formatDate } from "@/lib/utils";

const ACTIVE = ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW", "REVISION_REQUIRED", "REVISED_SUBMITTED"];

export default async function AuthorDashboard() {
  const u = await requireUser();
  const drafts = await db.submissionDraft.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" } });
  const ms = await db.manuscript.findMany({ where: { submitterId: u.id }, orderBy: { updatedAt: "desc" }, include: { article: { select: { slug: true, status: true } } } });
  const action = ms.filter((m) => m.status === "REVISION_REQUIRED");
  const active = ms.filter((m) => ACTIVE.includes(m.status));
  return (
    <>
      <PTitle title="My submissions" subtitle="Follow each manuscript from submission to publication." actions={<Link href="/submission" className="btn-primary">Submit a new manuscript</Link>} />
      {action.length > 0 && (
        <div className="mb-6 border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3 text-sm">
          <strong>Revision requested:</strong>{" "}
          {action.map((m, i) => <span key={m.id}>{i > 0 && ", "}<Link className="font-medium text-amber-900 underline" href={`/author/manuscripts/${m.id}`}>{m.code}</Link></span>)}
        </div>
      )}
      <StatStrip cols={4}>
        <Stat label="Submissions" value={ms.length} />
        <Stat label="In progress" value={active.length} />
        <Stat label="Action required" value={action.length} tone={action.length ? "amber" : undefined} />
        <Stat label="Published" value={ms.filter((m) => m.status === "PUBLISHED").length} />
      </StatStrip>
      {drafts.length > 0 && (
        <Card title="Incomplete submissions" subtitle="Saved drafts that have not been submitted yet" className="mt-6" flush>
          <table className="table">
            <thead><tr><th>Manuscript</th><th>Last saved</th><th></th></tr></thead>
            <tbody>{drafts.map((d) => { const x = d.data as { title?: string; articleType?: string }; return (
              <tr key={d.id}><td><span className="font-medium">{x.title || "Untitled manuscript"}</span><div className="text-[11px] text-muted">{x.articleType ?? "Article type not chosen"}</div></td><td className="whitespace-nowrap text-sm text-muted">{formatDate(d.updatedAt)}</td><td className="text-right"><Link href={`/submission/${d.id}?step=1`} className="btn-primary btn-sm">Continue</Link></td></tr>
            ); })}</tbody>
          </table>
        </Card>
      )}
      <Card title="Manuscripts" className="mt-6" flush>
        {ms.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-display text-xl font-semibold">No submissions yet</p>
            <p className="mt-1 text-sm text-muted">The submission form takes about 15 minutes. Have your anonymised manuscript and author details ready.</p>
            <div className="mt-4 flex justify-center gap-2"><Link href="/submission" className="btn-primary">Start a submission</Link><Link href="/for-authors" className="btn-secondary">Read the guidelines</Link></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Manuscript</th><th>Status</th><th className="w-56">Progress</th><th>Submitted</th><th>Last update</th></tr></thead>
              <tbody>
                {ms.map((m) => (
                  <tr key={m.id}>
                    <td className="min-w-72"><Link href={`/author/manuscripts/${m.id}`} className="font-medium text-ink hover:text-link hover:underline">{m.title}</Link><div className="font-mono text-[11px] text-muted">{m.code} · {m.articleType}</div></td>
                    <td><StatusBadge status={m.status} /></td>
                    <td><StageBar status={m.status} /></td>
                    <td className="whitespace-nowrap text-sm text-muted">{formatDate(m.submittedAt)}</td>
                    <td className="whitespace-nowrap text-sm text-muted">{formatDate(m.updatedAt)}{m.article?.status === "PUBLISHED" && <Link href={`/article/${m.article.slug}`} className="ml-2 text-link hover:underline">View article</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
