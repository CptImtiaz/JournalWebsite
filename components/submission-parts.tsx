"use client";
import { useRef, useState } from "react";

export function FileDrop({ name, accept, multiple, label, hint, note = "Uploaded when you save this step" }: { name: string; accept: string; multiple?: boolean; label: string; hint: string; note?: string }) {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const pick = (l: FileList | null) => setFiles(Array.from(l ?? []).map((f) => ({ name: f.name, size: f.size })));
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (ref.current && e.dataTransfer.files.length) { ref.current.files = e.dataTransfer.files; pick(e.dataTransfer.files); } }}
      className={`relative rounded-[4px] border border-dashed px-5 py-5 text-sm transition-colors ${over ? "border-navy bg-[#F1F3F6]" : files.length ? "border-navy/60 bg-white" : "border-[#B9BEC6] bg-[#FAFAFA] hover:border-navy"}`}
    >
      <input ref={ref} type="file" name={name} accept={accept} multiple={multiple} aria-label={label} className="absolute inset-0 z-10 cursor-pointer opacity-0" onChange={(e) => pick(e.target.files)} />
      {files.length ? (
        <div>
          {files.map((f) => <div key={f.name} className="flex items-baseline justify-between gap-4 py-0.5"><span className="truncate font-medium text-ink">{f.name}</span><span className="shrink-0 text-xs text-ink/60">{(f.size / 1048576).toFixed(f.size > 1048576 ? 1 : 2)} MB</span></div>)}
          <div className="mt-2 text-xs text-ink/60">{note}. Click to choose {multiple ? "other files" : "another file"}.</div>
        </div>
      ) : (
        <div className="text-center"><span className="font-medium text-link underline underline-offset-2">Choose {multiple ? "files" : "a file"}</span> <span className="text-ink/70">or drag {multiple ? "them" : "it"} here</span><div className="mt-1 text-xs text-ink/55">{hint}</div></div>
      )}
    </div>
  );
}

export function AbstractField({ defaultValue }: { defaultValue: string }) {
  const [v, setV] = useState(defaultValue);
  const n = v.trim() ? v.trim().split(/\s+/).length : 0;
  return (
    <div>
      <textarea id="abstract" name="abstract" rows={10} defaultValue={defaultValue} onChange={(e) => setV(e.target.value)} className="input leading-relaxed" placeholder="Background, methods, results and conclusions in one paragraph" />
      <div className={`mt-1.5 text-right text-xs tabular-nums ${n > 300 ? "font-semibold text-[#7A5A12]" : "text-ink/60"}`}>{n} words (150 to 300)</div>
    </div>
  );
}

export function KeywordsField({ defaultValue }: { defaultValue: string }) {
  const [v, setV] = useState(defaultValue);
  const kws = v.split(/[;,]/).map((k) => k.trim()).filter(Boolean);
  return (
    <div>
      <input id="keywords" name="keywords" value={v} onChange={(e) => setV(e.target.value)} className="input" placeholder="machine learning; edge computing; federated learning" />
      {kws.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{kws.map((k, i) => <span key={i} className="rounded-[3px] border border-[#DDE0E4] bg-[#F6F6F6] px-2 py-0.5 text-xs text-ink/80">{k}</span>)}</div>}
      <div className="mt-1.5 text-xs text-ink/60">{kws.length} of 4 to 8 keywords</div>
    </div>
  );
}

type AuthorRow = { fullName: string; email: string; affiliation: string; country: string; orcid: string };
const blank: AuthorRow = { fullName: "", email: "", affiliation: "", country: "", orcid: "" };

