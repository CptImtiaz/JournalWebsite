"use client";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function SubmitButton({ children, className = "btn-primary", confirm, name, value }: { children: ReactNode; className?: string; confirm?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        // Carry this button's name/value explicitly so multi-action forms always know which button was used.
        const form = e.currentTarget.form;
        if (form && name) {
          let h = form.querySelector<HTMLInputElement>("input[data-submitter]");
          if (!h) {
            h = document.createElement("input");
            h.type = "hidden";
            h.dataset.submitter = "1";
            form.appendChild(h);
          }
          h.name = name;
          h.value = value ?? "";
        }
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

export function Flash() {
  const sp = useSearchParams();
  const ok = sp.get("ok");
  const err = sp.get("error");
  const [show, setShow] = useState(true);
  useEffect(() => setShow(true), [ok, err]);
  if (!show || (!ok && !err)) return null;
  return (
    <div role={err ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${err ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      <span>{err ?? ok}</span>
      <button type="button" onClick={() => setShow(false)} className="text-current opacity-60 hover:opacity-100" aria-label="Dismiss">×</button>
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? "Copied" : label}
    </button>
  );
}

export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" className="btn-secondary btn-sm" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <div id="mobile-nav" className="absolute inset-x-0 top-full z-40 border-b border-line bg-white shadow-lg" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

type AuthorRow = { fullName: string; email: string; affiliation: string; country: string; orcid: string };
export function AuthorsEditor({ initial }: { initial: AuthorRow[] }) {
  const [rows, setRows] = useState<AuthorRow[]>(initial.length ? initial : [{ fullName: "", email: "", affiliation: "", country: "", orcid: "" }]);
  const [corr, setCorr] = useState(0);
  const update = (i: number, k: keyof AuthorRow, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const n = [...rows];
    [n[i], n[j]] = [n[j], n[i]];
    setRows(n);
    if (corr === i) setCorr(j);
    else if (corr === j) setCorr(i);
  };
  return (
    <div className="space-y-4">
      <input type="hidden" name="authorsJson" value={JSON.stringify(rows)} />
      <input type="hidden" name="correspondingIndex" value={corr} />
      {rows.map((r, i) => (
        <div key={i} className="rounded-md border border-line p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">Author {i + 1}</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs">
                <input type="radio" checked={corr === i} onChange={() => setCorr(i)} /> Corresponding author
              </label>
              <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">↓</button>
              {rows.length > 1 && (
                <button type="button" className="btn-secondary btn-sm text-red-700" onClick={() => { setRows(rows.filter((_, j) => j !== i)); if (corr >= rows.length - 1) setCorr(0); }}>Remove</button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Full name *" required value={r.fullName} onChange={(e) => update(i, "fullName", e.target.value)} />
            <input className="input" type="email" placeholder="Email *" required value={r.email} onChange={(e) => update(i, "email", e.target.value)} />
            <input className="input" placeholder="Institutional affiliation *" required value={r.affiliation} onChange={(e) => update(i, "affiliation", e.target.value)} />
            <input className="input" placeholder="Country" value={r.country} onChange={(e) => update(i, "country", e.target.value)} />
            <input className="input sm:col-span-2" placeholder="ORCID iD (optional, e.g. 0000-0002-1825-0097)" value={r.orcid} onChange={(e) => update(i, "orcid", e.target.value)} />
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setRows([...rows, { fullName: "", email: "", affiliation: "", country: "", orcid: "" }])}>
        + Add author
      </button>
    </div>
  );
}

export function EthicsToggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="ethicsApprovalRequired" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>This research involves human participants, personal data, or animals and required ethics approval.</span>
      </label>
      {on && (
        <textarea name="ethicsStatement" required className="input" rows={3} placeholder="Name of the approving ethics committee / IRB, approval reference number and consent procedures *" />
      )}
    </div>
  );
}
