import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getJournal, fileUrl } from "@/lib/journal";
import { Flash } from "@/components/client";
import { Logo } from "@/components/site";

export const metadata = { title: "Manuscript submission", robots: { index: false, follow: false } };

export default async function SubmissionLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser("/submission");
  const j = await getJournal();
  return (
    <div className="sx min-h-screen bg-[#F6F6F6]">
      <header className="border-b border-[#DDE0E4] bg-white">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={32} logoUrl={fileUrl(j.logoFileId)} />
            <span className="font-display text-[18px] font-bold text-ink">{j.shortName}</span>
          </Link>
          <span className="hidden h-6 border-l border-[#DDE0E4] sm:block" />
          <span className="hidden text-sm text-ink/70 sm:block">Manuscript submission</span>
          <nav className="ml-auto flex items-center gap-6 text-sm">
            <Link href="/submission" className="hidden text-ink/80 hover:text-ink hover:underline sm:inline">Submissions</Link>
            <Link href="/author/dashboard" className="hidden text-ink/80 hover:text-ink hover:underline sm:inline">Author dashboard</Link>
            <Link href="/for-authors" target="_blank" className="hidden text-ink/80 hover:text-ink hover:underline md:inline">Guide for authors</Link>
            <span className="text-ink/60">{u.fullName}</span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
        <Suspense><Flash /></Suspense>
        {children}
      </main>
      <footer className="border-t border-[#DDE0E4] bg-white py-6 text-center text-xs text-ink/60">
        Your files are shared only with the editors and reviewers handling your manuscript. <Link href="/contact" className="link">Contact the editorial office</Link>
      </footer>
    </div>
  );
}
