import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Stat, StatStrip, Card, StatusBadge, Empty } from "@/components/ui";
import { ColumnChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { formatDateTime, formatDate } from "@/lib/utils";
import { smtpConfigured } from "@/lib/email";
import { crossrefConfigured } from "@/lib/crossref";
import { getJournal } from "@/lib/journal";
import { submissionsByMonth } from "@/lib/stats";
import { sampleCounts } from "@/lib/sample-content";
import { SubmitButton } from "@/components/client";
import { loadSampleAction, removeSampleAction } from "./sample/actions";
import { MANUSCRIPT_STATUSES } from "@/lib/constants";

export default async function AdminDashboard() {
  const u = await requirePermission("admin.access");
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [total, fresh, review, awaiting, accepted, rejected, published, authors, reviewers, board, recentM, logs, failedEmails, j, monthly, byStatus, views] = await Promise.all([
    db.manuscript.count(),
    db.manuscript.count({ where: { submittedAt: { gte: weekAgo } } }),
    db.manuscript.count({ where: { status: "UNDER_REVIEW" } }),
    db.manuscript.count({ where: { OR: [{ status: "REVISED_SUBMITTED" }, { status: "UNDER_REVIEW", assignments: { some: { status: "COMPLETED" }, none: { status: { in: ["INVITED", "ACCEPTED"] } } } }] } }),
    db.manuscript.count({ where: { status: { in: ["ACCEPTED", "IN_PRODUCTION", "PUBLISHED"] } } }),
    db.manuscript.count({ where: { status: "REJECTED" } }),
    db.article.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { roles: { some: { role: { key: "AUTHOR" } } } } }),
    db.user.count({ where: { roles: { some: { role: { key: "REVIEWER" } } } } }),
    db.editorialBoardMember.count({ where: { isPublished: true } }),
    db.manuscript.findMany({ orderBy: { submittedAt: "desc" }, take: 6, include: { submitter: { select: { fullName: true } } } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { fullName: true } } } }),
    db.emailNotification.count({ where: { status: "FAILED" } }),
    getJournal(),
    submissionsByMonth(12),
    db.manuscript.groupBy({ by: ["status"], _count: true }),
    db.article.aggregate({ _sum: { views: true, downloads: true } }),
  ]);
  const samples = await sampleCounts();
  const decided = accepted + rejected;
  const checks = [
    { ok: smtpConfigured(), label: "Email delivery (SMTP)", fix: "Set SMTP environment variables." },
    { ok: !!process.env.BLOB_READ_WRITE_TOKEN, label: "Secure file storage", fix: "Connect a private Vercel Blob store." },
    { ok: crossrefConfigured(), label: "Crossref DOI deposits", fix: "Add Crossref credentials after membership." },
    { ok: !!(j.eIssn || j.printIssn), label: "ISSN recorded", fix: "Enter the officially assigned ISSN in settings." },
    { ok: !!j.contactEmail, label: "Contact email", fix: "Add an editorial contact email in settings." },
    { ok: board > 0, label: "Editorial board published", fix: "Add confirmed board members." },
  ];
  const ready = checks.filter((c) => c.ok).length;
  const pipeline = (["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW", "REVISION_REQUIRED", "REVISED_SUBMITTED", "ACCEPTED", "IN_PRODUCTION"] as const).map((s) => ({ s, n: byStatus.find((x) => x.status === s)?._count ?? 0 }));
  const pmax = Math.max(1, ...pipeline.map((p) => p.n));

  return (
    <>
      <PTitle title="Dashboard" subtitle={`${j.name} · administration`} actions={<><Link href="/admin/articles/new" className="btn-secondary"><Icon name="plus" size={16} />New article</Link><Link href="/editor/manuscripts" className="btn-primary">Open manuscripts</Link></>} />

      <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 border p-4 ${samples.articles ? "border-amber-300 border-l-4 border-l-amber-500 bg-amber-50" : "border-line bg-white"}`}>
        <div className="flex items-start gap-3">
          <div className="text-sm">
            <div className="font-semibold">{samples.articles ? `Sample content is showing on the website (${samples.articles} articles, ${samples.issues} issue, ${samples.announcements} announcements)` : "Sample content"}</div>
            <div className="text-muted">{samples.articles ? "Sample items are labelled “Sample” and hidden from search engines. Remove them before launch or before applying to indexing services." : "Load demonstration articles, an issue and announcements to preview the website with content. Removable in one click."}</div>
          </div>
        </div>
        {samples.articles ? (
          <form action={removeSampleAction}><SubmitButton className="btn-danger" confirm="Remove all sample articles, the sample issue and sample announcements?">Remove sample content</SubmitButton></form>
        ) : (
          <form action={loadSampleAction}><SubmitButton className="btn-primary">Load sample content</SubmitButton></form>
        )}
      </div>

      <StatStrip cols={4}>
        <Stat label="Total submissions" value={total} hint={`${fresh} in the last 7 days`} href="/editor/manuscripts" />
        <Stat label="Under review" value={review} hint={`${awaiting} awaiting a decision`} href="/editor/manuscripts?status=UNDER_REVIEW" />
        <Stat label="Accepted" value={accepted} hint={decided ? `${Math.round((accepted / decided) * 100)}% acceptance, ${rejected} rejected` : `${rejected} rejected`} href="/editor/manuscripts?status=ACCEPTED" />
        <Stat label="Published articles" value={published} hint={`${(views._sum.views ?? 0).toLocaleString()} views, ${(views._sum.downloads ?? 0).toLocaleString()} downloads`} href="/admin/articles" />
      </StatStrip>
      <div className="mt-px"><StatStrip cols={4}>
        <Stat label="Registered authors" value={authors} href="/admin/users?role=AUTHOR" />
        <Stat label="Registered reviewers" value={reviewers} href="/admin/users?role=REVIEWER" />
        <Stat label="Board members" value={board} href="/admin/board" />
        <Stat label="New this week" value={fresh} href="/editor/manuscripts?status=SUBMITTED" />
      </StatStrip></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Submissions per month" subtitle="Last 12 months">
          <ColumnChart data={monthly} />
        </Card>
        <Card title="Editorial pipeline" subtitle="Manuscripts currently at each stage">
          <ul className="space-y-2.5">
            {pipeline.map((p) => (
              <li key={p.s}>
                <Link href={`/editor/manuscripts?status=${p.s}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
                  <span className="truncate text-ink group-hover:text-brand">{MANUSCRIPT_STATUSES[p.s]}</span>
                  <span className="font-semibold tabular-nums">{p.n}</span>
                  <span className="col-span-2 mt-1 h-1 overflow-hidden bg-app"><span className="block h-full bg-navy" style={{ width: `${(p.n / pmax) * 100}%` }} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Recent submissions" actions={<Link className="text-sm font-medium text-brand hover:underline" href="/editor/manuscripts">View all</Link>} flush>
          {recentM.length === 0 ? <div className="p-5"><Empty title="No submissions yet" /></div> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Manuscript</th><th>Author</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>{recentM.map((m) => (
                  <tr key={m.id}>
                    <td className="min-w-64"><Link className="font-medium text-ink hover:text-brand" href={`/editor/manuscripts/${m.id}`}>{m.title.length > 70 ? m.title.slice(0, 70) + "…" : m.title}</Link><div className="font-mono text-[11px] text-muted">{m.code}</div></td>
                    <td className="whitespace-nowrap">{m.submitter.fullName}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(m.submittedAt)}</td>
                    <td><StatusBadge status={m.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Launch readiness" subtitle={`${ready} of ${checks.length} complete`}>
          <div className="mb-4 h-1.5 overflow-hidden bg-app"><div className="h-full bg-emerald-600" style={{ width: `${(ready / checks.length) * 100}%` }} /></div>
          <ul className="space-y-3 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex gap-3">
                <span className={`mt-0.5 w-12 shrink-0 text-[11px] font-bold uppercase ${c.ok ? "text-emerald-700" : "text-amber-700"}`}>{c.ok ? "Done" : "To do"}</span>
                <span><span className="font-medium">{c.label}</span>{!c.ok && <span className="block text-xs text-muted">{c.fix}</span>}</span>
              </li>
            ))}
            {failedEmails > 0 && <li className="flex gap-3"><span className="mt-0.5 w-12 shrink-0 text-[11px] font-bold uppercase text-red-700">Alert</span><Link className="link" href="/admin/email?status=FAILED">{failedEmails} failed email(s)</Link></li>}
          </ul>
        </Card>
      </div>

      <Card title="Recent activity" className="mt-6" actions={<Link className="text-sm font-medium text-brand hover:underline" href="/admin/audit">Audit log</Link>}>
        <ol className="relative space-y-4 border-l border-line pl-6">
          {logs.map((l) => (
            <li key={l.id} className="relative">
              <span className="absolute -left-[28px] top-1.5 h-2 w-2 bg-navy" />
              <div className="text-sm"><span className="font-medium">{l.actor?.fullName ?? "System"}</span> <span className="text-muted">None</span> <span className="font-mono text-xs">{l.action}</span> {l.entityType && <span className="text-muted">({l.entityType})</span>}</div>
              <div className="text-xs text-muted">{formatDateTime(l.createdAt)}</div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
