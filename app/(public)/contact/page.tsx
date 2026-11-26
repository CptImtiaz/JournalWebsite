import { Suspense } from "react";
import { getJournal } from "@/lib/journal";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { PageHeader, TextField, TextArea } from "@/components/ui";
import { Flash, SubmitButton } from "@/components/client";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/auth";
import { sendTemplate, editorialOfficeEmails } from "@/lib/email";
import { back } from "@/lib/actions-util";
import { str } from "@/lib/utils";

export const metadata = { title: "Contact", description: "Official contact information for the journal's editorial office.", alternates: { canonical: "/contact" } };

async function send(fd: FormData) {
  "use server";
  if (str(fd, "website")) back("/contact", { ok: "Thank you. Your message has been sent." }); // honeypot
  const name = str(fd, "name").slice(0, 200), email = str(fd, "email").slice(0, 200), subject = str(fd, "subject").slice(0, 300), message = str(fd, "message").slice(0, 5000);
  if (!name || !email.includes("@") || !subject || !message) back("/contact", { error: "Please complete all fields." });
  if (!(await rateLimit("contact", 5, 60))) back("/contact", { error: "Too many messages. Please try again later." });
  await db.contactMessage.create({ data: { name, email, subject, message } });
  await sendTemplate("contact_message", await editorialOfficeEmails(), { name, email, subject, message });
  back("/contact", { ok: "Thank you. Your message has been sent to the editorial office." });
}

export default async function Contact() {
  const [j, page] = await Promise.all([getJournal(), getPage("contact")]);
  return (
    <>
      <PageHeader title="Contact" crumbs={[{ label: "Contact" }]} />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-2">
        <div>
          {page && <div className="prose prose-slate max-w-none prose-headings:text-ink prose-headings:font-semibold prose-a:text-link prose-h2:mt-8 prose-h2:text-xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />}
          <dl className="card mt-6 space-y-3 p-5 text-sm">
            <div><dt className="font-semibold text-ink">Journal</dt><dd>{j.name}</dd></div>
            {j.publisherName && <div><dt className="font-semibold text-ink">Publisher</dt><dd>{j.publisherName}</dd></div>}
            {j.contactEmail && <div><dt className="font-semibold text-ink">Editorial office email</dt><dd><a className="link" href={`mailto:${j.contactEmail}`}>{j.contactEmail}</a></dd></div>}
            {j.contactPhone && <div><dt className="font-semibold text-ink">Telephone</dt><dd>{j.contactPhone}</dd></div>}
            {(j.contactAddress || j.publisherAddress) && <div><dt className="font-semibold text-ink">Address</dt><dd className="whitespace-pre-line">{j.contactAddress || j.publisherAddress}</dd></div>}
          </dl>
        </div>
        <form action={send} className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-ink">Send a message</h2>
          <Suspense><Flash /></Suspense>
          <TextField label="Your name" name="name" required maxLength={200} />
          <TextField label="Email" name="email" type="email" required maxLength={200} />
          <TextField label="Subject" name="subject" required maxLength={300} />
          <TextArea label="Message" name="message" required rows={6} maxLength={5000} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <SubmitButton>Send message</SubmitButton>
        </form>
      </div>
    </>
  );
}
