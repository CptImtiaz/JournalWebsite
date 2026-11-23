export function IssueCover({ issue }: { issue: { coverFileId: string | null; number: number; year: number; volume: { number: number } } }) {
  if (issue.coverFileId)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/files/${issue.coverFileId}`} alt={`Cover of Volume ${issue.volume.number}, Issue ${issue.number}`} loading="lazy" className="aspect-[3/4] w-full rounded border border-line object-cover" />;
  return (
    <div className="flex aspect-[3/4] w-full flex-col justify-between rounded bg-gradient-to-b from-navy to-brand p-4 text-white">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">IJCST</span>
      <div>
        <div className="text-2xl font-semibold">Vol. {issue.volume.number}</div>
        <div className="text-sm">Issue {issue.number} · {issue.year}</div>
      </div>
    </div>
  );
}
