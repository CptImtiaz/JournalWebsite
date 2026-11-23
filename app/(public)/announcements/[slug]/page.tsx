import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export default async function Announcement({ params }: { params: Promise<{ slug: string }> }) {
  const a = await db.announcement.findUnique({ where: { slug: (await params).slug } });
  if (!a || !a.isPublished) notFound();
  return (
    <>
      <PageHeader title={a.title} subtitle={formatDate(a.publishedAt)} crumbs={[{ label: "Announcements", href: "/announcements" }, { label: a.title }]} />
      <div className="container-x max-w-4xl py-10"><div className="prose prose-slate max-w-none prose-headings:text-navy prose-headings:font-semibold prose-a:text-brand prose-h2:mt-8 prose-h2:text-xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} /></div>
    </>
  );
}
