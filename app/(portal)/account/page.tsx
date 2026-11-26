import Link from "next/link";
import { requireUser, hasRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card } from "@/components/ui";

export default async function Account() {
  const u = await requireUser();
  const [subs, reviews, revision] = await Promise.all([
    db.manuscript.count({ where: { submitterId: u.id } }),
    db.reviewerAssignment.count({ where: { reviewerId: u.id, status: { in: ["INVITED", "ACCEPTED"] } } }),
    db.manuscript.count({ where: { submitterId: u.id, status: "REVISION_REQUIRED" } }),
  ]);
  const rows: { href: string; title: string; text: string; meta?: string; show: boolean }[] = [
    { href: "/author/submit", title: "Submit a manuscript", text: "Start a new submission to the journal.", show: can(u, "submissions.create") },
    { href: "/author/dashboard", title: "My submissions", text: "Status, decisions and revisions.", meta: `${subs} submission${subs === 1 ? "" : "s"}${revision ? `, ${revision} awaiting revision` : ""}`, show: true },
    { href: "/reviewer/dashboard", title: "Review assignments", text: "Invitations and review reports.", meta: `${reviews} open`, show: hasRole(u, "REVIEWER") },
    { href: "/editor/dashboard", title: "Editor dashboard", text: "Submissions, reviewers and decisions.", show: can(u, "manuscripts.view_all") || can(u, "manuscripts.view_assigned") },
    { href: "/admin", title: "Administration", text: "Website, publishing, users and settings.", show: can(u, "admin.access") },
    { href: "/account/security", title: "Security", text: u.mfaEnabled ? "Two factor authentication is on." : "Turn on two factor authentication.", show: true },
  ];
  return (
    <>
      <PTitle title="Home" subtitle={`Signed in as ${u.fullName}`} />
      <Card title="Main menu" flush>
        <ul>
          {rows.filter((r) => r.show).map((r) => (
            <li key={r.href} className="border-b border-line last:border-0">
              <Link href={r.href} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface">
                <span><span className="block font-semibold text-link">{r.title}</span><span className="text-sm text-muted">{r.text}</span></span>
                {r.meta && <span className="shrink-0 text-sm text-ink">{r.meta}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
