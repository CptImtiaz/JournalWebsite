import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicArticle, doiRegistered, toCite } from "@/lib/article";
import { getJournal } from "@/lib/journal";
import { db } from "@/lib/db";
import { FORMATS } from "@/lib/citations";
import { appUrl, formatDate, splitKeywords, fileSize } from "@/lib/utils";
import { sanitize, renderMarkdown, withHeadingIds, headingsOf } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/ui";
import { Icon } from "@/components/icons";
import { IssueCover } from "@/components/issue-cover";
import { CopyButton } from "@/components/client";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const [a, j] = await Promise.all([getPublicArticle(slug), getJournal()]);
  if (!a) return {};
  const url = `${appUrl()}/article/${a.slug}`;
  const reg = doiRegistered(a);
  const pdf = a.files.find((f) => f.kind === "PDF");
  const [fp, lp] = (a.pages ?? "").split(/[-–]/);
  const d = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : undefined;
  const other: Record<string, string | string[]> = {
    citation_title: a.title,
    citation_author: a.authors.map((x) => x.fullName),
    citation_author_institution: a.authors.map((x) => x.affiliation ?? ""),
    citation_journal_title: j.name,
    citation_publisher: j.publisherName ?? j.name,
    citation_language: "en",
    citation_abstract_html_url: url,
    citation_keywords: splitKeywords(a.keywords).join("; "),
    "DC.title": a.title,
    "DC.creator": a.authors.map((x) => x.fullName),
    "DC.type": "Text.Serial.Journal",
    "DC.format": "text/html",
    "DC.language": "en",
    "DC.identifier": reg ? `doi:${a.doi}` : url,
    "DC.source": j.name,
    "DC.rights": a.licenseUrl ?? j.licenseUrl ?? "",
    "DC.description": a.abstract.slice(0, 500),
    "DC.subject": splitKeywords(a.keywords),
  };
  if (d) { other.citation_publication_date = d.replace(/-/g, "/"); other.citation_online_date = d.replace(/-/g, "/"); other["DC.date"] = d; }
  if (j.eIssn || j.printIssn) other.citation_issn = [j.eIssn, j.printIssn].filter(Boolean) as string[];
  if (a.issue) { other.citation_volume = String(a.issue.volume.number); other.citation_issue = String(a.issue.number); }
  if (fp) other.citation_firstpage = fp;
  if (lp) other.citation_lastpage = lp;
  if (reg) other.citation_doi = a.doi!;
  if (pdf) other.citation_pdf_url = `${appUrl()}/api/articles/${a.slug}/pdf`;
  if (j.publisherName) other["DC.publisher"] = j.publisherName;
  if (a.isSample) return { title: `${a.title} (sample)`, description: a.abstract.slice(0, 200), robots: { index: false, follow: false } };
  return {
    title: a.title,
    description: a.seoDescription || a.abstract.slice(0, 200),
    alternates: { canonical: `/article/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.abstract.slice(0, 200), url, publishedTime: a.publishedAt?.toISOString(), authors: a.authors.map((x) => x.fullName) },
    other,
  };
}

export default async function ArticlePage({ params }: P) {
  const { slug } = await params;
  const [a, j] = await Promise.all([getPublicArticle(slug), getJournal()]);
  if (!a) notFound();
  await db.article.update({ where: { id: a.id }, data: { views: { increment: 1 } } });

  const url = `${appUrl()}/article/${a.slug}`;
  const reg = doiRegistered(a);
  const pdf = a.files.find((f) => f.kind === "PDF");
  const others = a.files.filter((f) => f.kind !== "PDF");
  const figures = others.filter((f) => f.kind === "FIGURE" && !(a.bodyHtml ?? "").includes(f.fileId));
  const supp = others.filter((f) => f.kind !== "FIGURE");
  const cite = toCite(a);
  const affs = [...new Set(a.authors.map((x) => x.affiliation).filter(Boolean))] as string[];
  const corr = a.authors.find((x) => x.isCorresponding);
  const lic = a.licenseName ?? j.licenseName;
  const licUrl = a.licenseUrl ?? j.licenseUrl;
  const body = a.bodyHtml ? withHeadingIds(sanitize(a.bodyHtml)) : "";
  const sections = [
    { id: "abstract", label: "Abstract" },
    ...headingsOf(body),
    ...(figures.length ? [{ id: "figures", label: "Figures" }] : []),
    ...(a.references.length ? [{ id: "references", label: "References" }] : []),
    { id: "declarations", label: "Declarations" },
    ...(supp.length ? [{ id: "supplementary", label: "Supplementary information" }] : []),
    { id: "rights", label: "Rights and permissions" },
    { id: "about", label: "About this article" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: a.title.slice(0, 110),
    name: a.title,
    abstract: a.abstract,
    keywords: splitKeywords(a.keywords),
    datePublished: a.publishedAt?.toISOString(),
    url,
    ...(reg ? { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: a.doi }, sameAs: `https://doi.org/${a.doi}` } : {}),
    author: a.authors.map((x) => ({
      "@type": "Person",
      name: x.fullName,
      ...(x.affiliation ? { affiliation: { "@type": "Organization", name: x.affiliation, ...(x.rorId ? { identifier: x.rorId } : {}) } } : {}),
      ...(x.orcid ? { identifier: `https://orcid.org/${x.orcid}` } : {}),
    })),
    isPartOf: a.issue
      ? { "@type": "PublicationIssue", issueNumber: a.issue.number, isPartOf: { "@type": "PublicationVolume", volumeNumber: a.issue.volume.number, isPartOf: { "@type": "Periodical", name: j.name, ...(j.eIssn || j.printIssn ? { issn: [j.eIssn, j.printIssn].filter(Boolean) } : {}) } } }
      : { "@type": "Periodical", name: j.name },
    ...(a.pages ? { pagination: a.pages } : {}),
    ...(licUrl ? { license: licUrl } : {}),
    isAccessibleForFree: j.isOpenAccess,
    ...(j.publisherName ? { publisher: { "@type": "Organization", name: j.publisherName } } : {}),
  };
  const shareText = encodeURIComponent(a.title);
  const shareUrl = encodeURIComponent(url);
  const H2 = "scroll-mt-24 font-display text-2xl font-semibold text-ink";

  return (
    <>
      {!a.isSample && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <div className="container-x pt-6">
        <Breadcrumbs items={[{ label: "Articles", href: "/articles" }, ...(a.issue ? [{ label: `Volume ${a.issue.volume.number}, Issue ${a.issue.number}`, href: `/archives/${a.issue.year}/${a.issue.slug}` }] : []), { label: "Article" }]} />
      </div>

      <div className="container-x grid gap-10 py-8 lg:grid-cols-[1fr_300px] xl:grid-cols-[200px_1fr_300px]">
        {/* Section navigation */}
        <nav aria-label="Article sections" className="hidden xl:block">
          <div className="sticky top-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Sections</p>
            <ul className="space-y-1 border-l border-line text-sm">
              {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-ink/80 hover:border-brand hover:text-brand">{s.label}</a></li>)}
            </ul>
          </div>
        </nav>

        <article className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-x-2 text-xs">
              <span className="font-bold text-ink">{a.articleType}</span>
              {j.isOpenAccess && <><span className="text-line">|</span><span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><Icon name="lock" size={12} />Open access</span></>}
              {a.publishedAt && <><span className="text-line">|</span><span className="text-muted">Published: {formatDate(a.publishedAt, { day: "numeric", month: "long", year: "numeric" })}</span></>}
            </div>
            {a.isSample && (
              <div className="mt-4 flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><Icon name="alert" size={18} className="mt-0.5 shrink-0" /><span><strong>Sample article.</strong> This is demonstration content showing how articles appear on this website. It is not a peer reviewed publication; authors and institutions are fictional.</span></div>
            )}
            {a.status === "RETRACTED" && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>This article has been retracted.</strong> See the journal&apos;s <Link className="underline" href="/retraction-policy">Retraction Policy</Link>.</div>
            )}
            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-[42px]">{a.title}</h1>
            <p className="mt-5 text-[15px] leading-relaxed text-ink">
              {a.authors.length === 0 && <span className="text-muted">Author details are being verified.</span>}
              {a.authors.map((x, i) => (
                <span key={x.id}>
                  <span className="font-medium">{x.fullName}</span>
                  {x.affiliation && <sup className="ml-0.5 text-brand">{affs.indexOf(x.affiliation) + 1}</sup>}
                  {x.isCorresponding && <a href="#corresponding" title="Corresponding author" className="ml-0.5 text-brand"><Icon name="mail" size={13} className="inline" /></a>}
                  {x.orcid && <a href={`https://orcid.org/${x.orcid}`} className="ml-1 inline-flex align-middle" title={`ORCID ${x.orcid}`} target="_blank" rel="noopener"><span className="rounded-full bg-[#A6CE39] px-1 text-[9px] font-bold leading-[14px] text-white">iD</span></a>}
                  {i < a.authors.length - 1 && ", "}
                </span>
              ))}
            </p>
            <p className="mt-3 text-sm text-muted">
              <em className="font-display text-base not-italic text-ink">{j.name}</em>
              {a.issue && <> <strong className="text-ink">{a.issue.volume.number}</strong>, {a.issue.number}</>}
              {a.pages ? `, ${a.pages}` : ""}{a.articleNumber ? `, ${a.articleNumber}` : ""} ({a.issue?.year ?? (a.publishedAt ? new Date(a.publishedAt).getUTCFullYear() : "")})
              {reg && <> · <a className="link" href={`https://doi.org/${a.doi}`}>https://doi.org/{a.doi}</a></>}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-6 border-y border-line py-3 text-sm">
              <span><strong className="text-ink">{(a.views + 1).toLocaleString()}</strong> <span className="text-muted">Accesses</span></span>
              <span><strong className="text-ink">{a.downloads.toLocaleString()}</strong> <span className="text-muted">Downloads</span></span>
              <a href="#about" className="link ml-auto">Cite this article</a>
            </div>
          </header>

          <section id="abstract" className="mt-8 scroll-mt-24">
            <h2 className={H2}>Abstract</h2>
            <p className="mt-4 font-serif text-[18px] leading-[1.7] text-ink">{a.abstract}</p>
          </section>

          {body && <section aria-label="Main text" className="mt-10 prose prose-slate prose-lg max-w-none font-serif prose-headings:scroll-mt-24 prose-figcaption:text-sm prose-figcaption:text-left prose-table:text-sm [&_.table-wrap]:overflow-x-auto [&_math[display=block]]:my-3 [&_math[display=block]]:overflow-x-auto prose-headings:font-display prose-headings:text-ink prose-h2:text-2xl prose-a:text-link prose-img:rounded" dangerouslySetInnerHTML={{ __html: body }} />}

          {figures.length > 0 && (
            <section id="figures" className="mt-12 scroll-mt-24">
              <h2 className={H2}>Figures</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {figures.map((f) => (
                  <figure key={f.id} className="rounded-lg border border-line p-3">
                    <a href={`/api/files/${f.fileId}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/files/${f.fileId}`} alt={f.label ?? "Figure"} loading="lazy" className="w-full rounded" />
                    </a>
                    {f.label && <figcaption className="mt-2 text-sm"><strong>{f.label}</strong></figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {a.references.length > 0 && (
            <section id="references" className="mt-12 scroll-mt-24">
              <h2 className={H2}>References</h2>
              <ol className="mt-5 space-y-4">
                {a.references.map((r) => (
                  <li key={r.id} id={`ref${r.order}`} className="grid grid-cols-[2rem_1fr] gap-2 text-[15px] leading-relaxed">
                    <span className="text-muted">{r.order}.</span>
                    <div>
                      <span className="font-serif" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.citation).replace(/^<p>|<\/p>\s*$/g, "") }} />
                      <div className="mt-1 flex gap-3 text-xs">
                        {r.doi && <a className="link" href={`https://doi.org/${r.doi}`}>Article</a>}
                        <a className="link" href={`https://scholar.google.com/scholar?q=${encodeURIComponent(r.citation.slice(0, 250))}`} target="_blank" rel="noopener">Google Scholar</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="declarations" className="mt-12 scroll-mt-24 space-y-5 text-[15px]">
            <h2 className={H2}>Declarations</h2>
            {a.fundingStatement && <div><h3 className="font-semibold">Funding</h3><p className="mt-1 text-ink/80">{a.fundingStatement}</p></div>}
            {a.conflictOfInterest && <div><h3 className="font-semibold">Competing interests</h3><p className="mt-1 text-ink/80">{a.conflictOfInterest}</p></div>}
            {a.dataAvailability && <div><h3 className="font-semibold">Data availability</h3><p className="mt-1 text-ink/80">{a.dataAvailability}</p></div>}
            <div id="corresponding" className="scroll-mt-24">
              <h3 className="font-semibold">Author information</h3>
              {affs.length === 0 && <p className="mt-1 text-ink/80">Author details are being verified.</p>}
              <ol className="mt-1 space-y-0.5 text-ink/80">{affs.map((af, i) => <li key={af}><sup>{i + 1}</sup> {af}</li>)}</ol>
              {corr && <p className="mt-2 text-ink/80">Correspondence to {corr.fullName}{corr.email ? <> (<a className="link" href={`mailto:${corr.email}`}>{corr.email}</a>)</> : null}.</p>}
            </div>
          </section>

          {supp.length > 0 && (
            <section id="supplementary" className="mt-12 scroll-mt-24">
              <h2 className={H2}>Supplementary information</h2>
              <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
                {supp.map((f) => <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="flex items-center gap-2"><Icon name="file" size={16} className="text-muted" />{f.label || f.file.originalName}</span><a className="link" href={`/api/files/${f.fileId}`}>Download ({fileSize(f.file.size)})</a></li>)}
              </ul>
            </section>
          )}

          <section id="rights" className="mt-12 scroll-mt-24 text-[15px]">
            <h2 className={H2}>Rights and permissions</h2>
            <p className="mt-3 text-ink/80">
              {lic ? <><strong>Open Access.</strong> This article is licensed under the {licUrl ? <a className="link" href={licUrl} rel="license noopener" target="_blank">{lic}</a> : lic} licence, which permits use, sharing, adaptation, distribution and reproduction in any medium or format, as long as you give appropriate credit to the original author(s) and the source.</> : "All rights reserved."}
            </p>
            <p className="mt-2 text-sm text-muted">© {a.publishedAt ? new Date(a.publishedAt).getUTCFullYear() : ""} {a.copyrightHolder || "The Author(s)"}</p>
          </section>

          <section id="about" className="mt-12 scroll-mt-24">
            <h2 className={H2}>About this article</h2>
            <div className="mt-5 grid gap-6 rounded-lg border border-line p-5 sm:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-sm font-semibold">Cite this article</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/85">{FORMATS.apa.fn(cite, j)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/cite?format=ris`}><Icon name="download" size={13} />RIS</a>
                  <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/cite?format=bibtex`}><Icon name="download" size={13} />BibTeX</a>
                  <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/jats`}><Icon name="download" size={13} />JATS XML</a>
                </div>
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-medium text-brand">Other citation styles</summary>
                  <div className="mt-3 space-y-3">
                    {Object.entries(FORMATS).filter(([k]) => k !== "apa").map(([k, f]) => {
                      const text = f.fn(cite, j);
                      return <div key={k}><p className="text-xs font-bold uppercase tracking-wide text-muted">{f.label}</p><p className="mt-1">{text}</p><div className="mt-1"><CopyButton text={text} /></div></div>;
                    })}
                  </div>
                </details>
              </div>
              {a.issue && <Link href={`/archives/${a.issue.year}/${a.issue.slug}`} className="hidden w-24 sm:block"><IssueCover issue={a.issue} /></Link>}
            </div>
            <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
              {a.receivedAt && <div><dt className="text-muted">Received</dt><dd className="font-medium">{formatDate(a.receivedAt)}</dd></div>}
              {a.acceptedAt && <div><dt className="text-muted">Accepted</dt><dd className="font-medium">{formatDate(a.acceptedAt)}</dd></div>}
              {a.publishedAt && <div><dt className="text-muted">Published</dt><dd className="font-medium">{formatDate(a.publishedAt)}</dd></div>}
              {a.issue && <div><dt className="text-muted">Issue date</dt><dd className="font-medium">{formatDate(a.issue.publishedAt ?? a.publishedAt, { month: "long", year: "numeric" })}</dd></div>}
              {reg && <div className="sm:col-span-2"><dt className="text-muted">DOI</dt><dd className="font-medium"><a className="link" href={`https://doi.org/${a.doi}`}>https://doi.org/{a.doi}</a></dd></div>}
            </dl>
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Keywords</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {splitKeywords(a.keywords).map((k) => <li key={k}><Link href={`/articles?q=${encodeURIComponent(k)}`} className="inline-block rounded-full border border-line px-3 py-1 text-xs hover:border-brand hover:text-brand">{k}</Link></li>)}
              </ul>
            </div>
          </section>
        </article>

        {/* Right rail */}
        <aside className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="space-y-2">
              {pdf ? (
                <>
                  <a href={`/api/articles/${a.slug}/pdf`} className="btn-primary w-full py-3 text-base"><Icon name="download" size={18} /> Download PDF</a>
                  <a href={`/api/articles/${a.slug}/pdf?inline=1`} target="_blank" className="btn-secondary w-full">View PDF in browser{pdf.file ? ` · ${fileSize(pdf.file.size)}` : ""}</a>
                </>
              ) : <p className="rounded-md bg-surface p-3 text-sm text-muted">PDF version in preparation.</p>}
            </div>

            <div className="rounded-lg border border-line p-4">
              <h2 className="text-sm font-semibold">Share this article</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}>LinkedIn</a>
                <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${shareText}&url=${shareUrl}`}>X</a>
                <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}>Facebook</a>
                <a className="btn-secondary btn-sm" href={`mailto:?subject=${shareText}&body=${shareUrl}`}>Email</a>
                <CopyButton text={url} label="Copy link" />
              </div>
            </div>

            {a.category && (
              <div className="rounded-lg border border-line p-4">
                <h2 className="text-sm font-semibold">Subject</h2>
                <Link href={`/articles?category=${a.category.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">{a.category.name} <Icon name="arrowRight" size={13} /></Link>
              </div>
            )}

            <div className="rounded-lg bg-navy p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9cc3ee]">Publish with us</p>
              <p className="mt-2 font-display text-lg font-semibold leading-snug">Submit your research to {j.shortName}</p>
              <Link href="/submit" className="btn mt-4 w-full bg-white text-navy hover:bg-brand-light">Submit manuscript</Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
