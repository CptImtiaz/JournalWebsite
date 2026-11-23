import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Stat, Card, StatusBadge } from "@/components/ui";
import { formatDateTime, formatDate } from "@/lib/utils";
import { smtpConfigured } from "@/lib/email";
import { crossrefConfigured } from "@/lib/crossref";
import { getJournal } from "@/lib/journal";

export default async function AdminDashboard() {
  await requirePermission("admin.access");
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [total, fresh, review, awaiting, accepted, rejected, published, authors, reviewers, board, recentM, logs, failedEmails, j] = await Promise.all([
    db.manuscript.count(),
    db.manuscript.count({ where: { submittedAt: { gte: weekAgo } } }),
    db.manuscript.count({ where: { status: "UNDER_REVIEW" } }),
    db.manuscript.count({ where: { status: { in: ["REVISED_SUBMITTED"] } } }).then(async (n) => n + (await db.manuscript.count({ where: { status: "UNDER_REVIEW", assignments: { some: { status: "COMPLETED" }, none: { status: { in: ["INVITED", "ACCEPTED"] } } } } }))),
    db.manuscript.count({ where: { status: { in: ["ACCEPTED", "IN_PRODUCTION", "PUBLISHED"] } } }),
    db.manuscript.count({ where: { status: "REJECTED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { roles: { some: { role: { key: "AUTHOR" } } } } }),
    db.user.count({ where: { roles: { some: { role: { key: "REVIEWER" } } } } }),
    db.editorialBoardMember.count({ where: { isPublished: true } }),
    db.manuscript.findMany({ orderBy: { submittedAt: "desc" }, take: 6 }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { fullName: true } } } }),
    db.emailNotification.count({ where: { status: "FAILED" } }),
    getJournal(),
  ]);
  const checks = [
    { ok: smtpConfigured(), label: "SMTP email delivery", fix: "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD environment variables." },
    { ok: !!process.env.BLOB_READ_WRITE_TOKEN, label: "Secure file storage (Vercel Blob)", fix: "Connect a private Vercel Blob store (BLOB_READ_WRITE_TOKEN)." },
    { ok: crossrefConfigured(), label: "Crossref DOI deposits", fix: "Set CROSSREF_USERNAME / CROSSREF_PASSWORD after Crossref membership." },
    { ok: !!(j.eIssn || j.printIssn), label: "ISSN recorded", fix: "Enter officially assigned ISSN in Journal settings." },
    { ok: !!j.contactEmail, label: "Contact email set", fix: "Add an editorial contact email in Journal settings." },
    { ok: !!process.env.CRON_SECRET, label: "Scheduled reminders secured", fix: "Set CRON_SECRET so the daily reminder job is authenticated." },
  ];
  return (
    <>
      <PTitle title="Administrator dashboard" subtitle={j.name} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total submissions" value={total} href="/editor/manuscripts" />
        <Stat label="New (7 days)" value={fresh} href="/editor/manuscripts?status=SUBMITTED" />
        <Stat label="Under review" value={review} href="/editor/manuscripts?status=UNDER_REVIEW" />
        <Stat label="Awaiting decision" value={awaiting} href="/editor/dashboard" />
        <Stat label="Accepted" value={accepted} href="/editor/manuscripts?status=ACCEPTED" />
        <Stat label="Rejected" value={rejected} href="/editor/manuscripts?status=REJECTED" />
        <Stat label="Published articles" value={published} href="/admin/articles" />
        <Stat label="Registered authors" value={authors} href="/admin/users?role=AUTHOR" />
        <Stat label="Registered reviewers" value={reviewers} href="/admin/users?role=REVIEWER" />
        <Stat label="Active board members" value={board} href="/admin/board" />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card title="System readiness">
          <ul className="space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex gap-2"><span className={c.ok ? "text-emerald-600" : "text-amber-600"}>{c.ok ? "✓" : "!"}</span><span><strong>{c.label}</strong>{!c.ok && <span className="block text-xs text-muted">{c.fix}</span>}</span></li>
            ))}
            {failedEmails > 0 && <li className="flex gap-2"><span className="text-red-600">!</span><Link className="link" href="/admin/email?status=FAILED">{failedEmails} failed email(s)</Link></li>}
          </ul>
        </Card>
        <Card title="Recent submissions">
          <ul className="divide-y divide-line text-sm">{recentM.map((m) => <li key={m.id} className="flex items-center justify-between gap-2 py-2"><Link className="link" href={`/editor/manuscripts/${m.id}`}><span className="font-mono text-xs">{m.code}</span> {m.title.slice(0, 70)}</Link><span className="flex items-center gap-2 text-xs text-muted">{formatDate(m.submittedAt)} <StatusBadge status={m.status} /></span></li>)}</ul>
        </Card>
        <Card title="Recent activity" actions={<Link className="link text-sm" href="/admin/audit">Audit log →</Link>} className="xl:col-span-2">
          <ul className="divide-y divide-line text-sm">{logs.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><span className="font-mono text-xs">{l.action}</span> {l.entityType && <span className="text-muted">on {l.entityType}</span>}</span><span className="text-xs text-muted">{l.actor?.fullName ?? "system"} · {formatDateTime(l.createdAt)}</span></li>)}</ul>
        </Card>
      </div>
    </>
  );
}
