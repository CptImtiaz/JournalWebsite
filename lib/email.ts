import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";
import { appUrl, escapeXml } from "./utils";
import { getJournal } from "./journal";

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

export function smtpConfigured() {
  return !!process.env.SMTP_HOST;
}

function fill(tpl: string, vars: Record<string, string>, html: boolean) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k] ?? "";
    // values ending in "_html" or "url" are trusted/raw; everything else is escaped in HTML context
    return html && !k.endsWith("_html") ? escapeXml(v).replace(/\n/g, "<br>") : v;
  });
}

function wrap(body: string, journalName: string) {
  return `<!doctype html><html><body style="margin:0;background:#F5F7FA;font-family:Inter,Arial,sans-serif;color:#202B38">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:8px">
<tr><td style="background:#142D4E;color:#fff;padding:18px 24px;font-size:16px;font-weight:600;border-radius:8px 8px 0 0">${escapeXml(journalName)}</td></tr>
<tr><td style="padding:24px;font-size:14px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #E5E7EB;font-size:12px;color:#6B7280">This is an automated message from the ${escapeXml(journalName)} editorial system. <a href="${appUrl()}" style="color:#2864A5">${appUrl()}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export async function deliver(id: string) {
  const n = await db.emailNotification.findUnique({ where: { id } });
  if (!n) return;
  const t = transport();
  if (!t) {
    await db.emailNotification.update({ where: { id }, data: { status: "LOGGED", error: "SMTP not configured — message recorded but not sent.", attempts: { increment: 1 } } });
    return;
  }
  const j = await getJournal();
  const fromName = j.emailSenderName || j.name;
  const fromAddr = j.emailSenderAddress || process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost";
  try {
    await t.sendMail({ from: `"${fromName.replace(/"/g, "")}" <${fromAddr}>`, to: n.toEmail, subject: n.subject, html: n.bodyHtml });
    await db.emailNotification.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), error: null, attempts: { increment: 1 } } });
  } catch (e) {
    await db.emailNotification.update({ where: { id }, data: { status: "FAILED", error: String((e as Error).message).slice(0, 1000), attempts: { increment: 1 } } });
  }
}

/** Render a stored template and send it (or log it if SMTP is not configured). */
export async function sendTemplate(key: string, to: string | string[], vars: Record<string, string>) {
  const j = await getJournal();
  const tpl = await db.emailTemplate.findUnique({ where: { key } });
  if (tpl && !tpl.isActive) return;
  const all = { journal_name: j.name, site_url: appUrl(), ...vars };
  const subject = fill(tpl?.subject ?? key, all, false);
  const body = wrap(fill(tpl?.bodyHtml ?? `<p>${key}</p>`, all, true), j.name);
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  for (const r of recipients) {
    const n = await db.emailNotification.create({ data: { templateKey: key, toEmail: r, subject, bodyHtml: body } });
    await deliver(n.id);
  }
}

export async function editorialOfficeEmails() {
  const j = await getJournal();
  if (j.editorialOfficeEmail) return [j.editorialOfficeEmail];
  const users = await db.user.findMany({
    where: { isActive: true, roles: { some: { role: { key: { in: ["EDITOR_IN_CHIEF", "MANAGING_EDITOR"] } } } } },
    select: { email: true },
  });
  return users.map((u) => u.email);
}
