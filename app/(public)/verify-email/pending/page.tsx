import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { SubmitButton } from "@/components/client";
import { resendVerificationAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/auth";

export default async function Pending() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.user.emailVerifiedAt) redirect("/account");
  return (
    <AuthCard title="Verify your email" subtitle={`We sent a verification link to ${s.user.email}.`}>
      <p className="text-sm text-muted">Please click the link in the email to activate your account. The link is valid for 48 hours. Check your spam folder if it does not arrive.</p>
      <form action={resendVerificationAction} className="mt-6"><SubmitButton className="btn-secondary w-full">Resend verification email</SubmitButton></form>
    </AuthCard>
  );
}
