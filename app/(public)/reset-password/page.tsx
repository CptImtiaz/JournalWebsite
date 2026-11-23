import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { resetAction } from "@/lib/auth-actions";

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthCard title="Choose a new password">
      <form action={resetAction} className="space-y-4">
        <input type="hidden" name="token" value={token ?? ""} />
        <TextField label="New password" name="password" type="password" required minLength={10} autoComplete="new-password" />
        <TextField label="Confirm new password" name="password2" type="password" required minLength={10} autoComplete="new-password" />
        <SubmitButton className="btn-primary w-full">Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
