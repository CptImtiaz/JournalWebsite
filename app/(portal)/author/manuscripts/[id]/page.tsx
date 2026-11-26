import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, StatusBadge, TextArea, Field, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { Tracker } from "@/components/tracker";
import { ClearDraft } from "@/components/submission-wizard";
import { formatDate, formatDateTime, fileSize, appUrl, str } from "@/lib/utils";
import { FILE_KINDS, MANUSCRIPT_STATUSES, RECOMMENDATIONS, MANUSCRIPT_EXT, SUPPLEMENTARY_EXT } from "@/lib/constants";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { setStatus } from "@/lib/manuscripts";
import { sendTemplate } from "@/lib/email";
import { back } from "@/lib/actions-util";
import { audit } from "@/lib/audit";

const DECISION_LABEL: Record<string, string> = { ...RECOMMENDATIONS, ACCEPT: "Accepted", REJECT: "Rejected", MINOR_REVISION: "Minor revision required", MAJOR_REVISION: "Major revision required" };

async function own(id: string) {
  const u = await requireUser();
  const m = await db.manuscript.findUnique({ where: { id }, include: { handlingEditor: true } });
  if (!m || m.submitterId !== u.id) notFound();
  return { u, m };
}

async function uploadRevision(fd: FormData) {
  "use server";
  const id = str(fd, "id");
  const { u, m } = await own(id);
  const here = `/author/manuscripts/${id}`;
  if (m.status !== "REVISION_REQUIRED") back(here, { error: "This manuscript is not awaiting revision." });
  const file = fd.get("revisionFile");
  if (!isRealFile(file)) back(here, { error: "Please upload the revised manuscript." });
  const response = str(fd, "response");
  if (!response) back(here, { error: "Please provide a response to the reviewers." });
  const rev = m.currentRevision + 1;
  try {
    const f = await storeFile(file, { allowed: MANUSCRIPT_EXT, folder: "manuscripts", uploadedById: u.id });
    await db.manuscriptFile.create({ data: { manuscriptId: id, fileId: f.id, kind: "REVISION", revision: rev } });
    const rl = fd.get("responseFile");
    if (isRealFile(rl)) {
      const f2 = await storeFile(rl, { allowed: MANUSCRIPT_EXT, folder: "manuscripts", uploadedById: u.id });
      await db.manuscriptFile.create({ data: { manuscriptId: id, fileId: f2.id, kind: "RESPONSE_LETTER", revision: rev } });
    }
    for (const s of fd.getAll("supplementaryFiles").filter(isRealFile)) {
      const f3 = await storeFile(s, { allowed: SUPPLEMENTARY_EXT, folder: "manuscripts", uploadedById: u.id });
      await db.manuscriptFile.create({ data: { manuscriptId: id, fileId: f3.id, kind: "SUPPLEMENTARY", revision: rev } });
    }
  } catch (e) {
    if (e instanceof UploadError) back(here, { error: e.message });
    throw e;
  }
  await db.manuscriptRevision.create({ data: { manuscriptId: id, number: rev, responseToReviewers: response } });
  await db.manuscript.update({ where: { id }, data: { currentRevision: rev } });
  await setStatus(id, "REVISED_SUBMITTED", u.id, `Revision ${rev} submitted`, false);
  const vars = { title: m.title, manuscript_id: m.code, revision: String(rev) };
  await sendTemplate("revision_received", u.email, { ...vars, url: `${appUrl()}/author/manuscripts/${id}` });
  if (m.handlingEditor) await sendTemplate("revision_received", m.handlingEditor.email, { ...vars, url: `${appUrl()}/editor/manuscripts/${id}` });
  back(here, { ok: `Revision ${rev} submitted successfully.` });
}

