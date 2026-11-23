import type { ReactNode } from "react";
import Link from "next/link";

export function PTitle({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand">← {back.label}</Link>}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
