import "server-only";
import { escapeXml, splitName, appUrl } from "./utils";
import { stripHtml } from "./markdown";

type A = {
  id: string; slug: string; title: string; abstract: string; doi: string | null; pages: string | null; articleNumber: string | null;
  publishedAt: Date | null; licenseUrl: string | null;
  authors: { fullName: string; givenName: string | null; familyName: string | null; affiliation: string | null; orcid: string | null; rorId: string | null; order: number }[];
  references: { order: number; citation: string; doi: string | null }[];
  issue: { number: number; year: number; publishedAt: Date | null; volume: { number: number } } | null;
};
type J = { name: string; abbreviation: string | null; eIssn: string | null; printIssn: string | null; crossrefDepositorName: string | null; crossrefDepositorEmail: string | null; publisherName: string | null; licenseUrl: string | null };

function dateParts(d: Date | null) {
  if (!d) return "";
  const x = new Date(d);
  return `<month>${String(x.getUTCMonth() + 1).padStart(2, "0")}</month><day>${String(x.getUTCDate()).padStart(2, "0")}</day><year>${x.getUTCFullYear()}</year>`;
}

/** Builds a Crossref 5.3.1 journal-article deposit. */
export function buildCrossrefXml(a: A, j: J, batchId: string) {
  if (!a.doi) throw new Error("Article has no DOI set.");
  const url = `${appUrl()}/article/${a.slug}`;
  const ts = Date.now();
  const contributors = a.authors
    .sort((x, y) => x.order - y.order)
    .map((au, i) => {
      const s = splitName(au.fullName);
      return `<person_name sequence="${i === 0 ? "first" : "additional"}" contributor_role="author">
          <given_name>${escapeXml(au.givenName || s.given || "")}</given_name><surname>${escapeXml(au.familyName || s.family)}</surname>
          ${au.affiliation ? `<affiliations><institution>${au.rorId ? `<institution_id type="ror">${escapeXml(au.rorId)}</institution_id>` : `<institution_name>${escapeXml(au.affiliation)}</institution_name>`}</institution></affiliations>` : ""}
          ${au.orcid ? `<ORCID>https://orcid.org/${escapeXml(au.orcid)}</ORCID>` : ""}
        </person_name>`;
    })
    .join("\n");
  const [first, last] = (a.pages ?? "").split(/[-–]/);
  const refs = a.references.length
    ? `<citation_list>${a.references.map((r) => `<citation key="ref${r.order}">${r.doi ? `<doi>${escapeXml(r.doi)}</doi>` : ""}<unstructured_citation>${escapeXml(stripHtml(r.citation))}</unstructured_citation></citation>`).join("")}</citation_list>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="5.3.1" xmlns="http://www.crossref.org/schema/5.3.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:jats="http://www.ncbi.nlm.nih.gov/JATS1" xmlns:ai="http://www.crossref.org/AccessIndicators.xsd"
  xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 http://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>${escapeXml(batchId)}</doi_batch_id>
    <timestamp>${ts}</timestamp>
    <depositor><depositor_name>${escapeXml(j.crossrefDepositorName || j.publisherName || j.name)}</depositor_name><email_address>${escapeXml(j.crossrefDepositorEmail || "")}</email_address></depositor>
    <registrant>${escapeXml(j.publisherName || j.name)}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${escapeXml(j.name)}</full_title>
        ${j.abbreviation ? `<abbrev_title>${escapeXml(j.abbreviation)}</abbrev_title>` : ""}
        ${j.eIssn ? `<issn media_type="electronic">${escapeXml(j.eIssn)}</issn>` : ""}
        ${j.printIssn ? `<issn media_type="print">${escapeXml(j.printIssn)}</issn>` : ""}
      </journal_metadata>
      ${a.issue ? `<journal_issue><publication_date media_type="online">${dateParts(a.issue.publishedAt ?? a.publishedAt)}</publication_date><journal_volume><volume>${a.issue.volume.number}</volume></journal_volume><issue>${a.issue.number}</issue></journal_issue>` : ""}
      <journal_article publication_type="full_text" language="en">
        <titles><title>${escapeXml(a.title)}</title></titles>
        <contributors>${contributors}</contributors>
        <jats:abstract><jats:p>${escapeXml(stripHtml(a.abstract))}</jats:p></jats:abstract>
        <publication_date media_type="online">${dateParts(a.publishedAt)}</publication_date>
        ${first ? `<pages><first_page>${escapeXml(first)}</first_page>${last ? `<last_page>${escapeXml(last)}</last_page>` : ""}</pages>` : ""}
        ${!first && a.articleNumber ? `<publisher_item><item_number item_number_type="article_number">${escapeXml(a.articleNumber)}</item_number></publisher_item>` : ""}
        ${(a.licenseUrl || j.licenseUrl) ? `<ai:program name="AccessIndicators"><ai:free_to_read/><ai:license_ref applies_to="vor">${escapeXml(a.licenseUrl || j.licenseUrl!)}</ai:license_ref></ai:program>` : ""}
        <doi_data><doi>${escapeXml(a.doi)}</doi><resource>${escapeXml(url)}</resource></doi_data>
        ${refs}
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

export function crossrefConfigured() {
  return !!(process.env.CROSSREF_USERNAME && process.env.CROSSREF_PASSWORD);
}

/** Submits a deposit to Crossref's deposit endpoint (test or production). */
export async function submitDeposit(xml: string, batchId: string, test: boolean) {
  if (!crossrefConfigured()) throw new Error("Crossref credentials are not configured (CROSSREF_USERNAME / CROSSREF_PASSWORD).");
  const endpoint = test ? "https://test.crossref.org/servlet/deposit" : "https://doi.crossref.org/servlet/deposit";
  const fd = new FormData();
  fd.set("operation", "doMDUpload");
  fd.set("login_id", process.env.CROSSREF_USERNAME!);
  fd.set("login_passwd", process.env.CROSSREF_PASSWORD!);
  fd.set("fname", new Blob([xml], { type: "application/xml" }), `${batchId}.xml`);
  const r = await fetch(endpoint, { method: "POST", body: fd });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text: text.slice(0, 5000) };
}

/** Checks whether the DOI actually resolves through doi.org and is known to Crossref. */
export async function checkDoi(doi: string) {
  const out: { resolves: boolean; target?: string; crossref: boolean; detail: string } = { resolves: false, crossref: false, detail: "" };
  try {
    const r = await fetch(`https://doi.org/api/handles/${encodeURIComponent(doi)}`, { cache: "no-store" });
    const j = await r.json();
    if (j.responseCode === 1) {
      out.resolves = true;
      out.target = j.values?.find((v: { type: string }) => v.type === "URL")?.data?.value;
    }
    out.detail += `doi.org handle responseCode=${j.responseCode}. `;
  } catch (e) {
    out.detail += `doi.org lookup failed: ${(e as Error).message}. `;
  }
  try {
    const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { cache: "no-store" });
    out.crossref = r.ok;
    out.detail += `Crossref REST API status=${r.status}.`;
  } catch (e) {
    out.detail += `Crossref lookup failed: ${(e as Error).message}.`;
  }
  return out;
}
