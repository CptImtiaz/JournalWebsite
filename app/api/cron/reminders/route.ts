import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTemplate, deliver } from "@/lib/email";
import { appUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Daily job: review reminders (3 days before due, and every 3 days when overdue), retry failed emails, prune old login attempts/sessions. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  const now = Date.now();
  const soon = new Date(now + 3 * 864e5);
  const threeDaysAgo = new Date(now - 3 * 864e5);
  const due = await db.reviewerAssignment.findMany({
    where: { status: { in: ["INVITED", "ACCEPTED"] }, dueAt: { lte: soon }, OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: threeDaysAgo } }], reminderCount: { lt: 5 } },
    include: { reviewer: true, manuscript: true },
  });
  for (const a of due) {
    if (["REJECTED", "WITHDRAWN", "ACCEPTED", "PUBLISHED"].includes(a.manuscript.status)) continue;
    await sendTemplate("review_reminder", a.reviewer.email, { name: a.reviewer.fullName, title: a.manuscript.title, manuscript_id: a.manuscript.code, due_date: formatDate(a.dueAt), url: `${appUrl()}/reviewer/assignments/${a.id}` });
    await db.reviewerAssignment.update({ where: { id: a.id }, data: { lastReminderAt: new Date(), reminderCount: { increment: 1 } } });
  }
  const failed = await db.emailNotification.findMany({ where: { status: "FAILED", attempts: { lt: 4 } }, take: 50 });
  for (const f of failed) await deliver(f.id);
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now - 7 * 864e5) } } });
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.authToken.deleteMany({ where: { expiresAt: { lt: new Date(now - 30 * 864e5) } } });
  return NextResponse.json({ reminders: due.length, retried: failed.length });
}
