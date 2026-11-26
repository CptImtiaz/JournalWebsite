import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ClearDraft } from "@/components/submission-wizard";

export default async function Done({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const m = await db.manuscript.findFirst({ where: { id: (await params).id, submitterId: u.id } });
  if (!m) notFound();
  return (
    <div className="mx-auto max-w-2xl border border-line bg-white">
      <ClearDraft />
      <div className="border-b border-line border-t-4 border-t-emerald-600 px-6 py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Submission received</p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight">Thank you for your submission</h1>
        <p className="mt-2 text-ink/75">{m.title}</p>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-white px-6 py-4"><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Manuscript ID</dt><dd className="mt-1 font-mono text-lg font-semibold">{m.code}</dd></div>
        <div className="bg-white px-6 py-4"><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Submitted</dt><dd className="mt-1 text-lg">{formatDateTime(m.submittedAt)}</dd></div>
      </dl>
      <div className="border-t border-line px-6 py-5 text-sm text-ink/80">
        <h2 className="font-semibold text-ink">What happens next</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>We have emailed you a confirmation with your manuscript ID.</li>
          <li>The editorial office checks your submission for completeness.</li>
          <li>An editor assigns independent reviewers for double anonymous review.</li>
          <li>You can follow every stage from your author dashboard.</li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-line bg-surface px-6 py-4">
        <Link href={`/author/manuscripts/${m.id}`} className="btn-primary">Track this manuscript</Link>
        <Link href="/author/dashboard" className="btn-secondary">My submissions</Link>
      </div>
    </div>
  );
}
