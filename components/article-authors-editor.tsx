"use client";
import { useState } from "react";

type Row = { fullName: string; givenName: string; familyName: string; email: string; affiliation: string; rorId: string; country: string; orcid: string; isCorresponding: boolean };
const blank: Row = { fullName: "", givenName: "", familyName: "", email: "", affiliation: "", rorId: "", country: "", orcid: "", isCorresponding: false };

export function ArticleAuthorsEditor({ initial }: { initial: Partial<Row>[] }) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial.map((r) => ({ ...blank, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? (k === "isCorresponding" ? false : "")])) })) : [{ ...blank }]);
  const set = (i: number, k: keyof Row, v: string | boolean) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const n = [...rows];
    [n[i], n[j]] = [n[j], n[i]];
    setRows(n);
  };
  return (
    <div className="space-y-3">
      <input type="hidden" name="authorsJson" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="rounded border border-line p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <strong>Author {i + 1}</strong>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.isCorresponding} onChange={(e) => set(i, "isCorresponding", e.target.checked)} /> Corresponding</label>
              <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="btn-secondary btn-sm text-red-700" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" placeholder="Full name (as displayed) *" value={r.fullName} onChange={(e) => set(i, "fullName", e.target.value)} />
            <input className="input" placeholder="Given name(s)" value={r.givenName} onChange={(e) => set(i, "givenName", e.target.value)} />
            <input className="input" placeholder="Family name" value={r.familyName} onChange={(e) => set(i, "familyName", e.target.value)} />
            <input className="input" placeholder="Email" value={r.email} onChange={(e) => set(i, "email", e.target.value)} />
            <input className="input sm:col-span-2" placeholder="Affiliation" value={r.affiliation} onChange={(e) => set(i, "affiliation", e.target.value)} />
            <input className="input" placeholder="Country" value={r.country} onChange={(e) => set(i, "country", e.target.value)} />
            <input className="input" placeholder="ORCID iD" value={r.orcid} onChange={(e) => set(i, "orcid", e.target.value)} />
            <input className="input" placeholder="ROR ID (https://ror.org/...)" value={r.rorId} onChange={(e) => set(i, "rorId", e.target.value)} />
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => setRows([...rows, { ...blank }])}>+ Add author</button>
    </div>
  );
}
