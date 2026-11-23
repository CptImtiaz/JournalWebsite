import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicArticle, doiRegistered, toCite } from "@/lib/article";
import { getJournal } from "@/lib/journal";
import { db } from "@/lib/db";
import { FORMATS } from "@/lib/citations";
import { appUrl, formatDate, splitKeywords, fileSize } from "@/lib/utils";
import { sanitize, renderMarkdown } from "@/lib/markdown";
import { Badge, Breadcrumbs } from "@/components/ui";
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
  const cite = toCite(a);
  const affs = [...new Set(a.authors.map((x) => x.affiliation).filter(Boolean))] as string[];
  const corr = a.authors.find((x) => x.isCorresponding);
  const lic = a.licenseName ?? j.licenseName;
  const licUrl = a.licenseUrl ?? j.licenseUrl;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="border-b border-line bg-surface">
        <div className="container-x py-8">
          <Breadcrumbs items={[{ label: "Articles", href: "/articles" }, ...(a.issue ? [{ label: `Vol. ${a.issue.volume.number}, Iss. ${a.issue.number}`, href: `/archives/${a.issue.year}/${a.issue.slug}` }] : []), { label: a.title.length > 60 ? a.title.slice(0, 60) + "…" : a.title }]} />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="blue">{a.articleType}</Badge>
            {j.isOpenAccess && <Badge tone="green">Open Access</Badge>}
            {a.status === "RETRACTED" && <Badge tone="red">Retracted</Badge>}
            {a.category && <Link href={`/articles?category=${a.category.slug}`}><Badge>{a.category.name}</Badge></Link>}
          </div>
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-navy sm:text-3xl">{a.title}</h1>
          <p className="mt-4 text-base text-ink">
            {a.authors.map((x, i) => (
              <span key={x.id}>
                {x.fullName}
                {x.affiliation && <sup className="ml-0.5 text-brand">{affs.indexOf(x.affiliation) + 1}</sup>}
                {x.isCorresponding && <span title="Corresponding author" className="text-brand">*</span>}
                {x.orcid && <a href={`https://orcid.org/${x.orcid}`} className="ml-1 inline-flex align-middle" title={`ORCID ${x.orcid}`} target="_blank" rel="noopener"><span className="rounded bg-[#A6CE39] px-1 text-[10px] font-bold text-white">iD</span></a>}
                {i < a.authors.length - 1 && ", "}
              </span>
            ))}
          </p>
          <ol className="mt-2 space-y-0.5 text-sm text-muted">
            {affs.map((af, i) => <li key={af}><sup>{i + 1}</sup> {af}</li>)}
          </ol>
          {corr && <p className="mt-2 text-sm text-muted">* Corresponding author: {corr.fullName}{corr.email ? <> — <a className="link" href={`mailto:${corr.email}`}>{corr.email}</a></> : null}</p>}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span><span className="font-medium text-ink">{j.name}</span>{a.issue ? `, Vol. ${a.issue.volume.number}, Issue ${a.issue.number} (${a.issue.year})` : ""}{a.pages ? `, pp. ${a.pages}` : ""}{a.articleNumber ? `, Article ${a.articleNumber}` : ""}</span>
            {a.receivedAt && <span>Received {formatDate(a.receivedAt)}</span>}
            {a.acceptedAt && <span>Accepted {formatDate(a.acceptedAt)}</span>}
            {a.publishedAt && <span>Published {formatDate(a.publishedAt)}</span>}
          </div>
          {reg && <p className="mt-2 text-sm">DOI: <a className="link" href={`https://doi.org/${a.doi}`}>https://doi.org/{a.doi}</a></p>}
        </div>
      </div>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
        <article className="min-w-0">
          {a.status === "RETRACTED" && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">This article has been retracted. See the journal&apos;s <Link className="underline" href="/retraction-policy">Retraction Policy</Link>.</div>
          )}
          <section aria-labelledby="abstract">
            <h2 id="abstract" className="text-lg font-semibold text-navy">Abstract</h2>
            <p className="mt-3 font-serif text-[17px] leading-relaxed">{a.abstract}</p>
          </section>
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Keywords</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {splitKeywords(a.keywords).map((k) => <li key={k}><Link href={`/articles?q=${encodeURIComponent(k)}`} className="inline-block rounded-full border border-line px-3 py-1 text-xs hover:border-brand hover:text-brand">{k}</Link></li>)}
            </ul>
          </section>

          {a.bodyHtml && (
            <section className="mt-10 border-t border-line pt-8" aria-label="Full text">
              <div className="prose prose-slate prose-lg max-w-none font-serif prose-headings:font-sans prose-headings:text-navy prose-a:text-brand" dangerouslySetInnerHTML={{ __html: sanitize(a.bodyHtml) }} />
            </section>
          )}

          <section className="mt-10 space-y-4 border-t border-line pt-8 text-sm">
            <h2 className="text-lg font-semibold text-navy">Declarations</h2>
            {a.fundingStatement && <div><h3 className="font-semibold">Funding</h3><p className="text-muted">{a.fundingStatement}</p></div>}
            {a.conflictOfInterest && <div><h3 className="font-semibold">Conflict of interest</h3><p className="text-muted">{a.conflictOfInterest}</p></div>}
            {a.dataAvailability && <div><h3 className="font-semibold">Data availability</h3><p className="text-muted">{a.dataAvailability}</p></div>}
            <div>
              <h3 className="font-semibold">Copyright and licence</h3>
              <p className="text-muted">© {a.publishedAt ? new Date(a.publishedAt).getUTCFullYear() : ""} {a.copyrightHolder || "The Author(s)"}. {lic && <>This article is published under the {licUrl ? <a className="link" href={licUrl} rel="license noopener" target="_blank">{lic}</a> : lic} licence.</>}</p>
            </div>
          </section>

          {a.references.length > 0 && (
            <section className="mt-10 border-t border-line pt-8" aria-labelledby="refs">
              <h2 id="refs" className="text-lg font-semibold text-navy">References</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-6 font-serif text-[15px] leading-relaxed">
                {a.references.map((r) => (
                  <li key={r.id} id={`ref${r.order}`}>
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(r.citation).replace(/^<p>|<\/p>\s*$/g, "") }} />
                    {r.doi && <> <a className="link font-sans text-xs" href={`https://doi.org/${r.doi}`}>doi:{r.doi}</a></>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>

        <aside className="space-y-6">
          <div className="card space-y-2 p-5">
            {pdf ? <a href={`/api/articles/${a.slug}/pdf`} className="btn-primary w-full">Download PDF{pdf.file ? ` (${fileSize(pdf.file.size)})` : ""}</a> : <p className="text-sm text-muted">PDF not yet available.</p>}
            {pdf && <a href={`/api/articles/${a.slug}/pdf?inline=1`} target="_blank" className="btn-secondary w-full">View PDF in browser</a>}
            <div className="flex justify-around pt-3 text-center text-xs text-muted">
              <div><div className="text-lg font-semibold text-navy">{a.views + 1}</div>Views</div>
              <div><div className="text-lg font-semibold text-navy">{a.downloads}</div>Downloads</div>
            </div>
          </div>

          {others.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">Supplementary material, figures & tables</h2>
              <ul className="space-y-2 text-sm">
                {others.map((f) => <li key={f.id}><a className="link" href={`/api/files/${f.fileId}`}>{f.label || f.file.originalName}</a> <span className="text-xs text-muted">({fileSize(f.file.size)})</span></li>)}
              </ul>
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-navy">Cite this article</h2>
            <div className="space-y-3">
              {Object.entries(FORMATS).map(([k, f]) => {
                const text = f.fn(cite, j);
                return (
                  <details key={k} className="group text-sm">
                    <summary className="flex cursor-pointer items-center justify-between font-medium text-ink hover:text-brand">{f.label}<span className="text-muted group-open:rotate-180">⌄</span></summary>
                    <p className="mt-2 rounded bg-surface p-2 text-xs leading-relaxed">{text}</p>
                    <div className="mt-1"><CopyButton text={text} /></div>
                  </details>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
              <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/cite?format=bibtex`}>BibTeX</a>
              <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/cite?format=ris`}>RIS</a>
              <a className="btn-secondary btn-sm" href={`/api/articles/${a.slug}/jats`}>JATS XML</a>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-navy">Share</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}>LinkedIn</a>
              <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${shareText}&url=${shareUrl}`}>X</a>
              <a className="btn-secondary btn-sm" target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}>Facebook</a>
              <a className="btn-secondary btn-sm" href={`mailto:?subject=${shareText}&body=${shareUrl}`}>Email</a>
              <CopyButton text={url} label="Copy link" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
