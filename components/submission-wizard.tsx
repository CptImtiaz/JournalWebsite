"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AuthorsEditor, EthicsToggle } from "./client";
import { Icon } from "./icons";

type Cat = { id: string; name: string };
type Author = { fullName: string; email: string; affiliation: string; country: string; orcid: string };
type Rev = { name: string; email: string; institution: string; reason: string };
const KEY = "ijcst-submission-draft-v1";

const STEPS = [
  { id: "type", title: "Article type", desc: "Type and subject area" },
  { id: "details", title: "Title & abstract", desc: "Title, abstract, keywords" },
  { id: "authors", title: "Authors", desc: "Order and affiliations" },
  { id: "files", title: "Files", desc: "Manuscript and supplements" },
  { id: "reviewers", title: "Reviewers", desc: "Suggestions (optional)" },
  { id: "declarations", title: "Declarations", desc: "Ethics and disclosures" },
  { id: "review", title: "Review & submit", desc: "Check and confirm" },
];

const TYPE_INFO: Record<string, string> = {
  "Research Article": "Original research with full methods and results.",
  "Review Article": "Comprehensive critical survey of a research area.",
  "Short Communication": "Concise report of significant preliminary findings.",
  "Case Study": "In-depth analysis of a system, deployment or project.",
  Survey: "Systematic overview and taxonomy of existing work.",
  "Technical Note": "Brief description of a technique, tool or dataset.",
  Editorial: "Commissioned editorial content (by invitation).",
};

function words(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-6 py-2.5">
      {pending ? "Uploading and submitting…" : <>Submit manuscript <Icon name="check" size={16} /></>}
    </button>
  );
}