async function withdraw(fd: FormData) {
  "use server";
  const id = str(fd, "id");
  const { u, m } = await own(id);
  if (["ACCEPTED", "IN_PRODUCTION", "PUBLISHED", "REJECTED", "WITHDRAWN"].includes(m.status)) back(`/author/manuscripts/${id}`, { error: "This manuscript can no longer be withdrawn online. Please contact the editorial office." });
  await setStatus(id, "WITHDRAWN", u.id, `Withdrawn by author: ${str(fd, "reason")}`);
  await db.reviewerAssignment.updateMany({ where: { manuscriptId: id, status: { in: ["INVITED", "ACCEPTED"] } }, data: { status: "CANCELLED" } });
  await audit(u.id, "manuscript.withdrawn", "Manuscript", id);
  redirect(`/author/manuscripts/${id}?ok=Manuscript+withdrawn.`);
}

export default async function AuthorManuscript({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await own(id);
  const m = await db.manuscript.findUniqueOrThrow({
    where: { id },
    include: {
      category: true,
      authors: { orderBy: { order: "asc" } },
      files: { where: { kind: { notIn: ["EDITORIAL", "SIMILARITY_REPORT"] } }, include: { file: true }, orderBy: { createdAt: "asc" } },
      revisions: { orderBy: { number: "asc" } },
      decisions: { where: { isRecommendation: false }, orderBy: { createdAt: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      assignments: { where: { report: { releasedToAuthor: true } }, include: { report: { include: { annotatedFile: true } } }, orderBy: { invitedAt: "asc" } },
      article: { select: { slug: true, status: true } },
    },
  });
  // Reviewer identities are never exposed: reviewers are numbered per revision round.
  const rounds = new Map<number, typeof m.assignments>();
  for (const a of m.assignments) rounds.set(a.revision, [...(rounds.get(a.revision) ?? []), a]);
  const canWithdraw = !["ACCEPTED", "IN_PRODUCTION", "PUBLISHED", "REJECTED", "WITHDRAWN"].includes(m.status);

  return (
    <>
      <ClearDraft />
      <PTitle back={{ href: "/author/dashboard", label: "My submissions" }} title={m.title} subtitle={<span className="font-mono">{m.code}</span>} actions={<StatusBadge status={m.status} />} />
      <div className="space-y-6">
        <Card title="Manuscript tracking">
          <Tracker status={m.status} />
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-muted">Manuscript ID</dt><dd className="font-mono font-medium">{m.code}</dd></div>
            <div><dt className="text-muted">Submitted</dt><dd className="font-medium">{formatDate(m.submittedAt)}</dd></div>
            <div><dt className="text-muted">Current status</dt><dd className="font-medium">{MANUSCRIPT_STATUSES[m.status as keyof typeof MANUSCRIPT_STATUSES]}</dd></div>
            <div><dt className="text-muted">Editorial decision</dt><dd className="font-medium">{m.decisions.length ? DECISION_LABEL[m.decisions[m.decisions.length - 1].decision] : "Pending"}</dd></div>
          </dl>
          {m.article?.status === "PUBLISHED" && <Link href={`/article/${m.article.slug}`} className="btn-primary btn-sm mt-4">View published article</Link>}
        </Card>

        {m.status === "REVISION_REQUIRED" && (
          <Card title="Submit your revision" className="border-amber-300">
            <form action={uploadRevision} className="grid gap-4" encType="multipart/form-data">
              <input type="hidden" name="id" value={m.id} />
              <Field label="Revised manuscript (anonymised)" name="revisionFile" required><input id="revisionFile" name="revisionFile" type="file" required accept=".doc,.docx,.pdf" className="input" /></Field>
              <TextArea label="Response to reviewers" name="response" required rows={6} hint="Point-by-point response to each reviewer comment." />
              <Field label="Response letter file (optional)" name="responseFile"><input id="responseFile" name="responseFile" type="file" accept=".doc,.docx,.pdf" className="input" /></Field>
              <Field label="Updated supplementary files (optional)" name="supplementaryFiles"><input id="supplementaryFiles" name="supplementaryFiles" type="file" multiple className="input" /></Field>
              <div><SubmitButton>Submit revision</SubmitButton></div>
            </form>
          </Card>
        )}

        {m.decisions.length > 0 && (
          <Card title="Decision letters">
            <div className="space-y-5">
              {m.decisions.map((d) => (
                <div key={d.id} className="rounded-md border border-line p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm"><Badge tone={d.decision === "ACCEPT" ? "green" : d.decision === "REJECT" ? "red" : "amber"}>{DECISION_LABEL[d.decision]}</Badge><span className="text-muted">{formatDateTime(d.createdAt)} · Round {d.revision + 1}</span></div>
                  <div className="whitespace-pre-line text-sm">{d.letter}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {rounds.size > 0 && (
          <Card title="Reviewer comments">
            <div className="space-y-6">
              {[...rounds.entries()].map(([rev, list]) => (
                <div key={rev}>
                  <h3 className="mb-2 text-sm font-semibold text-ink">Review round {rev + 1}</h3>
                  <div className="space-y-3">
                    {list.map((a, i) => (
                      <div key={a.id} className="rounded-md bg-surface p-4 text-sm">
                        <div className="mb-2 font-semibold">Reviewer {i + 1}</div>
                        <div className="whitespace-pre-line">{a.report!.commentsToAuthor}</div>
                        {a.report!.annotatedFile && <a className="link mt-2 inline-block text-xs" href={`/api/files/${a.report!.annotatedFile.id}`}>Annotated document</a>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Submission details">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted">Article type</dt><dd>{m.articleType}</dd></div>
              <div><dt className="text-muted">Research field</dt><dd>{m.category?.name}</dd></div>
              <div><dt className="text-muted">Keywords</dt><dd>{m.keywords}</dd></div>
              <div><dt className="text-muted">Abstract</dt><dd className="whitespace-pre-line">{m.abstract}</dd></div>
              <div><dt className="text-muted">Conflict of interest</dt><dd>{m.conflictOfInterest}</dd></div>
              <div><dt className="text-muted">Funding</dt><dd>{m.fundingStatement}</dd></div>
              {m.ethicsApprovalRequired && <div><dt className="text-muted">Ethics approval</dt><dd>{m.ethicsStatement}</dd></div>}
            </dl>
          </Card>
          <div className="space-y-6">
            <Card title="Authors">
              <ol className="space-y-2 text-sm">
                {m.authors.map((a) => <li key={a.id}><span className="font-medium">{a.order}. {a.fullName}</span>{a.isCorresponding && <Badge tone="blue">Corresponding</Badge>}<div className="text-xs text-muted">{a.affiliation}{a.country ? `, ${a.country}` : ""} · {a.email}{a.orcid ? ` · ORCID ${a.orcid}` : ""}</div></li>)}
              </ol>
            </Card>
            <Card title="Files & revision history">
              <ul className="space-y-2 text-sm">
                {m.files.map((f) => <li key={f.id} className="flex flex-wrap justify-between gap-2"><a className="link" href={`/api/files/${f.fileId}`}>{f.file.originalName}</a><span className="text-xs text-muted">{FILE_KINDS[f.kind]} · v{f.revision} · {fileSize(f.file.size)} · {formatDate(f.createdAt)}</span></li>)}
              </ul>
              {m.revisions.length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  {m.revisions.map((r) => <details key={r.id} className="text-sm"><summary className="cursor-pointer">Revision {r.number} · {formatDate(r.submittedAt)}</summary><p className="mt-1 whitespace-pre-line text-muted">{r.responseToReviewers}</p></details>)}
                </div>
              )}
            </Card>
          </div>
        </div>

        <Card title="Status history">
          <ol className="space-y-2 text-sm">
            {m.statusEvents.map((e) => <li key={e.id} className="flex flex-wrap gap-3"><span className="w-44 text-muted">{formatDateTime(e.createdAt)}</span><StatusBadge status={e.status} /></li>)}
          </ol>
        </Card>

        {canWithdraw && (
          <Card title="Withdraw manuscript">
            <form action={withdraw} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={m.id} />
              <div className="min-w-64 flex-1"><TextArea label="Reason for withdrawal" name="reason" required rows={2} /></div>
              <SubmitButton className="btn-danger" confirm="Withdraw this manuscript? This cannot be undone.">Withdraw</SubmitButton>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
