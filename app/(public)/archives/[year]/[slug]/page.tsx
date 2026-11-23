import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { IssueView, issueInclude } from "@/components/issue-view";

type P = { params: Promise<{ year: string; slug: string }> };

async function load({ params }: P) {
  const { year, slug } = await params;
  const issue = await db.issue.findUnique({ where: { slug }, include: issueInclude });
  if (!issue || !issue.isPublished || String(issue.year) !== year) return null;
  return issue;
}

export async function generateMetadata(p: P): Promise<Metadata> {
  const i = await load(p);
  if (!i) return {};
  const t = `Volume ${i.volume.number}, Issue ${i.number} (${i.year})`;
  return { title: t, description: `Table of contents for ${t}.`, alternates: { canonical: `/archives/${i.year}/${i.slug}` } };
}

export default async function IssuePage(p: P) {
  const issue = await load(p);
  if (!issue) notFound();
  const t = `Volume ${issue.volume.number}, Issue ${issue.number}`;
  return (
    <>
      <PageHeader title={t} subtitle={String(issue.year)} crumbs={[{ label: "Archives", href: "/archives" }, { label: String(issue.year), href: `/archives#y${issue.year}` }, { label: t }]} />
      <IssueView issue={issue} />
    </>
  );
}
