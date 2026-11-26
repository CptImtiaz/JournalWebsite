import Link from "next/link";
import { getJournal, navOf, footerOf, fileUrl } from "@/lib/journal";
import { getCurrentUser, isStaff, hasRole } from "@/lib/auth";
import { MobileNav } from "./client";
import { Icon } from "./icons";
import { JournalTabs } from "./journal-tabs";

export function Logo({ size = 44, logoUrl, light }: { size?: number; logoUrl?: string | null; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" width={size} height={size} className="rounded object-contain" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <rect width="48" height="48" rx="8" fill={light ? "#ffffff" : "#191919"} />
      <path d="M12 34V14h4v20h-4Z" fill={light ? "#191919" : "#fff"} />
      <path d="M20 34V14h4l8 12V14h4v20h-4l-8-12v12h-4Z" fill={light ? "#006699" : "#e6e6e6"} />
      <rect x="12" y="37" width="24" height="2" rx="1" fill="#006699" />
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

const TABS = [
  { label: "Journal home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Volumes and issues", href: "/archives" },
  { label: "Editorial board", href: "/editorial-board" },
  { label: "Aims and scope", href: "/aims-scope" },
  { label: "Submission guidelines", href: "/for-authors" },
  { label: "Policies", href: "/policies" },
  { label: "About", href: "/about" },
];

export async function SiteHeader() {
  const [j, user] = await Promise.all([getJournal(), getCurrentUser()]);
  const nav = groups(navOf(j));
  const dash = !user ? null : isStaff(user) ? (hasRole(user, "SUPER_ADMIN", "JOURNAL_ADMIN") ? "/admin" : "/editor/dashboard") : hasRole(user, "REVIEWER") ? "/reviewer/dashboard" : "/author/dashboard";
  return (
    <header className="relative z-30 bg-white">
      {/* Publisher bar */}
      <div className="border-b border-line">
        <div className="container-x flex h-16 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${j.name} home`}>
            <Logo logoUrl={fileUrl(j.logoFileId)} size={36} />
            <span className="font-display text-xl font-bold tracking-tight text-navy">{j.shortName}</span>
          </Link>
          <form action="/articles" role="search" className="mx-auto hidden max-w-xl flex-1 md:block">
            <label className="relative block">
              <span className="sr-only">Search articles</span>
              <input name="q" placeholder="Search articles, authors, keywords, DOI…" className="w-full rounded-[3px] border border-ink/25 py-2 pl-3 pr-11 text-sm focus:border-link focus:outline-none focus:ring-1 focus:ring-link" />
              <button className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-[3px] bg-navy text-white" aria-label="Search"><Icon name="search" size={16} /></button>
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            {user ? (
              <>
                <Link href={dash!} className="hidden items-center gap-1.5 text-sm font-medium text-ink hover:text-link sm:inline-flex"><Icon name="user" size={16} />My account</Link>
                <form action="/logout" method="post" className="hidden sm:block"><button className="text-sm text-muted hover:text-ink">Log out</button></form>
              </>
            ) : (
              <Link href="/login" className="hidden items-center gap-1.5 text-sm font-medium text-ink hover:text-link sm:inline-flex"><Icon name="user" size={16} />Log in</Link>
            )}
            <MobileNav>
              <nav className="container-x grid gap-4 py-4 sm:grid-cols-3">
                <form action="/articles" role="search" className="sm:col-span-3"><input name="q" placeholder="Search articles" className="input" /></form>
                {nav.map((g) => (
                  <div key={g.label}>
                    <div className="kicker mb-1">{g.label}</div>
                    {g.links.map((l) => <Link key={l.href} href={l.href} className="block rounded px-1 py-1.5 text-sm hover:bg-surface">{l.label}</Link>)}
                  </div>
                ))}
                <Link href={user ? dash! : "/login"} className="btn-secondary sm:col-span-3">{user ? "My account" : "Log in / Register"}</Link>
              </nav>
            </MobileNav>
          </div>
        </div>
      </div>
      {/* Journal title strip */}
      <div className="border-b border-line bg-white">
        <div className="container-x flex items-center justify-between gap-4 py-4">
          <Link href="/" className="min-w-0 font-display text-xl font-bold leading-tight tracking-tight text-ink sm:text-[30px]">{j.name}</Link>
          <Link href="/submit" className="btn-accent hidden shrink-0 sm:inline-flex">Submit manuscript</Link>
        </div>
      </div>
      <JournalTabs tabs={TABS} />
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
