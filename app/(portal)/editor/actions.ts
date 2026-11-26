"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, hashPassword, randomToken, createAuthToken, type CurrentUser } from "@/lib/auth";
import { canEditManuscript } from "@/lib/access";
import { setStatus } from "@/lib/manuscripts";
import { sendTemplate, editorialOfficeEmails } from "@/lib/email";
import { audit } from "@/lib/audit";
import { back } from "@/lib/actions-util";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { str, optStr, bool, appUrl, formatDate, slugify } from "@/lib/utils";
import { MANUSCRIPT_STATUSES, RECOMMENDATIONS, SUPPLEMENTARY_EXT, type ManuscriptStatus } from "@/lib/constants";

async function load(id: string) {
  const u = await requireUser();
  const m = await db.manuscript.findUnique({ where: { id }, include: { submitter: true, handlingEditor: true } });
  if (!m || !canEditManuscript(u, m)) redirect("/forbidden");
  return { u, m, here: `/editor/manuscripts/${id}` };
}
function need(u: CurrentUser, p: Parameters<CurrentUser["permissions"]["has"]>[0], here: string) {
  if (!u.permissions.has(p)) back(here, { error: "You do not have permission for this action." });
}

export async function changeStatusAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  const status = str(fd, "status") as ManuscriptStatus;
  const allowed: ManuscriptStatus[] = ["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW"];
  if (u.permissions.has("manuscripts.decide")) allowed.push("IN_PRODUCTION", "WITHDRAWN");
  if (!allowed.includes(status)) back(here, { error: "This status cannot be set manually." });
  await setStatus(m.id, status, u.id, optStr(fd, "note") ?? undefined);
  back(here, { ok: `Status changed to ${MANUSCRIPT_STATUSES[status]}.` });
}

export async function assignEditorAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  need(u, "manuscripts.assign_editor", here);
  const editorId = str(fd, "editorId");
  const ed = await db.user.findFirst({ where: { id: editorId, isActive: true, roles: { some: { role: { key: { in: ["EDITOR_IN_CHIEF", "MANAGING_EDITOR", "ASSOCIATE_EDITOR"] } } } } } });
  if (!ed) back(here, { error: "Select a valid editor." });
  await db.manuscript.update({ where: { id: m.id }, data: { handlingEditorId: ed.id } });
  if (["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR"].includes(m.status)) await setStatus(m.id, "EDITOR_ASSIGNED", u.id, `Assigned to ${ed.fullName}`, false);
  await audit(u.id, "manuscript.editor_assigned", "Manuscript", m.id, { editorId: ed.id });
  await sendTemplate("editor_assigned", ed.email, { name: ed.fullName, title: m.title, manuscript_id: m.code, url: `${appUrl()}${here}` });
  back(here, { ok: `${ed.fullName} assigned as handling editor.` });
}

async function inviteReviewerUser(reviewerId: string, m: { id: string; code: string; title: string; abstract: string; currentRevision: number }, u: CurrentUser, due: Date, here: string, accountHtml = "") {
  const exists = await db.reviewerAssignment.findFirst({ where: { manuscriptId: m.id, reviewerId, revision: m.currentRevision, status: { notIn: ["DECLINED", "CANCELLED"] } } });
  if (exists) back(here, { error: "This reviewer is already assigned for the current round." });
  const r = await db.user.findUniqueOrThrow({ where: { id: reviewerId } });
  const a = await db.reviewerAssignment.create({ data: { manuscriptId: m.id, reviewerId, invitedById: u.id, revision: m.currentRevision, dueAt: due } });
  await sendTemplate("reviewer_invitation", r.email, {
    name: r.fullName, title: m.title, manuscript_id: m.code, abstract: m.abstract, due_date: formatDate(due),
    url: `${appUrl()}/reviewer/assignments/${a.id}`, account_html: accountHtml,
  });
  await audit(u.id, "review.invited", "ReviewerAssignment", a.id, { reviewerId });
  return a;
}

