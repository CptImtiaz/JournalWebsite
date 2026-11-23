import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, Badge, Empty } from "@/components/ui";
import { crossrefConfigured } from "@/lib/crossref";
import { formatDate } from "@/lib/utils";

const TONE = { DRAFT: "gray", SUBMITTED: "amber", REGISTERED: "green", FAILED: "red" } as const;

export default async function DoiAdmin() {
  await requirePermission("publishing.manage");
  const [j, arts] = await Promise.all([
    getJournal(),
    db.article.findMany({ where: { status: { not: "DRAFT" } }, orderBy: { publishedAt: "desc" }, include: { doiRecords: { orderBy: { createdAt: "desc" }, take: 1 } } }),
  ]);
  return (
    <>
      <PTitle title="DOI management" subtitle="Crossref metadata generation, deposit and registration status." />
      <Card title="Configuration" className="mb-6">
        <ul className="space-y-1 text-sm">
          <li>DOI prefix: <strong>{j.doiPrefix || "not set"}</strong> <Link className="link ml-2" href="/admin/settings#doi">edit</Link></li>
          <li>Depositor: {j.crossrefDepositorName || "—"} {j.crossrefDepositorEmail && `<${j.crossrefDepositorEmail}>`}</li>
          <li>Mode: <Badge tone={j.crossrefTestMode ? "amber" : "green"}>{j.crossrefTestMode ? "Crossref test system" : "Crossref production"}</Badge></li>
          <li>Credentials: {crossrefConfigured() ? <Badge tone="green">configured</Badge> : <Badge tone="red">CROSSREF_USERNAME / CROSSREF_PASSWORD not set</Badge>}</li>
        </ul>
        <p className="hint mt-3">DOI registration requires Crossref membership (or an authorised sponsoring organisation). A DOI is shown publicly only once its status is <em>registered</em> and it resolves through doi.org.</p>
      </Card>
      {arts.length === 0 ? <Empty title="No published articles yet" /> : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Article</th><th>DOI</th><th>Status</th><th>Last activity</th><th></th></tr></thead>
            <tbody>{arts.map((a) => {
              const r = a.doiRecords[0];
              return (
                <tr key={a.id}>
                  <td className="min-w-64">{a.title}</td>
                  <td className="font-mono text-xs">{a.doi ?? <span className="text-muted">none</span>}</td>
                  <td>{r ? <Badge tone={TONE[r.status as keyof typeof TONE]}>{r.status.toLowerCase()}</Badge> : <Badge>—</Badge>}</td>
                  <td className="text-xs">{formatDate(r?.registeredAt ?? r?.submittedAt ?? r?.createdAt)}</td>
                  <td><Link className="btn-secondary btn-sm" href={`/admin/doi/${a.id}`}>Manage</Link></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
