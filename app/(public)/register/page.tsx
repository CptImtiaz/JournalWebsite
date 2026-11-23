import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { TextField, TextArea, Checkbox } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { registerAction } from "@/lib/auth-actions";

export const metadata = { title: "Register", description: "Create an author account to submit manuscripts." };

export default function Register() {
  return (
    <AuthCard wide title="Create an author account" subtitle={<>Already registered? <Link className="link" href="/login">Sign in</Link></>}>
      <form action={registerAction} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><TextField label="Full name" name="fullName" required autoComplete="name" /></div>
        <TextField label="Email address" name="email" type="email" required autoComplete="email" hint="A verification link will be sent to this address." />
        <TextField label="Country" name="country" required autoComplete="country-name" />
        <TextField label="Password" name="password" type="password" required minLength={10} autoComplete="new-password" hint="At least 10 characters with letters and numbers." />
        <TextField label="Confirm password" name="password2" type="password" required minLength={10} autoComplete="new-password" />
        <TextField label="Institutional affiliation" name="affiliation" required autoComplete="organization" />
        <TextField label="Department" name="department" />
        <div className="sm:col-span-2"><TextField label="ORCID iD (optional)" name="orcid" placeholder="0000-0000-0000-0000" /></div>
        <div className="sm:col-span-2"><TextArea label="Research interests" name="researchInterests" rows={2} /></div>
        <div className="sm:col-span-2">
          <Checkbox name="privacy" required label={<>I consent to the processing of my personal data as described in the <Link className="link" href="/privacy-policy" target="_blank">Privacy Policy</Link>.</>} />
        </div>
        <div className="sm:col-span-2"><SubmitButton className="btn-primary w-full">Create account</SubmitButton></div>
      </form>
    </AuthCard>
  );
}
