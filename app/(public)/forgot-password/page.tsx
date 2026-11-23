import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { forgotAction } from "@/lib/auth-actions";

export const metadata = { title: "Reset password" };

export default function Forgot() {
  return (
    <AuthCard title="Reset your password" subtitle="Enter your account email and we will send a reset link.">
      <form action={forgotAction} className="space-y-4">
        <TextField label="Email" name="email" type="email" required />
        <SubmitButton className="btn-primary w-full">Send reset link</SubmitButton>
      </form>
    </AuthCard>
  );
}
