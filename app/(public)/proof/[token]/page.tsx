import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { respondToProof } from "@/lib/production";
import { Flash, SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, bool, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Proof review", robots: { index: false, follow: false } };

async function respond(fd: FormData) {
  "use server";
  const token = str(fd, "token"), op = str(fd, "op"), corrections = str(fd, "corrections").slice(0, 20000);
  const here = `/proof/${token}`;
  if (op === "approve" && !bool(fd, "confirm")) back(here, { error: "Please tick the box to confirm you have checked the whole proof." });
  if (op === "corrections" && !corrections) back(here, { error: "Please list the corrections needed." });
  const r = await respondToProof(token, op === "approve", corrections);
  if (!r) back(here, { error: "This proof has already been answered or the link has expired." });
  back(here, { ok: r.approved ? "Thank you. Your proof is approved. We have emailed you the invoice for the article processing charge." : "Thank you. Your corrections were sent to the production team. You will receive revised proofs." });
}

export default async function Proof({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await db.article.findFirst({ where: { proofToken: token }, include: { manuscript: true } });
  if (!a) notFound();
  const inv = await db.invoice.findUnique({ where: { articleId: a.id } });
  const open = a.proofStatus === "SENT";
  return (
    <div className="bg-[#F4F5F7]">
      <div className="container-x py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Proof review · {a.manuscript?.code ?? ""} · round {a.proofRound}</p>
        <h1 className="mt-1 max-w-4xl font-display text-[28px] font-semibold leading-tight">{a.title}</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="border border-line bg-white">
            <div className="panel-head"><h2 className="panel-title">Proof PDF</h2><a href={`/api/proof/${token}`} target="_blank" className="text-sm font-semibold text-link hover:underline">Open in new tab</a></div>
            <iframe src={`/api/proof/${token}`} title="Article proof" className="h-[78vh] w-full bg-white" />
          </div>
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Suspense><Flash /></Suspense>
            {open ? (
              <>
                <section className="border border-line bg-white">
                  <div className="panel-head"><h2 className="panel-title">Approve the proof</h2></div>
                  <form action={respond} className="space-y-3 p-4 text-sm">
                    <input type="hidden" name="token" value={token} /><input type="hidden" name="op" value="approve" />
                    <p className="text-ink/80">Approve if the proof is correct. Your article then moves to payment and publication.</p>
                    <label className="flex items-start gap-2"><input type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 accent-[#142D4E]" />I have checked the whole proof, including author names, affiliations, figures, tables and references.</label>
                    <SubmitButton className="btn-accent w-full py-2.5" confirm="Approve this proof for publication?">Approve proof</SubmitButton>
                  </form>
                </section>
                <section className="border border-line bg-white">
                  <div className="panel-head"><h2 className="panel-title">Request corrections</h2></div>
                  <form action={respond} className="space-y-3 p-4 text-sm">
                    <input type="hidden" name="token" value={token} /><input type="hidden" name="op" value="corrections" />
                    <p className="text-ink/80">List each correction with its page and line. Only errors can be corrected at this stage.</p>
                    <textarea name="corrections" rows={8} className="input" placeholder={"Page 3, line 12: change “dataset” to “datasets”\nPage 7, Table 2: value 0.91 should be 0.92"} />
                    <SubmitButton className="btn-secondary w-full">Send corrections</SubmitButton>
                  </form>
                </section>
              </>
            ) : (
              <section className="border border-line border-l-4 border-l-navy bg-white p-4 text-sm">
                <h2 className="panel-title mb-2">{a.proofStatus === "APPROVED" ? "Proof approved" : "Corrections sent"}</h2>
                <p className="text-ink/80">{a.proofStatus === "APPROVED" ? `You approved this proof on ${formatDateTime(a.proofRespondedAt)}.` : "The production team is preparing revised proofs. You will receive a new link by email."}</p>
                {a.proofCorrections && <p className="mt-2 whitespace-pre-line text-muted">{a.proofCorrections}</p>}
                {inv && inv.status === "PENDING" && <a href={`/pay/${inv.token}`} className="btn-accent mt-4 w-full">Pay the article processing charge</a>}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
