import { db } from "@/lib/db";
import { BOARD_POSITIONS } from "@/lib/constants";
import { PageHeader, Empty } from "@/components/ui";

export const metadata = { title: "Editorial Board", description: "Editors and academic members of the journal's editorial board.", alternates: { canonical: "/editorial-board" } };

export default async function Board() {
  const members = await db.editorialBoardMember.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }] });
  const groups = Object.entries(BOARD_POSITIONS).map(([k, label]) => ({ label, items: members.filter((m) => m.position === k) })).filter((g) => g.items.length);
  return (
    <>
      <PageHeader title="Editorial Board" subtitle="All editorial appointments are made with the consent of the individuals listed." crumbs={[{ label: "Editorial Board" }]} />
      <div className="container-x space-y-12 py-10">
        {groups.length === 0 && <Empty title="The editorial board is being constituted">Board members will be listed here once their appointments are confirmed.</Empty>}
        {groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-5 border-b border-line pb-2 text-xl font-semibold text-ink">{g.label}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {g.items.map((m) => (
                <article key={m.id} className="card flex gap-4 p-5" itemScope itemType="https://schema.org/Person">
                  {m.photoFileId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/files/${m.photoFileId}`} alt={m.fullName} loading="lazy" className="h-24 w-24 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-surface text-2xl font-semibold text-navy">{m.fullName.split(/\s+/).map((x) => x[0]).slice(0, 2).join("")}</div>
                  )}
                  <div className="min-w-0 text-sm">
                    <h3 className="text-base font-semibold text-ink" itemProp="name">{m.fullName}</h3>
                    {m.designation && <p className="text-ink" itemProp="jobTitle">{m.designation}</p>}
                    <p className="text-muted">{[m.department, m.affiliation, m.country].filter(Boolean).join(", ")}</p>
                    {m.researchInterests && <p className="mt-2"><span className="font-medium">Research interests:</span> {m.researchInterests}</p>}
                    {m.biography && <details className="mt-2"><summary className="cursor-pointer text-brand">Biography</summary><p className="mt-1 whitespace-pre-line text-muted">{m.biography}</p></details>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {m.orcid && <a className="link" href={`https://orcid.org/${m.orcid}`} rel="noopener" target="_blank">ORCID {m.orcid}</a>}
                      {m.website && <a className="link" href={m.website} rel="noopener" target="_blank">Academic webpage</a>}
                      {m.email && <a className="link" href={`mailto:${m.email}`}>{m.email}</a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
