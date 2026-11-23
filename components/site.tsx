import Link from "next/link";
import { getJournal, navOf, footerOf, fileUrl } from "@/lib/journal";
import { getCurrentUser, isStaff, hasRole } from "@/lib/auth";
import { MobileNav } from "./client";
import { Icon } from "./icons";

export function Logo({ size = 44, logoUrl, light }: { size?: number; logoUrl?: string | null; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" width={size} height={size} className="rounded object-contain" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <rect width="48" height="48" rx="8" fill={light ? "#ffffff" : "#142D4E"} />
      <path d="M12 34V14h4v20h-4Z" fill={light ? "#142D4E" : "#fff"} />
      <path d="M20 34V14h4l8 12V14h4v20h-4l-8-12v12h-4Z" fill={light ? "#2864A5" : "#7FB0E6"} />
      <rect x="12" y="37" width="24" height="2" rx="1" fill="#2864A5" />
    </svg>
  );
}

type Group = { label: string; links: { label: string; href: string; desc?: string }[] };

function groups(extra: { label: string; href: string }[]): Group[] {
  const g: Group[] = [
    {
      label: "Explore content",
      links: [
        { label: "Research articles", href: "/articles", desc: "Search the full archive" },
        { label: "Current issue", href: "/current-issue", desc: "Latest table of contents" },
        { label: "Browse archives", href: "/archives", desc: "All volumes and issues" },
        { label: "Browse by subject", href: "/aims-scope", desc: "15 research areas" },
        { label: "Announcements", href: "/announcements" },
        { label: "RSS feed", href: "/feed.xml" },
      ],
    },
    {
      label: "About the journal",
      links: [
        { label: "Journal information", href: "/about" },
        { label: "Aims & scope", href: "/aims-scope" },
        { label: "Editorial board", href: "/editorial-board" },
        { label: "Journal policies", href: "/policies" },
        { label: "Open access", href: "/open-access" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      label: "Publish with us",
      links: [
        { label: "Submit manuscript", href: "/submit", desc: "Start a new submission" },
        { label: "For authors", href: "/for-authors", desc: "Preparation guidelines" },
        { label: "Peer review process", href: "/peer-review" },
        { label: "Publication ethics", href: "/publication-ethics" },
        { label: "Publication fees", href: "/publication-fees" },
        { label: "Track my manuscript", href: "/author/dashboard" },
      ],
    },
  ];
  const known = new Set(g.flatMap((x) => x.links.map((l) => l.href)).concat(["/"]));
  for (const e of extra) if (!known.has(e.href)) g[1].links.push(e);
  return g;
}

export async function SiteHeader() {
  const [j, user] = await Promise.all([getJournal(), getCurrentUser()]);
  const nav = groups(navOf(j));
  const dash = !user ? null : isStaff(user) ? (hasRole(user, "SUPER_ADMIN", "JOURNAL_ADMIN") ? "/admin" : "/editor/dashboard") : hasRole(user, "REVIEWER") ? "/reviewer/dashboard" : "/author/dashboard";
  const issn = [j.printIssn && `ISSN ${j.printIssn}`, j.eIssn && `eISSN ${j.eIssn}`].filter(Boolean).join(" · ");
  return (
    <header className="relative z-30 bg-white">
      <div className="border-b border-line bg-surface text-xs text-muted">
        <div className="container-x flex h-9 items-center justify-between gap-4">
          <span className="truncate">{j.isOpenAccess ? "Open access · " : ""}Peer-reviewed international journal{issn ? ` · ${issn}` : ""}</span>
          <div className="flex shrink-0 items-center gap-4">
            {user ? (
              <>
                <Link href={dash!} className="font-medium text-ink hover:text-brand">My account</Link>
                <form action="/logout" method="post"><button className="hover:text-ink">Sign out</button></form>
              </>
            ) : (
              <>
                <Link href="/login" className="font-medium text-ink hover:text-brand">Log in</Link>
                <Link href="/register" className="hover:text-ink">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="border-b border-line">
        <div className="container-x flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Logo logoUrl={fileUrl(j.logoFileId)} size={46} />
            <div className="min-w-0">
              <div className="font-display text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">{j.name}</div>
              <div className="hidden text-xs text-muted sm:block">{j.tagline}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/articles" className="btn-ghost hidden sm:inline-flex" aria-label="Search articles"><Icon name="search" size={16} /> Search</Link>
            <Link href="/submit" className="btn-primary hidden sm:inline-flex">Submit manuscript</Link>
            <MobileNav>
              <nav className="container-x grid gap-4 py-4 sm:grid-cols-3">
                {nav.map((g) => (
                  <div key={g.label}>
                    <div className="kicker mb-1">{g.label}</div>
                    {g.links.map((l) => <Link key={l.href} href={l.href} className="block rounded px-1 py-1.5 text-sm hover:bg-surface">{l.label}</Link>)}
                  </div>
                ))}
                <Link href="/submit" className="btn-primary sm:col-span-3">Submit manuscript</Link>
              </nav>
            </MobileNav>
          </div>
        </div>
      </div>
      <nav className="hidden border-b border-line lg:block" aria-label="Main">
        <div className="container-x flex items-stretch gap-1">
          {nav.map((g) => (
            <div key={g.label} className="group relative">
              <button className="flex items-center gap-1 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-ink group-hover:border-brand group-focus-within:border-brand" aria-haspopup="true">
                {g.label}
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="transition group-hover:rotate-180"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
              <div className="invisible absolute left-0 top-full w-80 translate-y-1 rounded-b-lg border border-line bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href} className="block rounded-md px-3 py-2 hover:bg-surface">
                    <span className="text-sm font-medium text-ink">{l.label}</span>
                    {l.desc && <span className="block text-xs text-muted">{l.desc}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <form action="/articles" className="ml-auto flex items-center py-2" role="search">
            <label className="relative">
              <span className="sr-only">Search articles</span>
              <Icon name="search" size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input name="q" placeholder="Search articles, authors, keywords" className="w-72 rounded-full border border-line bg-surface py-1.5 pl-8 pr-3 text-sm focus:border-brand focus:bg-white focus:outline-none" />
            </label>
          </form>
        </div>
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const j = await getJournal();
  const links = footerOf(j);
  const cols = [
    { title: "Explore", links: [{ label: "Research articles", href: "/articles" }, { label: "Current issue", href: "/current-issue" }, { label: "Archives", href: "/archives" }, { label: "Announcements", href: "/announcements" }, { label: "RSS feed", href: "/feed.xml" }] },
    { title: "Publish with us", links: [{ label: "Submit manuscript", href: "/submit" }, { label: "For authors", href: "/for-authors" }, { label: "Peer review", href: "/peer-review" }, { label: "Publication fees", href: "/publication-fees" }, { label: "Reviewer & author login", href: "/login" }] },
    { title: "Journal", links },
  ];
  return (
    <footer className="mt-20 bg-navy text-white/75">
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Logo size={44} logoUrl={fileUrl(j.logoFileId)} light />
            <div className="font-display text-lg font-semibold leading-tight text-white">{j.name}</div>
          </div>
          {j.description && <p className="mt-4 max-w-md text-sm leading-relaxed">{j.description}</p>}
          <dl className="mt-5 space-y-1 text-sm">
            {j.publisherName && <div>Publisher: <span className="text-white">{j.publisherName}</span></div>}
            {j.printIssn && <div>Print ISSN: <span className="text-white">{j.printIssn}</span></div>}
            {j.eIssn && <div>eISSN: <span className="text-white">{j.eIssn}</span></div>}
            {j.doiPrefix && <div>DOI prefix: <span className="text-white">{j.doiPrefix}</span></div>}
            {j.contactEmail && <div>Contact: <a className="text-white hover:underline" href={`mailto:${j.contactEmail}`}>{j.contactEmail}</a></div>}
          </dl>
          {j.footerText && <p className="mt-3 text-sm">{j.footerText}</p>}
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white">{c.title}</h2>
              <ul className="mt-4 space-y-2 text-sm">{c.links.map((l) => <li key={l.href + l.label}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs">
          <span>© {new Date().getFullYear()} {j.publisherName || j.name}. {j.copyrightStatement}</span>
          <span className="flex gap-4"><Link href="/privacy-policy" className="hover:text-white">Privacy policy</Link><Link href="/terms-of-use" className="hover:text-white">Terms of use</Link><Link href="/policies" className="hover:text-white">Policies</Link><Link href="/contact" className="hover:text-white">Contact</Link></span>
        </div>
      </div>
    </footer>
  );
}
