import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function PagesAdmin() {
  await requirePermission("content.manage");
  const ps = await db.page.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      <PTitle title="Website pages & policies" subtitle="All public text content is editable here. Policies must reflect the journal's actual practice." actions={<Link className="btn-primary" href="/admin/pages/new">New page</Link>} />
      {(["PAGE", "POLICY"] as const).map((k) => (
        <section key={k} className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{k === "PAGE" ? "Pages" : "Policies"}</h2>
          <div className="card overflow-x-auto">
            <table className="table"><thead><tr><th>Title</th><th>URL</th><th>Updated</th><th>Status</th></tr></thead>
              <tbody>{ps.filter((p) => p.kind === k).map((p) => <tr key={p.id}><td><Link className="link font-medium" href={`/admin/pages/${p.id}`}>{p.title}</Link></td><td className="font-mono text-xs">/{p.slug}</td><td className="text-xs">{formatDate(p.updatedAt)}</td><td>{p.isPublished ? <Badge tone="green">published</Badge> : <Badge>hidden</Badge>}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
