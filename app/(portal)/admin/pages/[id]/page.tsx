import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, SelectField, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, bool, slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

const RESERVED = ["admin", "editor", "reviewer", "author", "account", "api", "login", "register", "articles", "article", "archives", "current-issue", "editorial-board", "policies", "announcements", "submit", "contact", "aims-scope", "forbidden", "logout", "feed.xml", "sitemap.xml", "robots.txt", "verify-email", "forgot-password", "reset-password"];
const PROTECTED = ["about", "aims-scope", "for-authors", "contact"];

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const id = str(fd, "id");
  const here = `/admin/pages/${id || "new"}`;
  const title = str(fd, "title");
  const slug = slugify(str(fd, "slug") || title);
  if (!title || !slug) back(here, { error: "Title is required." });
  const existing = id ? await db.page.findUnique({ where: { id } }) : null;
  const finalSlug = existing && PROTECTED.includes(existing.slug) ? existing.slug : slug;
  if (RESERVED.includes(finalSlug) && !(existing && existing.slug === finalSlug)) back(here, { error: "That URL is reserved." });
  if (await db.page.findFirst({ where: { slug: finalSlug, id: { not: id || undefined } } })) back(here, { error: "Another page uses that URL." });
  const data = { title, slug: finalSlug, kind: str(fd, "kind") === "POLICY" ? "POLICY" : "PAGE", body: str(fd, "body"), seoDescription: optStr(fd, "seoDescription"), isPublished: bool(fd, "isPublished") };
  const p = id ? await db.page.update({ where: { id }, data }) : await db.page.create({ data: { ...data, sortOrder: await db.page.count() } });
  await audit(u.id, id ? "page.updated" : "page.created", "Page", p.id, { slug: p.slug });
  back(`/admin/pages/${p.id}`, { ok: "Page saved." });
}

async function remove(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const p = await db.page.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  if (PROTECTED.includes(p.slug)) back(`/admin/pages/${p.id}`, { error: "Core pages cannot be deleted (you can unpublish them)." });
  await db.page.delete({ where: { id: p.id } });
  await audit(u.id, "page.deleted", "Page", p.id, { slug: p.slug });
  redirect("/admin/pages?ok=Page+deleted.");
}

export default async function PageEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content.manage");
  const { id } = await params;
  const p = id === "new" ? null : await db.page.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();
  return (
    <>
      <PTitle back={{ href: "/admin/pages", label: "Pages" }} title={p?.title ?? "New page"} actions={p && <Link className="btn-secondary" href={`/${p.slug}`} target="_blank">View</Link>} />
      <Card>
        <form action={save} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={p?.id ?? ""} />
          <TextField label="Title" name="title" defaultValue={p?.title} required />
          <TextField label="URL slug" name="slug" defaultValue={p?.slug} disabled={!!p && PROTECTED.includes(p.slug)} hint="The page will be available at /<slug>." />
          <SelectField label="Type" name="kind" defaultValue={p?.kind ?? "PAGE"} options={[{ value: "PAGE", label: "Page" }, { value: "POLICY", label: "Policy" }]} />
          <TextField label="SEO meta description" name="seoDescription" defaultValue={p?.seoDescription ?? ""} />
          <div className="sm:col-span-2"><TextArea label="Content (Markdown)" name="body" rows={24} defaultValue={p?.body ?? ""} hint="Use ## Heading for sections, - for bullet lists, **bold**, [link text](https://…). HTML is sanitised." /></div>
          <Checkbox name="isPublished" defaultChecked={p?.isPublished ?? true} label="Published" />
          <div className="sm:col-span-2"><SubmitButton>Save page</SubmitButton></div>
        </form>
        {p && !PROTECTED.includes(p.slug) && <form action={remove} className="mt-6 border-t border-line pt-4"><input type="hidden" name="id" value={p.id} /><SubmitButton className="btn-danger btn-sm" confirm="Delete this page?">Delete page</SubmitButton></form>}
      </Card>
    </>
  );
}
