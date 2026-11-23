import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { StatusBadge, Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function AuthorDashboard() {
  const u = await requireUser();
  const ms = await db.manuscript.findMany({ where: { submitterId: u.id }, orderBy: { submittedAt: "desc" }, include: { article: { select: { slug: true, status: true } } } });
  return (
    <>
      <PTitle title="My submissions" subtitle="Track the status of your manuscripts." actions={<Link href="/author/submit" className="btn-primary">Submit new manuscript</Link>} />
      {ms.length === 0 ? (
        <Empty title="You have not submitted any manuscripts yet"><Link className="link" href="/author/submit">Start a new submission</Link></Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Manuscript ID</th><th>Title</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{m.code}</td>
                  <td className="min-w-64"><Link href={`/author/manuscripts/${m.id}`} className="font-medium text-navy hover:text-brand">{m.title}</Link><div className="text-xs text-muted">{m.articleType}</div></td>
                  <td className="whitespace-nowrap">{formatDate(m.submittedAt)}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/author/manuscripts/${m.id}`} className="btn-secondary btn-sm">Details</Link>
                    {m.article?.status === "PUBLISHED" && <Link href={`/article/${m.article.slug}`} className="btn-ghost btn-sm">View article</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
