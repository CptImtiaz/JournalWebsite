"use server";
import { redirect } from "next/navigation";
import * as OTPAuth from "otpauth";
import { db } from "./db";
import {
  createSession, destroySession, verifyPassword, hashPassword, passwordProblem, loginBlocked, recordLoginAttempt,
  createAuthToken, consumeAuthToken, getSession, rateLimit, destroyAllSessions,
} from "./auth";
import { sendTemplate } from "./email";
import { audit } from "./audit";
import { back } from "./actions-util";
import { str, optStr, bool, appUrl, normalizeOrcid } from "./utils";

function safeNext(n: string) {
  return n.startsWith("/") && !n.startsWith("//") ? n : "";
}

export async function loginAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const next = safeNext(str(fd, "next"));
  const here = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  if (await loginBlocked(email)) back(here, { error: "Too many failed sign-in attempts. Please wait 15 minutes and try again." });
  const user = await db.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
  const ok = !!user && (await verifyPassword(password, user.passwordHash));
  await recordLoginAttempt(email, ok);
  if (!user || !ok) back(here, { error: "Invalid email or password." });
  if (!user.isActive) back(here, { error: "This account has been deactivated. Please contact the editorial office." });
  await createSession(user.id, !user.mfaEnabled);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "auth.login", "User", user.id);
  if (user.mfaEnabled) redirect(`/login/mfa${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  redirect(next || "/account");
}

export async function mfaAction(fd: FormData) {
  const s = await getSession();
  const next = safeNext(str(fd, "next"));
  if (!s) redirect("/login");
  if (await loginBlocked(`mfa:${s.user.id}`)) back("/login/mfa", { error: "Too many attempts. Please wait 15 minutes." });
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(s.user.mfaSecret ?? ""), digits: 6, period: 30 });
  const ok = totp.validate({ token: str(fd, "code").replace(/\s/g, ""), window: 1 }) !== null;
  await recordLoginAttempt(`mfa:${s.user.id}`, ok);
  if (!ok) back(`/login/mfa${next ? `?next=${encodeURIComponent(next)}` : ""}`, { error: "Invalid authentication code." });
  await db.session.update({ where: { id: s.session.id }, data: { mfaPassed: true } });
  redirect(next || "/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

async function sendVerification(user: { id: string; email: string; fullName: string }) {
  const token = await createAuthToken(user.id, "VERIFY_EMAIL", 48);
  await sendTemplate("verify_email", user.email, { name: user.fullName, verify_url: `${appUrl()}/verify-email?token=${token}` });
}

export async function registerAction(fd: FormData) {
  if (!(await rateLimit("register", 10, 60))) back("/register", { error: "Too many registrations from this network. Try again later." });
  const email = str(fd, "email").toLowerCase();
  const fullName = str(fd, "fullName");
  const password = str(fd, "password");
  if (!fullName || !email.includes("@")) back("/register", { error: "Please provide your name and a valid email address." });
  if (password !== str(fd, "password2")) back("/register", { error: "Passwords do not match." });
  const pp = passwordProblem(password);
  if (pp) back("/register", { error: pp });
  if (!bool(fd, "privacy")) back("/register", { error: "You must accept the privacy policy to register." });
  if (!str(fd, "affiliation") || !str(fd, "country")) back("/register", { error: "Country and institutional affiliation are required." });
  const orcidRaw = str(fd, "orcid");
  const orcid = normalizeOrcid(orcidRaw);
  if (orcidRaw && !orcid) back("/register", { error: "ORCID iD format should be 0000-0000-0000-0000." });
  if (await db.user.findUnique({ where: { email } })) back("/register", { error: "An account with this email already exists. Please sign in or reset your password." });
  const authorRole = await db.role.findUniqueOrThrow({ where: { key: "AUTHOR" } });
  const user = await db.user.create({
    data: {
      email, fullName, passwordHash: await hashPassword(password),
      country: optStr(fd, "country"), affiliation: optStr(fd, "affiliation"), department: optStr(fd, "department"),
      orcid, researchInterests: optStr(fd, "researchInterests"), privacyConsentAt: new Date(),
      roles: { create: [{ roleId: authorRole.id }] },
      authorProfile: { create: {} },
    },
  });
  await audit(user.id, "auth.register", "User", user.id);
  await sendTemplate("account_registered", user.email, { name: user.fullName });
  await sendVerification(user);
  await createSession(user.id, true);
  redirect("/verify-email/pending");
}

export async function resendVerificationAction() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!(await rateLimit(`verify:${s.user.id}`, 3, 30))) back("/verify-email/pending", { error: "Please wait before requesting another email." });
  await sendVerification(s.user);
  back("/verify-email/pending", { ok: "A new verification email has been sent." });
}

export async function forgotAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  if (!(await rateLimit("forgot", 5, 30))) back("/forgot-password", { error: "Too many requests. Please try again later." });
  const user = await db.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = await createAuthToken(user.id, "RESET_PASSWORD", 1);
    await sendTemplate("password_reset", user.email, { name: user.fullName, reset_url: `${appUrl()}/reset-password?token=${token}` });
    await audit(user.id, "auth.password_reset_requested", "User", user.id);
  }
  back("/forgot-password", { ok: "If an account exists for that email, a reset link has been sent." });
}

export async function resetAction(fd: FormData) {
  const token = str(fd, "token");
  const pw = str(fd, "password");
  const here = `/reset-password?token=${encodeURIComponent(token)}`;
  if (pw !== str(fd, "password2")) back(here, { error: "Passwords do not match." });
  const pp = passwordProblem(pw);
  if (pp) back(here, { error: pp });
  const t = await consumeAuthToken(token, "RESET_PASSWORD");
  if (!t) back("/forgot-password", { error: "This reset link is invalid or has expired." });
  await db.user.update({ where: { id: t.userId }, data: { passwordHash: await hashPassword(pw), emailVerifiedAt: new Date() } });
  await destroyAllSessions(t.userId);
  await audit(t.userId, "auth.password_reset", "User", t.userId);
  back("/login", { ok: "Your password has been reset. Please sign in." });
}
