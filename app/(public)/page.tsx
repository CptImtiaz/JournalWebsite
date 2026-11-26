import Link from "next/link";
import { db } from "@/lib/db";
import { getJournal, getCurrentIssue, homepageOf, issuePath } from "@/lib/journal";
import { latestArticles } from "@/lib/queries";
import { ArticleRow } from "@/components/article-card";
import { IssueCover } from "@/components/issue-cover";
import { JournalCover } from "@/components/journal-cover";
import { Icon, type IconName } from "@/components/icons";
import { formatDate } from "@/lib/utils";

function SideBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t-[3px] border-navy bg-white">
      <h2 className="border-b border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink">{title}</h2>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}
function H2({ id, children, more }: { id: string; children: React.ReactNode; more?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-2">
      <h2 id={id} className="font-display text-[26px] font-semibold text-ink">{children}</h2>
      {more && <Link href={more.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-link hover:underline">{more.label} <Icon name="arrowRight" size={14} /></Link>}
    </div>
  );
}

export default async function Home() {
  const j = await getJournal();
  const hp = homepageOf(j);
  const [issue, latest, announcements, categories, eic, issues] = await Promise.all([
    getCurrentIssue(),
    latestArticles(8),
    db.announcement.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } } }),
    db.editorialBoardMember.findFirst({ where: { isPublished: true, position: "EDITOR_IN_CHIEF" } }),
    db.issue.findMany({ where: { isPublished: true }, orderBy: [{ year: "desc" }, { number: "desc" }], take: 4, include: { volume: true, _count: { select: { articles: { where: { status: { in: ["PUBLISHED", "RETRACTED"] } } } } } } }),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Periodical",
    name: j.name,
    alternateName: j.shortName,
    ...(j.eIssn || j.printIssn ? { issn: [j.eIssn, j.printIssn].filter(Boolean) } : {}),
    ...(j.publisherName ? { publisher: { "@type": "Organization", name: j.publisherName } } : {}),
    isAccessibleForFree: j.isOpenAccess,
    inLanguage: "en",
  };
  const facts: [string, string | null | undefined][] = [
    ["Editor in Chief", eic?.fullName],
    ["Publishing model", j.isOpenAccess ? "Open Access" : "Subscription"],
    ["Peer review", "Double anonymous"],
    ["Licence", j.licenseName],
    ["Frequency", j.publicationFrequency],
    ["Print ISSN", j.printIssn],
    ["Electronic ISSN", j.eIssn],
    ["Publisher", j.publisherName],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Journal band */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hp.heroImageFileId ? `/api/files/${hp.heroImageFileId}` : "/images/hero-network.svg"} alt="" aria-hidden className="absolute inset-y-0 right-0 hidden h-full w-[62%] object-cover opacity-90 md:block" style={{ maskImage: "linear-gradient(to right, transparent, black 45%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 45%)" }} />
        <div className="container-x relative grid gap-8 py-10 md:grid-cols-[170px_1fr] lg:py-12">
          <Link href={issue ? issuePath(issue) : "/archives"} className="hidden w-[170px] md:block" aria-label="Current issue">
            {issue ? <IssueCover issue={issue} /> : <JournalCover />}
          </Link>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{j.isOpenAccess ? "Open access · " : ""}Peer reviewed international journal</p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-[1.1] sm:text-[44px]">{hp.headline || j.tagline || "Advancing Research in Computing and Emerging Technologies."}</h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/80">{hp.description || j.description}</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
              {eic && <li>Editor in Chief: <span className="font-semibold text-white">{eic.fullName}</span></li>}
              {j.eIssn && <li>eISSN: <span className="text-white">{j.eIssn}</span></li>}
              {j.printIssn && <li>ISSN: <span className="text-white">{j.printIssn}</span></li>}
              {issue && <li>Current issue: <Link href={issuePath(issue)} className="text-white underline-offset-2 hover:underline">Vol. {issue.volume.number}, Iss. {issue.number} ({issue.year})</Link></li>}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/submit" className="btn-accent px-5 py-2.5">Submit manuscript</Link>
              <Link href="/alerts" className="btn border border-white/40 px-5 py-2.5 text-white hover:bg-white/10"><Icon name="bell" size={16} />Sign up for alerts</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="overview">
            <H2 id="overview" more={{ href: "/about", label: "Read more about the journal" }}>Overview</H2>
            <p className="text-[17px] leading-relaxed text-ink/90">
              <em>{j.name}</em> is an open access journal for original research in computer science and information technology. We publish work that is technically sound and clearly reported.
            </p>
            <p className="mt-3 text-[17px] leading-relaxed text-ink/90">
              Every research paper goes through double anonymous peer review. Articles are free to read{j.isOpenAccess ? `, published under ${j.licenseName ?? "a Creative Commons licence"}, and authors keep their copyright` : ""}.
            </p>
            <div className="mt-5 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
              {([["shield", "Double anonymous review", "/peer-review"], ["globe", j.isOpenAccess ? "Free to read & reuse" : "Global readership", "/open-access"], ["file", "Author templates", "/for-authors#templates"]] as [IconName, string, string][]).map(([i, t, h]) => (
                <Link key={t} href={h} className="flex items-center gap-3 bg-white px-4 py-3 text-sm font-medium hover:bg-surface hover:text-link"><Icon name={i} size={18} className="text-brand" />{t}</Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="why">
            <H2 id="why" more={{ href: "/for-authors", label: "Submission guidelines" }}>Why publish with us</H2>
            <div className="grid gap-6 sm:grid-cols-2">
              {([
                ["shield", "Fair peer review", "At least two independent experts review each paper. Neither side knows the other's identity."],
                ["globe", "Free to read", "Your article is open to every reader from the day it is published. You keep your copyright."],
                ["clock", "Clear tracking", "Submit online in about 15 minutes and follow every stage of review in your dashboard."],
                ["link", "Easy to find and cite", "Each article has a permanent address, citation downloads and metadata for Google Scholar and Crossref."],
              ] as [IconName, string, string][]).map(([i, t, d]) => (
                <div key={t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-light text-brand"><Icon name={i} size={20} /></span>
                  <div><h3 className="font-semibold text-ink">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-ink/75">{d}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="latest">
            <H2 id="latest" more={{ href: "/articles", label: "View all articles" }}>Latest articles</H2>
            {latest.length ? latest.map((a) => <ArticleRow key={a.id} a={a} snippet />) : (
              <div className="border border-dashed border-line bg-surface p-8 text-center">
                <p className="font-display text-xl font-semibold">Now accepting submissions for Volume 1</p>
                <p className="mt-1 text-sm text-muted">Articles will appear here as soon as they are published.</p>
                <Link href="/submit" className="btn-accent mt-4">Submit your manuscript</Link>
              </div>
            )}
          </section>

          {issues.length > 0 && (
            <section aria-labelledby="volumes">
              <H2 id="volumes" more={{ href: "/archives", label: "All volumes and issues" }}>Volumes and issues</H2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {issues.map((i) => (
                  <Link key={i.id} href={issuePath(i)} className="group">
                    <IssueCover issue={i} />
                    <p className="mt-2 text-sm font-semibold group-hover:text-link">Volume {i.volume.number}, Issue {i.number}</p>
                    <p className="text-xs text-muted">{i.year} · {i._count.articles} articles{i.isCurrent ? " · current" : ""}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>

        <aside className="space-y-6">
          <SideBox title="This journal">
            <dl className="space-y-3 text-sm">
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wider text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <Link href="/editorial-board" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">Editorial board <Icon name="arrowRight" size={13} /></Link>
          </SideBox>

          <SideBox title="For authors">
            <p className="text-sm text-ink/80">Use the journal template, then submit online. Submission and review are free.</p>
            <ul id="templates" className="mt-3 space-y-2 text-sm">
              <li><a href="/templates/IJCST-manuscript-template.docx" className="flex items-center gap-2 font-medium text-link hover:underline"><Icon name="download" size={15} />Word template (.docx)</a></li>
              <li><Link href="/for-authors" className="flex items-center gap-2 font-medium text-link hover:underline"><Icon name="file" size={15} />Submission guidelines</Link></li>
            </ul>
            <Link href="/submit" className="btn-accent mt-4 w-full">Submit manuscript</Link>
            <Link href="/author/dashboard" className="btn-secondary mt-2 w-full">Track your submission</Link>
          </SideBox>

          <SideBox title="Journal updates">
            {announcements.length ? (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <Link href={`/announcements/${a.slug}`} className="text-[15px] font-medium leading-snug hover:text-link hover:underline">{a.title}</Link>
                    <div className="text-xs text-muted">{formatDate(a.publishedAt)}{a.isSample && " · sample"}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No updates yet.</p>}
            <Link href="/announcements" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">All updates <Icon name="arrowRight" size={13} /></Link>
          </SideBox>

          <SideBox title="Stay informed">
            <p className="text-sm text-ink/80">Get an email when a new article is published, or follow us by RSS.</p>
            <Link href="/alerts" className="btn-accent mt-3 w-full"><Icon name="bell" size={15} />Sign up for alerts</Link>
            <a href="/feed.xml" className="btn-secondary mt-2 w-full"><Icon name="rss" size={15} />RSS feed</a>
          </SideBox>
        </aside>
      </div>

      <section className="border-t border-line bg-surface">
        <div className="container-x grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="kicker">Publish with us</p>
            <h2 className="mt-1 font-display text-[28px] font-semibold">Ready to submit your research?</h2>
            <p className="mt-2 max-w-2xl text-ink/75">We accept research articles, reviews, short communications and case studies. Use our template and submit online.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/submit" className="btn-accent px-6 py-3">Submit manuscript</Link>
            <Link href="/for-authors" className="btn-secondary px-6 py-3">Author guidelines</Link>
          </div>
        </div>
      </section>
    </>
  );
}
