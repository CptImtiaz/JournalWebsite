import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubmitButton } from "@/components/client";
import { FileDrop } from "@/components/submission-parts";
import { RECOMMENDATIONS } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { submitRevision } from "../actions";

export const metadata = { title: "Submit revision", robots: { index: false, follow: false } };

export default async function Revise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser(`/submission/revise/${id}`);
  const m = await db.manuscript.findUnique({
    where: { id },
    include: {
      decisions: { where: { isRecommendation: false }, orderBy: { createdAt: "desc" }, take: 1 },
      assignments: { where: { report: { releasedToAuthor: true } }, include: { report: { include: { annotatedFile: true } } }, orderBy: { invitedAt: "asc" } },
    },
  });
  if (!m || m.submitterId !== u.id) notFound();
  if (m.status !== "REVISION_REQUIRED") redirect(`/author/manuscripts/${id}`);
  const d = m.decisions[0];
  const reports = m.assignments.filter((a) => a.revision === m.currentRevision && a.report);
  const daysLeft = m.revisionDueAt ? Math.ceil((m.revisionDueAt.getTime() - Date.now()) / 86400000) : null;
  const round = m.currentRevision + 1;

  return (
    <div>
      <div className="sx-card mb-6 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Revision {round} · {m.code}</p>
          <h1 className="mt-2 max-w-3xl font-display text-[26px] font-semibold leading-tight">{m.title}</h1>
        </div>
        {m.revisionDueAt && (
          <div className="border-l border-[#DDE0E4] pl-6 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Revision due</div>
            <div className="font-semibold">{formatDate(m.revisionDueAt)}</div>
            <div className="text-xs text-muted">{daysLeft! >= 0 ? `${daysLeft} days left` : "Overdue. Contact the editor if you need more time."}</div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: what the editor and reviewers asked for */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          {d && (
            <section className="sx-card">
              <div className="flex items-center justify-between gap-2 border-b border-[#DDE0E4] px-5 py-3"><h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">Decision letter</h2><span className="text-xs text-muted">{RECOMMENDATIONS[d.decision as keyof typeof RECOMMENDATIONS]} · {formatDateTime(d.createdAt)}</span></div>
              <div className="whitespace-pre-line p-4 text-sm leading-relaxed text-ink/85">{d.letter}</div>
            </section>
          )}
          {reports.map((a, i) => (
            <section key={a.id} className="sx-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[#DDE0E4] px-5 py-3"><h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">Reviewer {i + 1}</h2>{a.report!.annotatedFile && <a className="text-sm font-semibold text-link hover:underline" href={`/api/files/${a.report!.annotatedFile.id}`}>Annotated file</a>}</div>
              <div className="whitespace-pre-line p-5 text-sm leading-relaxed text-ink/85">{a.report!.commentsToAuthor}</div>
            </section>
          ))}
          {!reports.length && <p className="sx-card p-4 text-sm text-muted">No reviewer reports were released for this round. Please follow the decision letter.</p>}
        </div>

        {/* Right: the revision form */}
        <form action={submitRevision} className="space-y-4">
          <input type="hidden" name="id" value={m.id} />
          <section className="sx-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[#DDE0E4] px-5 py-3"><h2 className="text-[13px] font-bold uppercase tracking-[0.1em]"><span className="mr-2 text-ink/45">1.</span>Response to reviewers</h2></div>
            <div className="space-y-2 p-4">
              <p className="text-sm text-ink/80">Answer each comment in turn. Say what you changed and where, or why you disagree.</p>
              <textarea name="response" rows={14} required className="input font-mono text-[13px] leading-relaxed" defaultValue={`Reviewer 1\n\nComment 1:\nResponse:\nChange made (page, line):\n\n${reports.length > 1 ? "Reviewer 2\n\nComment 1:\nResponse:\nChange made (page, line):\n" : ""}`} />
            </div>
          </section>
          <section className="sx-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[#DDE0E4] px-5 py-3"><h2 className="text-[13px] font-bold uppercase tracking-[0.1em]"><span className="mr-2 text-ink/45">2.</span>Revised files</h2></div>
            <div className="grid gap-4 p-4">
              <div><div className="mb-1.5 text-sm font-semibold">Clean revised manuscript <span className="font-normal text-ink/50">(required)</span></div><FileDrop name="revisionFile" accept=".doc,.docx,.pdf" label="Clean revised manuscript" hint="Word or PDF, with no author names if the review is anonymous" note="Uploaded when you submit" /></div>
              <div><div className="mb-1.5 text-sm font-semibold">Version with tracked changes <span className="font-normal text-muted">(recommended)</span></div><FileDrop name="trackedFile" accept=".doc,.docx,.pdf" label="Tracked changes version" hint="Changes highlighted so reviewers can see them quickly" note="Uploaded when you submit" /></div>
              <div><div className="mb-1.5 text-sm font-semibold">Response letter <span className="font-normal text-muted">(optional)</span></div><FileDrop name="responseFile" accept=".doc,.docx,.pdf" label="Response letter" hint="If you prefer a formatted letter as well" note="Uploaded when you submit" /></div>
              <div><div className="mb-1.5 text-sm font-semibold">Updated supplementary files <span className="font-normal text-muted">(optional)</span></div><FileDrop name="supplementaryFiles" multiple accept=".doc,.docx,.pdf,.zip,.xlsx,.csv,.png,.jpg,.jpeg" label="Supplementary files" hint="Data, code or extra figures" note="Uploaded when you submit" /></div>
            </div>
          </section>
          <section className="sx-card p-5">
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirm" required className="mt-0.5 h-4 w-4 accent-[#142D4E]" />All authors have read and approved the revised manuscript and the response.</label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Link href={`/author/manuscripts/${m.id}`} className="text-sm font-semibold text-link hover:underline">Back to manuscript</Link>
              <SubmitButton className="btn-primary px-6 py-2.5" confirm="Submit this revision to the editor?">Submit revision</SubmitButton>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
