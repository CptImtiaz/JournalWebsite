import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function AnnAdmin() {
  await requirePermission("content.manage");
  const items = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PTitle title="Announcements" actions={<Link className="btn-primary" href="/admin/announcements/new">New announcement</Link>} />
      {items.length === 0 ? <Empty title="No announcements" /> : (
        <div className="card divide-y divide-line">{items.map((a) => <div key={a.id} className="flex justify-between gap-2 p-3 text-sm"><Link className="link" href={`/admin/announcements/${a.id}`}>{a.title}</Link><span className="flex gap-2 text-xs text-muted">{formatDate(a.publishedAt ?? a.createdAt)} {a.isPublished ? <Badge tone="green">published</Badge> : <Badge>draft</Badge>}</span></div>)}</div>
      )}
    </>
  );
}
