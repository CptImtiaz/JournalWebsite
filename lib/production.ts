import "server-only";
import { db } from "./db";
import { sendTemplate, editorialOfficeEmails } from "./email";
import { appUrl, randomTokenSafe } from "./production-util";
import { audit } from "./audit";

export const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);

/** The person who receives proofs and invoices: the submitting author, else the corresponding author. */
export async function articleContact(articleId: string) {
  const a = await db.article.findUnique({ where: { id: articleId }, include: { manuscript: { include: { submitter: true } }, authors: true } });
  if (!a) return null;
  const corr = a.authors.find((x) => x.isCorresponding && x.email);
  const name = a.manuscript?.submitter.fullName ?? corr?.fullName ?? "Author";
  const email = a.manuscript?.submitter.email ?? corr?.email ?? null;
  return { a, name, email, code: a.manuscript?.code ?? a.slug };
}

export async function sendProofs(articleId: string, actorId: string) {
  const c = await articleContact(articleId);
  if (!c?.a.proofFileId) throw new Error("Upload a proof PDF first.");
  if (!c.email) throw new Error("No author email is available for this article.");
  const token = randomTokenSafe();
  await db.article.update({ where: { id: articleId }, data: { proofStatus: "SENT", proofToken: token, proofRound: { increment: 1 }, proofSentAt: new Date(), proofCorrections: null, proofRespondedAt: null } });
  await sendTemplate("proof_ready", c.email, { name: c.name, title: c.a.title, manuscript_id: c.code, url: `${appUrl()}/proof/${token}` });
  await audit(actorId, "article.proofs_sent", "Article", articleId, { to: c.email });
  return c.email;
}

export async function ensureInvoice(articleId: string) {
  const existing = await db.invoice.findUnique({ where: { articleId } });
  if (existing) return existing;
  const [c, j] = await Promise.all([articleContact(articleId), db.journal.findUnique({ where: { id: "journal" } })]);
  if (!c?.email || !j) return null;
  if (!j.apcAmount) return null;
  const year = new Date().getUTCFullYear();
  const count = await db.invoice.count({ where: { number: { startsWith: `INV-${year}-` } } });
  return db.invoice.create({
    data: { number: `INV-${year}-${String(count + 1).padStart(4, "0")}`, articleId, email: c.email, payerName: c.name, amount: j.apcAmount * 100, currency: j.apcCurrency || "USD" },
  });
}

export async function sendPaymentRequest(articleId: string) {
  const inv = await ensureInvoice(articleId);
  if (!inv || inv.status !== "PENDING") return inv;
  const c = await articleContact(articleId);
  await sendTemplate("payment_request", inv.email, { name: inv.payerName, title: c?.a.title ?? "", invoice_number: inv.number, amount: money(inv.amount, inv.currency), url: `${appUrl()}/pay/${inv.token}` });
  return inv;
}

export async function respondToProof(token: string, approve: boolean, corrections: string) {
  const a = await db.article.findFirst({ where: { proofToken: token }, include: { manuscript: true } });
  if (!a || a.proofStatus !== "SENT") return null;
  await db.article.update({ where: { id: a.id }, data: { proofStatus: approve ? "APPROVED" : "CORRECTIONS", proofCorrections: approve ? (corrections || null) : corrections, proofRespondedAt: new Date() } });
  await audit(null, approve ? "article.proof_approved" : "article.proof_corrections", "Article", a.id);
  await sendTemplate("proof_response", await editorialOfficeEmails(), {
    title: a.title, manuscript_id: a.manuscript?.code ?? a.slug, decision: approve ? "approved" : "corrections requested",
    corrections: corrections || (approve ? "No corrections." : ""), url: `${appUrl()}/admin/articles/${a.id}`,
  });
  if (approve) await sendPaymentRequest(a.id);
  return { approved: approve, articleId: a.id };
}

export async function markInvoicePaid(invoiceId: string, method: string, note?: string) {
  const inv = await db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date(), method, note } });
  const a = await db.article.findUnique({ where: { id: inv.articleId } });
  await sendTemplate("payment_received", inv.email, { name: inv.payerName, title: a?.title ?? "", invoice_number: inv.number, amount: money(inv.amount, inv.currency), url: `${appUrl()}/pay/${inv.token}` });
  await sendTemplate("proof_response", await editorialOfficeEmails(), { title: a?.title ?? "", manuscript_id: inv.number, decision: "payment received", corrections: `${money(inv.amount, inv.currency)} paid by ${method}.`, url: `${appUrl()}/admin/articles/${inv.articleId}` });
  await audit(null, "invoice.paid", "Invoice", inv.id, { method });
  return inv;
}

// ── Stripe Checkout (REST, no SDK). Enabled when STRIPE_SECRET_KEY is set. ──
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

async function stripe(path: string, body?: Record<string, string>) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? new URLSearchParams(body) : undefined,
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message ?? `Stripe error ${r.status}`);
  return j;
}

export async function createCheckout(invoiceId: string) {
  const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const a = await db.article.findUnique({ where: { id: inv.articleId } });
  const s = await stripe("checkout/sessions", {
    mode: "payment",
    customer_email: inv.email,
    client_reference_id: inv.id,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": inv.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(inv.amount),
    "line_items[0][price_data][product_data][name]": `Article processing charge (${inv.number})`,
    "line_items[0][price_data][product_data][description]": (a?.title ?? "").slice(0, 300),
    "metadata[invoice]": inv.number,
    success_url: `${appUrl()}/pay/${inv.token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/pay/${inv.token}?cancelled=1`,
  });
  await db.invoice.update({ where: { id: inv.id }, data: { stripeSessionId: s.id } });
  return s.url as string;
}

/** Verifies a returned Checkout session and marks the invoice paid if Stripe confirms payment. */
export async function confirmCheckout(token: string, sessionId: string) {
  const inv = await db.invoice.findFirst({ where: { token } });
  if (!inv || inv.status !== "PENDING" || inv.stripeSessionId !== sessionId || !stripeEnabled()) return inv;
  const s = await stripe(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (s.payment_status === "paid" && s.client_reference_id === inv.id && s.amount_total === inv.amount) return markInvoicePaid(inv.id, "card (Stripe)", s.payment_intent ?? undefined);
  return inv;
}
