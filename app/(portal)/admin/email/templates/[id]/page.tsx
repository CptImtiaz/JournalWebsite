import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, bool } from "@/lib/utils";
import { sanitize } from "@/lib/markdown";
import { audit } from "@/lib/audit";

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("email.manage");
  const id = str(fd, "id");
  await db.emailTemplate.update({ where: { id }, data: { subject: str(fd, "subject"), bodyHtml: sanitize(str(fd, "bodyHtml")).replace(/%7B%7B(\w+)%7D%7D/g, "{{$1}}"), isActive: bool(fd, "isActive") } });
  await audit(u.id, "email.template_updated", "EmailTemplate", id);
  back(`/admin/email/templates/${id}`, { ok: "Template saved." });
}

export default async function TemplateEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("email.manage");
  const t = await db.emailTemplate.findUnique({ where: { id: (await params).id } });
  if (!t) notFound();
  const vars = [...new Set([...(t.subject + t.bodyHtml).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))];
  return (
    <>
      <PTitle back={{ href: "/admin/email", label: "Email" }} title={t.name} subtitle={<>Key: <code>{t.key}</code></>} />
      <Card>
        <form action={save} className="space-y-4">
          <input type="hidden" name="id" value={t.id} />
          <TextField label="Subject" name="subject" defaultValue={t.subject} required />
          <TextArea label="HTML body" name="bodyHtml" rows={14} defaultValue={t.bodyHtml} hint={<>Available placeholders: {[...new Set(["journal_name", "site_url", ...vars])].map((v) => <code key={v} className="mr-1">{`{{${v}}}`}</code>)}</>} />
          <Checkbox name="isActive" defaultChecked={t.isActive} label="Enabled (disable to stop sending this notification)" />
          <SubmitButton>Save template</SubmitButton>
        </form>
      </Card>
    </>
  );
}
