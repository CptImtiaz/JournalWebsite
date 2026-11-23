import Link from "next/link";
import { formatDate } from "@/lib/utils";

export type CardArticle = {
  id: string; slug: string; title: string; abstract: string; articleType: string; publishedAt: Date | null; doi: string | null;
  authors: { fullName: string }[];
  files?: { kind: string; fileId: string }[];
  doiRecords?: { status: string }[];
  issue?: { number: number; year: number; volume: { number: number } } | null;
  status?: string;
  views?: number;
};

export function isDoiRegistered(a: { doi: string | null; doiRecords?: { status: string }[] }) {
  return !!a.doi && !!a.doiRecords?.some((r) => r.status === "REGISTERED");
}

function authorLine(a: CardArticle, max = 4) {
  const n = a.authors.map((x) => x.fullName);
  return n.length > max ? `${n.slice(0, max - 1).join(", ")}, … ${n[n.length - 1]}` : n.join(", ");
}

function Meta({ a }: { a: CardArticle }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="font-bold uppercase tracking-wide text-brand">{a.articleType}</span>
      <span className="text-line">|</span>
      <span className="font-semibold text-emerald-700">Open Access</span>
      {a.status === "RETRACTED" && <span className="font-semibold text-red-700">· Retracted</span>}
      {a.publishedAt && <><span className="text-line">|</span><time className="text-muted" dateTime={a.publishedAt.toISOString()}>{formatDate(a.publishedAt, { day: "numeric", month: "short", year: "numeric" })}</time></>}
    </div>
  );
}

/** Large lead story */
export function ArticleFeature({ a }: { a: CardArticle }) {
  return (
    <article className="group">
      <div className="mb-5 h-2 w-16 bg-brand" aria-hidden />
      <Meta a={a} />
      <h3 className="mt-3 font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-[40px]">
        <Link href={`/article/${a.slug}`} className="group-hover:text-brand">{a.title}</Link>
      </h3>
      <p className="mt-4 line-clamp-4 text-[17px] leading-relaxed text-ink/80">{a.abstract}</p>
      <p className="mt-4 text-sm text-muted">{authorLine(a, 6)}</p>
      {a.issue && <p className="mt-1 text-xs text-muted">Volume {a.issue.volume.number}, Issue {a.issue.number} ({a.issue.year})</p>}
    </article>
  );
}

/** Compact list entry (Nature-style "latest research" row) */
export function ArticleRow({ a, snippet = false }: { a: CardArticle; snippet?: boolean }) {
  const pdf = a.files?.some((f) => f.kind === "PDF");
  return (
    <article className="border-b border-line py-5 first:pt-0 last:border-0">
      <Meta a={a} />
      <h3 className="mt-1.5 font-display text-[19px] font-semibold leading-snug text-ink">
        <Link href={`/article/${a.slug}`} className="hover:text-brand hover:underline decoration-1 underline-offset-4">{a.title}</Link>
      </h3>
      {snippet && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/75">{a.abstract}</p>}
      <p className="mt-1.5 text-sm text-muted">{authorLine(a)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        {a.issue && <span className="text-muted">Vol. {a.issue.volume.number}, Iss. {a.issue.number}</span>}
        {isDoiRegistered(a) && <a className="link" href={`https://doi.org/${a.doi}`}>https://doi.org/{a.doi}</a>}
        {pdf && <a href={`/api/articles/${a.slug}/pdf`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" /></svg>PDF</a>}
      </div>
    </article>
  );
}

/** Backwards-compatible card */
export function ArticleCard({ a }: { a: CardArticle; compact?: boolean }) {
  return <ArticleRow a={a} snippet />;
}
