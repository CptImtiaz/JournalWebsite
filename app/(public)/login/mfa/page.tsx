import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { mfaAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/auth";

export default async function Mfa({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.session.mfaPassed) redirect("/account");
  const { next } = await searchParams;
  return (
    <AuthCard title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app.">
      <form action={mfaAction} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <TextField label="Authentication code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required autoFocus />
        <SubmitButton className="btn-primary w-full">Verify</SubmitButton>
      </form>
    </AuthCard>
  );
}
