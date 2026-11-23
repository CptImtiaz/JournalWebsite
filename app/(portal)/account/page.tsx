import Link from "next/link";
import { requireUser, hasRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Icon, type IconName } from "@/components/icons";

export default async function Account() {
  const u = await requireUser();
  const [subs, reviews, revision] = await Promise.all([
    db.manuscript.count({ where: { submitterId: u.id } }),
    db.reviewerAssignment.count({ where: { reviewerId: u.id, status: { in: ["INVITED", "ACCEPTED"] } } }),
    db.manuscript.count({ where: { submitterId: u.id, status: "REVISION_REQUIRED" } }),
  ]);
  const tiles: { href: string; icon: IconName; title: string; text: string; meta?: string; show: boolean }[] = [
    { href: "/author/submit", icon: "upload", title: "Submit a manuscript", text: "Start the guided submission for a new article.", show: can(u, "submissions.create") },
    { href: "/author/dashboard", icon: "file", title: "My submissions", text: "Track status, decisions and revisions.", meta: `${subs} submission${subs === 1 ? "" : "s"}${revision ? ` · ${revision} need revision` : ""}`, show: true },
    { href: "/reviewer/dashboard", icon: "review", title: "Review assignments", text: "Respond to invitations and submit reports.", meta: `${reviews} open`, show: hasRole(u, "REVIEWER") },
    { href: "/editor/dashboard", icon: "inbox", title: "Editorial office", text: "Manage submissions, reviewers and decisions.", show: can(u, "manuscripts.view_all") || can(u, "manuscripts.view_assigned") },
    { href: "/admin", icon: "chart", title: "Administration", text: "Website, publishing, users and settings.", show: can(u, "admin.access") },
    { href: "/account/security", icon: "lock", title: "Security", text: u.mfaEnabled ? "Two-factor authentication is on." : "Turn on two-factor authentication.", show: true },
  ];
  return (
    <>
      <PTitle title={`Welcome, ${u.fullName.split(" ")[0]}`} subtitle="What would you like to do today?" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.filter((t) => t.show).map((t) => (
          <Link key={t.href} href={t.href} className="app-card group flex gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand group-hover:bg-brand group-hover:text-white"><Icon name={t.icon} size={22} /></span>
            <div>
              <h2 className="font-semibold text-ink">{t.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.text}</p>
              {t.meta && <p className="mt-2 text-xs font-medium text-brand">{t.meta}</p>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
