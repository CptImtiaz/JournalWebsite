import Link from "next/link";
import { db } from "@/lib/db";
import { getJournal, getCurrentIssue, homepageOf, issuePath } from "@/lib/journal";
import { latestArticles } from "@/lib/queries";
import { ArticleFeature, ArticleRow } from "@/components/article-card";
import { IssueCover } from "@/components/issue-cover";
import { Icon, type IconName } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export default async function Home() {
  const j = await getJournal();
  const hp = homepageOf(j);
  const [issue, latest, announcements, categories, board] = await Promise.all([
    getCurrentIssue(),
    latestArticles(9),
    db.announcement.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { articles: { where: { status: "PUBLISHED" } } } } } }),
    db.editorialBoardMember.findFirst({ where: { isPublished: true, position: "EDITOR_IN_CHIEF" } }),
  ]);
  const [lead, ...rest] = latest;
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
  const facts: [IconName, string, string][] = [
    ["shield", "Double-anonymous peer review", "Every research article is assessed by independent experts who do not know the authors' identities."],
    ["globe", j.isOpenAccess ? `Open access · ${j.licenseName ?? "CC BY"}` : "Global readership", "Articles are free to read, download and share immediately on publication."],
    ["link", "Permanent scholarly record", "Stable article URLs, rich metadata for indexing services, and DOI registration through Crossref."],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Masthead */}
      <section className="border-b border-line">
        <div className="container-x grid items-end gap-8 py-10 lg:grid-cols-[1fr_auto] lg:py-14">
          <div className="max-w-3xl">
            <p className="kicker">{j.shortName} · Computer Science & Information Technology</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
              {hp.headline || j.tagline || "Advancing Research in Computing and Emerging Technologies."}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/75">{hp.description || j.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/submit" className="btn-primary px-5 py-2.5">Submit manuscript <Icon name="arrowRight" size={16} /></Link>
              <Link href="/articles" className="btn-secondary px-5 py-2.5">Browse articles</Link>
            </div>
          </div>
          {issue && (
            <Link href={issuePath(issue)} className="group hidden w-44 lg:block">
              <IssueCover issue={issue} />
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">Current issue</p>
              <p className="text-sm font-semibold text-ink group-hover:text-brand">Volume {issue.volume.number}, Issue {issue.number} · {issue.year}</p>
            </Link>
          )}
        </div>
      </section>

      {/* Latest research */}
      <section className="container-x py-12" aria-labelledby="latest">
        <div className="rule-top mb-8 flex items-end justify-between">
          <h2 id="latest" className="section-title">Latest research</h2>
          <Link href="/articles" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">View all articles <Icon name="arrowRight" size={14} /></Link>
        </div>
        {lead ? (
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
            <ArticleFeature a={lead} />
            <div className="lg:border-l lg:border-line lg:pl-10">
              {rest.slice(0, 4).map((a) => <ArticleRow key={a.id} a={a} />)}
              {rest.length === 0 && <p className="text-sm text-muted">More articles will appear here as they are published.</p>}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 rounded-xl border border-line bg-surface p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="font-display text-2xl font-semibold">The first articles are in peer review</h3>
              <p className="mt-2 max-w-xl text-ink/75">We are now accepting submissions for our inaugural issue. Original research, reviews and short communications across computer science and IT are welcome.</p>
            </div>
            <Link href="/submit" className="btn-primary px-5 py-2.5">Submit your work</Link>
          </div>
        )}
        {rest.length > 4 && (
          <div className="mt-10 grid gap-x-10 border-t border-line pt-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.slice(4).map((a) => <ArticleRow key={a.id} a={a} />)}
          </div>
        )}
      </section>

      {/* Current issue */}
      {issue && (
        <section className="bg-surface py-12" aria-labelledby="issue">
          <div className="container-x">
            <div className="rule-top mb-8 flex items-end justify-between">
              <h2 id="issue" className="section-title">Current issue</h2>
              <Link href="/archives" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">Browse all issues <Icon name="arrowRight" size={14} /></Link>
            </div>
            <div className="grid gap-10 md:grid-cols-[200px_1fr]">
              <div>
                <IssueCover issue={issue} />
                <div className="mt-3 space-y-2">
                  <Link href={issuePath(issue)} className="btn-primary w-full">Table of contents</Link>
                  {issue.pdfFileId && <a href={`/api/files/${issue.pdfFileId}`} className="btn-secondary w-full"><Icon name="download" size={15} /> Issue PDF</a>}
                </div>
              </div>
              <div>
                <p className="kicker">Volume {issue.volume.number} · Issue {issue.number} · {issue.year}</p>
                {issue.title && <h3 className="mt-1 font-display text-2xl font-semibold">{issue.title}</h3>}
                <p className="mt-1 text-sm text-muted">{issue.articles.length} article{issue.articles.length === 1 ? "" : "s"}{issue.publishedAt ? ` · Published ${formatDate(issue.publishedAt)}` : ""}</p>
                <ol className="mt-5 divide-y divide-line border-y border-line bg-white">
                  {issue.articles.slice(0, 6).map((a, i) => (
                    <li key={a.id} className="flex gap-4 px-4 py-3">
                      <span className="w-6 shrink-0 font-display text-lg text-muted">{i + 1}</span>
                      <div>
                        <Link href={`/article/${a.slug}`} className="font-display text-[17px] font-semibold leading-snug hover:text-brand">{a.title}</Link>
                        <div className="text-xs text-muted">{a.authors.map((x) => x.fullName).join(", ")}{a.pages ? ` · pp. ${a.pages}` : ""}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Subjects */}
      <section className="container-x py-12" aria-labelledby="subjects">
        <div className="rule-top mb-8 flex items-end justify-between">
          <h2 id="subjects" className="section-title">Explore by subject</h2>
          <Link href="/aims-scope" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">Aims & scope <Icon name="arrowRight" size={14} /></Link>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id} className="bg-white">
              <Link href={`/articles?category=${c.slug}`} className="group flex h-full items-center justify-between gap-3 px-5 py-4 hover:bg-surface">
                <span className="font-medium text-ink group-hover:text-brand">{c.name}</span>
                <span className="shrink-0 text-xs text-muted">{c._count.articles > 0 ? `${c._count.articles} article${c._count.articles === 1 ? "" : "s"}` : <Icon name="arrowRight" size={14} />}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Publish with us */}
      <section className="bg-navy text-white">
        <div className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9cc3ee]">Publish with us</p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">Share your research with the global computing community</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/submit" className="btn bg-white text-navy hover:bg-brand-light">Submit manuscript</Link>
              <Link href="/for-authors" className="btn border border-white/40 text-white hover:bg-white/10">Author guidelines</Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {facts.map(([icon, t, d]) => (
              <div key={t} className="border-t border-white/20 pt-4">
                <Icon name={icon} size={22} className="text-[#9cc3ee]" />
                <h3 className="mt-3 font-semibold text-white">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info + news */}
      <section className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_1fr_1fr]">
        <div>
          <h2 className="rule-top mb-4 font-display text-xl font-semibold">Journal information</h2>
          <dl className="divide-y divide-line text-sm">
            {[
              ["Peer review", "Double-anonymous"],
              ["Access", j.isOpenAccess ? "Open access" : "—"],
              ["Licence", j.licenseName],
              ["Frequency", j.publicationFrequency],
              ["Print ISSN", j.printIssn],
              ["eISSN", j.eIssn],
              ["Publisher", j.publisherName],
              ["Editor-in-Chief", board?.fullName],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="rule-top mb-4 font-display text-xl font-semibold">For authors</h2>
          <ul className="space-y-3 text-sm">
            {[["Submission guidelines", "/for-authors", "file"], ["Peer review process", "/peer-review", "review"], ["Publication ethics", "/publication-ethics", "shield"], ["AI usage policy", "/ai-usage-policy", "activity"], ["Publication fees", "/publication-fees", "tag"], ["Track your manuscript", "/author/dashboard", "clock"]].map(([l, h, i]) => (
              <li key={h}><Link href={h} className="flex items-center gap-2 font-medium text-ink hover:text-brand"><Icon name={i as IconName} size={16} className="text-brand" />{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="rule-top mb-4 font-display text-xl font-semibold">Announcements</h2>
          {announcements.length ? (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li key={a.id}>
                  <time className="text-xs text-muted">{formatDate(a.publishedAt)}</time>
                  <Link href={`/announcements/${a.slug}`} className="block font-display text-[17px] font-semibold leading-snug hover:text-brand">{a.title}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No announcements yet. Follow the <Link className="link" href="/feed.xml">RSS feed</Link> for new articles.</p>}
        </div>
      </section>
    </>
  );
}
