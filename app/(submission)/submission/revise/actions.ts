"use server";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl, str } from "@/lib/utils";
import { MANUSCRIPT_EXT, SUPPLEMENTARY_EXT } from "@/lib/constants";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { setStatus } from "@/lib/manuscripts";
import { sendTemplate } from "@/lib/email";
import { back } from "@/lib/actions-util";
import { audit } from "@/lib/audit";

export async function submitRevision(fd: FormData) {
  const id = str(fd, "id");
  const u = await requireUser();
  const m = await db.manuscript.findUnique({ where: { id }, include: { handlingEditor: true } });
  if (!m || m.submitterId !== u.id) notFound();
  const here = `/submission/revise/${id}`;
  if (m.status !== "REVISION_REQUIRED") back(`/author/manuscripts/${id}`, { error: "This manuscript is not awaiting revision." });
  const file = fd.get("revisionFile");
  if (!isRealFile(file)) back(here, { error: "Please upload the clean revised manuscript." });
  const response = str(fd, "response");
  if (response.length < 20) back(here, { error: "Please write a point by point response to the reviewers." });
  if (!fd.get("confirm")) back(here, { error: "Please confirm that all authors approve the revised version." });
  const rev = m.currentRevision + 1;
  const add = async (f: File, kind: string, allowed: string[]) => {
    const s = await storeFile(f, { allowed, folder: "manuscripts", uploadedById: u.id });
    await db.manuscriptFile.create({ data: { manuscriptId: id, fileId: s.id, kind, revision: rev } });
  };
  try {
    await add(file, "REVISION", MANUSCRIPT_EXT);
    const tracked = fd.get("trackedFile"); if (isRealFile(tracked)) await add(tracked, "TRACKED_CHANGES", MANUSCRIPT_EXT);
    const rl = fd.get("responseFile"); if (isRealFile(rl)) await add(rl, "RESPONSE_LETTER", MANUSCRIPT_EXT);
    for (const s of fd.getAll("supplementaryFiles").filter(isRealFile)) await add(s, "SUPPLEMENTARY", SUPPLEMENTARY_EXT);
  } catch (e) {
    if (e instanceof UploadError) back(here, { error: e.message });
    throw e;
  }
  await db.manuscriptRevision.create({ data: { manuscriptId: id, number: rev, responseToReviewers: response } });
  await db.manuscript.update({ where: { id }, data: { currentRevision: rev, revisionDueAt: null } });
  await setStatus(id, "REVISED_SUBMITTED", u.id, `Revision ${rev} submitted`, false);
  await audit(u.id, "manuscript.revision_submitted", "Manuscript", id, { revision: rev });
  const vars = { title: m.title, manuscript_id: m.code, revision: String(rev) };
  await sendTemplate("revision_received", u.email, { ...vars, url: `${appUrl()}/author/manuscripts/${id}` });
  if (m.handlingEditor) await sendTemplate("revision_received", m.handlingEditor.email, { ...vars, url: `${appUrl()}/editor/manuscripts/${id}` });
  redirect(`/author/manuscripts/${id}?ok=${encodeURIComponent(`Revision ${rev} submitted. The editor has been notified.`)}`);
}
