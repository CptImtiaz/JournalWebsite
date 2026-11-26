"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconName } from "./icons";

export type NavSection = { title: string; links: { href: string; label: string; icon?: IconName; badge?: number }[] };

function Links({ sections, onNav }: { sections: NavSection[]; onNav?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-5" aria-label="Dashboard">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="mb-1 px-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{s.title}</div>
          <ul>
            {s.links.map((l) => {
              const root = ["/admin", "/account", "/editor/dashboard"].includes(l.href);
              const active = path === l.href || (!root && path.startsWith(l.href + "/"));
              return (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNav} className={`flex items-center justify-between border-l-[3px] py-1.5 pl-[13px] pr-4 text-[13.5px] ${active ? "border-navy bg-surface font-semibold text-navy" : "border-transparent text-ink/80 hover:bg-surface hover:text-ink"}`}>
                    <span>{l.label}</span>
                    {!!l.badge && <span className="text-xs font-semibold text-[#C8102E]">({l.badge})</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalNav({ sections }: { sections: NavSection[] }) {
  return <Links sections={sections} />;
}

export function MobilePortalNav({ sections }: { sections: NavSection[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className="border border-white/30 px-2 py-1 text-xs text-white" aria-label="Open menu">Menu</button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 overflow-y-auto bg-white py-4">
            <button type="button" onClick={() => setOpen(false)} className="mb-3 px-4 text-sm text-muted">Close</button>
            <Links sections={sections} onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
