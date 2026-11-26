import type { ReactNode } from "react";
import Link from "next/link";

export function PTitle({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 border-b border-line pb-4">
      {back && <Link href={back.href} className="text-xs font-medium text-link hover:underline">‹ {back.label}</Link>}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
