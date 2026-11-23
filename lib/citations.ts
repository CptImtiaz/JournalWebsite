import { splitName, splitKeywords, escapeXml } from "./utils";

export type CiteArticle = {
  title: string;
  slug: string;
  abstract: string;
  keywords: string;
  doi: string | null;
  doiRegistered: boolean;
  pages: string | null;
  articleNumber: string | null;
  publishedAt: Date | null;
  authors: { fullName: string; givenName?: string | null; familyName?: string | null }[];
  issue: { number: number; year: number; volume: { number: number } } | null;
};
export type CiteJournal = { name: string; abbreviation?: string | null; eIssn?: string | null; printIssn?: string | null; publisherName?: string | null };

function names(a: CiteArticle) {
  return a.authors.map((x) => {
    const s = splitName(x.fullName);
    const given = x.givenName || s.given;
    const family = x.familyName || s.family;
    const initials = given.split(/[\s-]+/).filter(Boolean).map((g) => g[0].toUpperCase() + ".");
    return { given, family, initials };
  });
}
const year = (a: CiteArticle) => (a.publishedAt ? new Date(a.publishedAt).getUTCFullYear() : a.issue?.year ?? "n.d.");
const vol = (a: CiteArticle) => a.issue?.volume.number;
const iss = (a: CiteArticle) => a.issue?.number;
const loc = (a: CiteArticle) => a.pages || a.articleNumber || "";
const doiUrl = (a: CiteArticle) => (a.doi && a.doiRegistered ? `https://doi.org/${a.doi}` : "");

function joinList(xs: string[], last = ", & ") {
  if (xs.length <= 1) return xs.join("");
  return xs.slice(0, -1).join(", ") + last + xs[xs.length - 1];
}

export function apa(a: CiteArticle, j: CiteJournal) {
  const au = joinList(names(a).map((n) => `${n.family}, ${n.initials.join(" ")}`));
  let s = `${au} (${year(a)}). ${a.title}. ${j.name}`;
  if (vol(a)) s += `, ${vol(a)}(${iss(a)})`;
  if (loc(a)) s += `, ${loc(a)}`;
  s += ".";
  if (doiUrl(a)) s += ` ${doiUrl(a)}`;
  return s;
}
export function ieee(a: CiteArticle, j: CiteJournal) {
  const au = joinList(names(a).map((n) => `${n.initials.join(" ")} ${n.family}`), ", and ");
  let s = `${au}, "${a.title}," ${j.abbreviation || j.name}`;
  if (vol(a)) s += `, vol. ${vol(a)}, no. ${iss(a)}`;
  if (a.pages) s += `, pp. ${a.pages}`;
  else if (a.articleNumber) s += `, Art. no. ${a.articleNumber}`;
  s += `, ${year(a)}`;
  if (a.doi && a.doiRegistered) s += `, doi: ${a.doi}`;
  return s + ".";
}
export function harvard(a: CiteArticle, j: CiteJournal) {
  const au = joinList(names(a).map((n) => `${n.family}, ${n.initials.join("")}`), " and ");
  let s = `${au} (${year(a)}) '${a.title}', ${j.name}`;
  if (vol(a)) s += `, ${vol(a)}(${iss(a)})`;
  if (a.pages) s += `, pp. ${a.pages}`;
  s += ".";
  if (doiUrl(a)) s += ` Available at: ${doiUrl(a)}.`;
  return s;
}
export function vancouver(a: CiteArticle, j: CiteJournal) {
  const ns = names(a).map((n) => `${n.family} ${n.initials.join("").replace(/\./g, "")}`);
  const au = ns.length > 6 ? ns.slice(0, 6).join(", ") + ", et al" : ns.join(", ");
  let s = `${au}. ${a.title}. ${j.abbreviation || j.name}. ${year(a)}`;
  if (vol(a)) s += `;${vol(a)}(${iss(a)})`;
  if (loc(a)) s += `:${loc(a)}`;
  s += ".";
  if (a.doi && a.doiRegistered) s += ` doi:${a.doi}`;
  return s;
}
export function bibtex(a: CiteArticle, j: CiteJournal) {
  const first = names(a)[0]?.family?.toLowerCase().replace(/[^a-z]/g, "") || "article";
  const f: [string, string | number | undefined][] = [
    ["title", `{${a.title}}`],
    ["author", names(a).map((n) => `${n.family}, ${n.given}`).join(" and ")],
    ["journal", j.name],
    ["year", year(a)],
    ["volume", vol(a)],
    ["number", iss(a)],
    ["pages", a.pages?.replace("-", "--") ?? undefined],
    ["eid", a.articleNumber ?? undefined],
    ["doi", a.doi && a.doiRegistered ? a.doi : undefined],
    ["issn", j.eIssn ?? j.printIssn ?? undefined],
    ["publisher", j.publisherName ?? undefined],
    ["keywords", splitKeywords(a.keywords).join(", ")],
  ];
  return `@article{${first}${year(a)},\n` + f.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `  ${k} = {${v}}`).join(",\n") + "\n}\n";
}
export function ris(a: CiteArticle, j: CiteJournal, url: string) {
  const L = ["TY  - JOUR", `TI  - ${a.title}`];
  for (const n of names(a)) L.push(`AU  - ${n.family}, ${n.given}`);
  L.push(`JO  - ${j.name}`);
  if (j.abbreviation) L.push(`J2  - ${j.abbreviation}`);
  L.push(`PY  - ${year(a)}`);
  if (a.publishedAt) L.push(`DA  - ${new Date(a.publishedAt).toISOString().slice(0, 10).replace(/-/g, "/")}`);
  if (vol(a)) L.push(`VL  - ${vol(a)}`, `IS  - ${iss(a)}`);
  if (a.pages) {
    const [sp, ep] = a.pages.split(/[-–]/);
    L.push(`SP  - ${sp}`);
    if (ep) L.push(`EP  - ${ep}`);
  } else if (a.articleNumber) L.push(`SP  - ${a.articleNumber}`);
  if (a.doi && a.doiRegistered) L.push(`DO  - ${a.doi}`);
  if (j.eIssn || j.printIssn) L.push(`SN  - ${j.eIssn || j.printIssn}`);
  if (j.publisherName) L.push(`PB  - ${j.publisherName}`);
  for (const k of splitKeywords(a.keywords)) L.push(`KW  - ${k}`);
  L.push(`AB  - ${a.abstract.replace(/\s+/g, " ")}`, `UR  - ${url}`, "ER  - ", "");
  return L.join("\r\n");
}

export const FORMATS = {
  apa: { label: "APA", fn: apa },
  ieee: { label: "IEEE", fn: ieee },
  harvard: { label: "Harvard", fn: harvard },
  vancouver: { label: "Vancouver", fn: vancouver },
} as const;

export { escapeXml };
