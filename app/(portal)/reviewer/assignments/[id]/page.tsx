import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextArea, SelectField, Field, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { formatDate, fileSize, appUrl, str } from "@/lib/utils";
import { FILE_KINDS, RECOMMENDATIONS, SUPPLEMENTARY_EXT } from "@/lib/constants";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { sendTemplate, editorialOfficeEmails } from "@/lib/email";
import { back } from "@/lib/actions-util";
import { audit } from "@/lib/audit";

async function mine(id: string) {
  const u = await requireUser();
  const a = await db.reviewerAssignment.findUnique({ where: { id }, include: { manuscript: { include: { handlingEditor: true } }, report: true } });
  if (!a || a.reviewerId !== u.id) notFound();
  return { u, a };
}

async function respond(fd: FormData) {
  "use server";
  const id = str(fd, "id");
  const { u, a } = await mine(id);
  const here = `/reviewer/assignments/${id}`;
  if (a.status !== "INVITED") back(here, { error: "You have already responded to this invitation." });
  const accept = str(fd, "answer") === "accept";
  await db.reviewerAssignment.update({ where: { id }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
  await audit(u.id, accept ? "review.accepted" : "review.declined", "ReviewerAssignment", id);
  if (accept && a.manuscript.status === "EDITOR_ASSIGNED") {
    await db.manuscript.update({ where: { id: a.manuscriptId }, data: { status: "UNDER_REVIEW" } });
    await db.manuscriptStatusEvent.create({ data: { manuscriptId: a.manuscriptId, status: "UNDER_REVIEW", actorId: null, note: "First reviewer accepted" } });
  }
  back(here, { ok: accept ? "Thank you for accepting. You can now download the manuscript." : "You have declined this invitation." });
}

async function submitReport(fd: FormData) {
  "use server";
  const id = str(fd, "id");
  const { u, a } = await mine(id);
  const here = `/reviewer/assignments/${id}`;
  if (a.status !== "ACCEPTED") back(here, { error: "This review cannot be submitted." });
  const recommendation = str(fd, "recommendation");
  const commentsToAuthor = str(fd, "commentsToAuthor");
  if (!(recommendation in RECOMMENDATIONS) || !commentsToAuthor) back(here, { error: "Recommendation and comments for the authors are required." });
  let annotatedFileId: string | null = null;
  const f = fd.get("annotatedFile");
  if (isRealFile(f)) {
    try { annotatedFileId = (await storeFile(f, { allowed: SUPPLEMENTARY_EXT, folder: "reviews", uploadedById: u.id })).id; }
    catch (e) { if (e instanceof UploadError) back(here, { error: e.message }); throw e; }
  }
  await db.reviewReport.create({ data: { assignmentId: id, recommendation, commentsToAuthor, confidentialComments: str(fd, "confidentialComments") || null, annotatedFileId } });
  await db.reviewerAssignment.update({ where: { id }, data: { status: "COMPLETED" } });
  await audit(u.id, "review.submitted", "ReviewerAssignment", id, { recommendation });
  const to = a.manuscript.handlingEditor ? [a.manuscript.handlingEditor.email] : await editorialOfficeEmails();
  await sendTemplate("review_submitted", to, { title: a.manuscript.title, manuscript_id: a.manuscript.code, recommendation: RECOMMENDATIONS[recommendation as keyof typeof RECOMMENDATIONS], url: `${appUrl()}/editor/manuscripts/${a.manuscriptId}` });
  back(here, { ok: "Thank you. Your review has been submitted to the editor." });
}

export default async function Assignment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { a } = await mine(id);
  // Only the anonymised manuscript files of the relevant round are exposed; no author details.
  const files = a.status === "ACCEPTED" || a.status === "COMPLETED"
    ? await db.manuscriptFile.findMany({ where: { manuscriptId: a.manuscriptId, kind: { in: ["MANUSCRIPT", "REVISION", "SUPPLEMENTARY", "RESPONSE_LETTER"] }, revision: { lte: a.revision } }, include: { file: true }, orderBy: [{ revision: "desc" }, { createdAt: "asc" }] })
    : [];
  const m = a.manuscript;
  const response = a.revision > 0 ? await db.manuscriptRevision.findFirst({ where: { manuscriptId: m.id, number: a.revision } }) : null;
  return (
    <>
      <PTitle back={{ href: "/reviewer/dashboard", label: "Review assignments" }} title={m.title} subtitle={<><span className="font-mono">{m.code}</span> · Round {a.revision + 1} · Due {formatDate(a.dueAt)}</>} actions={<Badge tone="blue">{a.status.toLowerCase()}</Badge>} />
      <div className="space-y-6">
        <Card title="Manuscript">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-muted">Article type</dt><dd>{m.articleType}</dd></div>
            <div><dt className="text-muted">Keywords</dt><dd>{m.keywords}</dd></div>
            <div><dt className="text-muted">Abstract</dt><dd className="whitespace-pre-line">{m.abstract}</dd></div>
          </dl>
        </Card>

        {a.status === "INVITED" && (
          <Card title="Respond to invitation">
            <p className="mb-4 text-sm text-muted">Please accept only if you have the expertise, have no conflict of interest with the work, and can complete the review by {formatDate(a.dueAt)}. Manuscripts must be kept confidential and must not be uploaded to AI tools.</p>
            <form action={respond} className="flex gap-3">
              <input type="hidden" name="id" value={a.id} />
              <SubmitButton name="answer" value="accept">Accept invitation</SubmitButton>
              <SubmitButton name="answer" value="decline" className="btn-secondary">Decline</SubmitButton>
            </form>
          </Card>
        )}

        {files.length > 0 && (
          <Card title="Files for review">
            <ul className="space-y-2 text-sm">
              {files.map((f) => <li key={f.id} className="flex flex-wrap justify-between gap-2"><a className="link" href={`/api/files/${f.fileId}`}>{f.file.originalName}</a><span className="text-xs text-muted">{FILE_KINDS[f.kind]} · version {f.revision} · {fileSize(f.file.size)}</span></li>)}
            </ul>
            {response && <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">Authors&apos; response to previous reviews</summary><p className="mt-2 whitespace-pre-line text-muted">{response.responseToReviewers}</p></details>}
          </Card>
        )}

        {a.status === "ACCEPTED" && (
          <Card title="Submit your review">
            <form action={submitReport} className="grid gap-4" encType="multipart/form-data">
              <input type="hidden" name="id" value={a.id} />
              <SelectField label="Recommendation" name="recommendation" required placeholder="Select…" options={Object.entries(RECOMMENDATIONS).map(([value, label]) => ({ value, label }))} />
              <TextArea label="Comments for the authors" name="commentsToAuthor" required rows={10} hint="These comments may be shared with the authors. Do not include your identity." />
              <TextArea label="Confidential comments to the editor" name="confidentialComments" rows={4} hint="Visible to editors only — never shown to authors." />
              <Field label="Annotated document (optional)" name="annotatedFile" hint="Remove your name from document properties before uploading."><input id="annotatedFile" name="annotatedFile" type="file" className="input" accept=".pdf,.doc,.docx,.zip" /></Field>
              <div><SubmitButton confirm="Submit your review? It cannot be edited afterwards.">Submit review</SubmitButton></div>
            </form>
          </Card>
        )}

        {a.report && (
          <Card title="Your submitted review">
            <p className="text-sm"><span className="text-muted">Recommendation:</span> <strong>{RECOMMENDATIONS[a.report.recommendation as keyof typeof RECOMMENDATIONS]}</strong> · submitted {formatDate(a.report.submittedAt)}</p>
            <p className="mt-3 whitespace-pre-line text-sm">{a.report.commentsToAuthor}</p>
          </Card>
        )}
      </div>
    </>
  );
}
