import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, Badge, Field, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, int, optStr, bool, formatDate } from "@/lib/utils";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { moveItem } from "@/lib/reorder";
import { audit } from "@/lib/audit";
import { IMAGE_EXT } from "@/lib/constants";
import { issuePath } from "@/lib/journal";

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id");
  const here = `/admin/issues/${id}`;
  const files: { coverFileId?: string; pdfFileId?: string } = {};
  try {
    const c = fd.get("cover");
    if (isRealFile(c)) files.coverFileId = (await storeFile(c, { allowed: IMAGE_EXT, folder: "issues", uploadedById: u.id, visibility: "PUBLIC" })).id;
    const p = fd.get("pdf");
    if (isRealFile(p)) files.pdfFileId = (await storeFile(p, { allowed: [".pdf"], folder: "issues", uploadedById: u.id, visibility: "PUBLIC" })).id;
  } catch (e) {
    if (e instanceof UploadError) back(here, { error: e.message });
    throw e;
  }
  const pd = str(fd, "publishedAt");
  await db.issue.update({ where: { id }, data: { title: optStr(fd, "title"), description: optStr(fd, "description"), year: int(fd, "year"), publishedAt: pd ? new Date(pd + "T00:00:00Z") : null, ...files, ...(bool(fd, "removeCover") ? { coverFileId: null } : {}), ...(bool(fd, "removePdf") ? { pdfFileId: null } : {}) } });
  await audit(u.id, "issue.updated", "Issue", id);
  back(here, { ok: "Issue saved." });
}