export function AuthorCards({ initial, initialCorresponding = 0 }: { initial: AuthorRow[]; initialCorresponding?: number }) {
  const [rows, setRows] = useState<AuthorRow[]>(initial.length ? initial : [blank]);
  const [corr, setCorr] = useState(initialCorresponding);
  const update = (i: number, k: keyof AuthorRow, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const n = [...rows]; [n[i], n[j]] = [n[j], n[i]]; setRows(n);
    if (corr === i) setCorr(j); else if (corr === j) setCorr(i);
  };
  const remove = (i: number) => { setRows(rows.filter((_, j) => j !== i)); setCorr(corr === i ? 0 : corr > i ? corr - 1 : corr); };
  const tb = "text-sm text-link hover:underline disabled:cursor-default disabled:text-ink/30 disabled:no-underline";
  return (
    <div>
      <input type="hidden" name="authorsJson" value={JSON.stringify(rows)} />
      <input type="hidden" name="correspondingIndex" value={corr} />
      <ol className="divide-y divide-[#E6E8EB] border-b border-[#E6E8EB]">
        {rows.map((r, i) => (
          <li key={i} className="py-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-3"><span className="font-display text-lg font-semibold">Author {i + 1}</span>{corr === i && <span className="text-xs font-semibold uppercase tracking-[0.08em] text-navy">Corresponding author</span>}</div>
              <div className="flex items-center gap-4">
                {corr !== i && <button type="button" className={tb} onClick={() => setCorr(i)}>Make corresponding</button>}
                <button type="button" className={tb} onClick={() => move(i, -1)} disabled={i === 0}>Move up</button>
                <button type="button" className={tb} onClick={() => move(i, 1)} disabled={i === rows.length - 1}>Move down</button>
                {rows.length > 1 && <button type="button" className={tb} onClick={() => remove(i)}>Remove</button>}
              </div>
            </div>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <label className="text-sm text-ink/80">Full name<input className="input mt-1" required value={r.fullName} onChange={(e) => update(i, "fullName", e.target.value)} /></label>
              <label className="text-sm text-ink/80">Email<input className="input mt-1" type="email" required value={r.email} onChange={(e) => update(i, "email", e.target.value)} /></label>
              <label className="text-sm text-ink/80">Affiliation<input className="input mt-1" required value={r.affiliation} onChange={(e) => update(i, "affiliation", e.target.value)} placeholder="Department, institution, city" /></label>
              <label className="text-sm text-ink/80">Country<input className="input mt-1" value={r.country} onChange={(e) => update(i, "country", e.target.value)} /></label>
              <label className="text-sm text-ink/80 sm:col-span-2">ORCID iD <span className="text-ink/50">(optional)</span><input className="input mt-1" value={r.orcid} onChange={(e) => update(i, "orcid", e.target.value)} placeholder="0000-0002-1825-0097" /></label>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn-secondary mt-4" onClick={() => setRows([...rows, blank])}>Add another author</button>
    </div>
  );
}

export function EthicsSwitch({ defaultChecked, defaultStatement }: { defaultChecked?: boolean; defaultStatement?: string }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="ethicsApprovalRequired" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#142D4E]" />
        <span>This research involves human participants, personal data or animals and needed ethics approval.</span>
      </label>
      {on && <textarea name="ethicsStatement" required className="input" rows={3} defaultValue={defaultStatement ?? ""} placeholder="Approving committee, approval number and how consent was obtained" />}
    </div>
  );
}

type Rev = { name: string; email: string; institution: string; reason: string };
export function ReviewerRows({ name, initial, max, reasonLabel, addLabel }: { name: string; initial: Rev[]; max: number; reasonLabel: string; addLabel: string }) {
  const [rows, setRows] = useState<Rev[]>(initial);
  const upd = (i: number, k: keyof Rev, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="border-t border-[#E6E8EB] py-3 first:border-t-0 first:pt-0">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" value={r.name} onChange={(e) => upd(i, "name", e.target.value)} placeholder="Name" aria-label="Name" />
            <input className="input" type="email" value={r.email} onChange={(e) => upd(i, "email", e.target.value)} placeholder="Email" aria-label="Email" />
            <input className="input" value={r.institution} onChange={(e) => upd(i, "institution", e.target.value)} placeholder="Institution" aria-label="Institution" />
            <input className="input" value={r.reason} onChange={(e) => upd(i, "reason", e.target.value)} placeholder={reasonLabel} aria-label={reasonLabel} />
          </div>
          <button type="button" className="mt-1.5 text-sm text-link hover:underline" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      <div className="mt-2 flex items-center gap-3">
        {rows.length < max && <button type="button" className="text-sm font-medium text-link hover:underline" onClick={() => setRows([...rows, { name: "", email: "", institution: "", reason: "" }])}>{addLabel}</button>}
        <span className="text-xs text-ink/55">{rows.length} of {max}</span>
      </div>
    </div>
  );
}
