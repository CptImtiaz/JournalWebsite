"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { back } from "@/lib/actions-util";
import { audit } from "@/lib/audit";
import { renderBody } from "@/lib/markdown";
import { storeFile, isRealFile, UploadError, deleteStoredFile } from "@/lib/storage";
import { sendTemplate } from "@/lib/email";
import { setStatus } from "@/lib/manuscripts";
import { notifySubscribers } from "@/lib/alerts";
import { str, optStr, int, slugify, normalizeOrcid, appUrl } from "@/lib/utils";
import { ARTICLE_TYPES, IMAGE_EXT, SUPPLEMENTARY_EXT } from "@/lib/constants";

type AuthorIn = { fullName: string; givenName?: string; familyName?: string; email?: string; affiliation?: string; rorId?: string; country?: string; orcid?: string; isCorresponding?: boolean };
const DOI_RE = /\b(10\.\d{4,9}\/[^\s"<>]+[^\s"<>.,;])/i;
const date = (v: string) => (v ? new Date(v + "T00:00:00Z") : null);

export async function saveArticleAction(fd: FormData) {
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id");
  const here = `/admin/articles/${id || "new"}`;
  const title = str(fd, "title"), abstract = str(fd, "abstract"), keywords = str(fd, "keywords"), articleType = str(fd, "articleType");
  if (!title || !abstract || !keywords) back(here, { error: "Title, abstract and keywords are required." });
  if (!ARTICLE_TYPES.includes(articleType)) back(here, { error: "Invalid article type." });
  const slug = slugify(str(fd, "slug") || title);
  const clash = await db.article.findFirst({ where: { slug, id: { not: id || undefined } } });
  if (clash) back(here, { error: "Another article already uses this URL slug." });
  const doi = optStr(fd, "doi")?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") ?? null;
  if (doi && !/^10\.\d{4,9}\/\S+$/.test(doi)) back(here, { error: "DOI must look like 10.xxxx/suffix." });
  let authors: AuthorIn[] = [];
  try { authors = JSON.parse(str(fd, "authorsJson") || "[]"); } catch {}
  authors = authors.filter((a) => a.fullName?.trim());
  const current = id ? await db.article.findUnique({ where: { id }, select: { status: true } }) : null;
  if (!authors.length && current && current.status !== "DRAFT") back(here, { error: "A published article needs at least one author." });
  const refs = str(fd, "references").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^\[\d+\]\s*|^\d+\.\s+/, ""));
  const body = str(fd, "bodyMarkdown");
  const existing = id ? await db.article.findUnique({ where: { id } }) : null;
  const data = {
    title, slug, abstract, keywords, articleType,
    categoryId: optStr(fd, "categoryId"), issueId: optStr(fd, "issueId"), pages: optStr(fd, "pages"), articleNumber: optStr(fd, "articleNumber"), doi,
    bodyMarkdown: body || null, bodyHtml: body ? renderBody(body) : null,
    fundingStatement: optStr(fd, "fundingStatement"), conflictOfInterest: optStr(fd, "conflictOfInterest"), dataAvailability: optStr(fd, "dataAvailability"),
    licenseName: optStr(fd, "licenseName"), licenseUrl: optStr(fd, "licenseUrl"), copyrightHolder: optStr(fd, "copyrightHolder"), seoDescription: optStr(fd, "seoDescription"),
    receivedAt: date(str(fd, "receivedAt")), acceptedAt: date(str(fd, "acceptedAt")), publishedAt: date(str(fd, "publishedAt")) ?? existing?.publishedAt ?? null,
  };
  const authorRows = authors.map((a, i) => ({
    order: i + 1, fullName: a.fullName.trim(), givenName: a.givenName?.trim() || null, familyName: a.familyName?.trim() || null, email: a.email?.trim() || null,
    affiliation: a.affiliation?.trim() || null, rorId: a.rorId?.trim() || null, country: a.country?.trim() || null, orcid: normalizeOrcid(a.orcid), isCorresponding: !!a.isCorresponding,
  }));
  const refRows = refs.map((c, i) => ({ order: i + 1, citation: c, doi: c.match(DOI_RE)?.[1] ?? null }));
  let a;
  if (id) {
    a = await db.$transaction(async (tx) => {
      await tx.articleAuthor.deleteMany({ where: { articleId: id } });
      await tx.articleReference.deleteMany({ where: { articleId: id } });
      return tx.article.update({ where: { id }, data: { ...data, authors: { create: authorRows }, references: { create: refRows } } });
    });
  } else {
    a = await db.article.create({ data: { ...data, authors: { create: authorRows }, references: { create: refRows } } });
  }
  if (doi && !(await db.doiRecord.findFirst({ where: { articleId: a.id, doi } }))) await db.doiRecord.create({ data: { articleId: a.id, doi, status: "DRAFT" } });
  await audit(u.id, id ? "article.updated" : "article.created", "Article", a.id);
  back(`/admin/articles/${a.id}`, { ok: "Article saved." });
}

