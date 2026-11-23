import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "./ui";

export type CardArticle = {
  id: string; slug: string; title: string; abstract: string; articleType: string; publishedAt: Date | null; doi: string | null;
  authors: { fullName: string }[];
  files?: { kind: string; fileId: string }[];
  doiRecords?: { status: string }[];
  issue?: { number: number; year: number; volume: { number: number } } | null;
  status?: string;
};

export function isDoiRegistered(a: { doi: string | null; doiRecords?: { status: string }[] }) {
  return !!a.doi && !!a.doiRecords?.some((r) => r.status === "REGISTERED");
}

export function ArticleCard({ a, compact }: { a: CardArticle; compact?: boolean }) {
  const pdf = a.files?.find((f) => f.kind === "PDF");
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="blue">{a.articleType}</Badge>
        {a.status === "RETRACTED" && <Badge tone="red">Retracted</Badge>}
        {a.publishedAt && <span>Published {formatDate(a.publishedAt)}</span>}
        {a.issue && <span>· Vol. {a.issue.volume.number}, Iss. {a.issue.number}</span>}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-navy">
        <Link href={`/article/${a.slug}`} className="hover:text-brand">{a.title}</Link>
      </h3>
      <p className="mt-1 text-sm text-ink">{a.authors.map((x) => x.fullName).join(", ")}</p>
      {!compact && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{a.abstract}</p>}
      {isDoiRegistered(a) && (
        <p className="mt-2 text-xs">
          DOI: <a className="link" href={`https://doi.org/${a.doi}`}>https://doi.org/{a.doi}</a>
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link href={`/article/${a.slug}`} className="btn-primary btn-sm">Read Article</Link>
        {pdf && <a href={`/api/articles/${a.slug}/pdf`} className="btn-secondary btn-sm">PDF</a>}
      </div>
    </article>
  );
}
