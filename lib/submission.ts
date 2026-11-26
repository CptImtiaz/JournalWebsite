import "server-only";
import mammoth from "mammoth";
import { db } from "./db";
import { readFileStream } from "./storage";
import { normalizeOrcid, splitKeywords } from "./utils";

export type DraftAuthor = { fullName: string; email: string; affiliation: string; country: string; orcid: string };
export type DraftReviewer = { name: string; email: string; institution: string; reason: string };
export type DraftData = {
  articleType?: string; categoryId?: string; title?: string; abstract?: string; keywords?: string;
  authors?: DraftAuthor[]; correspondingIndex?: number;
  coverLetter?: string; previouslySubmitted?: string; suggested?: DraftReviewer[]; opposed?: DraftReviewer[];
  conflictOfInterest?: string; fundingStatement?: string; ethicsApprovalRequired?: boolean; ethicsStatement?: string;
  dataAvailability?: string; aiUsageDisclosure?: string; originality?: boolean; authorsAgree?: boolean; policies?: boolean;
};

export const STEPS = [
  { n: 1, key: "files", title: "Type and files", help: "Choose the article type and research field, then upload your anonymised manuscript. Word files let us fill in the title and abstract for you." },
  { n: 2, key: "details", title: "Title and abstract", help: "Use a concise, specific title. The abstract should be one paragraph of 150 to 300 words with no citations." },
  { n: 3, key: "authors", title: "Authors", help: "List every author in publication order and choose one corresponding author. Reviewers never see this information." },
  { n: 4, key: "additional", title: "Additional information", help: "Add a cover letter and, if you wish, suggest or exclude reviewers. Suggested reviewers must be independent of you and your coauthors." },
  { n: 5, key: "declarations", title: "Declarations", help: "Every submission needs statements on competing interests, funding and, where relevant, ethics approval." },
  { n: 6, key: "review", title: "Review and submit", help: "Check everything carefully. After submission you will receive a manuscript ID and a confirmation email." },
] as const;

export type Draft = NonNullable<Awaited<ReturnType<typeof loadDraft>>>;

export async function loadDraft(id: string, userId: string) {
  const d = await db.submissionDraft.findFirst({ where: { id, userId } });
  if (!d) return null;
  const ids = [d.manuscriptFileId, d.coverLetterFileId, ...d.supplementaryFileIds].filter(Boolean) as string[];
  const files = await db.storedFile.findMany({ where: { id: { in: ids } } });
  return { ...d, data: (d.data ?? {}) as DraftData, files: Object.fromEntries(files.map((f) => [f.id, f])) };
}

export function stepComplete(d: Draft, n: number): boolean {
  const x = d.data;
  switch (n) {
    case 1: return !!(x.articleType && x.categoryId && d.manuscriptFileId);
    case 2: return !!(x.title?.trim() && x.abstract?.trim() && splitKeywords(x.keywords ?? "").length >= 3);
    case 3: return !!x.authors?.length && x.authors.every((a) => a.fullName?.trim() && a.email?.includes("@") && a.affiliation?.trim() && (!a.orcid?.trim() || normalizeOrcid(a.orcid)));
    case 4: return true;
    case 5: return !!(x.conflictOfInterest?.trim() && x.fundingStatement?.trim() && x.originality && x.authorsAgree && x.policies && (!x.ethicsApprovalRequired || x.ethicsStatement?.trim()));
    case 6: return [1, 2, 3, 4, 5].every((k) => stepComplete(d, k));
    default: return false;
  }
}

/** Reads a DOCX manuscript and guesses title, abstract and keywords (works well with the IJCST template). */
export async function extractFromDocx(fileId: string) {
  const f = await db.storedFile.findUnique({ where: { id: fileId } });
  if (!f || !f.originalName.toLowerCase().endsWith(".docx")) return null;
  const stream = await readFileStream(f.storageKey);
  if (!stream) return null;
  const buf = Buffer.from(await new Response(stream).arrayBuffer());
  const { value } = await mammoth.extractRawText({ buffer: buf });
  const paras = value.split(/\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const skip = /^(\[?guidance|ijcst|international journal|article type|research article|title of the manuscript|preprint|submitted to|running head)/i;
  const authorish = /[¹²³⁴⁵⁶⁷⁸⁹⁰*†‡]|@|corresponding author|orcid|department of|university|institute|faculty of|school of/i;
  let abstract = "", keywords = "";
  const ai = paras.findIndex((p) => /^abstract\b/i.test(p));
  const head = ai > 0 ? paras.slice(0, ai) : paras.slice(0, 8);
  const title = head.find((p) => p.length > 15 && p.length < 300 && !skip.test(p) && !authorish.test(p) && !/[.:]$/.test(p));
  if (ai >= 0) {
    const inline = paras[ai].replace(/^abstract[\s:.\-–—]*/i, "");
    const parts = inline ? [inline] : [];
    for (let i = ai + 1; i < paras.length && i < ai + 6; i++) {
      if (/^(keywords|index terms|key words)\b/i.test(paras[i]) || /^(1\.?\s|i\.\s|introduction\b)/i.test(paras[i])) break;
      parts.push(paras[i]);
    }
    abstract = parts.join("\n\n");
  }
  const kw = paras.find((p) => /^(keywords|index terms|key words)\b/i.test(p));
  if (kw) keywords = kw.replace(/^(keywords|index terms|key words)[\s:.\-–—]*/i, "").replace(/\s*,\s*/g, "; ");
  return { title: title ?? "", abstract, keywords };
}
