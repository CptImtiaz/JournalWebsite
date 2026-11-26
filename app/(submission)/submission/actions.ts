"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { storeFile, isRealFile, UploadError, deleteStoredFile } from "@/lib/storage";
import { nextManuscriptCode } from "@/lib/manuscripts";
import { sendTemplate, editorialOfficeEmails } from "@/lib/email";
import { audit } from "@/lib/audit";
import { str, bool, appUrl, normalizeOrcid } from "@/lib/utils";
import { ARTICLE_TYPES, MANUSCRIPT_EXT, SUPPLEMENTARY_EXT } from "@/lib/constants";
import { loadDraft, stepComplete, extractFromDocx, type DraftData, type DraftAuthor, type DraftReviewer } from "@/lib/submission";

function go(id: string, step: number, msg?: { ok?: string; error?: string }): never {
  const q = new URLSearchParams({ step: String(step) });
  if (msg?.ok) q.set("ok", msg.ok);
  if (msg?.error) q.set("error", msg.error);
  redirect(`/submission/${id}?${q}`);
}
const json = <T,>(raw: string, fallback: T): T => { try { return JSON.parse(raw) as T; } catch { return fallback; } };
const cleanRev = (rows: DraftReviewer[], max: number) => rows.filter((r) => r.name?.trim()).slice(0, max).map((r) => ({ name: r.name.slice(0, 200), email: (r.email ?? "").slice(0, 200), institution: (r.institution ?? "").slice(0, 300), reason: (r.reason ?? "").slice(0, 500) }));

export async function startSubmission() {
  const u = await requireUser("/submission");
  const d = await db.submissionDraft.create({
    data: { userId: u.id, data: { authors: [{ fullName: u.fullName, email: u.email, affiliation: u.affiliation ?? "", country: u.country ?? "", orcid: u.orcid ?? "" }], correspondingIndex: 0 } },
  });
  redirect(`/submission/${d.id}?step=1`);
}

export async function saveStep(fd: FormData) {
  const u = await requireUser();
  const id = str(fd, "id"), step = parseInt(str(fd, "step"), 10) || 1, nav = str(fd, "nav") || "next";
  const d = await loadDraft(id, u.id);
  if (!d) redirect("/author/dashboard?error=Submission+not+found.");
  const x: DraftData = { ...d.data };
  const upd: { manuscriptFileId?: string | null; coverLetterFileId?: string | null; supplementaryFileIds?: string[] } = {};
  try {
    if (step === 1) {
      const t = str(fd, "articleType"); if (ARTICLE_TYPES.includes(t)) x.articleType = t;
      x.categoryId = str(fd, "categoryId") || x.categoryId;
      const mf = fd.get("manuscriptFile");
      if (isRealFile(mf)) {
        const f = await storeFile(mf, { allowed: MANUSCRIPT_EXT, folder: "drafts", uploadedById: u.id });
        if (d.manuscriptFileId) await deleteStoredFile(d.manuscriptFileId);
        upd.manuscriptFileId = f.id;
      }
      const supp = fd.getAll("supplementaryFiles").filter(isRealFile);
      if (supp.length) {
        const ids = [...d.supplementaryFileIds];
        for (const s of supp) ids.push((await storeFile(s, { allowed: SUPPLEMENTARY_EXT, folder: "drafts", uploadedById: u.id })).id);
        upd.supplementaryFileIds = ids;
      }
    }
    if (step === 2) { x.title = str(fd, "title").slice(0, 500); x.abstract = str(fd, "abstract").slice(0, 5000); x.keywords = str(fd, "keywords").slice(0, 500); }
    if (step === 3) {
      x.authors = json<DraftAuthor[]>(str(fd, "authorsJson"), x.authors ?? []).filter((a) => a.fullName?.trim() || a.email?.trim()).slice(0, 40);
      x.correspondingIndex = Math.min(Math.max(parseInt(str(fd, "correspondingIndex"), 10) || 0, 0), Math.max((x.authors.length || 1) - 1, 0));
    }
    if (step === 4) {
      x.coverLetter = str(fd, "coverLetter").slice(0, 10000); x.previouslySubmitted = str(fd, "previouslySubmitted").slice(0, 100);
      x.suggested = cleanRev(json<DraftReviewer[]>(str(fd, "suggestedJson"), []), 5); x.opposed = cleanRev(json<DraftReviewer[]>(str(fd, "opposedJson"), []), 3);
      const cf = fd.get("coverLetterFile");
      if (isRealFile(cf)) { const f = await storeFile(cf, { allowed: MANUSCRIPT_EXT, folder: "drafts", uploadedById: u.id }); if (d.coverLetterFileId) await deleteStoredFile(d.coverLetterFileId); upd.coverLetterFileId = f.id; }
    }
    if (step === 5) {
      x.conflictOfInterest = str(fd, "conflictOfInterest"); x.fundingStatement = str(fd, "fundingStatement");
      x.ethicsApprovalRequired = bool(fd, "ethicsApprovalRequired"); x.ethicsStatement = str(fd, "ethicsStatement");
      x.dataAvailability = str(fd, "dataAvailability"); x.aiUsageDisclosure = str(fd, "aiUsageDisclosure");
      x.originality = bool(fd, "originality"); x.authorsAgree = bool(fd, "authorsAgree"); x.policies = bool(fd, "policies");
    }
  } catch (e) {
    if (e instanceof UploadError) go(id, step, { error: e.message });
    throw e;
  }
  await db.submissionDraft.update({ where: { id }, data: { data: x, ...upd } });
  if (nav === "back") go(id, Math.max(1, step - 1));
  if (nav === "stay") go(id, step, { ok: "Draft saved." });
  if (nav.startsWith("goto:")) go(id, parseInt(nav.slice(5), 10) || step);
  if (nav === "exit") redirect("/submission?ok=Your+submission+is+saved.+Continue+it+any+time+from+this+page.");
  const fresh = await loadDraft(id, u.id);
  if (fresh && step < 6 && step !== 4 && !stepComplete(fresh, step)) go(id, step, { error: "Please complete the required fields before continuing." });
  go(id, Math.min(6, step + 1));
}

