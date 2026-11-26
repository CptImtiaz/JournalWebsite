import Link from "next/link";
import { IssueCover } from "./issue-cover";
import { Empty, Badge } from "./ui";
import { formatDate } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";

type IssueFull = {
  id: string; number: number; year: number; title: string | null; description: string | null; coverFileId: string | null; pdfFileId: string | null; publishedAt: Date | null;
  volume: { number: number };
  articles: { id: string; slug: string; title: string; articleType: string; pages: string | null; articleNumber: string | null; status: string; doi: string | null; isSample?: boolean; authors: { fullName: string }[]; files: { kind: string }[]; doiRecords: { status: string }[] }[];
};

export function IssueView({ issue }: { issue: IssueFull }) {
  const byType = new Map<string, IssueFull["articles"]>();
  for (const a of issue.articles) byType.set(a.articleType, [...(byType.get(a.articleType) ?? []), a]);
  return (
    <div className="container-x grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <IssueCover issue={issue} />
        <dl className="space-y-1 text-sm">
          <div><dt className="inline text-muted">Volume:</dt> <dd className="inline font-medium">{issue.volume.number}</dd></div>
          <div><dt className="inline text-muted">Issue:</dt> <dd className="inline font-medium">{issue.number}</dd></div>
          <div><dt className="inline text-muted">Year:</dt> <dd className="inline font-medium">{issue.year}</dd></div>
          {issue.publishedAt && <div><dt className="inline text-muted">Published:</dt> <dd className="inline font-medium">{formatDate(issue.publishedAt)}</dd></div>}
          <div><dt className="inline text-muted">Articles:</dt> <dd className="inline font-medium">{issue.articles.length}</dd></div>
        </dl>
        {issue.pdfFileId && <a href={`/api/files/${issue.pdfFileId}`} className="btn-primary w-full">Download issue PDF</a>}
      </aside>
      <div>
        {issue.title && <h2 className="text-xl font-semibold text-ink">{issue.title}</h2>}
        {issue.description && <div className="prose prose-slate max-w-none prose-headings:text-ink prose-headings:font-semibold prose-a:text-link prose-h2:mt-8 prose-h2:text-xl mb-6 mt-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(issue.description) }} />}
        <h2 className="mb-4 border-b border-line pb-2 text-lg font-semibold text-ink">Table of Contents</h2>
        {issue.articles.length === 0 && <Empty title="No articles in this issue yet" />}
        {[...byType.entries()].map(([type, list]) => (
          <section key={type} className="mb-8">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{type}</h3>
            <ol className="divide-y divide-line">
              {list.map((a) => (
                <li key={a.id} className="py-4">
                  <Link href={`/article/${a.slug}`} className="text-base font-semibold text-ink hover:text-brand">{a.title}</Link>
                  {a.status === "RETRACTED" && <span className="ml-2"><Badge tone="red">Retracted</Badge></span>}
                  {a.isSample && <span className="ml-2"><Badge tone="amber">Sample</Badge></span>}
                  <p className="mt-1 text-sm text-ink">{a.authors.map((x) => x.fullName).join(", ")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    {a.pages && <span>pp. {a.pages}</span>}
                    {a.articleNumber && <span>Article {a.articleNumber}</span>}
                    {a.doi && a.doiRecords.some((r) => r.status === "REGISTERED") && <a className="link" href={`https://doi.org/${a.doi}`}>doi.org/{a.doi}</a>}
                    <Link href={`/article/${a.slug}`} className="link">Abstract & full text</Link>
                    {a.files.some((f) => f.kind === "PDF") && <a className="link" href={`/api/articles/${a.slug}/pdf`}>PDF</a>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export const issueInclude = {
  volume: true,
  articles: {
    where: { status: { in: ["PUBLISHED", "RETRACTED"] } },
    orderBy: { sortOrder: "asc" as const },
    include: { authors: { orderBy: { order: "asc" as const }, select: { fullName: true } }, files: { select: { kind: true } }, doiRecords: { select: { status: true } } },
  },
};
