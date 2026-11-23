import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { TextField } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { loginAction } from "@/lib/auth-actions";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Sign in" subtitle="Authors, reviewers, editors and administrators.">
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton className="btn-primary w-full">Sign in</SubmitButton>
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="link">Forgot password?</Link>
        <Link href="/register" className="link">Create an account</Link>
      </div>
    </AuthCard>
  );
}
