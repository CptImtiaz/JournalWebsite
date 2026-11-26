import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { db } from "@/lib/db";

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const s = token ? await db.newsletterSubscriber.findFirst({ where: { token } }) : null;
  if (s && !s.unsubscribedAt) await db.newsletterSubscriber.update({ where: { id: s.id }, data: { unsubscribedAt: new Date() } });
  return (
    <AuthCard title={s ? "You're unsubscribed" : "Link not valid"}>
      <p className="text-sm text-muted">{s ? `${s.email} will no longer receive article alerts.` : "This link is invalid."}</p>
      <Link href="/alerts" className="btn-secondary mt-6 w-full">Manage alerts</Link>
    </AuthCard>
  );
}
