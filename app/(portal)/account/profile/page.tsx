import { requireUser, verifyPassword, hashPassword, passwordProblem } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, SelectField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, normalizeOrcid } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function save(fd: FormData) {
  "use server";
  const u = await requireUser();
  const orcidRaw = str(fd, "orcid");
  const orcid = normalizeOrcid(orcidRaw);
  if (orcidRaw && !orcid) back("/account/profile", { error: "Invalid ORCID iD format." });
  if (!str(fd, "fullName")) back("/account/profile", { error: "Name is required." });
  await db.user.update({
    where: { id: u.id },
    data: { fullName: str(fd, "fullName"), country: optStr(fd, "country"), affiliation: optStr(fd, "affiliation"), department: optStr(fd, "department"), orcid, rorId: optStr(fd, "rorId"), researchInterests: optStr(fd, "researchInterests") },
  });
  if (u.roleKeys.includes("REVIEWER")) {
    await db.reviewerProfile.upsert({
      where: { userId: u.id },
      update: { expertise: optStr(fd, "expertise"), availability: str(fd, "availability") || "AVAILABLE", institution: optStr(fd, "affiliation") },
      create: { userId: u.id, expertise: optStr(fd, "expertise"), availability: str(fd, "availability") || "AVAILABLE", institution: optStr(fd, "affiliation") },
    });
  }
  await audit(u.id, "user.profile_updated", "User", u.id);
  back("/account/profile", { ok: "Profile updated." });
}

async function changePassword(fd: FormData) {
  "use server";
  const u = await requireUser();
  if (!(await verifyPassword(str(fd, "current"), u.passwordHash))) back("/account/profile", { error: "Current password is incorrect." });
  const pw = str(fd, "password");
  if (pw !== str(fd, "password2")) back("/account/profile", { error: "New passwords do not match." });
  const pp = passwordProblem(pw);
  if (pp) back("/account/profile", { error: pp });
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } });
  await audit(u.id, "user.password_changed", "User", u.id);
  back("/account/profile", { ok: "Password changed." });
}

export default async function Profile() {
  const u = await requireUser();
  const rp = await db.reviewerProfile.findUnique({ where: { userId: u.id } });
  return (
    <>
      <PTitle title="Profile" />
      <div className="space-y-6">
        <Card title="Personal & institutional details">
          <form action={save} className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" name="fullName" defaultValue={u.fullName} required />
            <TextField label="Email" name="email" defaultValue={u.email} disabled hint="Contact the editorial office to change your email." />
            <TextField label="Country" name="country" defaultValue={u.country ?? ""} />
            <TextField label="Institutional affiliation" name="affiliation" defaultValue={u.affiliation ?? ""} />
            <TextField label="Department" name="department" defaultValue={u.department ?? ""} />
            <TextField label="ORCID iD" name="orcid" defaultValue={u.orcid ?? ""} placeholder="0000-0000-0000-0000" />
            <TextField label="ROR institution ID" name="rorId" defaultValue={u.rorId ?? ""} placeholder="https://ror.org/..." hint="Optional Research Organization Registry identifier." />
            <div className="sm:col-span-2"><TextArea label="Research interests" name="researchInterests" defaultValue={u.researchInterests ?? ""} rows={2} /></div>
            {u.roleKeys.includes("REVIEWER") && (
              <>
                <div className="sm:col-span-2"><TextArea label="Reviewing expertise" name="expertise" defaultValue={rp?.expertise ?? ""} rows={2} /></div>
                <SelectField label="Availability to review" name="availability" defaultValue={rp?.availability ?? "AVAILABLE"} options={[{ value: "AVAILABLE", label: "Available" }, { value: "LIMITED", label: "Limited availability" }, { value: "UNAVAILABLE", label: "Not available" }]} />
              </>
            )}
            <div className="sm:col-span-2"><SubmitButton>Save profile</SubmitButton></div>
          </form>
        </Card>
        <Card title="Change password">
          <form action={changePassword} className="grid gap-4 sm:grid-cols-3">
            <TextField label="Current password" name="current" type="password" required autoComplete="current-password" />
            <TextField label="New password" name="password" type="password" required minLength={10} autoComplete="new-password" />
            <TextField label="Confirm new password" name="password2" type="password" required minLength={10} autoComplete="new-password" />
            <div className="sm:col-span-3"><SubmitButton>Change password</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
