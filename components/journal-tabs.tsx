"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function JournalTabs({ tabs }: { tabs: { label: string; href: string }[] }) {
  const path = usePathname();
  return (
    <nav className="hidden border-b border-line bg-white lg:block" aria-label="Journal">
      <div className="container-x flex items-stretch gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.href === "/" ? path === "/" : path === t.href || path.startsWith(t.href + "/") || (t.href === "/articles" && path.startsWith("/article/")) || (t.href === "/archives" && path === "/current-issue");
          return <Link key={t.href} href={t.href} className={`tab-link ${active ? "border-navy font-semibold text-navy" : ""}`}>{t.label}</Link>;
        })}
      </div>
    </nav>
  );
}
