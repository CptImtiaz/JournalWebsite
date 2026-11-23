import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, formatDateTime } from "@/lib/utils";

async function toggle(fd: FormData) {
  "use server";
  await requirePermission("content.manage");
  const m = await db.contactMessage.findUniqueOrThrow({ where: { id: str(fd, "id") } });
  await db.contactMessage.update({ where: { id: m.id }, data: { handled: !m.handled } });
  back("/admin/messages", {});
}

export default async function Messages() {
  await requirePermission("content.manage");
  const ms = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PTitle title="Contact messages" />
      {ms.length === 0 ? <Empty title="No messages" /> : (
        <div className="space-y-3">{ms.map((m) => (
          <div key={m.id} className="card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><strong>{m.subject}</strong><span className="text-xs text-muted">{formatDateTime(m.createdAt)}</span></div>
            <div className="text-xs text-muted">{m.name} · <a className="link" href={`mailto:${m.email}`}>{m.email}</a></div>
            <p className="mt-2 whitespace-pre-line">{m.message}</p>
            <form action={toggle} className="mt-2 flex items-center gap-2"><input type="hidden" name="id" value={m.id} />{m.handled ? <Badge tone="green">handled</Badge> : <Badge tone="amber">open</Badge>}<SubmitButton className="btn-secondary btn-sm">{m.handled ? "Reopen" : "Mark handled"}</SubmitButton></form>
          </div>
        ))}</div>
      )}
    </>
  );
}
