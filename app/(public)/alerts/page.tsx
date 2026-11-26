import { Suspense } from "react";
import { PageHeader, TextField } from "@/components/ui";
import { Flash, SubmitButton, CopyButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/auth";
import { sendTemplate } from "@/lib/email";
import { back } from "@/lib/actions-util";
import { str, appUrl } from "@/lib/utils";

export const metadata = { title: "Article alerts", description: "Get an email when a new article is published.", alternates: { canonical: "/alerts" } };

async function subscribe(fd: FormData) {
  "use server";
  if (str(fd, "website")) back("/alerts", { ok: "Check your inbox to confirm." });
  const email = str(fd, "email").toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("/alerts", { error: "Please enter a valid email address." });
  if (!(await rateLimit("alerts", 10, 60))) back("/alerts", { error: "Too many requests. Please try again later." });
  const s = await db.newsletterSubscriber.upsert({ where: { email }, update: { unsubscribedAt: null }, create: { email } });
  if (s.confirmedAt && !s.unsubscribedAt) back("/alerts", { ok: "You are already subscribed." });
  await sendTemplate("alert_confirm", email, { confirm_url: `${appUrl()}/alerts/confirm?token=${s.token}` });
  back("/alerts", { ok: "Almost done. We sent a confirmation link to your inbox." });
}

export default function Alerts() {
  const feed = `${appUrl()}/feed.xml`;
  return (
    <>
      <PageHeader title="Article alerts" subtitle="Be the first to read new research from the journal." crumbs={[{ label: "Article alerts" }]} />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-2">
        <section className="border-t-[3px] border-navy bg-white">
          <div className="border-b border-line bg-surface px-5 py-3"><h2 className="flex items-center gap-2 font-semibold"><Icon name="mail" size={18} />Email alerts</h2></div>
          <div className="space-y-4 p-5">
            <p className="text-ink/80">Get one short email each time a new article is published. You can unsubscribe at any time with one click.</p>
            <Suspense><Flash /></Suspense>
            <form action={subscribe} className="space-y-3">
              <TextField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@university.edu" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <SubmitButton className="btn-accent w-full py-2.5">Sign up for alerts</SubmitButton>
            </form>
            <p className="text-xs text-muted">We only use your email to send article alerts. See our <a className="link" href="/privacy-policy">privacy policy</a>.</p>
          </div>
        </section>
        <section id="rss" className="scroll-mt-24 border-t-[3px] border-navy bg-white">
          <div className="border-b border-line bg-surface px-5 py-3"><h2 className="flex items-center gap-2 font-semibold"><Icon name="rss" size={18} />RSS feed</h2></div>
          <div className="space-y-4 p-5">
            <p className="text-ink/80">Follow the journal in a feed reader such as Feedly, Inoreader or Zotero. Copy the feed address and add it to your reader.</p>
            <div className="flex items-center gap-2 border border-line bg-surface px-3 py-2"><code className="flex-1 truncate text-sm">{feed}</code><CopyButton text={feed} label="Copy" /></div>
            <div className="flex flex-wrap gap-2">
              <a className="btn-secondary" href={`https://feedly.com/i/subscription/feed/${encodeURIComponent(feed)}`} target="_blank" rel="noopener">Open in Feedly</a>
              <a className="btn-secondary" href={`https://www.inoreader.com/?add_feed=${encodeURIComponent(feed)}`} target="_blank" rel="noopener">Open in Inoreader</a>
              <a className="btn-secondary" href="/feed.xml?raw=1">View raw feed</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
