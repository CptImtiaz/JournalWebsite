"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { nextManuscriptCode } from "@/lib/manuscripts";
import { sendTemplate, editorialOfficeEmails } from "@/lib/email";
import { audit } from "@/lib/audit";
import { back } from "@/lib/actions-util";
import { str, optStr, bool, appUrl, normalizeOrcid, splitKeywords } from "@/lib/utils";
import { ARTICLE_TYPES, MANUSCRIPT_EXT, SUPPLEMENTARY_EXT } from "@/lib/constants";

type AuthorIn = { fullName: string; email: string; affiliation: string; country: string; orcid: string };

export async function submitManuscript(fd: FormData) {
  const u = await requireUser("/author/submit");
  const B = "/author/submit";
  const title = str(fd, "title"), abstract = str(fd, "abstract"), keywords = str(fd, "keywords"), articleType = str(fd, "articleType"), categoryId = str(fd, "categoryId");
  const conflictOfInterest = str(fd, "conflictOfInterest"), fundingStatement = str(fd, "fundingStatement");
  if (!title || !abstract || !keywords || !categoryId) back(B, { error: "Title, abstract, keywords and research field are required." });
  if (!ARTICLE_TYPES.includes(articleType)) back(B, { error: "Please choose an article type." });
  if (splitKeywords(keywords).length < 3) back(B, { error: "Please provide at least 3 keywords, separated by commas or semicolons." });
  if (!conflictOfInterest || !fundingStatement) back(B, { error: "Conflict of interest and funding declarations are required." });
  if (!bool(fd, "originality")) back(B, { error: "You must confirm the originality declaration." });
  const ethicsRequired = bool(fd, "ethicsApprovalRequired");
  if (ethicsRequired && !str(fd, "ethicsStatement")) back(B, { error: "Please provide ethics approval details." });

  let authors: AuthorIn[] = [];
  try { authors = JSON.parse(str(fd, "authorsJson")); } catch {}
  authors = authors.filter((a) => a.fullName?.trim());
  if (!authors.length) back(B, { error: "At least one author is required." });
  for (const a of authors) {
    if (!a.email?.includes("@") || !a.affiliation?.trim()) back(B, { error: `Author "${a.fullName}" needs an email and institutional affiliation.` });
    if (a.orcid?.trim() && !normalizeOrcid(a.orcid)) back(B, { error: `ORCID for "${a.fullName}" is not valid.` });
  }
  const corr = Math.min(Math.max(parseInt(str(fd, "correspondingIndex"), 10) || 0, 0), authors.length - 1);
  const category = await db.researchCategory.findUnique({ where: { id: categoryId } });
  if (!category) back(B, { error: "Invalid research field." });

  const manuscriptFile = fd.get("manuscriptFile");
  if (!isRealFile(manuscriptFile)) back(B, { error: "Please upload the manuscript file (DOC, DOCX or PDF)." });
  const supp = fd.getAll("supplementaryFiles").filter(isRealFile);
  const coverFile = fd.get("coverLetterFile");

  const stored: { fileId: string; kind: string }[] = [];
  try {
    stored.push({ fileId: (await storeFile(manuscriptFile, { allowed: MANUSCRIPT_EXT, folder: "manuscripts", uploadedById: u.id })).id, kind: "MANUSCRIPT" });
    for (const s of supp) stored.push({ fileId: (await storeFile(s, { allowed: SUPPLEMENTARY_EXT, folder: "manuscripts", uploadedById: u.id })).id, kind: "SUPPLEMENTARY" });
    if (isRealFile(coverFile)) stored.push({ fileId: (await storeFile(coverFile, { allowed: MANUSCRIPT_EXT, folder: "manuscripts", uploadedById: u.id })).id, kind: "COVER_LETTER" });
  } catch (e) {
    if (e instanceof UploadError) back(B, { error: e.message });
    throw e;
  }

  let m = null;
  for (let attempt = 0; attempt < 5 && !m; attempt++) {
    try {
      m = await db.manuscript.create({
        data: {
          code: await nextManuscriptCode(),
          title, abstract, keywords, articleType, categoryId, submitterId: u.id,
          coverLetter: optStr(fd, "coverLetter"), conflictOfInterest, fundingStatement,
          ethicsApprovalRequired: ethicsRequired, ethicsStatement: ethicsRequired ? optStr(fd, "ethicsStatement") : null,
          originalityDeclared: true, aiUsageDisclosure: optStr(fd, "aiUsageDisclosure"),
          authors: { create: authors.map((a, i) => ({ order: i + 1, fullName: a.fullName.trim(), email: a.email.trim().toLowerCase(), affiliation: a.affiliation.trim(), country: a.country?.trim() || null, orcid: normalizeOrcid(a.orcid), isCorresponding: i === corr })) },
          files: { create: stored.map((s) => ({ fileId: s.fileId, kind: s.kind, revision: 0 })) },
          statusEvents: { create: [{ status: "SUBMITTED", actorId: u.id, note: "Manuscript submitted" }] },
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!m) back(B, { error: "Could not allocate a manuscript ID. Please try again." });
  await audit(u.id, "manuscript.submitted", "Manuscript", m.id, { code: m.code });
  const url = `${appUrl()}/author/manuscripts/${m.id}`;
  await sendTemplate("submission_confirmation", u.email, { name: u.fullName, title, manuscript_id: m.code, url });
  await sendTemplate("new_submission_office", await editorialOfficeEmails(), { title, manuscript_id: m.code, article_type: articleType, url: `${appUrl()}/editor/manuscripts/${m.id}` });
  redirect(`/author/manuscripts/${m.id}?ok=${encodeURIComponent(`Submission received. Your manuscript ID is ${m.code}.`)}`);
}