export async function inviteReviewerAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  need(u, "manuscripts.manage_reviews", here);
  const days = Math.min(Math.max(parseInt(str(fd, "days"), 10) || 21, 3), 120);
  const due = new Date(Date.now() + days * 864e5);
  let reviewerId = str(fd, "reviewerId");
  let accountHtml = "";
  if (!reviewerId) {
    const email = str(fd, "email").toLowerCase();
    const fullName = str(fd, "fullName");
    if (!email.includes("@") || !fullName) back(here, { error: "Choose a reviewer from the pool, or enter a name and email to invite a new reviewer." });
    const role = await db.role.findUniqueOrThrow({ where: { key: "REVIEWER" } });
    let r = await db.user.findUnique({ where: { email }, include: { roles: true } });
    if (!r) {
      r = await db.user.create({
        data: { email, fullName, passwordHash: await hashPassword(randomToken()), affiliation: optStr(fd, "institution"), roles: { create: [{ roleId: role.id }] }, reviewerProfile: { create: { institution: optStr(fd, "institution"), expertise: optStr(fd, "expertise") } } },
        include: { roles: true },
      });
      const token = await createAuthToken(r.id, "RESET_PASSWORD", 24 * 14);
      accountHtml = `<p>A reviewer account has been created for you. Please set your password here: <a href="${appUrl()}/reset-password?token=${token}">${appUrl()}/reset-password?token=${token}</a></p>`;
      await audit(u.id, "user.reviewer_created", "User", r.id);
    } else if (!r.roles.some((x) => x.roleId === role.id)) {
      await db.userRole.create({ data: { userId: r.id, roleId: role.id } });
      await db.reviewerProfile.upsert({ where: { userId: r.id }, update: {}, create: { userId: r.id, institution: r.affiliation } });
    }
    reviewerId = r.id;
  }
  if (reviewerId === m.submitterId) back(here, { error: "The submitting author cannot review their own manuscript." });
  const coAuthor = await db.manuscriptAuthor.findFirst({ where: { manuscriptId: m.id, email: (await db.user.findUniqueOrThrow({ where: { id: reviewerId } })).email } });
  if (coAuthor) back(here, { error: "This person is listed as an author of the manuscript." });
  await inviteReviewerUser(reviewerId, m, u, due, here, accountHtml);
  if (m.status === "EDITOR_ASSIGNED" || m.status === "REVISED_SUBMITTED") await setStatus(m.id, "UNDER_REVIEW", u.id, undefined, m.status === "EDITOR_ASSIGNED");
  back(here, { ok: "Reviewer invited." });
}

export async function assignmentAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  need(u, "manuscripts.manage_reviews", here);
  const a = await db.reviewerAssignment.findFirst({ where: { id: str(fd, "assignmentId"), manuscriptId: m.id }, include: { reviewer: true, report: true } });
  if (!a) back(here, { error: "Assignment not found." });
  const op = str(fd, "op");
  if (op === "remind") {
    await sendTemplate("review_reminder", a.reviewer.email, { name: a.reviewer.fullName, title: m.title, manuscript_id: m.code, due_date: formatDate(a.dueAt), url: `${appUrl()}/reviewer/assignments/${a.id}` });
    await db.reviewerAssignment.update({ where: { id: a.id }, data: { lastReminderAt: new Date(), reminderCount: { increment: 1 } } });
    back(here, { ok: `Reminder sent to ${a.reviewer.fullName}.` });
  }
  if (op === "cancel") {
    await db.reviewerAssignment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    await audit(u.id, "review.cancelled", "ReviewerAssignment", a.id);
    back(here, { ok: "Assignment cancelled." });
  }
  if (op === "deadline") {
    const d = new Date(str(fd, "dueAt"));
    if (isNaN(+d)) back(here, { error: "Invalid date." });
    await db.reviewerAssignment.update({ where: { id: a.id }, data: { dueAt: d } });
    back(here, { ok: "Deadline updated." });
  }
  if (op === "release" && a.report) {
    await db.reviewReport.update({ where: { id: a.report.id }, data: { releasedToAuthor: !a.report.releasedToAuthor } });
    await audit(u.id, a.report.releasedToAuthor ? "review.unreleased" : "review.released", "ReviewReport", a.report.id);
    back(here, { ok: a.report.releasedToAuthor ? "Review withheld from author." : "Review comments released to author." });
  }
  back(here, {});
}

export async function noteAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  const body = str(fd, "body");
  if (!body) back(here, { error: "Note is empty." });
  await db.editorialNote.create({ data: { manuscriptId: m.id, authorId: u.id, body } });
  back(here + "#notes", { ok: "Note added." });
}

export async function uploadEditorialFileAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  const kind = str(fd, "kind");
  if (!["EDITORIAL", "SIMILARITY_REPORT", "ACCEPTED"].includes(kind)) back(here, { error: "Invalid file type." });
  const f = fd.get("file");
  if (!isRealFile(f)) back(here, { error: "Choose a file." });
  try {
    const s = await storeFile(f, { allowed: SUPPLEMENTARY_EXT, folder: "editorial", uploadedById: u.id });
    await db.manuscriptFile.create({ data: { manuscriptId: m.id, fileId: s.id, kind, revision: m.currentRevision } });
  } catch (e) {
    if (e instanceof UploadError) back(here, { error: e.message });
    throw e;
  }
  await audit(u.id, "manuscript.file_uploaded", "Manuscript", m.id, { kind });
  back(here, { ok: "File uploaded." });
}

