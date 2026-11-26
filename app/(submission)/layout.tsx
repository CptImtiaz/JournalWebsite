import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getJournal } from "@/lib/journal";
import { Flash } from "@/components/client";

export const metadata = { title: "Manuscript submission", robots: { index: false, follow: false } };

export default async function SubmissionLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser("/submission");
  const j = await getJournal();
  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-wide">{j.shortName}</span>
            <span className="hidden border-l border-white/30 pl-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:inline">Manuscript submission</span>
          </Link>
          <nav className="ml-auto flex items-center gap-5 text-[13px] text-white/80">
            <Link href="/for-authors" target="_blank" className="hover:text-white">Author guidelines</Link>
            <Link href="/author/dashboard" className="hover:text-white">My submissions</Link>
            <span className="hidden text-white/60 md:inline">{u.fullName}</span>
          </nav>
        </div>
      </header>
      <div className="h-1 bg-gold" />
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
        <Suspense><Flash /></Suspense>
        {children}
      </main>
      <footer className="border-t border-line bg-white py-5 text-center text-xs text-muted">{j.name} · Questions about your submission? <Link href="/contact" className="link">Contact the editorial office</Link></footer>
    </div>
  );
}
