import "server-only";
import { db } from "./db";
import { getJournal } from "./journal";
import { sendTemplate } from "./email";
import { audit } from "./audit";
import { appUrl } from "./utils";
import { MANUSCRIPT_STATUSES, type ManuscriptStatus } from "./constants";

export async function nextManuscriptCode() {
  const j = await getJournal();
  const year = new Date().getUTCFullYear();
  const prefix = `${j.manuscriptPrefix}-${year}-`;
  const last = await db.manuscript.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" }, select: { code: true } });
  const n = last ? parseInt(last.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

const NOTIFY_AUTHOR: ManuscriptStatus[] = ["TECHNICAL_CHECK", "UNDER_REVIEW", "IN_PRODUCTION", "WITHDRAWN"];

export async function setStatus(manuscriptId: string, status: ManuscriptStatus, actorId: string | null, note?: string, notify = true) {
  const m = await db.manuscript.update({ where: { id: manuscriptId }, data: { status }, include: { submitter: true } });
  await db.manuscriptStatusEvent.create({ data: { manuscriptId, status, note, actorId } });
  await audit(actorId, "manuscript.status_changed", "Manuscript", manuscriptId, { status, note });
  if (notify && NOTIFY_AUTHOR.includes(status)) {
    await sendTemplate("status_changed", m.submitter.email, {
      name: m.submitter.fullName, title: m.title, manuscript_id: m.code, status: MANUSCRIPT_STATUSES[status], url: `${appUrl()}/author/manuscripts/${m.id}`,
    });
  }
  return m;
}