export async function fillFromManuscript(fd: FormData) {
  const u = await requireUser();
  const id = str(fd, "id");
  const d = await loadDraft(id, u.id);
  if (!d?.manuscriptFileId) go(id, 2, { error: "Upload a Word manuscript first." });
  const r = await extractFromDocx(d.manuscriptFileId);
  if (!r || (!r.title && !r.abstract)) go(id, 2, { error: "We could not read a title or abstract from this file. Please enter them below." });
  await db.submissionDraft.update({ where: { id }, data: { data: { ...d.data, title: r.title || d.data.title, abstract: r.abstract || d.data.abstract, keywords: r.keywords || d.data.keywords } } });
  go(id, 2, { ok: "Filled in from your manuscript. Please check the details." });
}

export async function removeDraftFile(fd: FormData) {
  const u = await requireUser();
  const id = str(fd, "id"), fileId = str(fd, "fileId"), step = parseInt(str(fd, "step"), 10) || 1;
  const d = await loadDraft(id, u.id);
  if (!d) redirect("/author/dashboard");
  const data: { manuscriptFileId?: null; coverLetterFileId?: null; supplementaryFileIds?: string[] } = {};
  if (d.manuscriptFileId === fileId) data.manuscriptFileId = null;
  else if (d.coverLetterFileId === fileId) data.coverLetterFileId = null;
  else if (d.supplementaryFileIds.includes(fileId)) data.supplementaryFileIds = d.supplementaryFileIds.filter((x) => x !== fileId);
  else go(id, step);
  await db.submissionDraft.update({ where: { id }, data });
  await deleteStoredFile(fileId);
  await db.storedFile.delete({ where: { id: fileId } }).catch(() => {});
  go(id, step, { ok: "File removed." });
}

export async function deleteDraft(fd: FormData) {
  const u = await requireUser();
  const d = await loadDraft(str(fd, "id"), u.id);
  if (d) {
    for (const f of [d.manuscriptFileId, d.coverLetterFileId, ...d.supplementaryFileIds].filter(Boolean) as string[]) { await deleteStoredFile(f); await db.storedFile.delete({ where: { id: f } }).catch(() => {}); }
    await db.submissionDraft.delete({ where: { id: d.id } });
  }
  redirect("/submission?ok=Draft+deleted.");
}

export async function submitDraft(fd: FormData) {
  const u = await requireUser();
  const id = str(fd, "id");
  const d = await loadDraft(id, u.id);
  if (!d) redirect("/author/dashboard");
  for (const n of [1, 2, 3, 5]) if (!stepComplete(d, n)) go(id, n, { error: "This section is incomplete. Please finish it before submitting." });
  const x = d.data;
  const authors = x.authors!;
  const corr = x.correspondingIndex ?? 0;
  const files = [
    { fileId: d.manuscriptFileId!, kind: "MANUSCRIPT" },
    ...d.supplementaryFileIds.map((f) => ({ fileId: f, kind: "SUPPLEMENTARY" })),
    ...(d.coverLetterFileId ? [{ fileId: d.coverLetterFileId, kind: "COVER_LETTER" }] : []),
  ];
  let m = null;
  for (let attempt = 0; attempt < 5 && !m; attempt++) {
    try {
      m = await db.manuscript.create({
        data: {
          code: await nextManuscriptCode(), title: x.title!, abstract: x.abstract!, keywords: x.keywords!, articleType: x.articleType!, categoryId: x.categoryId!, submitterId: u.id,
          coverLetter: x.coverLetter || null, conflictOfInterest: x.conflictOfInterest!, fundingStatement: x.fundingStatement!,
          ethicsApprovalRequired: !!x.ethicsApprovalRequired, ethicsStatement: x.ethicsApprovalRequired ? x.ethicsStatement || null : null,
          originalityDeclared: true, aiUsageDisclosure: x.aiUsageDisclosure || null, dataAvailability: x.dataAvailability || null, previouslySubmitted: x.previouslySubmitted || null,
          suggestedReviewers: x.suggested ?? [], opposedReviewers: x.opposed ?? [],
          authors: { create: authors.map((a, i) => ({ order: i + 1, fullName: a.fullName.trim(), email: a.email.trim().toLowerCase(), affiliation: a.affiliation.trim(), country: a.country?.trim() || null, orcid: normalizeOrcid(a.orcid), isCorresponding: i === corr })) },
          files: { create: files.map((f) => ({ ...f, revision: 0 })) },
          statusEvents: { create: [{ status: "SUBMITTED", actorId: u.id, note: "Manuscript submitted" }] },
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!m) go(id, 6, { error: "Could not allocate a manuscript ID. Please try again." });
  await db.submissionDraft.delete({ where: { id } });
  await audit(u.id, "manuscript.submitted", "Manuscript", m.id, { code: m.code });
  await sendTemplate("submission_confirmation", u.email, { name: u.fullName, title: m.title, manuscript_id: m.code, url: `${appUrl()}/author/manuscripts/${m.id}` });
  await sendTemplate("new_submission_office", await editorialOfficeEmails(), { title: m.title, manuscript_id: m.code, article_type: m.articleType, url: `${appUrl()}/editor/manuscripts/${m.id}` });
  redirect(`/submission/${m.id}/done`);
}
