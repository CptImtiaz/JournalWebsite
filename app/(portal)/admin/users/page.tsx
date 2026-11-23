import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requirePermission, hashPassword, passwordProblem } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, Badge, Pagination } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, formatDate } from "@/lib/utils";
import { ROLES } from "@/lib/roles";
import { audit } from "@/lib/audit";

async function createUser(fd: FormData) {
  "use server";
  const u = await requirePermission("users.manage");
  const email = str(fd, "email").toLowerCase(), fullName = str(fd, "fullName"), pw = str(fd, "password");
  if (!email.includes("@") || !fullName) back("/admin/users", { error: "Name and email are required." });
  const pp = passwordProblem(pw);
  if (pp) back("/admin/users", { error: pp });
  if (await db.user.findUnique({ where: { email } })) back("/admin/users", { error: "A user with that email already exists." });
  const roleKeys = fd.getAll("roles").map(String).filter((r) => r in ROLES);
  const roles = await db.role.findMany({ where: { key: { in: roleKeys.length ? roleKeys : ["AUTHOR"] } } });
  const nu = await db.user.create({ data: { email, fullName, passwordHash: await hashPassword(pw), affiliation: optStr(fd, "affiliation"), emailVerifiedAt: new Date(), privacyConsentAt: new Date(), roles: { create: roles.map((r) => ({ roleId: r.id })) } } });
  if (roleKeys.includes("REVIEWER")) await db.reviewerProfile.create({ data: { userId: nu.id, institution: nu.affiliation } });
  await audit(u.id, "user.created", "User", nu.id, { roles: roleKeys });
  back(`/admin/users/${nu.id}`, { ok: "User created." });
}

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  await requirePermission("users.manage");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where: Prisma.UserWhereInput = {};
  if (sp.q) where.OR = [{ fullName: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { affiliation: { contains: sp.q, mode: "insensitive" } }];
  if (sp.role) where.roles = { some: { role: { key: sp.role } } };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, include: { roles: { include: { role: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 30 }),
  ]);
  return (
    <>
      <PTitle title="Users & roles" subtitle={`${total} users`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, institution" className="input max-w-xs" />
        <select name="role" defaultValue={sp.role ?? ""} className="input max-w-xs"><option value="">All roles</option>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="card mb-8 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Roles</th><th>Country / institution</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>{users.map((x) => (
            <tr key={x.id}>
              <td><Link className="link font-medium" href={`/admin/users/${x.id}`}>{x.fullName}</Link><div className="text-xs text-muted">{x.email}</div></td>
              <td><div className="flex flex-wrap gap-1">{x.roles.map((r) => <Badge key={r.roleId} tone={r.role.key === "SUPER_ADMIN" ? "navy" : "blue"}>{r.role.name}</Badge>)}</div></td>
              <td className="text-xs">{x.country}<div className="text-muted">{x.affiliation}</div></td>
              <td className="whitespace-nowrap text-xs">{formatDate(x.createdAt)}</td>
              <td className="space-x-1">{x.isActive ? <Badge tone="green">active</Badge> : <Badge tone="red">deactivated</Badge>}{!x.emailVerifiedAt && <Badge tone="amber">unverified</Badge>}{x.mfaEnabled && <Badge>2FA</Badge>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / 30)} makeHref={(p) => `/admin/users?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.role ? { role: sp.role } : {}), page: String(p) })}`} />
      <Card title="Create user">
        <form action={createUser} className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" name="fullName" required />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="Institution" name="affiliation" />
          <TextField label="Temporary password" name="password" type="text" required minLength={10} hint="Share securely; ask the user to change it." />
          <fieldset className="sm:col-span-2"><legend className="label">Roles</legend><div className="flex flex-wrap gap-4 text-sm">{Object.entries(ROLES).map(([k, v]) => <label key={k} className="flex items-center gap-1"><input type="checkbox" name="roles" value={k} defaultChecked={k === "AUTHOR"} /> {v}</label>)}</div></fieldset>
          <div><SubmitButton>Create user</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
