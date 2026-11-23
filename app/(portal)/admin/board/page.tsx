import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { BOARD_POSITIONS } from "@/lib/constants";
import { moveItem } from "@/lib/reorder";
import { back } from "@/lib/actions-util";
import { str } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function op(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const id = str(fd, "id"), o = str(fd, "op");
  const m = await db.editorialBoardMember.findUniqueOrThrow({ where: { id } });
  if (o === "up" || o === "down") await moveItem("editorialBoardMember", id, o === "up" ? -1 : 1, { position: m.position });
  if (o === "toggle") {
    if (!m.isPublished && !m.appointmentConfirmed) back("/admin/board", { error: `Confirm that ${m.fullName} has approved their appointment before publishing (edit the profile).` });
    await db.editorialBoardMember.update({ where: { id }, data: { isPublished: !m.isPublished } });
    await audit(u.id, m.isPublished ? "board.unpublished" : "board.published", "EditorialBoardMember", id);
  }
  back("/admin/board", {});
}

export default async function BoardAdmin() {
  await requirePermission("content.manage");
  const ms = await db.editorialBoardMember.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <>
      <PTitle title="Editorial board" subtitle="Only publish members whose appointment has been genuinely accepted." actions={<Link href="/admin/board/new" className="btn-primary">Add member</Link>} />
      {ms.length === 0 && <Empty title="No board members yet" />}
      {Object.entries(BOARD_POSITIONS).map(([k, label]) => {
        const list = ms.filter((m) => m.position === k);
        if (!list.length) return null;
        return (
          <section key={k} className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{label}</h2>
            <div className="card divide-y divide-line">
              {list.map((m, i) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    {m.photoFileId ? <img src={`/api/files/${m.photoFileId}`} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-surface" />}
                    <div><Link href={`/admin/board/${m.id}`} className="link font-medium">{m.fullName}</Link><div className="text-xs text-muted">{[m.designation, m.affiliation, m.country].filter(Boolean).join(", ")}</div></div>
                  </div>
                  <form action={op} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={m.id} />
                    {m.isPublished ? <Badge tone="green">published</Badge> : <Badge>hidden</Badge>}
                    {!m.appointmentConfirmed && <Badge tone="amber">not confirmed</Badge>}
                    <SubmitButton name="op" value="up" className="btn-secondary btn-sm">↑</SubmitButton>
                    <SubmitButton name="op" value="down" className="btn-secondary btn-sm">↓</SubmitButton>
                    <SubmitButton name="op" value="toggle" className="btn-secondary btn-sm">{m.isPublished ? "Unpublish" : "Publish"}</SubmitButton>
                  </form>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
