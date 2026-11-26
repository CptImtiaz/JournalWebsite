import Link from "next/link";
import { getPage } from "@/lib/pages";
import { renderMarkdown } from "@/lib/markdown";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { JournalCover } from "@/components/journal-cover";

export const metadata = { title: "Submission guidelines", description: "Manuscript preparation, templates and submission instructions for authors.", alternates: { canonical: "/for-authors" } };

const TEMPLATES = [
  { href: "/templates/IJCST-manuscript-template.docx", title: "Microsoft Word template", meta: "DOCX · styles, headings, tables, figures, IEEE references", icon: "file" as const },
  { href: "/templates/IJCST-latex-template.zip", title: "LaTeX template", meta: "ZIP · main.tex, ijcst.sty and references.bib. Upload it to Overleaf", icon: "download" as const },
  { href: "/templates/IJCST-manuscript-template.pdf", title: "Template preview", meta: "PDF · see the expected layout before you start", icon: "page" as const },
];

export default async function ForAuthors() {
  const p = await getPage("for-authors");
  return (
    <>
      <PageHeader title="Submission guidelines" subtitle="Everything you need to prepare and submit your manuscript." crumbs={[{ label: "Submission guidelines" }]} actions={<Link href="/submit" className="btn-accent px-5 py-2.5">Submit manuscript</Link>} />
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <section id="templates" className="mb-10 scroll-mt-24">
            <h2 className="mb-4 border-b border-line pb-2 font-display text-[26px] font-semibold">Manuscript templates</h2>
            <p className="mb-5 text-ink/80">Using the journal template is recommended. It sets the correct structure, heading levels, table and figure captions, declarations and reference style. Remember to <strong>anonymise</strong> the file you submit for review.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <a key={t.href} href={t.href} className="group border border-line border-t-[3px] border-t-navy bg-white p-4 hover:border-link">
                  <Icon name={t.icon} size={22} className="text-brand" />
                  <div className="mt-2 font-semibold group-hover:text-link">{t.title}</div>
                  <div className="mt-1 text-xs text-muted">{t.meta}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-link"><Icon name="download" size={14} />Download</div>
                </a>
              ))}
            </div>
          </section>
          {p && <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-h2:text-[26px] prose-h2:border-b prose-h2:border-line prose-h2:pb-2 prose-a:text-link" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />}
        </div>
        <aside className="space-y-6">
          <div className="w-40"><JournalCover /></div>
          <section className="border-t-[3px] border-navy">
            <h2 className="border-b border-line bg-surface px-4 py-2.5 text-[15px] font-semibold">Quick links</h2>
            <ul className="space-y-2 px-4 py-4 text-sm">
              {[["Peer review process", "/peer-review"], ["Publication ethics", "/publication-ethics"], ["AI usage policy", "/ai-usage-policy"], ["Open access & licensing", "/copyright"], ["Publication fees", "/publication-fees"], ["Track your submission", "/author/dashboard"]].map(([l, h]) => <li key={h}><Link href={h} className="text-link hover:underline">{l}</Link></li>)}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
