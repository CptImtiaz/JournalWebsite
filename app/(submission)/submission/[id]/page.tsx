import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { SubmitButton, AuthorsEditor, EthicsToggle } from "@/components/client";
import { FileDrop, AbstractField, ReviewerRows } from "@/components/submission-parts";
import { ARTICLE_TYPES } from "@/lib/constants";
import { STEPS, loadDraft, stepComplete, type Draft } from "@/lib/submission";
import { formatDateTime, fileSize, splitKeywords } from "@/lib/utils";
import { saveStep, fillFromManuscript, removeDraftFile, deleteDraft, submitDraft } from "../actions";

const TYPE_INFO: Record<string, string> = {
  "Research Article": "Original research with full methods and results",
  "Review Article": "A critical survey of a research area",
  "Short Communication": "A concise report of significant findings",
  "Case Study": "Analysis of a system, deployment or project",
  Survey: "A systematic overview and taxonomy",
  "Technical Note": "A technique, tool or dataset",
};

function Q({ label, required, hint, children, id }: { label: string; required?: boolean; hint?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div className="grid gap-2 border-b border-line py-5 last:border-0 md:grid-cols-[220px_1fr] md:gap-6">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}{required && <span className="text-[#C8102E]"> *</span>}</label>
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function FileRow({ d, id, kind, step }: { d: Draft; id: string; kind: string; step: number }) {
  const f = d.files[id];
  if (!f) return null;
  return (
    <li className="flex items-center justify-between gap-3 border border-line bg-white px-3 py-2 text-sm">
      <span className="min-w-0"><span className="mr-2 text-[11px] font-bold uppercase tracking-wide text-muted">{kind}</span><a href={`/api/files/${f.id}`} className="link break-all">{f.originalName}</a> <span className="text-xs text-muted">{fileSize(f.size)}</span></span>
      <form action={removeDraftFile}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="fileId" value={f.id} /><input type="hidden" name="step" value={step} /><SubmitButton className="text-xs text-red-700 hover:underline">Remove</SubmitButton></form>
    </li>
  );
}

function Nav({ step, canBack = true, last = false }: { step: number; canBack?: boolean; last?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4">
      <div className="flex gap-2">
        {canBack && step > 1 && <SubmitButton name="nav" value="back" className="btn-secondary">Back</SubmitButton>}
        <SubmitButton name="nav" value="exit" className="btn-secondary">Save and exit</SubmitButton>
      </div>
      {!last && <SubmitButton name="nav" value="next" className="btn-primary px-6">Save and continue</SubmitButton>}
    </div>
  );
}

export default async function SubmissionStep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const d = await loadDraft(id, u.id);
  if (!d) notFound();
  const step = Math.min(6, Math.max(1, parseInt((await searchParams).step ?? "1", 10) || 1));
  const x = d.data;
  const [cats, j] = await Promise.all([db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), getJournal()]);
  const meta = STEPS[step - 1];
  const isDocx = !!d.manuscriptFileId && d.files[d.manuscriptFileId]?.originalName.toLowerCase().endsWith(".docx");
  const done = STEPS.map((s) => stepComplete(d, s.n));
  const ready = [0, 1, 2, 4].every((i) => done[i]);
  const pct = Math.round((done.filter(Boolean).length / STEPS.length) * 100);
  const cat = cats.find((c) => c.id === x.categoryId)?.name;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">New submission · draft saved {formatDateTime(d.updatedAt)}</p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight">{x.title || "Untitled manuscript"}</h1>
        </div>
        <div className="w-full max-w-60">
          <div className="flex justify-between text-xs"><span className="font-semibold">{pct}% complete</span><span className="text-muted">{done.filter(Boolean).length} of 6 steps</span></div>
          <div className="mt-1.5 h-1.5 bg-ink/10"><div className={`h-full transition-all ${pct === 100 ? "bg-emerald-600" : "bg-gold"}`} style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      {/* Stepper */}
      <ol className="mb-6 grid grid-cols-3 border border-line bg-white md:grid-cols-6">
        {STEPS.map((s, i) => {
          const cur = s.n === step;
          return (
            <li key={s.n} className="border-b border-r border-line last:border-r-0 md:border-b-0">
              <Link href={`?step=${s.n}`} className={`flex h-full items-center gap-2.5 px-3 py-3 text-[13px] ${cur ? "bg-white shadow-[inset_0_-3px_0_#142D4E]" : "hover:bg-surface"}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-xs font-bold ${done[i] && !cur ? "bg-emerald-600 text-white" : cur ? "bg-navy text-white" : "border border-ink/25 text-muted"}`}>{done[i] && !cur ? "✓" : s.n}</span>
                <span className={`leading-tight ${cur ? "font-semibold text-ink" : "text-ink/75"}`}>{s.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0 border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Step {step} of 6</p>
            <h2 className="mt-0.5 font-display text-[22px] font-semibold">{meta.title}</h2>
          </div>

          {step === 1 && (
            <form action={saveStep} encType="multipart/form-data">
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={1} />
              <div className="px-5">
                <Q label="Article type" required hint="Choose the category that best describes your manuscript.">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ARTICLE_TYPES.filter((t) => t !== "Editorial").map((t) => (
                      <label key={t} className="flex cursor-pointer gap-3 border border-line px-3 py-2.5 hover:border-link has-[:checked]:border-navy has-[:checked]:bg-surface">
                        <input type="radio" name="articleType" value={t} defaultChecked={(x.articleType ?? "Research Article") === t} className="mt-1 accent-[#142D4E]" />
                        <span><span className="block text-sm font-semibold">{t}</span><span className="block text-xs text-muted">{TYPE_INFO[t]}</span></span>
                      </label>
                    ))}
                  </div>
                </Q>
                <Q label="Research field" required id="categoryId" hint="Helps us choose suitable editors and reviewers.">
                  <select id="categoryId" name="categoryId" defaultValue={x.categoryId ?? ""} className="input max-w-md">
                    <option value="">Select a research field</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Q>
                <Q label="Manuscript file" required hint={<>DOCX or PDF, up to {j.maxUploadMb} MB. Remove author names for double anonymous review.</>}>
                  {d.manuscriptFileId ? <ul className="mb-3 space-y-2"><FileRow d={d} id={d.manuscriptFileId} kind="Manuscript" step={1} /></ul> : null}
                  <FileDrop name="manuscriptFile" accept=".doc,.docx,.pdf" label="Manuscript file" hint={d.manuscriptFileId ? "Upload a new file to replace the current one" : "DOC, DOCX or PDF"} />
                </Q>
                <Q label="Supplementary material" hint="Optional. Data, code, extra figures or appendices.">
                  {d.supplementaryFileIds.length > 0 && <ul className="mb-3 space-y-2">{d.supplementaryFileIds.map((f) => <FileRow key={f} d={d} id={f} kind="Supplement" step={1} />)}</ul>}
                  <FileDrop name="supplementaryFiles" multiple accept=".doc,.docx,.pdf,.zip,.xlsx,.csv,.png,.jpg,.jpeg" label="Supplementary files" hint="ZIP, PDF, DOCX, XLSX, CSV or images" />
                </Q>
              </div>
              <Nav step={1} />
            </form>
          )}

          {step === 2 && (
            <>
              {isDocx && (
                <form action={fillFromManuscript} className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#eef6fa] px-5 py-3 text-sm">
                  <input type="hidden" name="id" value={d.id} />
                  <span>We can read the title, abstract and keywords from <strong>{d.files[d.manuscriptFileId!]?.originalName}</strong>.</span>
                  <SubmitButton className="btn-secondary btn-sm">Fill from manuscript</SubmitButton>
                </form>
              )}
              <form action={saveStep}>
                <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={2} />
                <div className="px-5">
                  <Q label="Title" required id="title" hint="Specific and concise, ideally under 20 words.">
                    <textarea id="title" name="title" rows={2} defaultValue={x.title ?? ""} className="input font-display text-lg leading-snug" />
                  </Q>
                  <Q label="Abstract" required id="abstract" hint="One paragraph: problem, method, main results and conclusion. No citations.">
                    <AbstractField defaultValue={x.abstract ?? ""} />
                  </Q>
                  <Q label="Keywords" required id="keywords" hint="4 to 8 keywords, separated by semicolons.">
                    <input id="keywords" name="keywords" defaultValue={x.keywords ?? ""} className="input" placeholder="machine learning; edge computing; federated learning" />
                  </Q>
                </div>
                <Nav step={2} />
              </form>
            </>
          )}

          {step === 3 && (
            <form action={saveStep}>
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={3} />
              <div className="p-5">
                <p className="mb-4 text-sm text-ink/75">List all authors in the order they should appear. Select one corresponding author, who will receive all correspondence about the manuscript.</p>
                <AuthorsEditor initial={x.authors ?? []} initialCorresponding={x.correspondingIndex ?? 0} />
              </div>
              <Nav step={3} />
            </form>
          )}

          {step === 4 && (
            <form action={saveStep} encType="multipart/form-data">
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={4} />
              <div className="px-5">
                <Q label="Cover letter" id="coverLetter" hint="Optional. Explain the significance of the work. Only editors see this.">
                  <textarea id="coverLetter" name="coverLetter" rows={6} defaultValue={x.coverLetter ?? ""} className="input" placeholder="Dear Editor in Chief," />
                  {d.coverLetterFileId && <ul className="mt-3 space-y-2"><FileRow d={d} id={d.coverLetterFileId} kind="Cover letter" step={4} /></ul>}
                  <div className="mt-3"><FileDrop name="coverLetterFile" accept=".doc,.docx,.pdf" label="Cover letter file" hint="Or upload the letter as DOCX or PDF" /></div>
                </Q>
                <Q label="Suggested reviewers" hint="Optional, up to five. They must not be recent collaborators or colleagues.">
                  <ReviewerRows name="suggestedJson" initial={x.suggested ?? []} max={5} reasonLabel="Expertise" addLabel="Add a suggested reviewer" />
                </Q>
                <Q label="Opposed reviewers" hint="Optional, up to three, with a reason.">
                  <ReviewerRows name="opposedJson" initial={x.opposed ?? []} max={3} reasonLabel="Reason" addLabel="Add an opposed reviewer" />
                </Q>
                <Q label="Previous submission" id="previouslySubmitted" hint="If this is a resubmission to this journal, give the earlier manuscript ID.">
                  <input id="previouslySubmitted" name="previouslySubmitted" defaultValue={x.previouslySubmitted ?? ""} className="input max-w-xs" placeholder="JCS-2026-00000" />
                </Q>
              </div>
              <Nav step={4} />
            </form>
          )}

          {step === 5 && (
            <form action={saveStep}>
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={5} />
              <div className="px-5">
                <Q label="Competing interests" required id="conflictOfInterest"><textarea id="conflictOfInterest" name="conflictOfInterest" rows={2} defaultValue={x.conflictOfInterest ?? "The authors declare no competing interests."} className="input" /></Q>
                <Q label="Funding" required id="fundingStatement"><textarea id="fundingStatement" name="fundingStatement" rows={2} defaultValue={x.fundingStatement ?? ""} className="input" placeholder="This work was supported by … (grant no. …), or: This research received no external funding." /></Q>
                <Q label="Ethics approval" hint="Required for research with human participants, personal data or animals."><EthicsToggle defaultChecked={!!x.ethicsApprovalRequired} /></Q>
                <Q label="Data availability" id="dataAvailability"><textarea id="dataAvailability" name="dataAvailability" rows={2} defaultValue={x.dataAvailability ?? ""} className="input" placeholder="Where readers can find the data and code, or the conditions of access." /></Q>
                <Q label="Use of AI tools" id="aiUsageDisclosure" hint="Describe any use of generative AI. Leave blank if none."><textarea id="aiUsageDisclosure" name="aiUsageDisclosure" rows={2} defaultValue={x.aiUsageDisclosure ?? ""} className="input" /></Q>
                <Q label="Confirmations" required>
                  <div className="space-y-3 text-sm">
                    {([["originality", x.originality, "This manuscript is original, not published before, and not under consideration elsewhere."], ["authorsAgree", x.authorsAgree, "All authors approved the manuscript and agree with the author order."], ["policies", x.policies, <>I agree to the <a className="link" href="/publication-ethics" target="_blank">publication ethics</a>, <a className="link" href="/copyright" target="_blank">copyright</a> and <a className="link" href="/publication-fees" target="_blank">fees</a> policies.</>]] as [string, boolean | undefined, ReactNode][]).map(([n, v, t]) => (
                      <label key={n} className="flex items-start gap-3"><input type="checkbox" name={n} defaultChecked={!!v} className="mt-0.5 h-4 w-4 accent-[#142D4E]" /><span>{t}</span></label>
                    ))}
                  </div>
                </Q>
              </div>
              <Nav step={5} />
            </form>
          )}

          {step === 6 && (
            <>
              <div className="px-5">
                {([
                  [1, "Type and files", <>{x.articleType ?? "Not chosen"} · {cat ?? "No research field"}<ul className="mt-1 text-xs text-muted">{[d.manuscriptFileId, ...d.supplementaryFileIds].filter(Boolean).map((f) => <li key={f!}>{d.files[f!]?.originalName}</li>)}</ul></>],
                  [2, "Title and abstract", <><div className="font-display text-base font-semibold">{x.title || "No title"}</div><p className="mt-1 line-clamp-4 text-sm text-ink/80">{x.abstract}</p><div className="mt-1 text-xs text-muted">{splitKeywords(x.keywords ?? "").join(" · ")}</div></>],
                  [3, "Authors", <ol key="a" className="space-y-0.5 text-sm">{(x.authors ?? []).map((a, i) => <li key={i}>{i + 1}. {a.fullName}{i === (x.correspondingIndex ?? 0) && <span className="ml-1 text-xs font-semibold text-link">(corresponding)</span>} <span className="text-muted">· {a.affiliation}</span></li>)}</ol>],
                  [4, "Additional information", <span key="b" className="text-sm">{x.coverLetter || d.coverLetterFileId ? "Cover letter included" : "No cover letter"} · {(x.suggested ?? []).length} suggested, {(x.opposed ?? []).length} opposed reviewers</span>],
                  [5, "Declarations", <span key="c" className="text-sm">{done[4] ? "All declarations complete" : "Incomplete"}</span>],
                ] as [number, string, ReactNode][]).map(([n, t, body]) => (
                  <div key={n} className="grid gap-2 border-b border-line py-4 md:grid-cols-[220px_1fr_auto] md:gap-6">
                    <div className="flex items-center gap-2 text-sm font-semibold"><span className={`text-xs font-bold ${done[n - 1] ? "text-emerald-700" : "text-[#C8102E]"}`}>{done[n - 1] ? "Complete" : "Incomplete"}</span>{t}</div>
                    <div className="min-w-0">{body}</div>
                    <Link href={`?step=${n}`} className="text-sm font-semibold text-link hover:underline">Edit</Link>
                  </div>
                ))}
              </div>
              <form action={submitDraft} className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4">
                <input type="hidden" name="id" value={d.id} />
                <p className="max-w-md text-xs text-muted">By submitting, you confirm the information above is accurate. You will receive a manuscript ID and a confirmation email.</p>
                {ready ? <SubmitButton className="btn-accent px-8 py-2.5" confirm="Submit this manuscript to the journal?">Submit manuscript</SubmitButton> : <span className="text-sm font-semibold text-[#C8102E]">Complete all required sections to submit</span>}
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="border border-line bg-white">
            <div className="panel-head"><h2 className="panel-title">Submission checklist</h2><span className="text-xs text-muted">{done.slice(0, 5).filter(Boolean).length} of 5</span></div>
            <ul>
              {STEPS.slice(0, 5).map((s, i) => (
                <li key={s.n}><Link href={`?step=${s.n}`} className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm last:border-0 hover:bg-surface"><span className={s.n === step ? "font-semibold" : ""}>{s.title}</span><span className={`text-xs font-semibold ${done[i] ? "text-emerald-700" : s.n === 4 ? "text-muted" : "text-[#C8102E]"}`}>{done[i] ? (s.n === 4 && !x.coverLetter && !(x.suggested ?? []).length ? "Optional" : "Complete") : "To do"}</span></Link></li>
              ))}
            </ul>
          </div>
          <div className="border border-line border-l-4 border-l-navy bg-white p-4">
            <h2 className="panel-title mb-1.5">About this step</h2>
            <p className="text-sm leading-relaxed text-ink/80">{meta.help}</p>
            <Link href="/for-authors" target="_blank" className="mt-2 inline-block text-sm font-semibold text-link hover:underline">Full author guidelines</Link>
          </div>
          <form action={deleteDraft} className="text-center"><input type="hidden" name="id" value={d.id} /><SubmitButton className="text-xs text-muted hover:text-red-700 hover:underline" confirm="Delete this unfinished submission and its files?">Delete this draft</SubmitButton></form>
        </aside>
      </div>
    </>
  );
}
