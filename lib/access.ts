import "server-only";
import { db } from "./db";
import type { CurrentUser } from "./auth";

/** Whether the user can view a manuscript as editor (permission-scoped). */
export function canEditManuscript(user: CurrentUser | null, m: { handlingEditorId: string | null }) {
  if (!user) return false;
  if (user.permissions.has("manuscripts.view_all")) return true;
  return user.permissions.has("manuscripts.view_assigned") && m.handlingEditorId === user.id;
}

const REVIEWER_KINDS = ["MANUSCRIPT", "REVISION", "SUPPLEMENTARY", "RESPONSE_LETTER"];

export async function canReadFile(user: CurrentUser | null, fileId: string) {
  const f = await db.storedFile.findUnique({
    where: { id: fileId },
    include: {
      articleFiles: { include: { article: { select: { status: true } } } },
      manuscriptFiles: { include: { manuscript: { select: { id: true, submitterId: true, handlingEditorId: true } } } },
      reviewReports: { include: { assignment: { include: { manuscript: { select: { submitterId: true, handlingEditorId: true } } } } } },
    },
  });
  if (!f) return { file: null, ok: false };
  if (f.visibility === "PUBLIC") return { file: f, ok: true };
  if (f.articleFiles.some((af) => af.article.status === "PUBLISHED" || af.article.status === "RETRACTED")) return { file: f, ok: true };
  if (!user) return { file: f, ok: false };
  if (user.permissions.has("publishing.manage") || user.permissions.has("content.manage")) {
    if (f.articleFiles.length || (!f.manuscriptFiles.length && !f.reviewReports.length)) return { file: f, ok: true };
  }
  if (f.uploadedById === user.id) return { file: f, ok: true };
  for (const mf of f.manuscriptFiles) {
    const m = mf.manuscript;
    if (canEditManuscript(user, m)) return { file: f, ok: true };
    if (m.submitterId === user.id && mf.kind !== "EDITORIAL" && mf.kind !== "SIMILARITY_REPORT") return { file: f, ok: true };
    if (REVIEWER_KINDS.includes(mf.kind)) {
      const a = await db.reviewerAssignment.findFirst({ where: { manuscriptId: m.id, reviewerId: user.id, status: { in: ["ACCEPTED", "COMPLETED"] } } });
      if (a) return { file: f, ok: true };
    }
  }
  for (const r of f.reviewReports) {
    const m = r.assignment.manuscript;
    if (canEditManuscript(user, m)) return { file: f, ok: true };
    if (m.submitterId === user.id && r.releasedToAuthor) return { file: f, ok: true };
  }
  return { file: f, ok: false };
}