export async function uploadArticleFileAction(fd: FormData) {
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id");
  const here = `/admin/articles/${id}`;
  const kind = str(fd, "kind");
  if (!["PDF", "SUPPLEMENTARY", "FIGURE"].includes(kind)) back(here, { error: "Invalid file kind." });
  const f = fd.get("file");
  if (!isRealFile(f)) back(here, { error: "Choose a file." });
  try {
    const s = await storeFile(f, { allowed: kind === "PDF" ? [".pdf"] : kind === "FIGURE" ? IMAGE_EXT : SUPPLEMENTARY_EXT, folder: "articles", uploadedById: u.id });
    if (kind === "PDF") {
      const old = await db.articleFile.findMany({ where: { articleId: id, kind: "PDF" } });
      await db.articleFile.deleteMany({ where: { articleId: id, kind: "PDF" } });
      for (const o of old) await audit(u.id, "article.pdf_replaced", "StoredFile", o.fileId);
    }
    await db.articleFile.create({ data: { articleId: id, fileId: s.id, kind, label: optStr(fd, "label"), sortOrder: int(fd, "sortOrder") } });
  } catch (e) {
    if (e instanceof UploadError) back(here, { error: e.message });
    throw e;
  }
  await audit(u.id, "article.file_uploaded", "Article", id, { kind });
  back(here + "#files", { ok: "File uploaded." });
}

export async function deleteArticleFileAction(fd: FormData) {
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id");
  const af = await db.articleFile.findFirst({ where: { id: str(fd, "fileRowId"), articleId: id } });
  if (af) {
    await db.articleFile.delete({ where: { id: af.id } });
    const still = await db.articleFile.count({ where: { fileId: af.fileId } });
    if (!still) { await deleteStoredFile(af.fileId); await db.storedFile.delete({ where: { id: af.fileId } }).catch(() => {}); }
    await audit(u.id, "article.file_deleted", "Article", id);
  }
  back(`/admin/articles/${id}#files`, { ok: "File removed." });
}

export async function publishAction(fd: FormData) {
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id"), op = str(fd, "op");
  const here = `/admin/articles/${id}`;
  const a = await db.article.findUniqueOrThrow({ where: { id }, include: { manuscript: { include: { submitter: true } } } });
  if (op === "publish") {
    await db.article.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: a.publishedAt ?? new Date() } });
    if (a.manuscript && a.manuscript.status !== "PUBLISHED") {
      await setStatus(a.manuscript.id, "PUBLISHED", u.id, "Article published", false);
      await sendTemplate("article_published", a.manuscript.submitter.email, { name: a.manuscript.submitter.fullName, title: a.title, url: `${appUrl()}/article/${a.slug}` });
    }
    await audit(u.id, "article.published", "Article", id);
    const n = a.status === "DRAFT" ? await notifySubscribers(id) : 0;
    back(here, { ok: `Article published.${n ? ` Alert emailed to ${n} subscriber${n === 1 ? "" : "s"}.` : ""}` });
  }
  if (op === "unpublish") { await db.article.update({ where: { id }, data: { status: "DRAFT" } }); await audit(u.id, "article.unpublished", "Article", id); back(here, { ok: "Article unpublished (now draft)." }); }
  if (op === "retract") { await db.article.update({ where: { id }, data: { status: "RETRACTED" } }); await audit(u.id, "article.retracted", "Article", id); back(here, { ok: "Article marked as retracted." }); }
  if (op === "delete") {
    if (a.status !== "DRAFT") back(here, { error: "Only draft articles can be deleted. Published articles are part of the permanent record." });
    await db.article.delete({ where: { id } });
    await audit(u.id, "article.deleted", "Article", id);
    redirect("/admin/articles?ok=Draft+deleted.");
  }
  back(here, {});
}
