"use client";
import { useRef, useState } from "react";

export function FileDrop({ name, accept, multiple, label, hint }: { name: string; accept: string; multiple?: boolean; label: string; hint: string }) {
  const [names, setNames] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (ref.current && e.dataTransfer.files.length) { ref.current.files = e.dataTransfer.files; setNames(Array.from(e.dataTransfer.files).map((f) => f.name)); } }}
      className={`relative border border-dashed px-5 py-6 text-center transition-colors ${over ? "border-link bg-[#eef6fa]" : names.length ? "border-emerald-500 bg-emerald-50/40" : "border-ink/25 bg-white hover:border-link"}`}
    >
      <input ref={ref} type="file" name={name} accept={accept} multiple={multiple} aria-label={label} className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => setNames(Array.from(e.target.files ?? []).map((f) => f.name))} />
      {names.length ? (
        <div className="text-sm"><div className="font-semibold text-emerald-800">{names.length} file{names.length > 1 ? "s" : ""} ready to upload</div><div className="mt-1 text-xs text-ink/70">{names.join(", ")}</div><div className="mt-1 text-xs text-muted">Uploaded when you save this step</div></div>
      ) : (
        <div className="text-sm"><span className="font-semibold text-link underline underline-offset-2">Choose {multiple ? "files" : "a file"}</span> <span className="text-ink/70">or drag {multiple ? "them" : "it"} here</span><div className="mt-1 text-xs text-muted">{hint}</div></div>
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
      <div className={`mt-1 text-right text-xs tabular-nums ${n > 300 ? "font-semibold text-amber-700" : n && n < 150 ? "text-amber-700" : "text-muted"}`}>{n} words · 150 to 300 recommended</div>
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
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Institution</th><th>{reasonLabel}</th><th></th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input className="input py-1.5" value={r.name} onChange={(e) => upd(i, "name", e.target.value)} aria-label="Name" /></td>
                  <td><input className="input py-1.5" type="email" value={r.email} onChange={(e) => upd(i, "email", e.target.value)} aria-label="Email" /></td>
                  <td><input className="input py-1.5" value={r.institution} onChange={(e) => upd(i, "institution", e.target.value)} aria-label="Institution" /></td>
                  <td><input className="input py-1.5" value={r.reason} onChange={(e) => upd(i, "reason", e.target.value)} aria-label={reasonLabel} /></td>
                  <td><button type="button" className="text-sm text-red-700 hover:underline" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length < max && <button type="button" className="mt-2 text-sm font-semibold text-link hover:underline" onClick={() => setRows([...rows, { name: "", email: "", institution: "", reason: "" }])}>+ {addLabel}</button>}
      <span className="ml-3 text-xs text-muted">{rows.length} of {max}</span>
    </div>
  );
}
