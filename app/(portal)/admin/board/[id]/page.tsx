import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, SelectField, Checkbox, Field } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { BOARD_POSITIONS, IMAGE_EXT } from "@/lib/constants";
import { back } from "@/lib/actions-util";
import { str, optStr, bool, normalizeOrcid } from "@/lib/utils";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { audit } from "@/lib/audit";

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const id = str(fd, "id");
  const here = `/admin/board/${id || "new"}`;
  if (!str(fd, "fullName") || !(str(fd, "position") in BOARD_POSITIONS)) back(here, { error: "Name and position are required." });
  let photoFileId: string | undefined;
  const photo = fd.get("photo");
  if (isRealFile(photo)) {
    try { photoFileId = (await storeFile(photo, { allowed: IMAGE_EXT, folder: "board", uploadedById: u.id, visibility: "PUBLIC" })).id; }
    catch (e) { if (e instanceof UploadError) back(here, { error: e.message }); throw e; }
  }
  const confirmed = bool(fd, "appointmentConfirmed");
  const data = {
    fullName: str(fd, "fullName"), designation: optStr(fd, "designation"), department: optStr(fd, "department"), affiliation: optStr(fd, "affiliation"), country: optStr(fd, "country"),
    researchInterests: optStr(fd, "researchInterests"), biography: optStr(fd, "biography"), email: optStr(fd, "email"), orcid: normalizeOrcid(str(fd, "orcid")), website: optStr(fd, "website"),
    position: str(fd, "position"), appointmentConfirmed: confirmed, isPublished: confirmed && bool(fd, "isPublished"),
    ...(photoFileId ? { photoFileId } : {}), ...(bool(fd, "removePhoto") ? { photoFileId: null } : {}),
  };
  if (data.website && !/^https?:\/\//.test(data.website)) back(here, { error: "Website must start with http:// or https://" });
  const m = id ? await db.editorialBoardMember.update({ where: { id }, data }) : await db.editorialBoardMember.create({ data: { ...data, sortOrder: await db.editorialBoardMember.count() } });
  await audit(u.id, id ? "board.updated" : "board.created", "EditorialBoardMember", m.id);
  back(`/admin/board/${m.id}`, { ok: "Saved." + (bool(fd, "isPublished") && !confirmed ? " Not published: appointment must be confirmed first." : "") });
}

async function remove(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  await db.editorialBoardMember.delete({ where: { id: str(fd, "id") } });
  await audit(u.id, "board.deleted", "EditorialBoardMember", str(fd, "id"));
  redirect("/admin/board?ok=Member+removed.");
}

export default async function BoardEdit({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content.manage");
  const { id } = await params;
  const m = id === "new" ? null : await db.editorialBoardMember.findUnique({ where: { id } });
  if (id !== "new" && !m) notFound();
  return (
    <>
      <PTitle back={{ href: "/admin/board", label: "Editorial board" }} title={m ? m.fullName : "New board member"} />
      <Card>
        <form action={save} className="grid gap-4 sm:grid-cols-2" encType="multipart/form-data">
          <input type="hidden" name="id" value={m?.id ?? ""} />
          <TextField label="Full name" name="fullName" defaultValue={m?.fullName} required />
          <SelectField label="Editorial position" name="position" defaultValue={m?.position ?? "BOARD_MEMBER"} options={Object.entries(BOARD_POSITIONS).map(([value, label]) => ({ value, label }))} />
          <TextField label="Academic designation" name="designation" defaultValue={m?.designation ?? ""} placeholder="e.g. Professor" />
          <TextField label="Department" name="department" defaultValue={m?.department ?? ""} />
          <TextField label="University / institution" name="affiliation" defaultValue={m?.affiliation ?? ""} />
          <TextField label="Country" name="country" defaultValue={m?.country ?? ""} />
          <TextField label="Institutional email (optional, shown publicly)" name="email" type="email" defaultValue={m?.email ?? ""} />
          <TextField label="ORCID iD" name="orcid" defaultValue={m?.orcid ?? ""} />
          <div className="sm:col-span-2"><TextField label="Personal academic webpage" name="website" type="url" defaultValue={m?.website ?? ""} /></div>
          <div className="sm:col-span-2"><TextField label="Research interests" name="researchInterests" defaultValue={m?.researchInterests ?? ""} /></div>
          <div className="sm:col-span-2"><TextArea label="Professional biography" name="biography" rows={5} defaultValue={m?.biography ?? ""} /></div>
          <Field label="Professional photograph" name="photo" hint="JPG, PNG or WebP.">
            <input id="photo" name="photo" type="file" accept=".jpg,.jpeg,.png,.webp" className="input" />
            {m?.photoFileId && <div className="mt-2 flex items-center gap-3"><img src={`/api/files/${m.photoFileId}`} alt="" className="h-16 w-16 rounded object-cover" /><Checkbox name="removePhoto" label="Remove photo" /></div>}
          </Field>
          <div className="space-y-3 sm:col-span-2">
            <Checkbox name="appointmentConfirmed" defaultChecked={m?.appointmentConfirmed} label="I confirm this person has genuinely accepted this editorial appointment and approved this profile." />
            <Checkbox name="isPublished" defaultChecked={m?.isPublished} label="Publish profile on the Editorial Board page" />
          </div>
          <div><SubmitButton>Save member</SubmitButton></div>
        </form>
        {m && <form action={remove} className="mt-6 border-t border-line pt-4"><input type="hidden" name="id" value={m.id} /><SubmitButton className="btn-danger btn-sm" confirm="Delete this board member?">Delete member</SubmitButton></form>}
      </Card>
    </>
  );
}
