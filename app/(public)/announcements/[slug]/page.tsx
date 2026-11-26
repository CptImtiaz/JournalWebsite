import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await db.announcement.findUnique({ where: { slug: (await params).slug } });
  return a ? { title: a.title, ...(a.isSample ? { robots: { index: false } } : {}) } : {};
}

export default async function Announcement({ params }: { params: Promise<{ slug: string }> }) {
  const a = await db.announcement.findUnique({ where: { slug: (await params).slug } });
  if (!a || !a.isPublished) notFound();
  return (
    <>
      <PageHeader title={a.title} subtitle={formatDate(a.publishedAt)} crumbs={[{ label: "Announcements", href: "/announcements" }, { label: a.title }]} />
      <div className="container-x max-w-4xl py-10"><div className="prose prose-slate max-w-none prose-headings:text-ink prose-headings:font-semibold prose-a:text-link prose-h2:mt-8 prose-h2:text-xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} /></div>
    </>
  );
}
