import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, SelectField, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, int, optStr } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function createVolume(fd: FormData) {
  "use server";
  const u = await requirePermission("publishing.manage");
  const number = int(fd, "number"), year = int(fd, "year");
  if (number < 1 || year < 1900) back("/admin/issues", { error: "Enter a valid volume number and year." });
  if (await db.volume.findUnique({ where: { number } })) back("/admin/issues", { error: `Volume ${number} already exists.` });
  const v = await db.volume.create({ data: { number, year, title: optStr(fd, "title") } });
  await audit(u.id, "volume.created", "Volume", v.id);
  back("/admin/issues", { ok: `Volume ${number} created.` });
}

async function createIssue(fd: FormData) {
  "use server";
  const u = await requirePermission("publishing.manage");
  const v = await db.volume.findUnique({ where: { id: str(fd, "volumeId") } });
  if (!v) back("/admin/issues", { error: "Select a volume." });
  const number = int(fd, "number");
  const year = int(fd, "year", v.year);
  if (number < 1) back("/admin/issues", { error: "Invalid issue number." });
  if (await db.issue.findFirst({ where: { volumeId: v.id, number } })) back("/admin/issues", { error: "That issue already exists in this volume." });
  const i = await db.issue.create({ data: { volumeId: v.id, number, year, title: optStr(fd, "title"), slug: `volume-${v.number}-issue-${number}` } });
  await audit(u.id, "issue.created", "Issue", i.id);
  back(`/admin/issues/${i.id}`, { ok: "Issue created." });
}

export default async function IssuesAdmin() {
  await requirePermission("publishing.manage");
  const vols = await db.volume.findMany({ orderBy: { number: "desc" }, include: { issues: { orderBy: { number: "asc" }, include: { _count: { select: { articles: true } } } } } });
  const y = new Date().getFullYear();
  return (
    <>
      <PTitle title="Volumes & issues" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Create volume">
          <form action={createVolume} className="grid grid-cols-3 gap-3">
            <TextField label="Volume number" name="number" type="number" min={1} defaultValue={(vols[0]?.number ?? 0) + 1} required />
            <TextField label="Year" name="year" type="number" defaultValue={y} required />
            <TextField label="Title (optional)" name="title" />
            <div><SubmitButton>Create volume</SubmitButton></div>
          </form>
        </Card>
        <Card title="Create issue">
          {vols.length === 0 ? <p className="text-sm text-muted">Create a volume first.</p> : (
            <form action={createIssue} className="grid grid-cols-2 gap-3">
              <SelectField label="Volume" name="volumeId" options={vols.map((v) => ({ value: v.id, label: `Volume ${v.number} (${v.year})` }))} />
              <TextField label="Issue number" name="number" type="number" min={1} defaultValue={(vols[0]?.issues.length ?? 0) + 1} required />
              <TextField label="Year" name="year" type="number" defaultValue={y} required />
              <TextField label="Title / theme (optional)" name="title" />
              <div><SubmitButton>Create issue</SubmitButton></div>
            </form>
          )}
        </Card>
      </div>
      <div className="mt-8 space-y-4">
        {vols.length === 0 && <Empty title="No volumes yet" />}
        {vols.map((v) => (
          <Card key={v.id} title={`Volume ${v.number} · ${v.year}${v.title ? ` · ${v.title}` : ""}`}>
            {v.issues.length === 0 ? <p className="text-sm text-muted">No issues.</p> : (
              <ul className="divide-y divide-line text-sm">
                {v.issues.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link className="link font-medium" href={`/admin/issues/${i.id}`}>Issue {i.number} ({i.year}){i.title ? ` · ${i.title}` : ""}</Link>
                    <span className="flex gap-1 text-xs">{i._count.articles} articles {i.isPublished ? <Badge tone="green">published</Badge> : <Badge>unpublished</Badge>}{i.isCurrent && <Badge tone="navy">current</Badge>}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
