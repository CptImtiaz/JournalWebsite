import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { SubmitButton } from "@/components/client";
import { StatusPill, Bar } from "@/components/submission-ui";
import { STEPS, stepComplete, type Draft, type DraftData } from "@/lib/submission";
import { formatDate } from "@/lib/utils";
import { money } from "@/lib/production";
import { startSubmission, deleteDraft } from "./actions";

export default async function SubmissionHome() {
  const u = await requireUser("/submission");
  const [drafts, manuscripts, j] = await Promise.all([
    db.submissionDraft.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" } }),
    db.manuscript.findMany({ where: { submitterId: u.id }, orderBy: { updatedAt: "desc" }, take: 10, include: { article: { select: { id: true, proofStatus: true, proofToken: true } } } }),
    getJournal(),
  ]);
  const invoices = await db.invoice.findMany({ where: { articleId: { in: manuscripts.map((m) => m.article?.id).filter(Boolean) as string[] } } });
  const inv = new Map(invoices.map((i) => [i.articleId, i]));
  const tasks = manuscripts.flatMap((m) => {
    const out: { key: string; m: typeof m; label: string; detail: string; href: string; cta: string }[] = [];
    if (m.status === "REVISION_REQUIRED") out.push({ key: m.id + "r", m, label: "Revision requested", detail: m.revisionDueAt ? `Due ${formatDate(m.revisionDueAt)}` : "Upload your revised manuscript", href: `/submission/revise/${m.id}`, cta: "Submit revision" });
    if (m.article?.proofStatus === "SENT" && m.article.proofToken) out.push({ key: m.id + "p", m, label: "Proofs ready", detail: "Approve or request corrections", href: `/proof/${m.article.proofToken}`, cta: "Check proofs" });
    const i = m.article ? inv.get(m.article.id) : undefined;
    if (i?.status === "PENDING") out.push({ key: m.id + "i", m, label: "Article processing charge", detail: `${money(i.amount, i.currency)}, invoice ${i.number}`, href: `/pay/${i.token}`, cta: "Pay invoice" });
    return out;
  });

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-10">
        <section>
          <h1 className="font-display text-[34px] font-semibold leading-tight text-ink sm:text-[40px]">Submit to {j.name}</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink/75">Submission has six steps and takes about 15 minutes. Your progress is saved after each step.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <form action={startSubmission}><SubmitButton className="btn-primary px-6 py-3 text-[15px]">Start a new submission</SubmitButton></form>
            <a href="/templates/IJCST-manuscript-template.docx" className="text-sm font-medium text-link hover:underline">Download the Word template</a>
          </div>
        </section>

        {tasks.length > 0 && (
          <section>
            <h2 className="border-b-2 border-ink pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">Action required</h2>
            <ul className="divide-y divide-[#E6E8EB]">
              {tasks.map((t) => (
                <li key={t.key} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                  <div className="min-w-0 flex-1 basis-72">
                    <div className="text-sm font-semibold text-[#7A5A12]">{t.label}</div>
                    <div className="mt-0.5 truncate text-[15px] text-ink">{t.m.title}</div>
                    <div className="mt-0.5 text-xs text-ink/60">{t.m.code} · {t.detail}</div>
                  </div>
                  <Link href={t.href} className="btn-primary px-4">{t.cta}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {drafts.length > 0 && (
          <section>
            <h2 className="border-b-2 border-ink pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">Incomplete submissions</h2>
            <ul className="divide-y divide-[#E6E8EB]">
              {drafts.map((d) => {
                const x = d.data as DraftData;
                const dd = { ...d, data: x, files: {} } as unknown as Draft;
                const n = STEPS.filter((s) => s.n < 6 && stepComplete(dd, s.n)).length;
                const next = STEPS.find((s) => s.n < 6 && !stepComplete(dd, s.n))?.n ?? 6;
                return (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
                    <div className="min-w-0 flex-1 basis-72">
                      <div className="truncate text-[15px] font-medium">{x.title || "Untitled manuscript"}</div>
                      <div className="mt-0.5 text-xs text-ink/60">{x.articleType ?? "Article type not chosen"} · last saved {formatDate(d.updatedAt)} · {n} of 5 sections complete</div>
                      <div className="mt-2 max-w-xs"><Bar pct={(n / 5) * 100} /></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <form action={deleteDraft}><input type="hidden" name="id" value={d.id} /><SubmitButton className="text-sm text-ink/60 hover:text-ink hover:underline" confirm="Delete this unfinished submission and its files?">Delete</SubmitButton></form>
                      <Link href={`/submission/${d.id}?step=${next}`} className="btn-secondary px-4">Continue</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between border-b-2 border-ink pb-2"><h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">Your manuscripts</h2>{manuscripts.length > 0 && <Link href="/author/dashboard" className="text-sm text-link hover:underline">View all</Link>}</div>
          {manuscripts.length ? (
            <ul className="divide-y divide-[#E6E8EB]">
              {manuscripts.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                  <div className="min-w-0 flex-1 basis-72">
                    <Link href={`/author/manuscripts/${m.id}`} className="text-[15px] font-medium text-ink hover:text-link hover:underline">{m.title}</Link>
                    <div className="mt-0.5 text-xs text-ink/60">{m.code} · submitted {formatDate(m.submittedAt)}</div>
                  </div>
                  <StatusPill status={m.status} />
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-sm text-ink/60">You have not submitted a manuscript yet.</p>}
        </section>
      </div>

      <aside className="space-y-8 text-sm">
        <section>
          <h2 className="border-b border-ink/80 pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">Before you start</h2>
          <ul className="mt-3 space-y-3 leading-relaxed text-ink/80">
            <li>Your manuscript as DOCX or PDF, with author names removed for anonymous review</li>
            <li>An abstract of 150 to 300 words and 4 to 8 keywords</li>
            <li>Names, emails and affiliations of every author</li>
            <li>Statements on funding, competing interests and ethics</li>
          </ul>
        </section>
        <section>
          <h2 className="border-b border-ink/80 pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">The six steps</h2>
          <ol className="mt-3 space-y-2 text-ink/80">{STEPS.map((s) => <li key={s.n}><span className="mr-2 tabular-nums text-ink/50">{s.n}.</span>{s.title}</li>)}</ol>
        </section>
        <section>
          <h2 className="border-b border-ink/80 pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">Fees</h2>
          <p className="mt-3 leading-relaxed text-ink/80">{j.apcAmount > 0 ? <>An article processing charge of {money(j.apcAmount * 100, j.apcCurrency)} is payable only after acceptance. Waivers are available on request.</> : "There is no charge to publish."} <Link href="/publication-fees" target="_blank" className="link">Fee policy</Link></p>
        </section>
        <section>
          <h2 className="border-b border-ink/80 pb-2 text-[13px] font-bold uppercase tracking-[0.1em]">Help</h2>
          <p className="mt-3 leading-relaxed text-ink/80">Read the <Link href="/for-authors" target="_blank" className="link">guide for authors</Link> or <Link href="/contact" className="link">contact the editorial office</Link>.</p>
        </section>
      </aside>
    </div>
  );
}
