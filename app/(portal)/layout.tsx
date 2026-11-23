import Link from "next/link";
import { Suspense } from "react";
import { requireUser, hasRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal, fileUrl } from "@/lib/journal";
import { Flash } from "@/components/client";
import { PortalNav, MobilePortalNav, type NavSection } from "@/components/portal-nav";
import { Logo } from "@/components/site";
import { Icon } from "@/components/icons";

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
    sections.push({ title: "Author", links: [{ href: "/author/dashboard", label: "My submissions", icon: "file", badge: revisionDue }, { href: "/author/submit", label: "New submission", icon: "upload" }] });
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

  return (
    <div className="min-h-screen bg-app">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy lg:flex">
        <Link href="/" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <Logo size={36} logoUrl={fileUrl(j.logoFileId)} light />
          <div className="min-w-0">
            <div className="font-display text-base font-semibold leading-tight text-white">{j.shortName}</div>
            <div className="truncate text-[11px] text-white/50">Editorial system</div>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-5"><PortalNav sections={sections} /></div>
        <div className="border-t border-white/10 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"><Icon name="globe" size={17} />View journal website</Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <MobilePortalNav sections={sections} />
            <form action="/articles" className="hidden flex-1 md:block" role="search">
              <label className="relative block max-w-md">
                <span className="sr-only">Search published articles</span>
                <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input name="q" placeholder="Search published articles…" className="w-full rounded-lg border border-line bg-app py-2 pl-9 pr-3 text-sm focus:border-brand focus:bg-white focus:outline-none" />
              </label>
            </form>
            <div className="ml-auto flex items-center gap-3">
              {can(u, "submissions.create") && <Link href="/author/submit" className="btn-primary hidden sm:inline-flex"><Icon name="plus" size={16} />New submission</Link>}
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1 hover:bg-surface">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{initials}</span>
                  <span className="hidden text-left md:block"><span className="block text-sm font-medium leading-tight">{u.fullName}</span><span className="block text-[11px] text-muted">{u.roles.map((r) => r.role.name).slice(0, 2).join(", ")}</span></span>
                </summary>
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-xl">
                  <div className="border-b border-line px-3 pb-2 pt-1 text-xs text-muted">{u.email}</div>
                  <Link href="/account/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"><Icon name="user" size={15} />Profile</Link>
                  <Link href="/account/security" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface"><Icon name="lock" size={15} />Security</Link>
                  <form action="/logout" method="post"><button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"><Icon name="logout" size={15} />Sign out</button></form>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
          <Suspense><Flash /></Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
