import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, destroyAllSessions, createAuthToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, Badge, TextField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, formatDateTime, appUrl } from "@/lib/utils";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, PERMISSIONS, type RoleKey } from "@/lib/roles";
import { audit } from "@/lib/audit";
import { sendTemplate } from "@/lib/email";

async function saveRoles(fd: FormData) {
  "use server";
  const admin = await requirePermission("users.manage");
  const id = str(fd, "id");
  const keys = fd.getAll("roles").map(String).filter((r) => r in ROLES);
  if (id === admin.id && !keys.includes("SUPER_ADMIN")) back(`/admin/users/${id}`, { error: "You cannot remove your own Super Administrator role." });
  const roles = await db.role.findMany({ where: { key: { in: keys } } });
  await db.$transaction([db.userRole.deleteMany({ where: { userId: id } }), db.userRole.createMany({ data: roles.map((r) => ({ userId: id, roleId: r.id })) })]);
  if (keys.includes("REVIEWER")) await db.reviewerProfile.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
  await audit(admin.id, "user.roles_changed", "User", id, { roles: keys });
  back(`/admin/users/${id}`, { ok: "Roles updated." });
}

async function saveDetails(fd: FormData) {
  "use server";
  const admin = await requirePermission("users.manage");
  const id = str(fd, "id");
  const email = str(fd, "email").toLowerCase();
  const clash = await db.user.findFirst({ where: { email, id: { not: id } } });
  if (clash) back(`/admin/users/${id}`, { error: "Email already in use." });
  await db.user.update({ where: { id }, data: { fullName: str(fd, "fullName"), email, affiliation: optStr(fd, "affiliation"), country: optStr(fd, "country") } });
  await audit(admin.id, "user.updated", "User", id);
  back(`/admin/users/${id}`, { ok: "Details saved." });
}

async function accountOp(fd: FormData) {
  "use server";
  const admin = await requirePermission("users.manage");
  const id = str(fd, "id"), op = str(fd, "op");
  const here = `/admin/users/${id}`;
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  if (id === admin.id && (op === "deactivate")) back(here, { error: "You cannot deactivate your own account." });
  if (op === "deactivate") { await db.user.update({ where: { id }, data: { isActive: false } }); await destroyAllSessions(id); }
  if (op === "activate") await db.user.update({ where: { id }, data: { isActive: true } });
  if (op === "revoke") await destroyAllSessions(id);
  if (op === "verify") await db.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  if (op === "reset_mfa") await db.user.update({ where: { id }, data: { mfaEnabled: false, mfaSecret: null } });
  if (op === "reset_pw") {
    const t = await createAuthToken(id, "RESET_PASSWORD", 24);
    await sendTemplate("password_reset", u.email, { name: u.fullName, reset_url: `${appUrl()}/reset-password?token=${t}` });
  }
  await audit(admin.id, `user.${op}`, "User", id);
  back(here, { ok: "Done." });
}

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("users.manage");
  const { id } = await params;
  const u = await db.user.findUnique({ where: { id }, include: { roles: { include: { role: true } }, _count: { select: { manuscripts: true, reviewAssignments: true, sessions: true } } } });
  if (!u) notFound();
  const has = new Set(u.roles.map((r) => r.role.key));
  const logs = await db.auditLog.findMany({ where: { OR: [{ actorId: id }, { entityId: id }] }, orderBy: { createdAt: "desc" }, take: 15 });
  return (
    <>
      <PTitle back={{ href: "/admin/users", label: "Users" }} title={u.fullName} subtitle={u.email} actions={u.isActive ? <Badge tone="green">active</Badge> : <Badge tone="red">deactivated</Badge>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Roles & permissions">
          <form action={saveRoles} className="space-y-3">
            <input type="hidden" name="id" value={u.id} />
            {(Object.keys(ROLES) as RoleKey[]).map((k) => (
              <label key={k} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="roles" value={k} defaultChecked={has.has(k)} className="mt-1" />
                <span><strong>{ROLES[k]}</strong> — <span className="text-muted">{ROLE_DESCRIPTIONS[k]}</span><span className="block text-xs text-muted">{ROLE_PERMISSIONS[k].map((p) => PERMISSIONS[p]).join("; ") || "Public content only"}</span></span>
              </label>
            ))}
            <SubmitButton>Save roles</SubmitButton>
          </form>
        </Card>
        <div className="space-y-6">
          <Card title="Account details">
            <form action={saveDetails} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={u.id} />
              <TextField label="Full name" name="fullName" defaultValue={u.fullName} required />
              <TextField label="Email" name="email" type="email" defaultValue={u.email} required />
              <TextField label="Institution" name="affiliation" defaultValue={u.affiliation ?? ""} />
              <TextField label="Country" name="country" defaultValue={u.country ?? ""} />
              <div><SubmitButton>Save</SubmitButton></div>
            </form>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
              <div>Joined: {formatDateTime(u.createdAt)}</div><div>Last login: {formatDateTime(u.lastLoginAt) || "never"}</div>
              <div>Email verified: {u.emailVerifiedAt ? formatDateTime(u.emailVerifiedAt) : "no"}</div><div>2FA: {u.mfaEnabled ? "enabled" : "off"}</div>
              <div>Submissions: {u._count.manuscripts}</div><div>Review assignments: {u._count.reviewAssignments}</div>
              <div>ORCID: {u.orcid ?? "—"}</div><div>Active sessions: {u._count.sessions}</div>
            </dl>
          </Card>
          <Card title="Account actions">
            <form action={accountOp} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={u.id} />
              {u.isActive ? <SubmitButton name="op" value="deactivate" className="btn-danger btn-sm" confirm="Deactivate and sign out this user?">Deactivate / revoke account</SubmitButton> : <SubmitButton name="op" value="activate" className="btn-secondary btn-sm">Reactivate</SubmitButton>}
              <SubmitButton name="op" value="revoke" className="btn-secondary btn-sm">Sign out all sessions</SubmitButton>
              <SubmitButton name="op" value="reset_pw" className="btn-secondary btn-sm">Send password reset</SubmitButton>
              {!u.emailVerifiedAt && <SubmitButton name="op" value="verify" className="btn-secondary btn-sm">Mark email verified</SubmitButton>}
              {u.mfaEnabled && <SubmitButton name="op" value="reset_mfa" className="btn-secondary btn-sm" confirm="Disable this user's 2FA?">Reset 2FA</SubmitButton>}
            </form>
          </Card>
          <Card title="Recent activity" actions={<Link className="link text-sm" href={`/admin/audit?q=${u.id}`}>All</Link>}>
            <ul className="space-y-1 text-xs">{logs.map((l) => <li key={l.id}><span className="font-mono">{l.action}</span> · {formatDateTime(l.createdAt)}</li>)}</ul>
          </Card>
        </div>
      </div>
    </>
  );
}
