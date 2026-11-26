import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, SelectField, Badge, Field } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { ArticleAuthorsEditor } from "@/components/article-authors-editor";
import { ARTICLE_TYPES } from "@/lib/constants";
import { fileSize } from "@/lib/utils";
import { saveArticleAction, uploadArticleFileAction, deleteArticleFileAction, publishAction } from "../actions";

const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

export default async function ArticleEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("publishing.manage");
  const { id } = await params;
  const a = id === "new" ? null : await db.article.findUnique({ where: { id }, include: { authors: { orderBy: { order: "asc" } }, references: { orderBy: { order: "asc" } }, files: { include: { file: true }, orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] }, doiRecords: { orderBy: { createdAt: "desc" } }, manuscript: { select: { id: true, code: true } } } });
  if (id !== "new" && !a) notFound();
  const [cats, issues, j] = await Promise.all([
    db.researchCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.issue.findMany({ include: { volume: true }, orderBy: [{ year: "desc" }, { number: "desc" }] }),
    getJournal(),
  ]);
  return (
    <>
      <PTitle
        back={{ href: "/admin/articles", label: "Articles" }}
        title={a ? a.title : "New article"}
        subtitle={a?.manuscript ? <>From manuscript <Link className="link" href={`/editor/manuscripts/${a.manuscript.id}`}>{a.manuscript.code}</Link></> : undefined}
        actions={a && <>{a.status !== "DRAFT" && <Link href={`/article/${a.slug}`} className="btn-secondary" target="_blank">View public page</Link>}<Badge tone={a.status === "PUBLISHED" ? "green" : a.status === "RETRACTED" ? "red" : "amber"}>{a.status.toLowerCase()}</Badge></>}
      />
      <div className="space-y-6">
        {a && (
          <Card title="Publication">
            <form action={publishAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={a.id} />
              {a.status !== "PUBLISHED" && <SubmitButton name="op" value="publish" confirm="Publish this article publicly?">Publish article</SubmitButton>}
              {a.status === "PUBLISHED" && <SubmitButton name="op" value="unpublish" className="btn-secondary" confirm="Unpublish this article?">Unpublish</SubmitButton>}
              {a.status === "PUBLISHED" && <SubmitButton name="op" value="retract" className="btn-secondary text-red-700" confirm="Mark as retracted? A retraction notice should also be published.">Mark retracted</SubmitButton>}
              {a.status === "DRAFT" && <SubmitButton name="op" value="delete" className="btn-danger" confirm="Delete this draft permanently?">Delete draft</SubmitButton>}
              {!a.issueId && <span className="text-xs text-amber-700">Tip: assign the article to an issue before publishing.</span>}
              {!a.files.some((f) => f.kind === "PDF") && <span className="text-xs text-amber-700">No PDF uploaded yet.</span>}
            </form>
          </Card>
        )}

        <form action={saveArticleAction} className="space-y-6">
          <input type="hidden" name="id" value={a?.id ?? ""} />
          <Card title="Bibliographic metadata">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><TextField label="Title" name="title" required defaultValue={a?.title} /></div>
              <div className="sm:col-span-2"><TextField label="Permanent URL slug" name="slug" defaultValue={a?.slug} hint="/article/<slug>. Do not change after publication." /></div>
              <div className="sm:col-span-2"><TextArea label="Abstract" name="abstract" required rows={6} defaultValue={a?.abstract} /></div>
              <TextField label="Keywords" name="keywords" required defaultValue={a?.keywords} hint="Separated by commas or semicolons" />
              <SelectField label="Article type" name="articleType" defaultValue={a?.articleType ?? "Research Article"} options={ARTICLE_TYPES} />
              <SelectField label="Research category" name="categoryId" defaultValue={a?.categoryId ?? ""} placeholder="None" options={cats.map((c) => ({ value: c.id, label: c.name }))} />
              <SelectField label="Issue" name="issueId" defaultValue={a?.issueId ?? ""} placeholder="Not assigned (online first)" options={issues.map((i) => ({ value: i.id, label: `Volume ${i.volume.number}, Issue ${i.number} (${i.year})${i.isPublished ? "" : " · unpublished"}` }))} />
              <TextField label="Page numbers" name="pages" defaultValue={a?.pages ?? ""} placeholder="e.g. 1-15" />
              <TextField label="Article number" name="articleNumber" defaultValue={a?.articleNumber ?? ""} placeholder="e.g. e2026001" />
              <TextField label="DOI" name="doi" defaultValue={a?.doi ?? ""} placeholder={j.doiPrefix ? `${j.doiPrefix}/ijcst.${new Date().getFullYear()}.001` : "10.xxxxx/..."} hint="Displayed publicly only after successful registration (see DOI module)." />
              <TextField label="Received" name="receivedAt" type="date" defaultValue={d(a?.receivedAt)} />
              <TextField label="Accepted" name="acceptedAt" type="date" defaultValue={d(a?.acceptedAt)} />
              <TextField label="Publication date" name="publishedAt" type="date" defaultValue={d(a?.publishedAt)} hint="Set automatically on publish if empty." />
              <TextField label="Licence" name="licenseName" defaultValue={a?.licenseName ?? j.licenseName ?? ""} />
              <TextField label="Licence URL" name="licenseUrl" defaultValue={a?.licenseUrl ?? j.licenseUrl ?? ""} />
              <TextField label="Copyright holder" name="copyrightHolder" defaultValue={a?.copyrightHolder ?? ""} placeholder="The Author(s)" />
              <TextField label="SEO description" name="seoDescription" defaultValue={a?.seoDescription ?? ""} />
              <TextArea label="Funding statement" name="fundingStatement" rows={2} defaultValue={a?.fundingStatement ?? ""} />
              <TextArea label="Conflict of interest declaration" name="conflictOfInterest" rows={2} defaultValue={a?.conflictOfInterest ?? ""} />
              <div className="sm:col-span-2"><TextArea label="Data availability statement" name="dataAvailability" rows={2} defaultValue={a?.dataAvailability ?? ""} /></div>
            </div>
          </Card>
          <Card title="Authors & affiliations">
            <ArticleAuthorsEditor initial={a?.authors.map((x) => ({ fullName: x.fullName, givenName: x.givenName ?? "", familyName: x.familyName ?? "", email: x.email ?? "", affiliation: x.affiliation ?? "", rorId: x.rorId ?? "", country: x.country ?? "", orcid: x.orcid ?? "", isCorresponding: x.isCorresponding })) ?? []} />
          </Card>
          <Card title="Full text (HTML)">
            <TextArea label="Article body (Markdown)" name="bodyMarkdown" rows={18} defaultValue={a?.bodyMarkdown ?? ""} hint="Use ## for section headings, **bold**, *italic*, tables, and ![caption](/api/files/<id>) for uploaded figures. Converted to sanitised HTML." />
          </Card>
          <Card title="References">
            <TextArea label="One reference per line" name="references" rows={10} defaultValue={a?.references.map((r) => r.citation).join("\n") ?? ""} hint="DOIs inside a reference (10.xxxx/...) are detected automatically and linked." />
          </Card>
          <div className="flex justify-end"><SubmitButton className="btn-primary px-8">Save article</SubmitButton></div>
        </form>

        {a && (
          <Card title="Files">
            <div id="files" className="space-y-2">
              {a.files.length === 0 && <p className="text-sm text-muted">No files uploaded.</p>}
              {a.files.map((f) => (
                <form key={f.id} action={deleteArticleFileAction} className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-2 text-sm">
                  <input type="hidden" name="id" value={a.id} /><input type="hidden" name="fileRowId" value={f.id} />
                  <span><Badge>{f.kind}</Badge> <a className="link" href={`/api/files/${f.fileId}`}>{f.label || f.file.originalName}</a> <span className="text-xs text-muted">{fileSize(f.file.size)} · file id {f.fileId}</span></span>
                  <SubmitButton className="btn-secondary btn-sm text-red-700" confirm="Remove this file?">Remove</SubmitButton>
                </form>
              ))}
            </div>
            <form action={uploadArticleFileAction} className="mt-4 grid gap-3 sm:grid-cols-4" encType="multipart/form-data">
              <input type="hidden" name="id" value={a.id} />
              <SelectField label="Type" name="kind" options={[{ value: "PDF", label: "Final PDF" }, { value: "SUPPLEMENTARY", label: "Supplementary file" }, { value: "FIGURE", label: "Figure / table image" }]} />
              <TextField label="Label (optional)" name="label" placeholder="e.g. Figure 1" />
              <Field label="File" name="file"><input id="file" type="file" name="file" required className="input" /></Field>
              <div className="flex items-end"><SubmitButton className="btn-secondary">Upload</SubmitButton></div>
            </form>
            <p className="hint">Files become publicly accessible (with permanent links) only while the article is published.</p>
          </Card>
        )}
        {a?.doi && <Card title="DOI"><p className="text-sm">DOI <code>{a.doi}</code> · status: <Badge>{a.doiRecords[0]?.status?.toLowerCase() ?? "none"}</Badge> <Link className="link ml-2" href={`/admin/doi/${a.id}`}>Manage deposit →</Link></p></Card>}
      </div>
    </>
  );
}