async function op(fd: FormData) {
  "use server";
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id"), o = str(fd, "op");
  const here = `/admin/issues/${id}`;
  const i = await db.issue.findUniqueOrThrow({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (o === "publish") await db.issue.update({ where: { id }, data: { isPublished: true, publishedAt: i.publishedAt ?? new Date() } });
  if (o === "unpublish") await db.issue.update({ where: { id }, data: { isPublished: false, isCurrent: false } });
  if (o === "current") { await db.issue.updateMany({ data: { isCurrent: false } }); await db.issue.update({ where: { id }, data: { isCurrent: true, isPublished: true, publishedAt: i.publishedAt ?? new Date() } }); }
  if (o === "publishAll") {
    await db.article.updateMany({ where: { issueId: id, status: "DRAFT" }, data: { status: "PUBLISHED" } });
    await db.article.updateMany({ where: { issueId: id, publishedAt: null }, data: { publishedAt: i.publishedAt ?? new Date() } });
  }
  if (o === "delete") {
    if (i._count.articles) back(here, { error: "Move or remove the issue's articles before deleting it. Published issues should be preserved." });
    await db.issue.delete({ where: { id } });
    await audit(u.id, "issue.deleted", "Issue", id);
    redirect("/admin/issues?ok=Issue+deleted.");
  }
  if (o === "up" || o === "down") await moveItem("article", str(fd, "articleId"), o === "up" ? -1 : 1, { issueId: id });
  if (o === "addArticle") await db.article.update({ where: { id: str(fd, "articleId") }, data: { issueId: id, sortOrder: i._count.articles } });
  if (o === "removeArticle") await db.article.update({ where: { id: str(fd, "articleId") }, data: { issueId: null } });
  await audit(u.id, `issue.${o}`, "Issue", id);
  back(here, {});
}

export default async function IssueEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("publishing.manage");
  const { id } = await params;
  const i = await db.issue.findUnique({ where: { id }, include: { volume: true, articles: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { authors: { select: { fullName: true }, orderBy: { order: "asc" } } } } } });
  if (!i) notFound();
  const unassigned = await db.article.findMany({ where: { issueId: null }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PTitle back={{ href: "/admin/issues", label: "Volumes & issues" }} title={`Volume ${i.volume.number}, Issue ${i.number}`} subtitle={<>URL: <code>{issuePath(i)}</code> {i.isPublished && <Link className="link" href={issuePath(i)} target="_blank">view</Link>}</>} actions={<>{i.isPublished ? <Badge tone="green">published</Badge> : <Badge>unpublished</Badge>}{i.isCurrent && <Badge tone="navy">current issue</Badge>}</>} />
      <div className="space-y-6">
        <Card title="Publication">
          <form action={op} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={i.id} />
            {!i.isPublished ? <SubmitButton name="op" value="publish">Publish issue</SubmitButton> : <SubmitButton name="op" value="unpublish" className="btn-secondary" confirm="Unpublish this issue? Historical archives should normally be preserved.">Unpublish</SubmitButton>}
            {!i.isCurrent && <SubmitButton name="op" value="current" className="btn-secondary">Make current issue</SubmitButton>}
            <SubmitButton name="op" value="publishAll" className="btn-secondary" confirm="Publish all draft articles in this issue?">Publish all draft articles</SubmitButton>
            {i.articles.length === 0 && <SubmitButton name="op" value="delete" className="btn-danger" confirm="Delete this empty issue?">Delete issue</SubmitButton>}
          </form>
        </Card>
        <Card title="Issue details">
          <form action={save} className="grid gap-4 sm:grid-cols-2" encType="multipart/form-data">
            <input type="hidden" name="id" value={i.id} />
            <TextField label="Title / theme" name="title" defaultValue={i.title ?? ""} />
            <TextField label="Year" name="year" type="number" defaultValue={i.year} />
            <TextField label="Publication date" name="publishedAt" type="date" defaultValue={i.publishedAt?.toISOString().slice(0, 10)} />
            <div />
            <div className="sm:col-span-2"><TextArea label="Description / editorial (Markdown)" name="description" rows={4} defaultValue={i.description ?? ""} /></div>
            <Field label="Cover image" name="cover">
              <input id="cover" type="file" name="cover" accept=".jpg,.jpeg,.png,.webp" className="input" />
              {i.coverFileId && <div className="mt-2 flex items-center gap-2"><img src={`/api/files/${i.coverFileId}`} alt="" className="h-20 rounded" /><Checkbox name="removeCover" label="Remove" /></div>}
            </Field>
            <Field label="Full issue PDF (optional)" name="pdf">
              <input id="pdf" type="file" name="pdf" accept=".pdf" className="input" />
              {i.pdfFileId && <div className="mt-2 flex items-center gap-2"><a className="link text-sm" href={`/api/files/${i.pdfFileId}`}>Current PDF</a><Checkbox name="removePdf" label="Remove" /></div>}
            </Field>
            <div><SubmitButton>Save issue</SubmitButton></div>
          </form>
        </Card>
        <Card title={`Articles (${i.articles.length}) — table of contents order`}>
          <ol className="divide-y divide-line">
            {i.articles.map((a, k) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span><span className="mr-2 text-muted">{k + 1}.</span><Link className="link" href={`/admin/articles/${a.id}`}>{a.title}</Link> <span className="text-xs text-muted">— {a.authors.map((x) => x.fullName).join(", ")} {a.pages && `· pp. ${a.pages}`} {formatDate(a.publishedAt)}</span> <Badge tone={a.status === "PUBLISHED" ? "green" : "amber"}>{a.status.toLowerCase()}</Badge></span>
                <form action={op} className="flex gap-1">
                  <input type="hidden" name="id" value={i.id} /><input type="hidden" name="articleId" value={a.id} />
                  <SubmitButton name="op" value="up" className="btn-secondary btn-sm">↑</SubmitButton>
                  <SubmitButton name="op" value="down" className="btn-secondary btn-sm">↓</SubmitButton>
                  <SubmitButton name="op" value="removeArticle" className="btn-secondary btn-sm">Remove</SubmitButton>
                </form>
              </li>
            ))}
          </ol>
          {unassigned.length > 0 && (
            <form action={op} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={i.id} /><input type="hidden" name="op" value="addArticle" />
              <select name="articleId" className="input max-w-md">{unassigned.map((a) => <option key={a.id} value={a.id}>{a.title} ({a.status.toLowerCase()})</option>)}</select>
              <SubmitButton className="btn-secondary">Add to issue</SubmitButton>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
