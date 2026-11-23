import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { StatusBadge, Stat } from "@/components/ui";
import { StageBar } from "@/components/progress";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

const ACTIVE = ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW", "REVISION_REQUIRED", "REVISED_SUBMITTED"];

export default async function AuthorDashboard() {
  const u = await requireUser();
  const ms = await db.manuscript.findMany({ where: { submitterId: u.id }, orderBy: { updatedAt: "desc" }, include: { article: { select: { slug: true, status: true } }, category: { select: { name: true } }, authors: { select: { fullName: true }, orderBy: { order: "asc" } } } });
  const action = ms.filter((m) => m.status === "REVISION_REQUIRED");
  const active = ms.filter((m) => ACTIVE.includes(m.status));
  const done = ms.filter((m) => !ACTIVE.includes(m.status));
  return (
    <>
      <PTitle title="My submissions" subtitle="Track every manuscript from submission to publication." actions={<Link href="/author/submit" className="btn-primary"><Icon name="plus" size={16} />Start new submission</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="file" label="Total submissions" value={ms.length} />
        <Stat icon="clock" tone="blue" label="In progress" value={active.length} />
        <Stat icon="alert" tone="amber" label="Action required" value={action.length} />
        <Stat icon="book" tone="green" label="Published" value={ms.filter((m) => m.status === "PUBLISHED").length} />
      </div>

      {action.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-900"><Icon name="alert" size={18} />Revision requested</div>
          <ul className="mt-2 space-y-1 text-sm">{action.map((m) => <li key={m.id}><Link className="font-medium text-amber-900 underline" href={`/author/manuscripts/${m.id}`}>{m.code} — {m.title}</Link></li>)}</ul>
        </div>
      )}

      {ms.length === 0 ? (
        <div className="app-card mt-6 grid place-items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand"><Icon name="upload" size={26} /></span>
          <h2 className="mt-4 font-display text-2xl font-semibold">Submit your first manuscript</h2>
          <p className="mt-2 max-w-md text-sm text-muted">The guided submission takes about 15 minutes. Have your anonymised manuscript file, author details and declarations ready.</p>
          <div className="mt-5 flex gap-2"><Link href="/author/submit" className="btn-primary">Start submission</Link><Link href="/for-authors" className="btn-secondary">Read guidelines</Link></div>
        </div>
      ) : (
        <>
          {[{ t: "In progress", list: active }, { t: "Completed", list: done }].filter((g) => g.list.length).map((g) => (
            <section key={g.t} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{g.t} ({g.list.length})</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {g.list.map((m) => (
                  <Link key={m.id} href={`/author/manuscripts/${m.id}`} className="app-card group block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-xs text-muted">{m.code}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink group-hover:text-brand">{m.title}</h3>
                    <p className="mt-1 text-xs text-muted">{m.articleType} · {m.category?.name} · {m.authors.length} author{m.authors.length === 1 ? "" : "s"}</p>
                    <div className="mt-4"><StageBar status={m.status} /></div>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                      <span>Submitted {formatDate(m.submittedAt)} · updated {formatDate(m.updatedAt)}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-brand">{m.status === "REVISION_REQUIRED" ? "Submit revision" : m.article?.status === "PUBLISHED" ? "View article" : "View details"} <Icon name="arrowRight" size={13} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