export function SubmissionWizard({ action, categories, types, me, maxMb }: { action: (fd: FormData) => void; categories: Cat[]; types: string[]; me: Author; maxMb: number }) {
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [authors, setAuthors] = useState<Author[]>([me]);
  const [suggested, setSuggested] = useState<Rev[]>([]);
  const [opposed, setOpposed] = useState<Rev[]>([]);
  const [abstract, setAbstract] = useState("");
  const [files, setFiles] = useState<{ main?: string; supp: string[] }>({ supp: [] });
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Restore draft (text fields only · files cannot be stored by the browser).
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (d) {
        setSaved(d.fields ?? {});
        if (d.authors?.length) setAuthors(d.authors);
        setSuggested(d.suggested ?? []);
        setOpposed(d.opposed ?? []);
        setAbstract(d.fields?.abstract ?? "");
        setSavedAt(d.at ?? null);
      }
    } catch {}
    setReady(true);
  }, []);

  function persist() {
    if (!form.current) return;
    const fields: Record<string, string> = {};
    for (const el of Array.from(form.current.elements) as HTMLInputElement[]) {
      if (!el.name || el.type === "file" || el.type === "hidden" || el.dataset.nosave) continue;
      if (el.type === "radio") { if (el.checked) fields[el.name] = el.value; continue; }
      if (el.type === "checkbox") { fields[el.name] = el.checked ? "on" : ""; continue; }
      fields[el.name] = el.value;
    }
    let authorsNow = authors;
    const aj = form.current.querySelector<HTMLInputElement>("input[name=authorsJson]");
    try { if (aj) authorsNow = JSON.parse(aj.value); } catch {}
    const at = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    try { localStorage.setItem(KEY, JSON.stringify({ fields, authors: authorsNow, suggested, opposed, at })); setSavedAt(at); } catch {}
  }

  function panelValid(i: number) {
    const panel = form.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);
    return !panel || Array.from(panel.querySelectorAll<HTMLInputElement>("input,select,textarea")).every((el) => el.checkValidity());
  }

  function validate(i: number) {
    const panel = form.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);
    if (!panel) return true;
    for (const el of Array.from(panel.querySelectorAll<HTMLInputElement>("input,select,textarea"))) {
      if (!el.checkValidity()) { el.reportValidity(); return false; }
    }
    return true;
  }

  function go(n: number) {
    if (n > step) {
      for (let i = step; i < n; i++) if (!validate(i)) { setStep(i); return; }
    }
    if (n === STEPS.length - 1 && form.current) {
      const fd = new FormData(form.current);
      const o: Record<string, string> = {};
      fd.forEach((v, k) => { if (typeof v === "string") o[k] = v; });
      setSummary(o);
    }
    persist();
    setDone((d) => new Set([...d, ...Array.from({ length: n }, (_, k) => k)]));
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready) return <div className="app-card p-10 text-center text-sm text-muted">Loading submission form…</div>;
  const v = (k: string) => saved[k] ?? "";
  const cat = categories.find((c) => c.id === summary.categoryId)?.name;
  let authorsSummary: Author[] = [];
  try { authorsSummary = JSON.parse(summary.authorsJson ?? "[]"); } catch {}
  const corrIdx = parseInt(summary.correspondingIndex ?? "0", 10);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Stepper */}
      <aside>
        <ol className="app-card sticky top-24 p-3">
          {STEPS.map((s, i) => {
            const isDone = done.has(i) && i !== step;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => (i <= step || done.has(i) ? go(i) : go(i))} className={`flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left ${i === step ? "bg-brand-light" : "hover:bg-app"}`}>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === step ? "bg-brand text-white" : isDone ? "bg-navy text-white" : "border border-line bg-white text-muted"}`}>{isDone ? <Icon name="check" size={13} /> : i + 1}</span>
                  <span><span className={`block text-sm ${i === step ? "font-semibold text-ink" : "font-medium text-ink"}`}>{s.title}</span><span className="block text-xs text-muted">{s.desc}</span></span>
                </button>
              </li>
            );
          })}
          <li className="mt-2 border-t border-line px-3 pt-3 text-[11px] text-muted">{savedAt ? `Draft saved on this device at ${savedAt}` : "Your progress is saved on this device as you go."}</li>
        </ol>
      </aside>

      <form
        ref={form}
        action={action}
        noValidate
        onChange={persist}
        onSubmit={(e) => {
          for (let i = 0; i < STEPS.length; i++) {
            if (!panelValid(i)) {
              e.preventDefault();
              setStep(i);
              setTimeout(() => validate(i), 60);
              return;
            }
          }
          persist();
        }}
        encType="multipart/form-data"
        className="min-w-0"
      >
        <div className="app-card">
          <div className="border-b border-line px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Step {step + 1} of {STEPS.length}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{STEPS[step].title}</h2>
            <div className="mt-4 h-1 overflow-hidden bg-app"><div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {/* 1. Type */}
            <Panel i={0} step={step}>
              <Section title="What type of article are you submitting?" required>
                <div className="grid gap-3 sm:grid-cols-2">
                  {types.map((t, k) => (
                    <label key={t} className="group relative flex cursor-pointer gap-3 rounded-sm border border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-light/50 hover:border-brand/60">
                      <input type="radio" name="articleType" value={t} required defaultChecked={v("articleType") ? v("articleType") === t : k === 0} className="mt-1 accent-[#2864A5]" />
                      <span><span className="block text-sm font-semibold">{t}</span><span className="block text-xs text-muted">{TYPE_INFO[t]}</span></span>
                    </label>
                  ))}
                </div>
              </Section>
              <Section title="Research field" required hint="The subject area that best describes your work. It helps us choose suitable editors and reviewers.">
                <select name="categoryId" required defaultValue={v("categoryId")} className="input max-w-lg">
                  <option value="">Select a research field…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Section>
              <div className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-app/60 p-4 text-sm">
                <Icon name="file" size={18} className="text-brand" />
                <span className="flex-1">Use the journal template to format your manuscript.</span>
                <a href="/templates/IJCST-manuscript-template.docx" className="font-medium text-brand hover:underline">Word (.docx)</a>
              </div>
              <Section title="Before you begin">
                <ul className="grid gap-2 text-sm text-ink/80 sm:grid-cols-2">
                  {["Manuscript file anonymised (no author names)", "Names, emails and affiliations of all coauthors", "Abstract (150 to 300 words) and 4 to 8 keywords", "Funding and conflict-of-interest statements", "Ethics approval details, if applicable", `Files in DOC, DOCX or PDF, up to ${maxMb} MB each`].map((t) => (
                    <li key={t} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-navy" />{t}</li>
                  ))}
                </ul>
              </Section>
            </Panel>

            {/* 2. Details */}
            <Panel i={1} step={step}>
              <Section title="Manuscript title" required hint="Concise and informative. Avoid abbreviations.">
                <textarea name="title" required rows={2} maxLength={500} defaultValue={v("title")} className="input font-display text-lg" placeholder="Enter the full title of your manuscript" />
              </Section>
              <Section title="Abstract" required hint={<span className={words(abstract) > 300 ? "text-amber-700" : ""}>{words(abstract)} words · 150 to 300 recommended</span>}>
                <textarea name="abstract" required rows={9} maxLength={5000} defaultValue={v("abstract")} onChange={(e) => setAbstract(e.target.value)} className="input leading-relaxed" placeholder="Background, methods, results and conclusions" />
              </Section>
              <Section title="Keywords" required hint="4 to 8 keywords separated by semicolons, for example: machine learning; edge computing">
                <input name="keywords" required defaultValue={v("keywords")} className="input" pattern="(?:[^;,]+[;,]){2,}[^;,]+.*" title="Enter at least 3 keywords separated by semicolons or commas" />
              </Section>
              <Section title="Has this manuscript been previously submitted to this journal?">
                <input name="previouslySubmitted" defaultValue={v("previouslySubmitted")} className="input max-w-md" placeholder="Previous manuscript ID (if a resubmission)" />
              </Section>
            </Panel>

            {/* 3. Authors */}
            <Panel i={2} step={step}>
              <p className="mb-5 rounded-sm bg-app p-4 text-sm text-ink/80">List <strong>all</strong> authors in the order they should appear in the published article. Choose one corresponding author, who will receive all correspondence. Author details are <strong>not</strong> shared with reviewers.</p>
              <AuthorsEditor initial={authors} />
            </Panel>

            {/* 4. Files */}
            <Panel i={3} step={step}>
              <Section title="Manuscript file" required hint={`Anonymised for double anonymous review · DOC, DOCX or PDF · max ${maxMb} MB`}>
                <DropZone name="manuscriptFile" accept=".doc,.docx,.pdf" required label="Drop your manuscript here or browse" picked={files.main ? [files.main] : []} onPick={(n) => setFiles((f) => ({ ...f, main: n[0] }))} />
              </Section>
              <Section title="Supplementary material" hint="Data, code (ZIP), extra figures or appendices. Multiple files allowed.">
                <DropZone name="supplementaryFiles" multiple accept=".doc,.docx,.pdf,.zip,.xlsx,.csv,.png,.jpg,.jpeg" label="Drop supplementary files here or browse" picked={files.supp} onPick={(n) => setFiles((f) => ({ ...f, supp: n }))} />
              </Section>
              <Section title="Cover letter" hint="Explain the significance of the work and confirm it is not under consideration elsewhere. Visible to editors only.">
                <textarea name="coverLetter" rows={7} defaultValue={v("coverLetter")} className="input" placeholder="Dear Editor in Chief, …" />
                <div className="mt-3"><DropZone name="coverLetterFile" accept=".doc,.docx,.pdf" label="…or upload a cover letter file" compact picked={[]} onPick={() => {}} /></div>
              </Section>
              <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Browsers cannot keep selected files in a saved draft. If you leave this page, please select your files again before submitting.</p>
            </Panel>

            {/* 5. Reviewers */}
            <Panel i={4} step={step}>
              <p className="mb-5 text-sm text-ink/80">You may suggest up to five independent experts and identify reviewers you would prefer to exclude. Suggested reviewers must not be recent collaborators or from your institutions. The editor is not obliged to follow these suggestions.</p>
              <ReviewerList title="Suggested reviewers" name="suggestedReviewersJson" rows={suggested} setRows={(r) => { setSuggested(r); setTimeout(persist); }} max={5} reasonLabel="Expertise / reason" />
              <div className="mt-8"><ReviewerList title="Opposed reviewers" name="opposedReviewersJson" rows={opposed} setRows={(r) => { setOpposed(r); setTimeout(persist); }} max={3} reasonLabel="Reason for exclusion" /></div>
            </Panel>

            {/* 6. Declarations */}
            <Panel i={5} step={step}>
              <Section title="Competing interests" required>
                <textarea name="conflictOfInterest" required rows={2} defaultValue={v("conflictOfInterest") || "The authors declare no competing interests."} className="input" />
              </Section>
              <Section title="Funding" required>
                <textarea name="fundingStatement" required rows={2} defaultValue={v("fundingStatement")} className="input" placeholder="This work was supported by … (grant no. …) · or: This research received no external funding." />
              </Section>
              <Section title="Ethics approval" hint="Required if the research involved human participants, personal data or animals.">
                <EthicsToggle defaultChecked={v("ethicsApprovalRequired") === "on"} />
              </Section>
              <Section title="Data and code availability">
                <textarea name="dataAvailability" rows={2} defaultValue={v("dataAvailability")} className="input" placeholder="e.g. The datasets and code are available at https://… / available from the corresponding author on reasonable request." />
              </Section>
              <Section title="Use of AI tools" hint="Describe any use of generative AI in preparing the work or manuscript. Leave blank if none.">
                <textarea name="aiUsageDisclosure" rows={2} defaultValue={v("aiUsageDisclosure")} className="input" />
              </Section>
              <div className="space-y-3 rounded-sm bg-app p-4">
                <Check name="originality" saved={v("originality")}>I confirm the manuscript is original, has not been published before, and is not under consideration by another journal.</Check>
                <Check name="authorsAgree" saved={v("authorsAgree")}>All authors have approved the manuscript and agree with its submission and the author order.</Check>
                <Check name="policies" saved={v("policies")}>I have read and agree to the journal&apos;s <a className="link" href="/publication-ethics" target="_blank">Publication Ethics</a>, <a className="link" href="/copyright" target="_blank">Copyright & Licensing</a> and <a className="link" href="/publication-fees" target="_blank">Publication Fees</a> policies.</Check>
              </div>
            </Panel>

            {/* 7. Review */}
            <Panel i={6} step={step}>
              <p className="mb-5 text-sm text-muted">Please check your submission carefully. You can go back to any step to make changes.</p>
              <div className="divide-y divide-line rounded-sm border border-line">
                <Sum label="Article type" onEdit={() => go(0)}>{summary.articleType} · {cat ?? <em className="text-[#7A5A12]">no field selected</em>}</Sum>
                <Sum label="Title" onEdit={() => go(1)}><span className="font-display text-base font-semibold">{summary.title}</span></Sum>
                <Sum label="Abstract" onEdit={() => go(1)}><span className="line-clamp-4">{summary.abstract}</span><span className="text-xs text-muted">{words(summary.abstract ?? "")} words</span></Sum>
                <Sum label="Keywords" onEdit={() => go(1)}><span className="flex flex-wrap gap-1.5">{(summary.keywords ?? "").split(/[;,]/).map((k) => k.trim()).filter(Boolean).map((k) => <span key={k} className="bg-app px-2.5 py-0.5 text-xs">{k}</span>)}</span></Sum>
                <Sum label="Authors" onEdit={() => go(2)}>
                  <ol className="space-y-1">{authorsSummary.map((a, i) => <li key={i}>{i + 1}. <strong>{a.fullName}</strong>{i === corrIdx && <span className="ml-1 rounded bg-brand-light px-1.5 text-[11px] text-brand">corresponding</span>} <span className="text-muted">· {a.affiliation}</span></li>)}</ol>
                </Sum>
                <Sum label="Files" onEdit={() => go(3)}>{files.main ? <span className="flex items-center gap-1.5"><Icon name="file" size={15} />{files.main}</span> : <em className="text-[#7A5A12]">No manuscript file selected</em>}{files.supp.length > 0 && <span className="mt-1 block text-xs text-muted">+ {files.supp.length} supplementary file(s)</span>}</Sum>
                <Sum label="Reviewers" onEdit={() => go(4)}>{suggested.length} suggested · {opposed.length} opposed</Sum>
                <Sum label="Declarations" onEdit={() => go(5)}>
                  <span className="block">Competing interests: {summary.conflictOfInterest}</span>
                  <span className="block">Funding: {summary.fundingStatement}</span>
                  <span className="block">Ethics approval: {summary.ethicsApprovalRequired === "on" ? summary.ethicsStatement : "Not applicable"}</span>
                </Sum>
              </div>
              <p className="mt-5 text-xs text-muted">By submitting, you confirm that the information provided is accurate. You will receive a manuscript ID and confirmation email immediately.</p>
            </Panel>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line bg-app/60 px-6 py-4 sm:px-8">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn-secondary">← Back</button>
            {step < STEPS.length - 1 ? <button type="button" onClick={() => go(step + 1)} className="btn-primary px-6">Save & continue →</button> : <SubmitBtn />}
          </div>
        </div>
      </form>
    </div>
  );
}

function Panel({ i, step, children }: { i: number; step: number; children: ReactNode }) {
  return <div data-step={i} className={i === step ? "space-y-7" : "hidden"}>{children}</div>;
}
function Section({ title, required, hint, children }: { title: string; required?: boolean; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2"><span className="text-sm font-semibold text-ink">{title}{required && <span className="text-[#7A5A12]"> *</span>}</span>{hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}</div>
      {children}
    </div>
  );
}
function Check({ name, saved, children }: { name: string; saved: string; children: ReactNode }) {
  return <label className="flex items-start gap-3 text-sm"><input type="checkbox" name={name} required defaultChecked={saved === "on"} className="mt-0.5 h-4 w-4 accent-[#2864A5]" /><span>{children} <span className="text-[#7A5A12]">*</span></span></label>;
}
function Sum({ label, children, onEdit }: { label: string; children: ReactNode; onEdit: () => void }) {
  return (
    <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[140px_1fr_auto]">
      <span className="font-medium text-muted">{label}</span>
      <div className="min-w-0">{children}</div>
      <button type="button" onClick={onEdit} className="self-start text-xs font-medium text-brand hover:underline">Edit</button>
    </div>
  );
}

function DropZone({ name, accept, multiple, required, label, picked, onPick, compact }: { name: string; accept: string; multiple?: boolean; required?: boolean; label: string; picked: string[]; onPick: (names: string[]) => void; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        if (ref.current && e.dataTransfer.files.length) { ref.current.files = e.dataTransfer.files; onPick(Array.from(e.dataTransfer.files).map((f) => f.name)); }
      }}
      className={`relative rounded-sm border-2 border-dashed text-center transition ${over ? "border-brand bg-brand-light/60" : picked.length ? "border-navy/30 bg-[#EEF1F6]/50" : "border-line bg-app/40 hover:border-brand/60"} ${compact ? "px-4 py-4" : "px-6 py-8"}`}
    >
      <input ref={ref} type="file" name={name} accept={accept} multiple={multiple} required={required} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => onPick(Array.from(e.target.files ?? []).map((f) => f.name))} aria-label={label} />
      {!compact && <Icon name="upload" size={26} className="mx-auto text-brand" />}
      {picked.length ? (
        <div className="mt-2 space-y-1 text-sm">{picked.map((p) => <div key={p} className="flex items-center justify-center gap-1.5 font-medium text-navy"><Icon name="check" size={14} />{p}</div>)}<div className="text-xs text-muted">Click to change</div></div>
      ) : (
        <div className={compact ? "text-sm text-muted" : "mt-2"}><span className="text-sm font-medium text-ink">{label}</span>{!compact && <span className="block text-xs text-muted">{accept.replace(/\./g, "").toUpperCase().split(",").join(", ")}</span>}</div>
      )}
    </div>
  );
}

function ReviewerList({ title, name, rows, setRows, max, reasonLabel }: { title: string; name: string; rows: Rev[]; setRows: (r: Rev[]) => void; max: number; reasonLabel: string }) {
  const upd = (i: number, k: keyof Rev, val: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.name.trim()))} />
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{title}</h3><span className="text-xs text-muted">{rows.length}/{max}</span></div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-sm border border-line p-3 sm:grid-cols-2">
            <input data-nosave="1" className="input" placeholder="Full name" value={r.name} onChange={(e) => upd(i, "name", e.target.value)} />
            <input data-nosave="1" className="input" type="email" placeholder="Institutional email" value={r.email} onChange={(e) => upd(i, "email", e.target.value)} />
            <input data-nosave="1" className="input" placeholder="Institution" value={r.institution} onChange={(e) => upd(i, "institution", e.target.value)} />
            <div className="flex gap-2"><input data-nosave="1" className="input" placeholder={reasonLabel} value={r.reason} onChange={(e) => upd(i, "reason", e.target.value)} /><button type="button" className="btn-secondary btn-sm text-[#7A5A12]" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button></div>
          </div>
        ))}
      </div>
      {rows.length < max && <button type="button" className="btn-secondary mt-3" onClick={() => setRows([...rows, { name: "", email: "", institution: "", reason: "" }])}><Icon name="plus" size={15} />Add {title.toLowerCase().replace(/s$/, "")}</button>}
    </div>
  );
}

export function ClearDraft() {
  useEffect(() => { try { localStorage.removeItem(KEY); } catch {} }, []);
  return null;
}
