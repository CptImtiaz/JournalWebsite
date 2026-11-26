import Link from "next/link";
import { Suspense } from "react";
import { requireUser, hasRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { Flash } from "@/components/client";
import { PortalNav, MobilePortalNav, type NavSection } from "@/components/portal-nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const j = await getJournal();
  const [invites, newSubs, revisionDue] = await Promise.all([
    hasRole(u, "REVIEWER") ? db.reviewerAssignment.count({ where: { reviewerId: u.id, status: "INVITED" } }) : 0,
    can(u, "manuscripts.view_all") ? db.manuscript.count({ where: { status: "SUBMITTED" } }) : 0,
    db.manuscript.count({ where: { submitterId: u.id, status: "REVISION_REQUIRED" } }),
  ]);
  const sections: NavSection[] = [
    { title: "Workspace", links: [{ href: "/account", label: "Overview", icon: "home" }] },
  ];
  if (can(u, "submissions.create"))
    sections.push({ title: "Author", links: [{ href: "/author/dashboard", label: "My submissions", icon: "file", badge: revisionDue }, { href: "/submission", label: "New submission", icon: "upload" }] });
  if (hasRole(u, "REVIEWER")) sections.push({ title: "Reviewer", links: [{ href: "/reviewer/dashboard", label: "Review assignments", icon: "review", badge: invites }] });
  if (can(u, "manuscripts.view_all") || can(u, "manuscripts.view_assigned"))
    sections.push({ title: "Editorial office", links: [{ href: "/editor/dashboard", label: "Editor dashboard", icon: "inbox" }, { href: "/editor/manuscripts", label: "Manuscripts", icon: "list", badge: newSubs }, ...(can(u, "manuscripts.manage_reviews") ? [{ href: "/editor/reviewers", label: "Reviewer pool", icon: "users" as const }] : [])] });
  if (can(u, "admin.access")) {
    const L: NavSection["links"] = [{ href: "/admin", label: "Dashboard", icon: "chart" }];
    if (can(u, "users.manage")) L.push({ href: "/admin/users", label: "Users & roles", icon: "users" });
    if (can(u, "publishing.manage")) L.push({ href: "/admin/articles", label: "Articles", icon: "book" }, { href: "/admin/issues", label: "Volumes & issues", icon: "layers" }, { href: "/admin/doi", label: "DOI deposits", icon: "doi" });
    if (can(u, "content.manage")) L.push({ href: "/admin/board", label: "Editorial board", icon: "user" }, { href: "/admin/pages", label: "Pages & policies", icon: "page" }, { href: "/admin/categories", label: "Research categories", icon: "tag" }, { href: "/admin/announcements", label: "Announcements", icon: "megaphone" }, { href: "/admin/messages", label: "Messages", icon: "mail" });
    if (can(u, "email.manage")) L.push({ href: "/admin/email", label: "Email", icon: "bell" });
    if (can(u, "content.manage")) L.push({ href: "/admin/settings", label: "Journal settings", icon: "settings" }, { href: "/admin/seo", label: "SEO & navigation", icon: "globe" });
    if (can(u, "audit.view")) L.push({ href: "/admin/audit", label: "Audit logs", icon: "activity" });
    sections.push({ title: "Administration", links: L });
  }
  sections.push({ title: "Account", links: [{ href: "/account/profile", label: "Profile", icon: "user" }, { href: "/account/security", label: "Security & 2FA", icon: "lock" }] });
  const initials = u.fullName.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();

  const roleNames = u.roles.map((r) => r.role.name).join(", ");
  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="flex h-12 items-center gap-4 px-4 sm:px-6">
          <MobilePortalNav sections={sections} />
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-display text-lg font-bold tracking-wide">{j.shortName}</span>
            <span className="hidden border-l border-white/30 pl-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:inline">Editorial Manager</span>
          </Link>
          <form action="/articles" className="ml-6 hidden flex-1 md:block" role="search">
            <input name="q" placeholder="Search published articles" className="w-full max-w-sm border border-white/20 bg-white/10 px-3 py-1 text-sm text-white placeholder:text-white/50 focus:bg-white focus:text-ink focus:outline-none" />
          </form>
          <div className="ml-auto flex items-center gap-4 text-[13px]">
            <Link href="/" className="hidden text-white/75 hover:text-white sm:inline">Journal website</Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-white/90 hover:text-white">
                <span className="hidden max-w-48 truncate md:inline">{u.fullName}</span>
                <span className="flex h-7 w-7 items-center justify-center bg-white/15 text-[11px] font-bold">{initials}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-64 border border-line bg-white text-ink shadow-lg">
                <div className="border-b border-line px-4 py-3"><div className="text-sm font-semibold">{u.fullName}</div><div className="truncate text-xs text-muted">{u.email}</div><div className="mt-1 text-[11px] text-muted">{roleNames}</div></div>
                <Link href="/account/profile" className="block px-4 py-2 text-sm hover:bg-surface">Profile</Link>
                <Link href="/account/security" className="block px-4 py-2 text-sm hover:bg-surface">Security and 2FA</Link>
                <form action="/logout" method="post" className="border-t border-line"><button className="w-full px-4 py-2 text-left text-sm text-[#7A5A12] hover:bg-[#FBF6EA]">Sign out</button></form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-12 z-30 hidden w-60 overflow-y-auto border-r border-line bg-white py-5 lg:block">
        <div className="mb-5 px-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Signed in as</div>
          <div className="mt-0.5 truncate text-sm font-semibold">{u.fullName}</div>
          <div className="truncate text-xs text-muted">{roleNames}</div>
        </div>
        <PortalNav sections={sections} />
      </aside>

      <div className="lg:pl-60">
        <main id="main" className="mx-auto max-w-[1320px] px-4 py-6 sm:px-8">
          <Suspense><Flash /></Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
