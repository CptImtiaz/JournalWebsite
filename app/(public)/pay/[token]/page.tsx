import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { money, stripeEnabled, createCheckout, confirmCheckout } from "@/lib/production";
import { Flash, SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, formatDate, formatDateTime } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

async function pay(fd: FormData) {
  "use server";
  const token = str(fd, "token");
  const inv = await db.invoice.findFirst({ where: { token } });
  if (!inv || inv.status !== "PENDING") back(`/pay/${token}`, { error: "This invoice cannot be paid online." });
  let url: string;
  try { url = await createCheckout(inv.id); } catch (e) { back(`/pay/${token}`, { error: `Online payment is unavailable: ${(e as Error).message}` }); }
  redirect(url);
}

export default async function Pay({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ session_id?: string; cancelled?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  if (sp.session_id) await confirmCheckout(token, sp.session_id).catch(() => null);
  const inv = await db.invoice.findFirst({ where: { token } });
  if (!inv) notFound();
  const [a, j] = await Promise.all([db.article.findUnique({ where: { id: inv.articleId }, include: { manuscript: true } }), getJournal()]);
  const paid = inv.status === "PAID", waived = inv.status === "WAIVED";
  return (
    <div className="bg-[#F4F5F7]">
      <div className="container-x max-w-3xl py-10">
        <Suspense><Flash /></Suspense>
        {sp.cancelled && !paid && <div className="mb-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm">Payment was cancelled. You can try again below.</div>}
        <section className="border border-line bg-white">
          <div className={`flex flex-wrap items-start justify-between gap-4 border-b border-line border-t-4 px-6 py-5 ${paid ? "border-t-navy" : waived ? "border-t-brand" : "border-t-gold"}`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{j.name}</p>
              <h1 className="mt-1 font-display text-[26px] font-semibold">{paid ? "Receipt" : "Invoice"} {inv.number}</h1>
            </div>
            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide ${paid ? "bg-[#EEF1F6] text-navy" : waived ? "bg-brand-light text-brand" : "bg-amber-50 text-amber-800"}`}>{paid ? "Paid" : waived ? "Waived" : inv.status === "CANCELLED" ? "Cancelled" : "Payment due"}</span>
          </div>
          <dl className="grid gap-px bg-line sm:grid-cols-2">
            <div className="bg-white px-6 py-3"><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Billed to</dt><dd className="mt-0.5">{inv.payerName}<div className="text-sm text-muted">{inv.email}</div></dd></div>
            <div className="bg-white px-6 py-3"><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Issued</dt><dd className="mt-0.5">{formatDate(inv.createdAt)}{inv.paidAt && <div className="text-sm text-muted">Paid {formatDateTime(inv.paidAt)}</div>}</dd></div>
          </dl>
          <table className="table border-t border-line">
            <thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              <tr><td>Article processing charge<div className="text-xs text-muted">{a?.manuscript?.code ? `${a.manuscript.code} · ` : ""}{a?.title}</div></td><td className="text-right tabular-nums">{money(inv.amount, inv.currency)}</td></tr>
              <tr><td className="font-semibold">Total</td><td className="text-right font-display text-xl font-semibold tabular-nums">{waived ? money(0, inv.currency) : money(inv.amount, inv.currency)}</td></tr>
            </tbody>
          </table>
          {inv.status === "PENDING" && (
            <div className="grid gap-6 border-t border-line p-6 md:grid-cols-2">
              <div>
                <h2 className="font-semibold">Pay by card</h2>
                {stripeEnabled() ? (
                  <form action={pay} className="mt-3"><input type="hidden" name="token" value={token} /><SubmitButton className="btn-accent w-full py-3 text-base">Pay {money(inv.amount, inv.currency)} securely</SubmitButton><p className="mt-2 text-xs text-muted">Payments are processed by Stripe. We never see your card details.</p></form>
                ) : <p className="mt-2 text-sm text-muted">Online card payment will be available soon. Please use bank transfer for now.</p>}
              </div>
              <div>
                <h2 className="font-semibold">Pay by bank transfer</h2>
                {j.paymentInstructions ? <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(j.paymentInstructions) }} /> : <p className="mt-2 text-sm text-muted">Please contact the editorial office{j.contactEmail ? ` at ${j.contactEmail}` : ""} for bank details.</p>}
                <p className="mt-2 text-xs text-muted">Quote <strong>{inv.number}</strong> as the payment reference.</p>
              </div>
            </div>
          )}
          {paid && <p className="border-t border-line px-6 py-4 text-sm text-navy">Thank you. Your payment was received and your article will be published shortly.</p>}
        </section>
      </div>
    </div>
  );
}
