import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { consumeAuthToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const t = token ? await consumeAuthToken(token, "VERIFY_EMAIL") : null;
  if (t) {
    await db.user.update({ where: { id: t.userId }, data: { emailVerifiedAt: new Date() } });
    await audit(t.userId, "auth.email_verified", "User", t.userId);
  }
  return (
    <AuthCard title={t ? "Email verified" : "Verification failed"}>
      <p className="text-sm text-muted">{t ? "Thank you — your email address has been verified." : "This verification link is invalid, expired or has already been used."}</p>
      <Link href={t ? "/account" : "/verify-email/pending"} className="btn-primary mt-6 w-full">{t ? "Continue to your dashboard" : "Request a new link"}</Link>
    </AuthCard>
  );
}
