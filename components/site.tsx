import Link from "next/link";
import { getJournal, navOf, footerOf, fileUrl } from "@/lib/journal";
import { getCurrentUser, isStaff, hasRole } from "@/lib/auth";
import { MobileNav } from "./client";

export function Logo({ size = 44, logoUrl }: { size?: number; logoUrl?: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" width={size} height={size} className="rounded object-contain" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <rect width="48" height="48" rx="8" fill="#142D4E" />
      <path d="M12 34V14h4v20h-4Z" fill="#fff" />
      <path d="M20 34V14h4l8 12V14h4v20h-4l-8-12v12h-4Z" fill="#7FB0E6" />
      <rect x="12" y="37" width="24" height="2" rx="1" fill="#2864A5" />
    </svg>
  );
}

export async function SiteHeader() {
  const [j, user] = await Promise.all([getJournal(), getCurrentUser()]);
  const nav = navOf(j);
  const dash = !user ? null : isStaff(user) ? (hasRole(user, "SUPER_ADMIN", "JOURNAL_ADMIN") ? "/admin" : "/editor/dashboard") : hasRole(user, "REVIEWER") ? "/reviewer/dashboard" : "/author/dashboard";
  const issn = [j.printIssn && `ISSN ${j.printIssn}`, j.eIssn && `e-ISSN ${j.eIssn}`].filter(Boolean).join(" · ");
  return (
    <header className="relative border-b border-line bg-white">
      <div className="bg-navy text-xs text-white/80">
        <div className="container-x flex h-8 items-center justify-between gap-4">
          <span className="truncate">{j.isOpenAccess ? "Open Access · " : ""}Peer-Reviewed International Journal{issn ? ` · ${issn}` : ""}</span>
          <div className="flex shrink-0 items-center gap-4">
            {user ? (
              <>
                <Link href={dash!} className="hover:text-white">My Dashboard</Link>
                <form action="/logout" method="post"><button className="hover:text-white">Sign out</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-white">Sign in</Link>
                <Link href="/register" className="hover:text-white">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="container-x flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Logo logoUrl={fileUrl(j.logoFileId)} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{j.shortName}</div>
            <div className="text-sm font-semibold leading-tight text-navy sm:text-base">{j.name}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/articles" className="btn-ghost hidden sm:inline-flex" aria-label="Search articles">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            Search
          </Link>
          <Link href="/submit" className="btn-primary hidden sm:inline-flex">Submit Manuscript</Link>
          <MobileNav>
            <nav className="container-x grid gap-1 py-3">
              {nav.map((n) => <Link key={n.href} href={n.href} className="rounded px-2 py-2 text-sm hover:bg-surface">{n.label}</Link>)}
              <Link href="/submit" className="btn-primary mt-2">Submit Manuscript</Link>
            </nav>
          </MobileNav>
        </div>
      </div>
      <nav className="hidden border-t border-line lg:block" aria-label="Main">
        <div className="container-x flex items-center gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-ink hover:border-brand hover:text-brand">
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const j = await getJournal();
  const links = footerOf(j);
  return (
    <footer className="mt-16 bg-navy text-white/80">
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={40} logoUrl={fileUrl(j.logoFileId)} />
            <div className="font-semibold text-white">{j.name}</div>
          </div>
          {j.description && <p className="mt-4 text-sm leading-relaxed">{j.description}</p>}
          {j.footerText && <p className="mt-3 text-sm">{j.footerText}</p>}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Journal</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Information</h2>
          {j.contactEmail && <p>Contact: <a className="hover:text-white" href={`mailto:${j.contactEmail}`}>{j.contactEmail}</a></p>}
          {j.publisherName && <p>Publisher: {j.publisherName}</p>}
          {j.printIssn && <p>Print ISSN: {j.printIssn}</p>}
          {j.eIssn && <p>e-ISSN: {j.eIssn}</p>}
          {j.doiPrefix && <p>DOI prefix: {j.doiPrefix}</p>}
          <p><Link href="/feed.xml" className="hover:text-white">RSS feed</Link></p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-4 text-xs">
          <span>© {new Date().getFullYear()} {j.publisherName || j.name}. {j.copyrightStatement}</span>
          <span>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link> · <Link href="/terms-of-use" className="hover:text-white">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
