import Link from "next/link";
import { requireUser, hasRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Stat, Card } from "@/components/ui";

export default async function Account() {
  const u = await requireUser();
  const [subs, reviews] = await Promise.all([
    db.manuscript.count({ where: { submitterId: u.id } }),
    db.reviewerAssignment.count({ where: { reviewerId: u.id, status: { in: ["INVITED", "ACCEPTED"] } } }),
  ]);
  const staffAdmin = can(u, "admin.access");
  const editor = can(u, "manuscripts.view_all") || can(u, "manuscripts.view_assigned");
  return (
    <>
      <PTitle title={`Welcome, ${u.fullName}`} subtitle="Choose where you would like to go." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="My submissions" value={subs} href="/author/dashboard" />
        {hasRole(u, "REVIEWER") && <Stat label="Open review tasks" value={reviews} href="/reviewer/dashboard" />}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Author centre"><p className="text-sm text-muted">Submit a new manuscript or track existing submissions.</p><div className="mt-4 flex gap-2"><Link href="/author/submit" className="btn-primary btn-sm">Submit manuscript</Link><Link href="/author/dashboard" className="btn-secondary btn-sm">My submissions</Link></div></Card>
        {hasRole(u, "REVIEWER") && <Card title="Reviewer centre"><p className="text-sm text-muted">Respond to invitations and submit review reports.</p><Link href="/reviewer/dashboard" className="btn-primary btn-sm mt-4">Open</Link></Card>}
        {editor && <Card title="Editorial office"><p className="text-sm text-muted">Manage submissions, reviewers and decisions.</p><Link href="/editor/dashboard" className="btn-primary btn-sm mt-4">Open</Link></Card>}
        {staffAdmin && <Card title="Administration"><p className="text-sm text-muted">Website content, publishing, users and settings.</p><Link href="/admin" className="btn-primary btn-sm mt-4">Open</Link></Card>}
      </div>
    </>
  );
}
