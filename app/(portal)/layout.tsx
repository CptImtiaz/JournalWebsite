import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site";
import { requireUser, hasRole, can } from "@/lib/auth";
import { Flash } from "@/components/client";
import { PortalNav } from "@/components/portal-nav";

export const metadata = { robots: { index: false, follow: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const sections: { title: string; links: { href: string; label: string }[] }[] = [];
  sections.push({ title: "My account", links: [{ href: "/account", label: "Overview" }, { href: "/account/profile", label: "Profile" }, { href: "/account/security", label: "Security & 2FA" }] });
  if (can(u, "submissions.create"))
    sections.push({ title: "Author", links: [{ href: "/author/dashboard", label: "My submissions" }, { href: "/author/submit", label: "Submit manuscript" }] });
  if (hasRole(u, "REVIEWER")) sections.push({ title: "Reviewer", links: [{ href: "/reviewer/dashboard", label: "Review assignments" }] });
  if (can(u, "manuscripts.view_all") || can(u, "manuscripts.view_assigned"))
    sections.push({ title: "Editorial", links: [{ href: "/editor/dashboard", label: "Editor dashboard" }, { href: "/editor/manuscripts", label: "All manuscripts" }, ...(can(u, "manuscripts.manage_reviews") ? [{ href: "/editor/reviewers", label: "Reviewer pool" }] : [])] });
  if (can(u, "admin.access")) {
    const L: { href: string; label: string }[] = [{ href: "/admin", label: "Dashboard" }];
    if (can(u, "users.manage")) L.push({ href: "/admin/users", label: "Users & roles" });
    if (can(u, "content.manage")) L.push({ href: "/admin/board", label: "Editorial board" });
    if (can(u, "publishing.manage")) L.push({ href: "/admin/articles", label: "Articles" }, { href: "/admin/issues", label: "Volumes & issues" }, { href: "/admin/doi", label: "DOI" });
    if (can(u, "content.manage")) L.push({ href: "/admin/pages", label: "Pages & policies" }, { href: "/admin/categories", label: "Research categories" }, { href: "/admin/announcements", label: "Announcements" }, { href: "/admin/messages", label: "Contact messages" });
    if (can(u, "email.manage")) L.push({ href: "/admin/email", label: "Email" });
    if (can(u, "content.manage")) L.push({ href: "/admin/settings", label: "Journal settings" }, { href: "/admin/seo", label: "SEO & navigation" });
    if (can(u, "audit.view")) L.push({ href: "/admin/audit", label: "Audit logs" });
    sections.push({ title: "Administration", links: L });
  }
  return (
    <>
      <SiteHeader />
      <div className="container-x grid gap-8 py-8 lg:grid-cols-[230px_1fr]">
        <aside>
          <div className="mb-4 rounded-md bg-surface p-3 text-sm">
            <div className="font-semibold text-navy">{u.fullName}</div>
            <div className="truncate text-xs text-muted">{u.email}</div>
            <div className="mt-1 text-xs text-muted">{u.roles.map((r) => r.role.name).join(", ")}</div>
          </div>
          <PortalNav sections={sections} />
        </aside>
        <main id="main" className="min-w-0">
          <Suspense><Flash /></Suspense>
          {children}
        </main>
      </div>
      <footer className="border-t border-line py-6 text-center text-xs text-muted"><Link href="/" className="hover:text-brand">Return to journal website</Link></footer>
    </>
  );
}
