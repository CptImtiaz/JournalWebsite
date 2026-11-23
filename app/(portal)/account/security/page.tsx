import QRCode from "qrcode";
import * as OTPAuth from "otpauth";
import { requireUser, isStaff, verifyPassword, destroyAllSessions, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PTitle } from "@/components/portal";
import { Card, TextField, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, formatDateTime } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { getJournal } from "@/lib/journal";

async function start() {
  "use server";
  const u = await requireUser();
  const secret = new OTPAuth.Secret({ size: 20 });
  await db.user.update({ where: { id: u.id }, data: { mfaSecret: secret.base32, mfaEnabled: false } });
  back("/account/security", {});
}
async function confirm(fd: FormData) {
  "use server";
  const u = await requireUser();
  if (!u.mfaSecret) back("/account/security", { error: "Start setup first." });
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(u.mfaSecret), digits: 6, period: 30 });
  if (totp.validate({ token: str(fd, "code").replace(/\s/g, ""), window: 1 }) === null) back("/account/security", { error: "Code did not match. Try again." });
  await db.user.update({ where: { id: u.id }, data: { mfaEnabled: true } });
  await audit(u.id, "user.mfa_enabled", "User", u.id);
  back("/account/security", { ok: "Two-factor authentication is now enabled." });
}
async function disable(fd: FormData) {
  "use server";
  const u = await requireUser();
  if (!(await verifyPassword(str(fd, "password"), u.passwordHash))) back("/account/security", { error: "Password incorrect." });
  await db.user.update({ where: { id: u.id }, data: { mfaEnabled: false, mfaSecret: null } });
  await audit(u.id, "user.mfa_disabled", "User", u.id);
  back("/account/security", { ok: "Two-factor authentication disabled." });
}
async function signOutAll() {
  "use server";
  const u = await requireUser();
  await destroyAllSessions(u.id);
  await createSession(u.id, true);
  await audit(u.id, "user.sessions_revoked", "User", u.id);
  back("/account/security", { ok: "All other sessions have been signed out." });
}

export default async function Security() {
  const u = await requireUser();
  const j = await getJournal();
  const sessions = await db.session.findMany({ where: { userId: u.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  let qr: string | null = null, secret: string | null = null;
  if (u.mfaSecret && !u.mfaEnabled) {
    const totp = new OTPAuth.TOTP({ issuer: j.shortName, label: u.email, secret: OTPAuth.Secret.fromBase32(u.mfaSecret), digits: 6, period: 30 });
    qr = await QRCode.toDataURL(totp.toString());
    secret = u.mfaSecret;
  }
  return (
    <>
      <PTitle title="Security" />
      <div className="space-y-6">
        <Card title="Two-factor authentication (TOTP)" actions={u.mfaEnabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="amber">Disabled</Badge>}>
          {isStaff(u) && !u.mfaEnabled && <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">You hold a privileged role. {j.requireMfaForStaff ? "The journal requires" : "The journal strongly recommends"} two-factor authentication for your account.</p>}
          {u.mfaEnabled ? (
            <form action={disable} className="flex flex-wrap items-end gap-3">
              <div className="w-64"><TextField label="Confirm password to disable" name="password" type="password" required /></div>
              <SubmitButton className="btn-danger">Disable 2FA</SubmitButton>
            </form>
          ) : qr ? (
            <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code for authenticator app" width={200} height={200} />
              <form action={confirm} className="space-y-3">
                <p className="text-sm text-muted">Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, etc.), or enter this key manually:</p>
                <code className="block break-all rounded bg-surface p-2 text-xs">{secret}</code>
                <TextField label="6-digit code" name="code" inputMode="numeric" required />
                <SubmitButton>Confirm and enable</SubmitButton>
              </form>
            </div>
          ) : (
            <form action={start}><p className="mb-3 text-sm text-muted">Protect your account with a time-based one-time code in addition to your password.</p><SubmitButton>Set up two-factor authentication</SubmitButton></form>
          )}
        </Card>
        <Card title="Active sessions" actions={<form action={signOutAll}><SubmitButton className="btn-secondary btn-sm">Sign out all other sessions</SubmitButton></form>}>
          <table className="table"><thead><tr><th>Started</th><th>IP</th><th>Browser</th></tr></thead>
            <tbody>{sessions.map((s) => <tr key={s.id}><td>{formatDateTime(s.createdAt)}</td><td>{s.ip}</td><td className="max-w-xs truncate text-xs text-muted">{s.userAgent}</td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
