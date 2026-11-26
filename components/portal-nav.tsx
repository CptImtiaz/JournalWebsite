"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";

export type NavSection = { title: string; links: { href: string; label: string; icon: IconName; badge?: number }[] };

function Links({ sections, onNav }: { sections: NavSection[]; onNav?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-6" aria-label="Dashboard">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{s.title}</div>
          <ul className="space-y-0.5">
            {s.links.map((l) => {
              const root = ["/admin", "/account", "/editor/dashboard"].includes(l.href);
              const active = path === l.href || (!root && path.startsWith(l.href + "/"));
              return (
                <li key={l.href}>
                  <Link href={l.href} onClick={onNav} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white/12 font-medium text-white shadow-[inset_3px_0_0_#7FB0E6]" : "text-white/70 hover:bg-white/6 hover:text-white"}`}>
                    <Icon name={l.icon} size={17} className={active ? "text-[#9cc3ee]" : "text-white/50"} />
                    <span className="flex-1">{l.label}</span>
                    {!!l.badge && <span className="rounded-full bg-[#C8102E] px-1.5 text-[10px] font-bold leading-4 text-white">{l.badge}</span>}
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
      <button type="button" onClick={() => setOpen(true)} className="rounded-md p-2 text-ink hover:bg-surface" aria-label="Open menu"><Icon name="menu" size={20} /></button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 overflow-y-auto bg-navy p-4">
            <button type="button" onClick={() => setOpen(false)} className="mb-4 text-sm text-white/70">Close ✕</button>
            <Links sections={sections} onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
