import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal, navOf, footerOf, DEFAULT_NAV, DEFAULT_FOOTER } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr } from "@/lib/utils";
import { audit } from "@/lib/audit";

function parseLinks(s: string) {
  return s.split(/\r?\n/).map((l) => l.split("|").map((x) => x.trim())).filter(([a, b]) => a && b && (b.startsWith("/") || /^https?:\/\//.test(b))).map(([label, href]) => ({ label, href }));
}

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  const gaId = optStr(fd, "googleAnalyticsId");
  if (gaId && !/^G-[A-Z0-9]{4,}$/i.test(gaId)) back("/admin/seo", { error: "Google Analytics ID should look like G-XXXXXXX." });
  const nav = parseLinks(str(fd, "nav"));
  const footer = parseLinks(str(fd, "footer"));
  await db.journal.update({ where: { id: "journal" }, data: { seoTitle: optStr(fd, "seoTitle"), seoDescription: optStr(fd, "seoDescription"), seoKeywords: optStr(fd, "seoKeywords"), googleAnalyticsId: gaId, navMenu: nav.length ? nav : DEFAULT_NAV, footerLinks: footer.length ? footer : DEFAULT_FOOTER } });
  await audit(u.id, "seo.updated", "Journal", "journal");
  back("/admin/seo", { ok: "Saved." });
}

export default async function Seo() {
  await requirePermission("content.manage");
  const j = await getJournal();
  return (
    <>
      <PTitle title="SEO & navigation" />
      <form action={save} className="space-y-6">
        <Card title="Search engine metadata">
          <div className="grid gap-4">
            <TextField label="Site title" name="seoTitle" defaultValue={j.seoTitle ?? ""} placeholder={j.name} />
            <TextArea label="Meta description" name="seoDescription" rows={2} defaultValue={j.seoDescription ?? ""} placeholder={j.description ?? ""} />
            <TextField label="Keywords" name="seoKeywords" defaultValue={j.seoKeywords ?? ""} />
            <TextField label="Google Analytics 4 measurement ID" name="googleAnalyticsId" defaultValue={j.googleAnalyticsId ?? ""} placeholder="G-XXXXXXX" hint="Leave blank to disable analytics. Update the Privacy Policy if enabled." />
          </div>
          <p className="hint mt-3">Automatically generated: /sitemap.xml, /robots.txt, /feed.xml, canonical URLs, Open Graph tags, Schema.org ScholarlyArticle JSON-LD, Google Scholar (citation_*) and Dublin Core meta tags on every article.</p>
        </Card>
        <Card title="Navigation menus">
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="Main menu (one per line: Label | /path)" name="nav" rows={12} defaultValue={navOf(j).map((l) => `${l.label} | ${l.href}`).join("\n")} />
            <TextArea label="Footer links (Label | /path)" name="footer" rows={12} defaultValue={footerOf(j).map((l) => `${l.label} | ${l.href}`).join("\n")} />
          </div>
        </Card>
        <SubmitButton>Save</SubmitButton>
      </form>
    </>
  );
}
