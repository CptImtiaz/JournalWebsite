import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, Badge, TextField, Pagination } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { smtpConfigured, deliver, sendTemplate } from "@/lib/email";
import { getJournal } from "@/lib/journal";
import { back } from "@/lib/actions-util";
import { str, formatDateTime } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function retry(fd: FormData) {
  "use server";
  const u = await requirePermission("email.manage");
  const id = str(fd, "id");
  if (id === "all") {
    const failed = await db.emailNotification.findMany({ where: { status: { in: ["FAILED", "LOGGED"] } }, take: 50 });
    for (const f of failed) await deliver(f.id);
  } else await deliver(id);
  await audit(u.id, "email.retry", "EmailNotification", id);
  back("/admin/email", { ok: "Retry attempted." });
}
async function test(fd: FormData) {
  "use server";
  const u = await requirePermission("email.manage");
  const to = str(fd, "to");
  await sendTemplate("status_changed", to, { name: u.fullName, title: "Test message", manuscript_id: "TEST", status: "Email delivery test", url: "" });
  back("/admin/email", { ok: `Test email queued to ${to}. Check the log below.` });
}

export default async function EmailAdmin({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const u = await requirePermission("email.manage");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = sp.status ? { status: sp.status } : {};
  const [j, tpls, total, logs, counts] = await Promise.all([
    getJournal(),
    db.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    db.emailNotification.count({ where }),
    db.emailNotification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 30 }),
    db.emailNotification.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <>
      <PTitle title="Email notifications" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Delivery configuration">
          <ul className="space-y-1 text-sm">
            <li>SMTP: {smtpConfigured() ? <Badge tone="green">configured ({process.env.SMTP_HOST})</Badge> : <Badge tone="amber">not configured — messages are logged only</Badge>}</li>
            <li>Sender name: <strong>{j.emailSenderName || j.name}</strong></li>
            <li>Sender email: <strong>{j.emailSenderAddress || process.env.SMTP_FROM || "—"}</strong> <Link className="link ml-1" href="/admin/settings#email">edit</Link></li>
            <li>Editorial office: {j.editorialOfficeEmail || "Editors-in-Chief & Managing Editors"}</li>
            <li>Review reminders: daily scheduled job (3 days before and after due date)</li>
          </ul>
          <form action={test} className="mt-4 flex items-end gap-2"><div className="flex-1"><TextField label="Send test email to" name="to" type="email" defaultValue={u.email} required /></div><SubmitButton className="btn-secondary">Send test</SubmitButton></form>
        </Card>
        <Card title="Templates">
          <ul className="divide-y divide-line text-sm">{tpls.map((t) => <li key={t.id} className="flex justify-between py-1.5"><Link className="link" href={`/admin/email/templates/${t.id}`}>{t.name}</Link>{!t.isActive && <Badge>disabled</Badge>}</li>)}</ul>
        </Card>
      </div>
      <Card title="Delivery log" className="mt-6" actions={<form action={retry}><input type="hidden" name="id" value="all" /><SubmitButton className="btn-secondary btn-sm">Retry failed/logged</SubmitButton></form>}>
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <Link className="link" href="/admin/email">All</Link>
          {counts.map((c) => <Link key={c.status} className="link" href={`/admin/email?status=${c.status}`}>{c.status.toLowerCase()} ({c._count})</Link>)}
        </div>
        <div className="overflow-x-auto">
          <table className="table"><thead><tr><th>Time</th><th>To</th><th>Subject</th><th>Status</th><th></th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="text-xs">{l.toEmail}</td>
                <td className="text-xs">{l.subject}{l.error && <div className="text-red-700">{l.error}</div>}</td>
                <td><Badge tone={l.status === "SENT" ? "green" : l.status === "FAILED" ? "red" : "amber"}>{l.status.toLowerCase()}</Badge></td>
                <td>{l.status !== "SENT" && <form action={retry}><input type="hidden" name="id" value={l.id} /><SubmitButton className="btn-secondary btn-sm">Retry</SubmitButton></form>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Pagination page={page} pages={Math.ceil(total / 30)} makeHref={(p) => `/admin/email?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), page: String(p) })}`} />
      </Card>
    </>
  );
}
