"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ sections }: { sections: { title: string; links: { href: string; label: string }[] }[] }) {
  const path = usePathname();
  return (
    <nav className="space-y-5 text-sm" aria-label="Dashboard">
      {sections.map((s) => (
        <div key={s.title}>
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{s.title}</div>
          <ul className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">
            {s.links.map((l) => {
              const active = path === l.href || (l.href !== "/admin" && l.href !== "/account" && path.startsWith(l.href + "/"));
              return (
                <li key={l.href}>
                  <Link href={l.href} className={`block rounded px-2 py-1.5 ${active ? "bg-brand-light font-medium text-brand" : "text-ink hover:bg-surface"}`}>{l.label}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
