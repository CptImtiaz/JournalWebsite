import { db } from "@/lib/db";
import { PageHeader, Empty } from "@/components/ui";
import { IssueView, issueInclude } from "@/components/issue-view";

export const metadata = { title: "Current Issue", alternates: { canonical: "/current-issue" } };

export default async function CurrentIssue() {
  const issue =
    (await db.issue.findFirst({ where: { isPublished: true, isCurrent: true }, include: issueInclude })) ??
    (await db.issue.findFirst({ where: { isPublished: true }, orderBy: [{ year: "desc" }, { publishedAt: "desc" }], include: issueInclude }));
  return (
    <>
      <PageHeader title="Current Issue" subtitle={issue ? `Volume ${issue.volume.number}, Issue ${issue.number} (${issue.year})` : undefined} crumbs={[{ label: "Current Issue" }]} />
      {issue ? <IssueView issue={issue} /> : <div className="container-x py-10"><Empty title="No issue has been published yet" /></div>}
    </>
  );
}
