import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, slugify } from "@/lib/utils";
import { moveItem } from "@/lib/reorder";
import { audit } from "@/lib/audit";

async function op(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const o = str(fd, "op"), id = str(fd, "id");
  if (o === "add") {
    const name = str(fd, "name");
    if (!name) back("/admin/categories", { error: "Name required." });
    if (await db.researchCategory.findFirst({ where: { OR: [{ name }, { slug: slugify(name) }] } })) back("/admin/categories", { error: "Category exists." });
    await db.researchCategory.create({ data: { name, slug: slugify(name), description: optStr(fd, "description"), sortOrder: await db.researchCategory.count() } });
  }
  if (o === "save") await db.researchCategory.update({ where: { id }, data: { name: str(fd, "name"), description: optStr(fd, "description") } });
  if (o === "toggle") { const c = await db.researchCategory.findUniqueOrThrow({ where: { id } }); await db.researchCategory.update({ where: { id }, data: { isActive: !c.isActive } }); }
  if (o === "up" || o === "down") await moveItem("researchCategory", id, o === "up" ? -1 : 1);
  if (o === "delete") {
    const used = await db.researchCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { manuscripts: true, articles: true } } } });
    if (used._count.manuscripts || used._count.articles) back("/admin/categories", { error: "This category is in use. Deactivate it instead." });
    await db.researchCategory.delete({ where: { id } });
  }
  await audit(u.id, `category.${o}`, "ResearchCategory", id || undefined);
  back("/admin/categories", { ok: "Saved." });
}

export default async function Categories() {
  await requirePermission("content.manage");
  const cs = await db.researchCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { manuscripts: true, articles: true } } } });
  return (
    <>
      <PTitle title="Research categories" subtitle="Shown on Aims & Scope, used for submissions and article search filters." />
      <div className="card mb-6 divide-y divide-line">
        {cs.map((c) => (
          <form key={c.id} action={op} className="grid items-center gap-2 p-3 md:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="id" value={c.id} />
            <input name="name" defaultValue={c.name} className="input" aria-label="Name" />
            <input name="description" defaultValue={c.description ?? ""} placeholder="Description (optional)" className="input" aria-label="Description" />
            <div className="flex flex-wrap items-center gap-1">
              {!c.isActive && <Badge>inactive</Badge>}
              <span className="text-xs text-muted">{c._count.manuscripts}m/{c._count.articles}a</span>
              <SubmitButton name="op" value="save" className="btn-secondary btn-sm">Save</SubmitButton>
              <SubmitButton name="op" value="up" className="btn-secondary btn-sm">↑</SubmitButton>
              <SubmitButton name="op" value="down" className="btn-secondary btn-sm">↓</SubmitButton>
              <SubmitButton name="op" value="toggle" className="btn-secondary btn-sm">{c.isActive ? "Deactivate" : "Activate"}</SubmitButton>
              <SubmitButton name="op" value="delete" className="btn-secondary btn-sm text-red-700" confirm="Delete category?">Delete</SubmitButton>
            </div>
          </form>
        ))}
      </div>
      <Card title="Add category">
        <form action={op} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="op" value="add" />
          <TextField label="Name" name="name" required />
          <TextField label="Description" name="description" />
          <div className="flex items-end"><SubmitButton>Add</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
