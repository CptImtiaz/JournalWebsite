import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { permissionsFor, type PermissionKey, type RoleKey, STAFF_ROLES } from "./roles";

const COOKIE = "ijcst_sid";
const SESSION_DAYS = 7;

export function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Password must contain letters and numbers.";
  return null;
}

async function clientInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown",
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

export async function createSession(userId: string, mfaPassed = true) {
  const token = randomToken();
  const { ip, userAgent } = await clientInfo();
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, mfaPassed, ip, userAgent, expiresAt: new Date(Date.now() + SESSION_DAYS * 864e5) },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await db.session.deleteMany({ where: { tokenHash: hashToken(t) } });
  jar.delete(COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadSession>>>["user"] & {
  roleKeys: RoleKey[];
  permissions: Set<PermissionKey>;
};

async function loadSession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: hashToken(t) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });
  if (!s || s.expiresAt < new Date() || !s.user.isActive) return null;
  return s;
}

export const getSession = cache(async () => {
  const s = await loadSession();
  if (!s) return null;
  const roleKeys = s.user.roles.map((r) => r.role.key as RoleKey);
  const user: CurrentUser = Object.assign(s.user, { roleKeys, permissions: permissionsFor(roleKeys) });
  return { session: s, user };
});

/** Fully-authenticated user (MFA passed), or null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const s = await getSession();
  if (!s || !s.session.mfaPassed) return null;
  return s.user;
});

export async function requireUser(next?: string): Promise<CurrentUser> {
  const s = await getSession();
  if (s && !s.session.mfaPassed) redirect("/login/mfa");
  if (!s) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  if (!s.user.emailVerifiedAt) redirect("/verify-email/pending");
  return s.user;
}

export function can(user: CurrentUser | null, p: PermissionKey) {
  return !!user && user.permissions.has(p);
}
export function hasRole(user: CurrentUser | null, ...roles: RoleKey[]) {
  return !!user && roles.some((r) => user.roleKeys.includes(r));
}
export function isStaff(user: CurrentUser | null) {
  return hasRole(user, ...STAFF_ROLES);
}

async function enforceStaffMfa(u: CurrentUser) {
  if (u.mfaEnabled || !isStaff(u)) return;
  const j = await db.journal.findUnique({ where: { id: "journal" }, select: { requireMfaForStaff: true } });
  if (j?.requireMfaForStaff) redirect("/account/security?error=" + encodeURIComponent("Two-factor authentication is required for editorial and administrative access. Please enable it to continue."));
}

export async function requirePermission(p: PermissionKey, next?: string) {
  const u = await requireUser(next);
  if (!u.permissions.has(p)) redirect("/forbidden");
  await enforceStaffMfa(u);
  return u;
}
export async function requireAnyPermission(ps: PermissionKey[], next?: string) {
  const u = await requireUser(next);
  if (!ps.some((p) => u.permissions.has(p))) redirect("/forbidden");
  await enforceStaffMfa(u);
  return u;
}

// ── Rate limiting / login attempt restrictions ──
const WINDOW_MIN = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 30;

export async function loginBlocked(email: string) {
  const { ip } = await clientInfo();
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { key: `email:${email}`, success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { key: `ip:${ip}`, success: false, createdAt: { gte: since } } }),
  ]);
  return byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

export async function recordLoginAttempt(email: string, success: boolean) {
  const { ip } = await clientInfo();
  await db.loginAttempt.createMany({
    data: [
      { key: `email:${email}`, success },
      { key: `ip:${ip}`, success },
    ],
  });
}

/** Generic rate limit for public forms (contact, register, reset). */
export async function rateLimit(bucket: string, max: number, windowMin: number) {
  const { ip } = await clientInfo();
  const key = `${bucket}:${ip}`;
  const since = new Date(Date.now() - windowMin * 60_000);
  const n = await db.loginAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (n >= max) return false;
  await db.loginAttempt.create({ data: { key, success: true } });
  return true;
}

// ── One-time tokens ──
export async function createAuthToken(userId: string, type: string, hours: number) {
  const token = randomToken();
  await db.authToken.create({ data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + hours * 3600_000) } });
  return token;
}
export async function consumeAuthToken(token: string, type: string) {
  const t = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!t || t.type !== type || t.usedAt || t.expiresAt < new Date()) return null;
  await db.authToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
  return t;
}
