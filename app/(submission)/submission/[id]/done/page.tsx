import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ClearDraft } from "@/components/submission-wizard";

const NEXT = [
  ["Confirmation", "We have emailed you a confirmation with your manuscript number."],
  ["Editorial check", "The editorial office checks your files and statements, usually within a few days."],
  ["Peer review", "A handling editor invites independent reviewers. Reviewers do not see author names."],
  ["Decision", "We email you when a decision is made. You can follow progress in your author dashboard."],
];

export default async function Done({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const m = await db.manuscript.findFirst({ where: { id: (await params).id, submitterId: u.id } });
  if (!m) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <ClearDraft />
      <div className="sx-card">
        <div className="border-b border-[#DDE0E4] px-6 py-8 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Submission complete</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight">Thank you for your submission</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-ink/75">{m.title}</p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-[0.1em] text-ink/55">Manuscript number</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{m.code}</dd></div>
            <div><dt className="text-xs uppercase tracking-[0.1em] text-ink/55">Submitted</dt><dd className="mt-1 text-xl">{formatDateTime(m.submittedAt)}</dd></div>
          </dl>
        </div>
        <div className="px-6 py-7 sm:px-10">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">What happens next</h2>
          <ol className="mt-4 divide-y divide-[#E6E8EB]">
            {NEXT.map(([t, s], i) => (
              <li key={t} className="flex gap-4 py-3.5"><span className="w-5 shrink-0 tabular-nums text-ink/45">{i + 1}</span><div><div className="text-sm font-semibold">{t}</div><div className="text-sm text-ink/70">{s}</div></div></li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap items-center gap-5 border-t border-[#DDE0E4] bg-[#FAFAFA] px-6 py-5 sm:px-10">
          <Link href={`/author/manuscripts/${m.id}`} className="btn-primary px-5 py-2.5">Track this manuscript</Link>
          <Link href="/submission" className="text-sm text-link hover:underline">Back to submissions</Link>
        </div>
      </div>
    </div>
  );
}
