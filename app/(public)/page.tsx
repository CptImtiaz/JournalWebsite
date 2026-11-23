import Link from "next/link";
import { db } from "@/lib/db";
import { getJournal, getCurrentIssue, homepageOf, fileUrl, issuePath } from "@/lib/journal";
import { latestArticles } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";
import { Empty } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Logo } from "@/components/site";
import { IssueCover } from "@/components/issue-cover";

export default async function Home() {
  const j = await getJournal();
  const hp = homepageOf(j);
  const [issue, latest, announcements, categories] = await Promise.all([
    getCurrentIssue(),
    latestArticles(6),
    db.announcement.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="container-x relative grid items-center gap-10 py-16 lg:grid-cols-[1.4fr_1fr] lg:py-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Logo size={52} logoUrl={fileUrl(j.logoFileId)} />
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9cc3ee]">{j.name}</div>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {hp.headline || j.tagline || "Advancing Research in Computing and Emerging Technologies."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{hp.description || j.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/submit" className="btn bg-white text-navy hover:bg-brand-light">Submit Manuscript</Link>
              <Link href="/articles" className="btn border border-white/40 text-white hover:bg-white/10">Browse Articles</Link>
            </div>
            {issue && (
              <p className="mt-6 text-sm text-white/70">
                Current issue: <Link className="underline underline-offset-2 hover:text-white" href={issuePath(issue)}>Volume {issue.volume.number}, Issue {issue.number} ({issue.year})</Link>
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 text-sm">
            {[
              ["Review model", "Double-anonymous peer review"],
              ["Access", j.isOpenAccess ? `Open access${j.licenseName ? ` · ${j.licenseName}` : ""}` : "Subscription"],
              ["Frequency", j.publicationFrequency || "—"],
              ["Scope", "Computer Science & IT"],
              ...(j.eIssn ? [["e-ISSN", j.eIssn]] : []),
              ...(j.printIssn ? [["Print ISSN", j.printIssn]] : []),
            ].map(([k, v]) => (
              <div key={k} className="bg-navy/95 p-4">
                <dt className="text-xs uppercase tracking-wider text-white/60">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-x grid gap-12 py-14 lg:grid-cols-[1fr_340px]">
        <div className="space-y-14">
          {/* Latest articles */}
          <section aria-labelledby="latest">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-3">
              <h2 id="latest" className="text-xl font-semibold text-navy">Latest Published Articles</h2>
              <Link href="/articles" className="link text-sm">View all articles →</Link>
            </div>
            {latest.length ? (
              <div className="grid gap-5 md:grid-cols-2">{latest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            ) : (
              <Empty title="No articles published yet">The first articles will appear here once they complete peer review. <Link className="link" href="/submit">Submit your manuscript</Link>.</Empty>
            )}
          </section>

          {/* Current issue */}
          <section aria-labelledby="current">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-3">
              <h2 id="current" className="text-xl font-semibold text-navy">Current Issue</h2>
              <Link href="/archives" className="link text-sm">Browse archives →</Link>
            </div>
            {issue ? (
              <div className="card grid gap-6 p-5 sm:grid-cols-[160px_1fr]">
                <IssueCover issue={issue} />
                <div>
                  <h3 className="text-lg font-semibold text-navy">
                    <Link href={issuePath(issue)} className="hover:text-brand">Volume {issue.volume.number}, Issue {issue.number} ({issue.year})</Link>
                  </h3>
                  {issue.title && <p className="text-sm text-muted">{issue.title}</p>}
                  <p className="mt-1 text-sm text-muted">{issue.articles.length} article{issue.articles.length === 1 ? "" : "s"}{issue.publishedAt ? ` · Published ${formatDate(issue.publishedAt)}` : ""}</p>
                  <ol className="mt-4 space-y-2 text-sm">
                    {issue.articles.slice(0, 6).map((a) => (
                      <li key={a.id}>
                        <Link href={`/article/${a.slug}`} className="font-medium text-ink hover:text-brand">{a.title}</Link>
                        <div className="text-xs text-muted">{a.authors.map((x) => x.fullName).join(", ")}{a.pages ? ` · pp. ${a.pages}` : ""}</div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={issuePath(issue)} className="btn-primary btn-sm">Table of contents</Link>
                    {issue.pdfFileId && <a href={`/api/files/${issue.pdfFileId}`} className="btn-secondary btn-sm">Download issue PDF</a>}
                  </div>
                </div>
              </div>
            ) : (
              <Empty title="The first issue is in preparation" />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-semibold text-navy">Journal Information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Info k="Peer review" v="Double-anonymous" />
              <Info k="Open access" v={j.isOpenAccess ? "Yes — free to read" : "No"} />
              {j.licenseName && <Info k="Licence" v={j.licenseName} />}
              {j.publicationFrequency && <Info k="Frequency" v={j.publicationFrequency} />}
              {j.printIssn && <Info k="Print ISSN" v={j.printIssn} />}
              {j.eIssn && <Info k="e-ISSN" v={j.eIssn} />}
              {j.issnL && <Info k="ISSN-L" v={j.issnL} />}
              {j.publisherName && <Info k="Publisher" v={j.publisherName} />}
              {j.publicationCountry && <Info k="Country" v={j.publicationCountry} />}
              {j.contactEmail && <Info k="Editorial contact" v={<a className="link" href={`mailto:${j.contactEmail}`}>{j.contactEmail}</a>} />}
            </dl>
            <Link href="/about" className="link mt-4 inline-block text-sm">About the journal →</Link>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-navy">For Authors</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="link" href="/for-authors">Submission guidelines</Link></li>
              <li><Link className="link" href="/peer-review">Peer review process</Link></li>
              <li><Link className="link" href="/publication-fees">Publication fees</Link></li>
              <li><Link className="link" href="/author/dashboard">Track your manuscript</Link></li>
            </ul>
            <Link href="/submit" className="btn-primary mt-4 w-full">Submit Manuscript</Link>
          </section>

          {categories.length > 0 && (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-navy">Research Areas</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}><Link href={`/articles?category=${c.slug}`} className="inline-block rounded-full border border-line px-3 py-1 text-xs hover:border-brand hover:text-brand">{c.name}</Link></li>
                ))}
              </ul>
              <Link href="/aims-scope" className="link mt-3 inline-block text-sm">Full aims & scope →</Link>
            </section>
          )}

          {announcements.length > 0 && (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-navy">Announcements</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <Link href={`/announcements/${a.slug}`} className="font-medium hover:text-brand">{a.title}</Link>
                    <div className="text-xs text-muted">{formatDate(a.publishedAt)}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}