export async function decisionAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  const decision = str(fd, "decision");
  const letter = str(fd, "letter");
  if (!(decision in RECOMMENDATIONS) || !letter) back(here, { error: "Choose a decision and write the decision letter." });
  const official = u.permissions.has("manuscripts.decide") && str(fd, "mode") !== "recommend";
  if (!official && !u.permissions.has("manuscripts.recommend")) back(here, { error: "You are not permitted to make decisions." });
  if (["ACCEPTED", "REJECTED", "PUBLISHED", "WITHDRAWN", "IN_PRODUCTION"].includes(m.status)) back(here, { error: "A final decision has already been recorded." });
  await db.editorialDecision.create({ data: { manuscriptId: m.id, editorId: u.id, decision, letter, isRecommendation: !official, revision: m.currentRevision } });
  if (!official) {
    await audit(u.id, "manuscript.recommendation", "Manuscript", m.id, { decision });
    await sendTemplate("review_submitted", await editorialOfficeEmails(), { title: m.title, manuscript_id: m.code, recommendation: `Editor recommendation: ${RECOMMENDATIONS[decision as keyof typeof RECOMMENDATIONS]}`, url: `${appUrl()}${here}` });
    back(here, { ok: "Recommendation recorded and sent to the Editor in Chief / Managing Editor." });
  }
  if (bool(fd, "releaseReviews")) {
    await db.reviewReport.updateMany({ where: { assignment: { manuscriptId: m.id, revision: m.currentRevision } }, data: { releasedToAuthor: true } });
  }
  const status: ManuscriptStatus = decision === "ACCEPT" ? "ACCEPTED" : decision === "REJECT" ? "REJECTED" : "REVISION_REQUIRED";
  const days = decision === "MINOR_REVISION" ? 21 : 45;
  const revisionDueAt = status === "REVISION_REQUIRED" ? new Date(Date.now() + days * 86400000) : null;
  await db.manuscript.update({ where: { id: m.id }, data: { decidedAt: status === "REVISION_REQUIRED" ? null : new Date(), revisionDueAt } });
  const fullLetter = revisionDueAt ? `${letter}\n\nPlease submit your revised manuscript by ${revisionDueAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. Use the link below to open the revision workspace.` : letter;
  await setStatus(m.id, status, u.id, `Decision: ${RECOMMENDATIONS[decision as keyof typeof RECOMMENDATIONS]}`, false);
  await audit(u.id, "manuscript.decision", "Manuscript", m.id, { decision });
  const tpl = decision === "ACCEPT" ? "decision_accept" : decision === "REJECT" ? "decision_reject" : "revision_requested";
  const authorsEmails = [m.submitter.email];
  await sendTemplate(tpl, authorsEmails, { name: m.submitter.fullName, title: m.title, manuscript_id: m.code, decision: RECOMMENDATIONS[decision as keyof typeof RECOMMENDATIONS], letter: fullLetter, url: revisionDueAt ? `${appUrl()}/submission/revise/${m.id}` : `${appUrl()}/author/manuscripts/${m.id}` });
  back(here, { ok: "Decision issued and the author has been notified." });
}

export async function createArticleFromManuscriptAction(fd: FormData) {
  const { u, m, here } = await load(str(fd, "id"));
  need(u, "publishing.manage", here);
  if (!["ACCEPTED", "IN_PRODUCTION"].includes(m.status)) back(here, { error: "Only accepted manuscripts can move to production." });
  const existing = await db.article.findUnique({ where: { manuscriptId: m.id } });
  if (existing) redirect(`/admin/articles/${existing.id}`);
  const full = await db.manuscript.findUniqueOrThrow({ where: { id: m.id }, include: { authors: { orderBy: { order: "asc" } } } });
  const j = await db.journal.findUnique({ where: { id: "journal" } });
  let slug = slugify(full.title);
  if (await db.article.findUnique({ where: { slug } })) slug = `${slugify(full.title, 64)}-${full.code.toLowerCase()}`;
  const a = await db.article.create({
    data: {
      slug, title: full.title, abstract: full.abstract, keywords: full.keywords, articleType: full.articleType, categoryId: full.categoryId, manuscriptId: full.id,
      fundingStatement: full.fundingStatement, conflictOfInterest: full.conflictOfInterest, receivedAt: full.submittedAt, acceptedAt: full.decidedAt ?? new Date(),
      licenseName: j?.licenseName, licenseUrl: j?.licenseUrl,
      authors: { create: full.authors.map((x) => ({ order: x.order, fullName: x.fullName, email: x.email, affiliation: x.affiliation, country: x.country, orcid: x.orcid, isCorresponding: x.isCorresponding })) },
    },
  });
  if (m.status === "ACCEPTED") await setStatus(m.id, "IN_PRODUCTION", u.id, "Article record created");
  await audit(u.id, "article.created_from_manuscript", "Article", a.id, { manuscript: m.code });
  redirect(`/admin/articles/${a.id}?ok=Article+draft+created+from+manuscript.`);
}
