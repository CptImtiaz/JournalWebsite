import { escapeXml, splitKeywords, splitName, appUrl } from "./utils";
import { stripHtml } from "./markdown";
import type { PublicArticle } from "./article";

type J = { name: string; abbreviation: string | null; eIssn: string | null; printIssn: string | null; publisherName: string | null; licenseUrl: string | null; licenseName: string | null };

export function buildJats(a: PublicArticle, j: J, doiOk: boolean) {
  const affs = [...new Set(a.authors.map((x) => x.affiliation).filter(Boolean))] as string[];
  const d = a.publishedAt ? new Date(a.publishedAt) : null;
  const [fp, lp] = (a.pages ?? "").split(/[-–]/);
  const lic = a.licenseUrl ?? j.licenseUrl;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.3 20210610//EN" "JATS-journalpublishing1-3.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="${escapeXml(a.articleType.toLowerCase().replace(/\s+/g, "-"))}" dtd-version="1.3" xml:lang="en">
  <front>
    <journal-meta>
      <journal-title-group><journal-title>${escapeXml(j.name)}</journal-title>${j.abbreviation ? `<abbrev-journal-title>${escapeXml(j.abbreviation)}</abbrev-journal-title>` : ""}</journal-title-group>
      ${j.eIssn ? `<issn pub-type="epub">${escapeXml(j.eIssn)}</issn>` : ""}${j.printIssn ? `<issn pub-type="ppub">${escapeXml(j.printIssn)}</issn>` : ""}
      ${j.publisherName ? `<publisher><publisher-name>${escapeXml(j.publisherName)}</publisher-name></publisher>` : ""}
    </journal-meta>
    <article-meta>
      ${doiOk && a.doi ? `<article-id pub-id-type="doi">${escapeXml(a.doi)}</article-id>` : ""}
      <article-categories><subj-group><subject>${escapeXml(a.articleType)}</subject></subj-group></article-categories>
      <title-group><article-title>${escapeXml(a.title)}</article-title></title-group>
      <contrib-group>
${a.authors.map((x) => { const s = splitName(x.fullName); return `        <contrib contrib-type="author"${x.isCorresponding ? ' corresp="yes"' : ""}>${x.orcid ? `<contrib-id contrib-id-type="orcid">https://orcid.org/${escapeXml(x.orcid)}</contrib-id>` : ""}<name><surname>${escapeXml(x.familyName || s.family)}</surname><given-names>${escapeXml(x.givenName || s.given)}</given-names></name>${x.affiliation ? `<xref ref-type="aff" rid="aff${affs.indexOf(x.affiliation) + 1}"/>` : ""}${x.email && x.isCorresponding ? `<email>${escapeXml(x.email)}</email>` : ""}</contrib>`; }).join("\n")}
      </contrib-group>
${affs.map((af, i) => `      <aff id="aff${i + 1}">${escapeXml(af)}</aff>`).join("\n")}
      ${d ? `<pub-date publication-format="electronic" date-type="pub"><day>${d.getUTCDate()}</day><month>${d.getUTCMonth() + 1}</month><year>${d.getUTCFullYear()}</year></pub-date>` : ""}
      ${a.issue ? `<volume>${a.issue.volume.number}</volume><issue>${a.issue.number}</issue>` : ""}
      ${fp ? `<fpage>${escapeXml(fp)}</fpage>` : ""}${lp ? `<lpage>${escapeXml(lp)}</lpage>` : ""}${a.articleNumber ? `<elocation-id>${escapeXml(a.articleNumber)}</elocation-id>` : ""}
      <permissions>${lic ? `<license xlink:href="${escapeXml(lic)}"><license-p>${escapeXml(a.licenseName ?? j.licenseName ?? "")}</license-p></license>` : ""}</permissions>
      <self-uri xlink:href="${escapeXml(`${appUrl()}/article/${a.slug}`)}"/>
      <abstract><p>${escapeXml(a.abstract)}</p></abstract>
      <kwd-group kwd-group-type="author">${splitKeywords(a.keywords).map((k) => `<kwd>${escapeXml(k)}</kwd>`).join("")}</kwd-group>
      ${a.fundingStatement ? `<funding-group><funding-statement>${escapeXml(a.fundingStatement)}</funding-statement></funding-group>` : ""}
    </article-meta>
  </front>
  <body>${a.bodyHtml ? `<sec><p>${escapeXml(stripHtml(a.bodyHtml))}</p></sec>` : ""}</body>
  <back>
    ${a.conflictOfInterest ? `<fn-group><fn fn-type="conflict"><p>${escapeXml(a.conflictOfInterest)}</p></fn></fn-group>` : ""}
    ${a.references.length ? `<ref-list>${a.references.map((r) => `<ref id="ref${r.order}"><mixed-citation>${escapeXml(stripHtml(r.citation))}${r.doi ? ` <pub-id pub-id-type="doi">${escapeXml(r.doi)}</pub-id>` : ""}</mixed-citation></ref>`).join("")}</ref-list>` : ""}
  </back>
</article>
`;
}
