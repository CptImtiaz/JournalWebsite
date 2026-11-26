import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditManuscript } from "@/lib/access";
import { PTitle } from "@/components/portal";
import { Card, StatusBadge, Badge, TextArea, SelectField, TextField, Checkbox, Field } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { Tracker } from "@/components/tracker";
import { formatDate, formatDateTime, fileSize } from "@/lib/utils";
import { FILE_KINDS, MANUSCRIPT_STATUSES, RECOMMENDATIONS } from "@/lib/constants";
import {
  changeStatusAction, assignEditorAction, inviteReviewerAction, assignmentAction, noteAction, decisionAction, uploadEditorialFileAction, createArticleFromManuscriptAction,
} from "../../actions";

const A_TONE = { INVITED: "amber", ACCEPTED: "blue", COMPLETED: "green", DECLINED: "gray", CANCELLED: "gray" } as const;

export default async function EditorManuscript({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser();
  const m = await db.manuscript.findUnique({
    where: { id },
    include: {
      submitter: true, handlingEditor: true, category: true,
      authors: { orderBy: { order: "asc" } },
      files: { include: { file: true }, orderBy: [{ revision: "asc" }, { createdAt: "asc" }] },
      revisions: { orderBy: { number: "asc" } },
      assignments: { include: { reviewer: { include: { reviewerProfile: true } }, report: { include: { annotatedFile: true } } }, orderBy: { invitedAt: "asc" } },
      decisions: { include: { editor: { select: { fullName: true } } }, orderBy: { createdAt: "asc" } },
      notes: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      article: { select: { id: true, status: true } },
    },
  });
  if (!m) notFound();
  if (!canEditManuscript(u, m)) redirect("/forbidden");

  const [editors, reviewers] = await Promise.all([
    can(u, "manuscripts.assign_editor") ? db.user.findMany({ where: { isActive: true, roles: { some: { role: { key: { in: ["EDITOR_IN_CHIEF", "MANAGING_EDITOR", "ASSOCIATE_EDITOR"] } } } } }, orderBy: { fullName: "asc" } }) : [],
    can(u, "manuscripts.manage_reviews") ? db.user.findMany({ where: { isActive: true, roles: { some: { role: { key: "REVIEWER" } } }, id: { not: m.submitterId } }, include: { reviewerProfile: true, _count: { select: { reviewAssignments: { where: { status: { in: ["INVITED", "ACCEPTED"] } } } } } }, orderBy: { fullName: "asc" } }) : [],
  ]);
  const open = !["ACCEPTED", "REJECTED", "PUBLISHED", "WITHDRAWN", "IN_PRODUCTION"].includes(m.status);
  const rounds = [...new Set([...m.assignments.map((a) => a.revision), m.currentRevision])].sort((a, b) => b - a);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PTitle back={{ href: "/editor/manuscripts", label: "Manuscripts" }} title={m.title} subtitle={<><span className="font-mono">{m.code}</span> · {m.articleType} · {m.category?.name} · submitted {formatDate(m.submittedAt)} · revision {m.currentRevision}</>} actions={<StatusBadge status={m.status} />} />
      <div className="space-y-6">
        <Card><Tracker status={m.status} /></Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card title="Workflow" className="xl:col-span-1">
            <div className="space-y-5 text-sm">
              <div>
                <div className="text-muted">Handling editor</div>
                <div className="font-medium">{m.handlingEditor?.fullName ?? "Not assigned"}</div>
              </div>
              {can(u, "manuscripts.assign_editor") && (
                <form action={assignEditorAction} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <select name="editorId" className="input" required defaultValue={m.handlingEditorId ?? ""}>
                    <option value="">Select editor…</option>
                    {editors.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                  <SubmitButton className="btn-secondary">Assign</SubmitButton>
                </form>
              )}
              <form action={changeStatusAction} className="space-y-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={m.id} />
                <SelectField label="Set status" name="status" defaultValue={m.status} options={(["SUBMITTED", "TECHNICAL_CHECK", "AWAITING_EDITOR", "EDITOR_ASSIGNED", "UNDER_REVIEW", ...(can(u, "manuscripts.decide") ? ["IN_PRODUCTION", "WITHDRAWN"] : [])] as (keyof typeof MANUSCRIPT_STATUSES)[]).map((s) => ({ value: s, label: MANUSCRIPT_STATUSES[s] }))} />
                <input name="note" placeholder="Note (optional, internal)" className="input" />
                <SubmitButton className="btn-secondary btn-sm">Update status</SubmitButton>
              </form>
              {can(u, "publishing.manage") && ["ACCEPTED", "IN_PRODUCTION"].includes(m.status) && (
                <form action={createArticleFromManuscriptAction} className="border-t border-line pt-4">
                  <input type="hidden" name="id" value={m.id} />
                  {m.article ? <Link href={`/admin/articles/${m.article.id}`} className="btn-primary w-full">Open article in production</Link> : <SubmitButton className="btn-primary w-full">Send to production (create article)</SubmitButton>}
                </form>
              )}
            </div>
          </Card>

          <Card title="Submission" className="xl:col-span-2">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-muted">Abstract</dt><dd className="whitespace-pre-line">{m.abstract}</dd></div>
              <div><dt className="text-muted">Keywords</dt><dd>{m.keywords}</dd></div>
              <div><dt className="text-muted">Submitted by</dt><dd>{m.submitter.fullName} ({m.submitter.email})</dd></div>
              <div><dt className="text-muted">Conflict of interest</dt><dd>{m.conflictOfInterest}</dd></div>
              <div><dt className="text-muted">Funding</dt><dd>{m.fundingStatement}</dd></div>
              <div><dt className="text-muted">Ethics approval</dt><dd>{m.ethicsApprovalRequired ? m.ethicsStatement : "Not applicable (declared)"}</dd></div>
              <div><dt className="text-muted">AI usage</dt><dd>{m.aiUsageDisclosure || "None declared"}</dd></div>
              <div><dt className="text-muted">Originality declaration</dt><dd>{m.originalityDeclared ? "Confirmed" : "No"}</dd></div>
              {m.dataAvailability && <div className="sm:col-span-2"><dt className="text-muted">Data availability</dt><dd>{m.dataAvailability}</dd></div>}
              {m.previouslySubmitted && <div><dt className="text-muted">Previous submission</dt><dd>{m.previouslySubmitted}</dd></div>}
              {Array.isArray(m.suggestedReviewers) && m.suggestedReviewers.length > 0 && <div className="sm:col-span-2"><dt className="text-muted">Suggested reviewers</dt><dd><ul className="list-disc pl-5">{(m.suggestedReviewers as { name: string; email: string; institution: string; reason: string }[]).map((r, i) => <li key={i}><strong>{r.name}</strong> {r.institution && `· ${r.institution}`} {r.email && `· ${r.email}`} {r.reason && <span className="text-muted">— {r.reason}</span>}</li>)}</ul></dd></div>}
              {Array.isArray(m.opposedReviewers) && m.opposedReviewers.length > 0 && <div className="sm:col-span-2"><dt className="text-muted">Opposed reviewers</dt><dd><ul className="list-disc pl-5">{(m.opposedReviewers as { name: string; institution: string; reason: string }[]).map((r, i) => <li key={i}><strong>{r.name}</strong> {r.institution && `· ${r.institution}`} {r.reason && <span className="text-muted">— {r.reason}</span>}</li>)}</ul></dd></div>}
              {m.coverLetter && <div className="sm:col-span-2"><dt className="text-muted">Cover letter</dt><dd className="whitespace-pre-line">{m.coverLetter}</dd></div>}
            </dl>
            <h3 className="mt-5 text-sm font-semibold text-ink">Authors</h3>
            <ol className="mt-2 space-y-1 text-sm">
              {m.authors.map((a) => <li key={a.id}>{a.order}. <strong>{a.fullName}</strong>{a.isCorresponding && " (corresponding)"} — {a.affiliation}{a.country ? `, ${a.country}` : ""} · {a.email}{a.orcid && <> · <a className="link" href={`https://orcid.org/${a.orcid}`} target="_blank" rel="noopener">{a.orcid}</a></>}</li>)}
            </ol>
          </Card>
        </div>

        <Card title="Files">
          <div className="overflow-x-auto">
            <table className="table"><thead><tr><th>File</th><th>Type</th><th>Version</th><th>Size</th><th>Uploaded</th></tr></thead>
              <tbody>{m.files.map((f) => <tr key={f.id}><td><a className="link" href={`/api/files/${f.fileId}`}>{f.file.originalName}</a></td><td>{FILE_KINDS[f.kind]}</td><td>{f.revision}</td><td>{fileSize(f.file.size)}</td><td>{formatDate(f.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
          <form action={uploadEditorialFileAction} className="mt-4 flex flex-wrap items-end gap-2" encType="multipart/form-data">
            <input type="hidden" name="id" value={m.id} />
            <select name="kind" className="input w-auto"><option value="SIMILARITY_REPORT">Similarity report</option><option value="EDITORIAL">Editorial document</option><option value="ACCEPTED">Accepted manuscript</option></select>
            <input type="file" name="file" required className="input w-auto" />
            <SubmitButton className="btn-secondary">Upload</SubmitButton>
          </form>
          <p className="hint">Similarity reports should come from a legitimate similarity-checking service. Editorial and similarity files are never shown to authors or reviewers.</p>
        </Card>

        <Card title="Peer review">
          {rounds.map((r) => {
            const list = m.assignments.filter((a) => a.revision === r);
            return (
              <div key={r} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-ink">Round {r + 1}{r === m.currentRevision ? " (current)" : ""}</h3>
                {list.length === 0 && <p className="text-sm text-muted">No reviewers assigned for this round.</p>}
                <div className="space-y-3">
                  {list.map((a) => (
                    <div key={a.id} className="rounded-md border border-line p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><strong>{a.reviewer.fullName}</strong> <span className="text-muted">· {a.reviewer.affiliation ?? a.reviewer.reviewerProfile?.institution ?? ""} · {a.reviewer.email}</span></div>
                        <Badge tone={A_TONE[a.status as keyof typeof A_TONE] ?? "gray"}>{a.status.toLowerCase()}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted">Invited {formatDate(a.invitedAt)} · due {formatDate(a.dueAt)}{a.respondedAt ? ` · responded ${formatDate(a.respondedAt)}` : ""}{a.reminderCount ? ` · ${a.reminderCount} reminder(s), last ${formatDate(a.lastReminderAt)}` : ""}</div>
                      {a.report && (
                        <div className="mt-3 space-y-2 rounded bg-surface p-3">
                          <div>Recommendation: <strong>{RECOMMENDATIONS[a.report.recommendation as keyof typeof RECOMMENDATIONS]}</strong> · {formatDateTime(a.report.submittedAt)} · {a.report.releasedToAuthor ? <Badge tone="green">Released to author</Badge> : <Badge>Not released</Badge>}</div>
                          <details open><summary className="cursor-pointer font-medium">Comments for author</summary><p className="mt-1 whitespace-pre-line">{a.report.commentsToAuthor}</p></details>
                          {a.report.confidentialComments && <details><summary className="cursor-pointer font-medium text-red-800">Confidential comments to editor</summary><p className="mt-1 whitespace-pre-line">{a.report.confidentialComments}</p></details>}
                          {a.report.annotatedFile && <a className="link text-xs" href={`/api/files/${a.report.annotatedFile.id}`}>Annotated file: {a.report.annotatedFile.originalName}</a>}
                        </div>
                      )}
                      {can(u, "manuscripts.manage_reviews") && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(a.status === "INVITED" || a.status === "ACCEPTED") && (
                            <>
                              <form action={assignmentAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="assignmentId" value={a.id} /><SubmitButton name="op" value="remind" className="btn-secondary btn-sm">Send reminder</SubmitButton></form>
                              <form action={assignmentAction} className="flex items-center gap-1"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="assignmentId" value={a.id} /><input type="hidden" name="op" value="deadline" /><input type="date" name="dueAt" min={today} defaultValue={a.dueAt?.toISOString().slice(0, 10)} className="input py-1 text-xs" /><SubmitButton className="btn-secondary btn-sm">Set deadline</SubmitButton></form>
                              <form action={assignmentAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="assignmentId" value={a.id} /><SubmitButton name="op" value="cancel" className="btn-secondary btn-sm text-red-700" confirm="Cancel this review assignment?">Cancel</SubmitButton></form>
                            </>
                          )}
                          {a.report && <form action={assignmentAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="assignmentId" value={a.id} /><SubmitButton name="op" value="release" className="btn-secondary btn-sm">{a.report.releasedToAuthor ? "Withhold from author" : "Release to author"}</SubmitButton></form>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {can(u, "manuscripts.manage_reviews") && open && (
            <form action={inviteReviewerAction} className="mt-4 grid gap-3 rounded-md border border-dashed border-line p-4 md:grid-cols-2">
              <input type="hidden" name="id" value={m.id} />
              <h3 className="text-sm font-semibold text-ink md:col-span-2">Invite a reviewer for round {m.currentRevision + 1}</h3>
              <div className="md:col-span-2">
                <SelectField label="From reviewer pool" name="reviewerId" placeholder="— or invite a new reviewer below —" options={reviewers.map((r) => ({ value: r.id, label: `${r.fullName} — ${r.reviewerProfile?.expertise ?? r.researchInterests ?? "no expertise listed"} (${r.reviewerProfile?.availability?.toLowerCase() ?? "available"}, ${r._count.reviewAssignments} active)` }))} />
              </div>
              <TextField label="New reviewer name" name="fullName" />
              <TextField label="New reviewer email" name="email" type="email" />
              <TextField label="Institution" name="institution" />
              <TextField label="Expertise" name="expertise" />
              <TextField label="Days to complete review" name="days" type="number" defaultValue={21} min={3} max={120} />
              <div className="flex items-end"><SubmitButton>Send invitation</SubmitButton></div>
              <p className="hint md:col-span-2">New reviewers receive an account and a secure link to set their password. Reviewers never see author identities.</p>
            </form>
          )}
        </Card>

        {(can(u, "manuscripts.decide") || can(u, "manuscripts.recommend")) && (
          <Card title={can(u, "manuscripts.decide") ? "Editorial decision" : "Editorial recommendation"}>
            {m.decisions.length > 0 && (
              <div className="mb-5 space-y-3">
                {m.decisions.map((d) => (
                  <div key={d.id} className="rounded-md bg-surface p-3 text-sm">
                    <div className="mb-1 flex flex-wrap gap-2"><Badge tone={d.isRecommendation ? "gray" : "navy"}>{d.isRecommendation ? "Recommendation" : "Decision"}</Badge><strong>{RECOMMENDATIONS[d.decision as keyof typeof RECOMMENDATIONS]}</strong><span className="text-muted">by {d.editor.fullName} · {formatDateTime(d.createdAt)} · round {d.revision + 1}</span></div>
                    <p className="whitespace-pre-line">{d.letter}</p>
                  </div>
                ))}
              </div>
            )}
            {open ? (
              <form action={decisionAction} className="grid gap-4">
                <input type="hidden" name="id" value={m.id} />
                <SelectField label="Decision" name="decision" required placeholder="Select…" options={Object.entries(RECOMMENDATIONS).map(([value, label]) => ({ value, label }))} />
                <TextArea label="Decision letter to author" name="letter" required rows={8} defaultValue={`Dear ${m.submitter.fullName},\n\nThank you for submitting your manuscript "${m.title}" (${m.code}) to our journal.\n\n`} />
                {can(u, "manuscripts.decide") ? (
                  <>
                    <Checkbox name="releaseReviews" defaultChecked label="Release this round's reviewer comments (for authors) with the decision. Reviewer identities and confidential comments are never shared." />
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton confirm="Issue this decision and notify the author?">Issue official decision</SubmitButton>
                      <SubmitButton name="mode" value="recommend" className="btn-secondary">Record as recommendation only</SubmitButton>
                    </div>
                  </>
                ) : (
                  <div><SubmitButton>Submit recommendation to Editor-in-Chief</SubmitButton><p className="hint">Only the Editor-in-Chief or Managing Editor can issue official decisions.</p></div>
                )}
              </form>
            ) : <p className="text-sm text-muted">A final decision has been recorded ({MANUSCRIPT_STATUSES[m.status as keyof typeof MANUSCRIPT_STATUSES]}).</p>}
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Internal editorial discussion">
            <div id="notes" className="space-y-3">
              {m.notes.map((n) => <div key={n.id} className="rounded bg-surface p-3 text-sm"><div className="text-xs text-muted">{n.author.fullName} · {formatDateTime(n.createdAt)}</div><p className="mt-1 whitespace-pre-line">{n.body}</p></div>)}
              <form action={noteAction} className="space-y-2">
                <input type="hidden" name="id" value={m.id} />
                <TextArea label="Add note (editors only)" name="body" rows={3} required />
                <SubmitButton className="btn-secondary btn-sm">Add note</SubmitButton>
              </form>
            </div>
          </Card>
          <Card title="History">
            <ol className="space-y-2 text-sm">
              {m.statusEvents.map((e) => <li key={e.id}><span className="text-muted">{formatDateTime(e.createdAt)}</span> — <StatusBadge status={e.status} /> {e.note && <span className="text-muted">{e.note}</span>}</li>)}
              {m.revisions.map((r) => <li key={r.id}><details><summary className="cursor-pointer">Revision {r.number} response ({formatDate(r.submittedAt)})</summary><p className="mt-1 whitespace-pre-line text-muted">{r.responseToReviewers}</p></details></li>)}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
