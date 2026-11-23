import Link from "next/link";
import type { ReactNode } from "react";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";

export function PageHeader({ title, subtitle, crumbs, actions }: { title: string; subtitle?: ReactNode; crumbs?: { label: string; href?: string }[]; actions?: ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-x py-8">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
            {subtitle && <div className="mt-2 max-w-3xl text-muted">{subtitle}</div>}
          </div>
          {actions}
        </div>
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-brand" itemProp="item"><span itemProp="name">{c.label}</span></Link>
            ) : (
              <span itemProp="name" className="text-ink">{c.label}</span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" | "green" | "red" | "amber" | "navy" }) {
  const t = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-brand-light text-brand",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-800",
    navy: "bg-navy text-white",
  }[tone];
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

const STATUS_TONE: Record<string, "gray" | "blue" | "green" | "red" | "amber"> = {
  SUBMITTED: "blue", TECHNICAL_CHECK: "amber", AWAITING_EDITOR: "amber", EDITOR_ASSIGNED: "blue", UNDER_REVIEW: "blue",
  REVISION_REQUIRED: "amber", REVISED_SUBMITTED: "blue", ACCEPTED: "green", REJECTED: "red", IN_PRODUCTION: "green", PUBLISHED: "green", WITHDRAWN: "gray",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "gray"}>{MANUSCRIPT_STATUSES[status as keyof typeof MANUSCRIPT_STATUSES] ?? status}</Badge>;
}

export function Card({ title, children, actions, className = "" }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="text-base font-semibold text-navy">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({ label, name, hint, required, children }: { label: string; name?: string; hint?: ReactNode; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode };
export function TextField({ label, hint, ...p }: InputProps) {
  return (
    <Field label={label} name={p.name} hint={hint} required={p.required}>
      <input id={p.name} className="input" {...p} />
    </Field>
  );
}
type TAProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode };
export function TextArea({ label, hint, ...p }: TAProps) {
  return (
    <Field label={label} name={p.name} hint={hint} required={p.required}>
      <textarea id={p.name} className="input" rows={p.rows ?? 4} {...p} />
    </Field>
  );
}
type SelProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: ReactNode; options: (string | { value: string; label: string })[]; placeholder?: string };
export function SelectField({ label, hint, options, placeholder, ...p }: SelProps) {
  return (
    <Field label={label} name={p.name} hint={hint} required={p.required}>
      <select id={p.name} className="input" {...p}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={v.value} value={v.value}>{v.label}</option>;
        })}
      </select>
    </Field>
  );
}
export function Checkbox({ label, name, defaultChecked, required, hint }: { label: ReactNode; name: string; defaultChecked?: boolean; required?: boolean; hint?: ReactNode }) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} required={required} className="mt-0.5 h-4 w-4 rounded border-line text-brand" />
        <span>{label}{required && <span className="text-red-600"> *</span>}</span>
      </label>
      {hint && <p className="hint ml-6">{hint}</p>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="font-medium text-navy">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="card p-4 transition hover:border-brand">
      <div className="text-2xl font-semibold text-navy">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
      {page > 1 && <Link className="btn-secondary btn-sm" href={makeHref(page - 1)}>Previous</Link>}
      <span className="text-muted">Page {page} of {pages}</span>
      {page < pages && <Link className="btn-secondary btn-sm" href={makeHref(page + 1)}>Next</Link>}
    </nav>
  );
}
