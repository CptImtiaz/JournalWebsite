import Link from "next/link";
import type { ReactNode } from "react";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";
import { Icon, type IconName } from "./icons";

export function PageHeader({ title, subtitle, crumbs, actions }: { title: string; subtitle?: ReactNode; crumbs?: { label: string; href?: string }[]; actions?: ReactNode }) {
  return (
    <div className="border-b border-line">
      <div className="container-x pb-8 pt-6">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-[42px] sm:leading-[1.1]">{title}</h1>
            {subtitle && <div className="mt-3 max-w-3xl text-lg text-ink/70">{subtitle}</div>}
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
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
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
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

const STATUS_TONE: Record<string, "gray" | "blue" | "green" | "red" | "amber"> = {
  SUBMITTED: "blue", TECHNICAL_CHECK: "amber", AWAITING_EDITOR: "amber", EDITOR_ASSIGNED: "blue", UNDER_REVIEW: "blue",
  REVISION_REQUIRED: "amber", REVISED_SUBMITTED: "blue", ACCEPTED: "green", REJECTED: "red", IN_PRODUCTION: "green", PUBLISHED: "green", WITHDRAWN: "gray",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "gray"}>{MANUSCRIPT_STATUSES[status as keyof typeof MANUSCRIPT_STATUSES] ?? status}</Badge>;
}

export function Card({ title, children, actions, className = "", subtitle, flush }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string; subtitle?: ReactNode; flush?: boolean }) {
  return (
    <section className={`app-card ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
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
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, href, icon, hint, tone = "navy" }: { label: string; value: number | string; href?: string; icon?: IconName; hint?: string; tone?: "navy" | "blue" | "green" | "amber" | "red" }) {
  const t = { navy: "bg-navy/8 text-navy", blue: "bg-brand-light text-brand", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700" }[tone];
  const inner = (
    <div className="app-card flex h-full items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      {icon && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t}`}><Icon name={icon} size={20} /></span>}
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
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
