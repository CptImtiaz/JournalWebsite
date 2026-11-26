import { JournalCover } from "./journal-cover";

export function IssueCover({ issue }: { issue: { coverFileId: string | null; number: number; year: number; volume: { number: number } } }) {
  if (issue.coverFileId)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/files/${issue.coverFileId}`} alt={`Cover of Volume ${issue.volume.number}, Issue ${issue.number}`} loading="lazy" className="aspect-[210/297] w-full object-cover shadow-[0_6px_18px_-6px_rgba(13,31,55,0.45)]" />;
  return <JournalCover volume={issue.volume.number} issue={issue.number} year={issue.year} />;
}
