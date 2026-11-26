import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { SubmitButton } from "@/components/client";
import { FileDrop, AbstractField, KeywordsField, ReviewerRows, AuthorCards, EthicsSwitch } from "@/components/submission-parts";
import { Bar } from "@/components/submission-ui";
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

function Field({ label, required, optional, hint, children, id }: { label: string; required?: boolean; optional?: boolean; hint?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div className="border-b border-[#E6E8EB] py-6 last:border-0">
      <label htmlFor={id} className="block text-[15px] font-semibold text-ink">{label}{required && <span className="ml-1 font-normal text-ink/50">(required)</span>}{optional && <span className="ml-1 font-normal text-ink/50">(optional)</span>}</label>
      {hint && <p className="mt-1 text-sm text-ink/65">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FileRow({ d, id, kind, step }: { d: Draft; id: string; kind: string; step: number }) {
  const f = d.files[id];
  if (!f) return null;
  return (
    <li className="flex items-center justify-between gap-4 border border-[#DDE0E4] bg-white px-4 py-3 text-sm">
      <span className="min-w-0"><span className="mr-3 text-xs uppercase tracking-[0.08em] text-ink/55">{kind}</span><a href={`/api/files/${f.id}`} className="link break-all">{f.originalName}</a> <span className="ml-1 text-xs text-ink/55">{fileSize(f.size)}</span></span>
      <form action={removeDraftFile}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="fileId" value={f.id} /><input type="hidden" name="step" value={step} /><SubmitButton className="text-sm text-link hover:underline">Remove</SubmitButton></form>
    </li>
  );
}

function Nav({ step, last = false }: { step: number; last?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE0E4] bg-[#FAFAFA] px-5 py-4 sm:px-8">
      <div className="flex items-center gap-5">
        {step > 1 && <SubmitButton name="nav" value="back" className="text-sm text-link hover:underline">Previous step</SubmitButton>}
        <SubmitButton name="nav" value="exit" className="text-sm text-link hover:underline">Save and exit</SubmitButton>
      </div>
      {!last && <SubmitButton name="nav" value="next" className="btn-primary px-6 py-2.5">Save and continue</SubmitButton>}
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
  const nDone = done.slice(0, 5).filter(Boolean).length;
  const cat = cats.find((c) => c.id === x.categoryId)?.name;

  return (
    <div>
      <div className="mb-8">
        <Link href="/submission" className="text-sm text-link hover:underline">Submissions</Link>
        <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight">{x.title || "New submission"}</h1>
        <p className="mt-1 text-sm text-ink/60">Draft saved {formatDateTime(d.updatedAt)} · {nDone} of 5 sections complete</p>
        <div className="mt-3 max-w-md"><Bar pct={(nDone / 5) * 100} /></div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <nav className="lg:sticky lg:top-6">
            <ol className="flex gap-1 overflow-x-auto border-b border-[#DDE0E4] lg:block lg:border-b-0 lg:border-l">
              {STEPS.map((s, i) => {
                const cur = s.n === step, ok = done[i] && s.n < 6;
                return (
                  <li key={s.n} className="shrink-0">
                    <Link href={`?step=${s.n}`} className={`-mb-px flex items-baseline gap-3 border-b-2 px-3 py-2.5 text-sm lg:-ml-px lg:mb-0 lg:border-b-0 lg:border-l-2 lg:px-4 ${cur ? "border-navy font-semibold text-ink" : "border-transparent text-ink/70 hover:text-ink"}`}>
                      <span className="w-4 shrink-0 tabular-nums text-ink/45">{ok && !cur ? "✓" : s.n}</span>
                      <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <div className="mt-8 hidden text-sm leading-relaxed text-ink/70 lg:block">
              <p>{meta.help}</p>
              <Link href="/for-authors" target="_blank" className="mt-2 inline-block text-link hover:underline">Guide for authors</Link>
              <form action={deleteDraft} className="mt-6 border-t border-[#DDE0E4] pt-4"><input type="hidden" name="id" value={d.id} /><SubmitButton className="text-sm text-ink/60 hover:text-ink hover:underline" confirm="Delete this unfinished submission and its files?">Delete this draft</SubmitButton></form>
            </div>
          </nav>
        </aside>

        <section className="sx-card min-w-0">
          <header className="border-b border-[#DDE0E4] px-5 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Step {step} of 6</p>
            <h2 className="mt-1 font-display text-[24px] font-semibold">{meta.title}</h2>
            <p className="mt-1 text-sm text-ink/65 lg:hidden">{meta.help}</p>
          </header>

          {step === 1 && (
            <form action={saveStep} encType="multipart/form-data">
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={1} />
              <div className="px-5 sm:px-8">
                <Field label="Article type" required>
                  <div className="grid gap-px border border-[#DDE0E4] bg-[#DDE0E4] sm:grid-cols-2">
                    {ARTICLE_TYPES.filter((t) => t !== "Editorial").map((t) => (
                      <label key={t} className="flex cursor-pointer items-start gap-3 bg-white px-4 py-3.5 hover:bg-[#FAFAFA] has-[:checked]:bg-[#F1F3F6]">
                        <input type="radio" name="articleType" value={t} defaultChecked={(x.articleType ?? "Research Article") === t} className="mt-1 h-4 w-4 accent-[#142D4E]" />
                        <span><span className="block text-sm font-semibold">{t}</span><span className="block text-sm text-ink/60">{TYPE_INFO[t]}</span></span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Subject area" required id="categoryId" hint="Used to choose a handling editor and reviewers.">
                  <select id="categoryId" name="categoryId" defaultValue={x.categoryId ?? ""} className="input max-w-lg">
                    <option value="">Select a subject area</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Manuscript file" required hint={<>DOC, DOCX or PDF, up to {j.maxUploadMb} MB. Remove author names and affiliations.</>}>
                  {d.manuscriptFileId ? <ul className="mb-3"><FileRow d={d} id={d.manuscriptFileId} kind="Manuscript" step={1} /></ul> : null}
                  <FileDrop name="manuscriptFile" accept=".doc,.docx,.pdf" label="Manuscript file" hint={d.manuscriptFileId ? "Upload a new file to replace the current one" : "A Word file lets us fill in your title and abstract"} />
                </Field>
                <Field label="Supplementary information" optional hint="Data, code, extra figures or appendices.">
                  {d.supplementaryFileIds.length > 0 && <ul className="mb-3 space-y-2">{d.supplementaryFileIds.map((f) => <FileRow key={f} d={d} id={f} kind="Supplement" step={1} />)}</ul>}
                  <FileDrop name="supplementaryFiles" multiple accept=".doc,.docx,.pdf,.zip,.xlsx,.csv,.png,.jpg,.jpeg" label="Supplementary files" hint="ZIP, PDF, DOCX, XLSX, CSV or images" />
                </Field>
              </div>
              <Nav step={1} />
            </form>
          )}

          {step === 2 && (
            <>
              {isDocx && (
                <form action={fillFromManuscript} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE0E4] bg-[#F6F6F6] px-5 py-3 text-sm sm:px-8">
                  <input type="hidden" name="id" value={d.id} />
                  <span className="text-ink/80">Fill in the title, abstract and keywords from <strong className="font-semibold">{d.files[d.manuscriptFileId!]?.originalName}</strong>.</span>
                  <SubmitButton className="btn-secondary btn-sm px-3 py-1.5">Fill from manuscript</SubmitButton>
                </form>
              )}
              <form action={saveStep}>
                <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={2} />
                <div className="px-5 sm:px-8">
                  <Field label="Title" required id="title" hint="Specific and concise, ideally under 20 words.">
                    <textarea id="title" name="title" rows={2} defaultValue={x.title ?? ""} className="input font-display text-lg leading-snug" />
                  </Field>
                  <Field label="Abstract" required id="abstract" hint="One paragraph: problem, method, main results and conclusion. No citations.">
                    <AbstractField defaultValue={x.abstract ?? ""} />
                  </Field>
                  <Field label="Keywords" required id="keywords" hint="Separate with semicolons.">
                    <KeywordsField defaultValue={x.keywords ?? ""} />
                  </Field>
                </div>
                <Nav step={2} />
              </form>
            </>
          )}

          {step === 3 && (
            <form action={saveStep}>
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={3} />
              <div className="px-5 pb-6 sm:px-8">
                <AuthorCards initial={x.authors ?? []} initialCorresponding={x.correspondingIndex ?? 0} />
              </div>
              <Nav step={3} />
            </form>
          )}

          {step === 4 && (
            <form action={saveStep} encType="multipart/form-data">
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={4} />
              <div className="px-5 sm:px-8">
                <Field label="Cover letter" optional id="coverLetter" hint="Explain why the work matters. Only editors see this.">
                  <textarea id="coverLetter" name="coverLetter" rows={6} defaultValue={x.coverLetter ?? ""} className="input" placeholder="Dear Editor," />
                  {d.coverLetterFileId && <ul className="mt-3"><FileRow d={d} id={d.coverLetterFileId} kind="Cover letter" step={4} /></ul>}
                  <div className="mt-3"><FileDrop name="coverLetterFile" accept=".doc,.docx,.pdf" label="Cover letter file" hint="Or upload the letter as DOCX or PDF" /></div>
                </Field>
                <Field label="Suggested reviewers" optional hint="Up to five independent experts. Not recent collaborators or colleagues.">
                  <ReviewerRows name="suggestedJson" initial={x.suggested ?? []} max={5} reasonLabel="Expertise" addLabel="Add a suggested reviewer" />
                </Field>
                <Field label="Reviewers to exclude" optional hint="Up to three, with a reason.">
                  <ReviewerRows name="opposedJson" initial={x.opposed ?? []} max={3} reasonLabel="Reason" addLabel="Add a reviewer to exclude" />
                </Field>
                <Field label="Previous submission" optional id="previouslySubmitted" hint="If this is a resubmission to this journal, give the earlier manuscript number.">
                  <input id="previouslySubmitted" name="previouslySubmitted" defaultValue={x.previouslySubmitted ?? ""} className="input max-w-xs" placeholder="JCS-2026-00000" />
                </Field>
              </div>
              <Nav step={4} />
            </form>
          )}

          {step === 5 && (
            <form action={saveStep}>
              <input type="hidden" name="id" value={d.id} /><input type="hidden" name="step" value={5} />
              <div className="px-5 sm:px-8">
                <Field label="Competing interests" required id="conflictOfInterest"><textarea id="conflictOfInterest" name="conflictOfInterest" rows={2} defaultValue={x.conflictOfInterest ?? "The authors declare no competing interests."} className="input" /></Field>
                <Field label="Funding" required id="fundingStatement"><textarea id="fundingStatement" name="fundingStatement" rows={2} defaultValue={x.fundingStatement ?? ""} className="input" placeholder="This work was supported by … (grant no. …), or: This research received no external funding." /></Field>
                <Field label="Ethics approval" hint="Needed for research with human participants, personal data or animals."><EthicsSwitch defaultChecked={!!x.ethicsApprovalRequired} defaultStatement={x.ethicsStatement} /></Field>
                <Field label="Data availability" optional id="dataAvailability"><textarea id="dataAvailability" name="dataAvailability" rows={2} defaultValue={x.dataAvailability ?? ""} className="input" placeholder="Where readers can find the data and code." /></Field>
                <Field label="Use of AI tools" optional id="aiUsageDisclosure"><textarea id="aiUsageDisclosure" name="aiUsageDisclosure" rows={2} defaultValue={x.aiUsageDisclosure ?? ""} className="input" placeholder="Describe any use of generative AI, or leave blank." /></Field>
                <Field label="Author confirmations" required>
                  <div className="space-y-3 text-sm">
                    {([["originality", x.originality, "This manuscript is original, has not been published before and is not under consideration elsewhere."], ["authorsAgree", x.authorsAgree, "All authors have approved the manuscript and the author order."], ["policies", x.policies, <>I agree to the <a className="link" href="/publication-ethics" target="_blank">publication ethics</a>, <a className="link" href="/copyright" target="_blank">copyright</a> and <a className="link" href="/publication-fees" target="_blank">fees</a> policies.</>]] as [string, boolean | undefined, ReactNode][]).map(([n, v, t]) => (
                      <label key={n} className="flex items-start gap-3"><input type="checkbox" name={n} defaultChecked={!!v} className="mt-0.5 h-4 w-4 shrink-0 accent-[#142D4E]" /><span className="leading-relaxed">{t}</span></label>
                    ))}
                  </div>
                </Field>
              </div>
              <Nav step={5} />
            </form>
          )}

          {step === 6 && (
            <>
              <dl className="px-5 sm:px-8">
                {([
                  [1, "Article type and files", <><div>{x.articleType ?? "Not chosen"} · {cat ?? "No subject area"}</div><ul className="mt-1 text-sm text-ink/65">{[d.manuscriptFileId, ...d.supplementaryFileIds].filter(Boolean).map((f) => <li key={f!}>{d.files[f!]?.originalName}</li>)}</ul></>],
                  [2, "Title and abstract", <><div className="font-display text-lg font-semibold leading-snug">{x.title || "No title"}</div><p className="mt-1 line-clamp-4 text-sm leading-relaxed text-ink/75">{x.abstract}</p><div className="mt-1.5 text-sm text-ink/60">{splitKeywords(x.keywords ?? "").join("; ")}</div></>],
                  [3, "Authors", <span key="a" className="text-sm leading-relaxed">{(x.authors ?? []).map((a, i) => <span key={i}>{i > 0 && ", "}{a.fullName}{i === (x.correspondingIndex ?? 0) && "*"}</span>)}<span className="block text-xs text-ink/55">* corresponding author</span></span>],
                  [4, "Additional information", <span key="b" className="text-sm">{x.coverLetter || d.coverLetterFileId ? "Cover letter included" : "No cover letter"}; {(x.suggested ?? []).length} suggested and {(x.opposed ?? []).length} excluded reviewers</span>],
                  [5, "Declarations", <span key="c" className="text-sm">{done[4] ? "All statements and confirmations provided" : "Some statements or confirmations are missing"}</span>],
                ] as [number, string, ReactNode][]).map(([n, t, body]) => (
                  <div key={n} className="grid gap-2 border-b border-[#E6E8EB] py-5 last:border-0 md:grid-cols-[200px_1fr_auto] md:gap-6">
                    <dt className="text-sm font-semibold">{t}{!done[n - 1] && <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#7A5A12]">Incomplete</span>}</dt>
                    <dd className="min-w-0">{body}</dd>
                    <dd><Link href={`?step=${n}`} className="text-sm text-link hover:underline">Edit</Link></dd>
                  </div>
                ))}
              </dl>
              <form action={submitDraft} className="flex flex-wrap items-center justify-between gap-4 border-t border-[#DDE0E4] bg-[#FAFAFA] px-5 py-5 sm:px-8">
                <input type="hidden" name="id" value={d.id} />
                <p className="max-w-md text-sm text-ink/65">By submitting you confirm that this information is accurate. You will receive a manuscript number by email.</p>
                {ready ? <SubmitButton className="btn-primary px-8 py-3 text-[15px]" confirm="Submit this manuscript to the journal?">Submit manuscript</SubmitButton> : <span className="text-sm font-semibold text-[#7A5A12]">Complete the sections marked incomplete to submit</span>}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
