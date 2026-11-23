import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, bool, slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const id = str(fd, "id");
  const title = str(fd, "title"), body = str(fd, "body");
  if (!title || !body) back(`/admin/announcements/${id || "new"}`, { error: "Title and body required." });
  const pub = bool(fd, "isPublished");
  const existing = id ? await db.announcement.findUnique({ where: { id } }) : null;
  let slug = existing?.slug ?? slugify(title);
  if (!existing && (await db.announcement.findUnique({ where: { slug } }))) slug = `${slug}-${Date.now().toString(36)}`;
  const data = { title, body, isPublished: pub, publishedAt: pub ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null, slug };
  const a = id ? await db.announcement.update({ where: { id }, data }) : await db.announcement.create({ data });
  await audit(u.id, id ? "announcement.updated" : "announcement.created", "Announcement", a.id);
  back(`/admin/announcements/${a.id}`, { ok: "Saved." });
}
async function remove(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  await db.announcement.delete({ where: { id: str(fd, "id") } });
  await audit(u.id, "announcement.deleted", "Announcement", str(fd, "id"));
  redirect("/admin/announcements?ok=Deleted.");
}

export default async function AnnEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content.manage");
  const { id } = await params;
  const a = id === "new" ? null : await db.announcement.findUnique({ where: { id } });
  if (id !== "new" && !a) notFound();
  return (
    <>
      <PTitle back={{ href: "/admin/announcements", label: "Announcements" }} title={a?.title ?? "New announcement"} />
      <Card>
        <form action={save} className="space-y-4">
          <input type="hidden" name="id" value={a?.id ?? ""} />
          <TextField label="Title" name="title" defaultValue={a?.title} required />
          <TextArea label="Body (Markdown)" name="body" rows={12} defaultValue={a?.body} required />
          <Checkbox name="isPublished" defaultChecked={a?.isPublished} label="Published" />
          <SubmitButton>Save</SubmitButton>
        </form>
        {a && <form action={remove} className="mt-6 border-t border-line pt-4"><input type="hidden" name="id" value={a.id} /><SubmitButton className="btn-danger btn-sm" confirm="Delete?">Delete</SubmitButton></form>}
      </Card>
    </>
  );
}
