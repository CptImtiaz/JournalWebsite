import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { SubmitButton } from "@/components/client";
import { formatDateTime } from "@/lib/utils";
import { startSubmission, deleteDraft } from "./actions";

export default async function SubmissionHome() {
  const u = await requireUser("/submission");
  const [drafts, j] = await Promise.all([db.submissionDraft.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" } }), getJournal()]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{j.name}</p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-tight">Submit a manuscript</h1>
          <p className="mt-2 max-w-2xl text-ink/75">Submission takes about 15 minutes. Your work is saved after every step, so you can stop and continue later from any device.</p>
        </div>

        {drafts.length > 0 && (
          <section className="border border-line bg-white">
            <div className="panel-head"><h2 className="panel-title">Continue a submission</h2></div>
            <table className="table">
              <thead><tr><th>Manuscript</th><th>Last saved</th><th></th></tr></thead>
              <tbody>
                {drafts.map((d) => {
                  const x = d.data as { title?: string; articleType?: string };
                  return (
                    <tr key={d.id}>
                      <td><div className="font-medium">{x.title || "Untitled manuscript"}</div><div className="text-xs text-muted">{x.articleType ?? "Article type not chosen"}</div></td>
                      <td className="whitespace-nowrap text-sm text-muted">{formatDateTime(d.updatedAt)}</td>
                      <td className="whitespace-nowrap text-right">
                        <Link href={`/submission/${d.id}?step=1`} className="btn-primary btn-sm">Continue</Link>
                        <form action={deleteDraft} className="ml-2 inline"><input type="hidden" name="id" value={d.id} /><SubmitButton className="btn-secondary btn-sm" confirm="Delete this unfinished submission and its files?">Delete</SubmitButton></form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <section className="border border-line bg-white">
          <div className="panel-head"><h2 className="panel-title">Start a new submission</h2></div>
          <div className="grid gap-6 p-5 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">You will need</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
                <li>Your manuscript as DOCX or PDF, with author names removed</li>
                <li>Title, abstract of 150 to 300 words, and 4 to 8 keywords</li>
                <li>Names, emails and affiliations of all coauthors</li>
                <li>Statements on funding, competing interests and ethics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Prepare your file</h3>
              <p className="mt-2 text-sm text-ink/80">Use the journal template. If you upload a Word file, we can fill in your title, abstract and keywords for you.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="link" href="/templates/IJCST-manuscript-template.docx">Word template</a><Link className="link" href="/for-authors" target="_blank">Guidelines</Link></div>
            </div>
          </div>
          <div className="border-t border-line bg-surface px-5 py-4">
            <form action={startSubmission}><SubmitButton className="btn-primary px-6 py-2.5">Start new submission</SubmitButton></form>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="border border-line bg-white">
          <div className="panel-head"><h2 className="panel-title">How it works</h2></div>
          <ol className="space-y-3 p-4 text-sm">
            {["Type and files", "Title and abstract", "Authors", "Additional information", "Declarations", "Review and submit"].map((s, i) => (
              <li key={s} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center border border-ink/20 text-xs font-semibold">{i + 1}</span><span className="pt-0.5">{s}</span></li>
            ))}
          </ol>
        </div>
        <div className="border border-line bg-white p-4 text-sm text-ink/80">
          <h2 className="panel-title mb-2">Peer review</h2>
          Every paper goes through double anonymous peer review. Reviewers never see author names, so please remove them from your manuscript file.
        </div>
      </aside>
    </div>
  );
}
