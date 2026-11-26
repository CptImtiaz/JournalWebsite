import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Announcements", alternates: { canonical: "/announcements" } };

export default async function Announcements() {
  const items = await db.announcement.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } });
  return (
    <>
      <PageHeader title="Announcements" crumbs={[{ label: "Announcements" }]} />
      <div className="container-x max-w-4xl py-10">
        {items.length === 0 && <Empty title="No announcements yet" />}
        <ul className="divide-y divide-line">
          {items.map((a) => (
            <li key={a.id} className="py-5">
              <div className="text-xs text-muted">{formatDate(a.publishedAt)}{a.isSample && <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] font-bold uppercase text-amber-800">Sample</span>}</div>
              <Link href={`/announcements/${a.slug}`} className="text-lg font-semibold text-ink hover:text-brand">{a.title}</Link>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{a.body.replace(/[#*_\[\]()]/g, "").slice(0, 240)}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
