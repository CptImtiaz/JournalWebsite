import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { db } from "@/lib/db";

export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const s = token ? await db.newsletterSubscriber.findFirst({ where: { token } }) : null;
  if (s && !s.confirmedAt) await db.newsletterSubscriber.update({ where: { id: s.id }, data: { confirmedAt: new Date(), unsubscribedAt: null } });
  return (
    <AuthCard title={s ? "You're subscribed" : "Link not valid"}>
      <p className="text-sm text-muted">{s ? `We will email ${s.email} when new articles are published.` : "This confirmation link is invalid. Please sign up again."}</p>
      <Link href={s ? "/articles" : "/alerts"} className="btn-primary mt-6 w-full">{s ? "Browse articles" : "Sign up for alerts"}</Link>
    </AuthCard>
  );
}
