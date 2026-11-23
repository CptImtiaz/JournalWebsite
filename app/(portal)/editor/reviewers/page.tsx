import { requirePermission, hashPassword, randomToken, createAuthToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, Badge, Empty } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, appUrl, normalizeOrcid } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { sendTemplate } from "@/lib/email";

async function addReviewer(fd: FormData) {
  "use server";
  const u = await requirePermission("manuscripts.manage_reviews");
  const email = str(fd, "email").toLowerCase(), fullName = str(fd, "fullName");
  if (!email.includes("@") || !fullName) back("/editor/reviewers", { error: "Name and email are required." });
  const role = await db.role.findUniqueOrThrow({ where: { key: "REVIEWER" } });
  let r = await db.user.findUnique({ where: { email } });
  const profile = { institution: optStr(fd, "institution"), expertise: optStr(fd, "expertise") };
  if (!r) {
    r = await db.user.create({ data: { email, fullName, passwordHash: await hashPassword(randomToken()), affiliation: profile.institution, country: optStr(fd, "country"), orcid: normalizeOrcid(str(fd, "orcid")), roles: { create: [{ roleId: role.id }] }, reviewerProfile: { create: profile } } });
    const token = await createAuthToken(r.id, "RESET_PASSWORD", 24 * 14);
    await sendTemplate("password_reset", email, { name: fullName, reset_url: `${appUrl()}/reset-password?token=${token}` });
  } else {
    await db.userRole.upsert({ where: { userId_roleId: { userId: r.id, roleId: role.id } }, update: {}, create: { userId: r.id, roleId: role.id } });
    await db.reviewerProfile.upsert({ where: { userId: r.id }, update: profile, create: { userId: r.id, ...profile } });
  }
  await audit(u.id, "reviewer.added", "User", r.id);
  back("/editor/reviewers", { ok: `${fullName} added to the reviewer pool.` });
}

export default async function Reviewers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("manuscripts.manage_reviews");
  const { q } = await searchParams;
  const rs = await db.user.findMany({
    where: { roles: { some: { role: { key: "REVIEWER" } } }, ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { reviewerProfile: { expertise: { contains: q, mode: "insensitive" } } }, { researchInterests: { contains: q, mode: "insensitive" } }] } : {}) },
    include: { reviewerProfile: true, reviewAssignments: { select: { status: true, invitedAt: true, respondedAt: true } } },
    orderBy: { fullName: "asc" },
  });
  return (
    <>
      <PTitle title="Reviewer pool" subtitle={`${rs.length} reviewers`} />
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Search name or expertise" className="input max-w-sm" /><button className="btn-secondary">Search</button></form>
      {rs.length === 0 ? <Empty title="No reviewers yet" /> : (
        <div className="card mb-8 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Institution / country</th><th>Expertise</th><th>Availability</th><th>History</th></tr></thead>
            <tbody>{rs.map((r) => {
              const h = r.reviewAssignments;
              const done = h.filter((x) => x.status === "COMPLETED").length;
              return (
                <tr key={r.id}>
                  <td><div className="font-medium">{r.fullName}</div><div className="text-xs text-muted">{r.email}{r.orcid ? ` · ${r.orcid}` : ""}</div>{!r.isActive && <Badge tone="red">inactive</Badge>}</td>
                  <td>{r.reviewerProfile?.institution ?? r.affiliation}<div className="text-xs text-muted">{r.country}</div></td>
                  <td className="max-w-xs text-xs">{r.reviewerProfile?.expertise ?? r.researchInterests}</td>
                  <td><Badge tone={r.reviewerProfile?.availability === "UNAVAILABLE" ? "red" : r.reviewerProfile?.availability === "LIMITED" ? "amber" : "green"}>{(r.reviewerProfile?.availability ?? "AVAILABLE").toLowerCase()}</Badge></td>
                  <td className="whitespace-nowrap text-xs">{h.length} invited · {done} completed · {h.filter((x) => x.status === "DECLINED").length} declined · {h.filter((x) => x.status === "ACCEPTED" || x.status === "INVITED").length} active</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      <Card title="Add a reviewer">
        <form action={addReviewer} className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" name="fullName" required />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="Institution" name="institution" />
          <TextField label="Country" name="country" />
          <TextField label="ORCID (optional)" name="orcid" />
          <TextField label="Research expertise" name="expertise" />
          <div><SubmitButton>Add reviewer</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
