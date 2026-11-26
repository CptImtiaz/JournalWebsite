import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, Badge } from "@/components/ui";
import { SubmitButton, CopyButton } from "@/components/client";
import { buildCrossrefXml, submitDeposit, checkDoi, crossrefConfigured } from "@/lib/crossref";
import { back } from "@/lib/actions-util";
import { str, formatDateTime } from "@/lib/utils";
import { audit } from "@/lib/audit";

async function load(id: string) {
  return db.article.findUnique({ where: { id }, include: { authors: { orderBy: { order: "asc" } }, references: { orderBy: { order: "asc" } }, issue: { include: { volume: true } }, doiRecords: { orderBy: { createdAt: "desc" } } } });
}

async function op(fd: FormData) {
  "use server";
  const u = await requirePermission("publishing.manage");
  const id = str(fd, "id"), o = str(fd, "op");
  const here = `/admin/doi/${id}`;
  const a = await load(id);
  if (!a) back("/admin/doi", { error: "Article not found." });
  if (!a.doi) back(here, { error: "Set a DOI on the article first." });
  const j = await getJournal();
  if (j.doiPrefix && !a.doi.startsWith(j.doiPrefix + "/")) back(here, { error: `DOI must start with the journal prefix ${j.doiPrefix}/` });
  if (o === "generate" || o === "submit") {
    const batchId = `${j.shortName}-${a.slug.slice(0, 40)}-${Date.now()}`;
    let xml: string;
    try { xml = buildCrossrefXml(a, j, batchId); } catch (e) { back(here, { error: (e as Error).message }); }
    const rec = await db.doiRecord.create({ data: { articleId: id, doi: a.doi, status: "DRAFT", batchId, depositXml: xml } });
    if (o === "submit") {
      if (a.status === "DRAFT") back(here, { error: "Publish the article first. The DOI must point to a live page." });
      try {
        const r = await submitDeposit(xml, batchId, j.crossrefTestMode);
        await db.doiRecord.update({ where: { id: rec.id }, data: { status: r.ok ? "SUBMITTED" : "FAILED", submittedAt: new Date(), response: `HTTP ${r.status}\n${r.text}` } });
        await audit(u.id, "doi.deposit_submitted", "Article", id, { doi: a.doi, ok: r.ok, test: j.crossrefTestMode });
        back(here, r.ok ? { ok: "Deposit sent to Crossref. Registration takes a few minutes. Then click Verify registration." } : { error: `Crossref returned HTTP ${r.status}.` });
      } catch (e) {
        await db.doiRecord.update({ where: { id: rec.id }, data: { status: "FAILED", response: (e as Error).message } });
        back(here, { error: (e as Error).message });
      }
    }
    await audit(u.id, "doi.metadata_generated", "Article", id);
    back(here, { ok: "Crossref deposit XML generated." });
  }
  if (o === "verify") {
    const c = await checkDoi(a.doi);
    const latest = a.doiRecords.find((r) => r.doi === a.doi) ?? (await db.doiRecord.create({ data: { articleId: id, doi: a.doi } }));
    const registered = c.resolves;
    await db.doiRecord.update({
      where: { id: latest.id },
      data: { status: registered ? "REGISTERED" : latest.status === "REGISTERED" ? "REGISTERED" : latest.status, registeredAt: registered ? latest.registeredAt ?? new Date() : latest.registeredAt, lastCheckedAt: new Date(), response: `${latest.response ?? ""}\n\n[${new Date().toISOString()}] Verification: ${c.detail}${c.target ? ` Resolves to ${c.target}` : ""}`.trim() },
    });
    await audit(u.id, "doi.verified", "Article", id, { resolves: c.resolves, crossref: c.crossref });
    back(here, registered ? { ok: `DOI resolves${c.target ? ` to ${c.target}` : ""}. Marked as registered and now displayed publicly.` } : { error: `DOI does not resolve yet. ${c.detail}` });
  }
  back(here, {});
}

export default async function DoiDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ rec?: string }> }) {
  await requirePermission("publishing.manage");
  const { id } = await params;
  const { rec } = await searchParams;
  const a = await load(id);
  if (!a) notFound();
  const j = await getJournal();
  const show = a.doiRecords.find((r) => r.id === rec) ?? a.doiRecords.find((r) => r.depositXml);
  return (
    <>
      <PTitle back={{ href: "/admin/doi", label: "DOI management" }} title={a.title} subtitle={<>DOI: <code>{a.doi ?? "not set"}</code> · <Link className="link" href={`/admin/articles/${a.id}`}>edit article</Link></>} />
      <div className="space-y-6">
        <Card title="Actions">
          <form action={op} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={a.id} />
            <SubmitButton name="op" value="generate" className="btn-secondary">Generate Crossref metadata</SubmitButton>
            <SubmitButton name="op" value="submit" confirm={`Submit deposit to Crossref ${j.crossrefTestMode ? "TEST" : "PRODUCTION"} system?`}>{crossrefConfigured() ? "Submit / update deposit" : "Submit deposit (credentials needed)"}</SubmitButton>
            <SubmitButton name="op" value="verify" className="btn-secondary">Verify registration (doi.org)</SubmitButton>
          </form>
          <p className="hint mt-2">Submitting again updates the metadata already registered for this DOI. Status is marked “registered” only when the DOI resolves through doi.org.</p>
        </Card>
        <Card title="Deposit history">
          <table className="table"><thead><tr><th>Created</th><th>DOI</th><th>Status</th><th>Batch</th><th>Checked</th><th></th></tr></thead>
            <tbody>{a.doiRecords.map((r) => <tr key={r.id}><td className="text-xs">{formatDateTime(r.createdAt)}</td><td className="font-mono text-xs">{r.doi}</td><td><Badge tone={r.status === "REGISTERED" ? "green" : r.status === "FAILED" ? "red" : "amber"}>{r.status.toLowerCase()}</Badge></td><td className="text-xs">{r.batchId}</td><td className="text-xs">{formatDateTime(r.lastCheckedAt)}</td><td>{r.depositXml && <Link className="link text-xs" href={`?rec=${r.id}`}>XML</Link>}</td></tr>)}</tbody>
          </table>
        </Card>
        {show?.response && <Card title="Last response / verification log"><pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-surface p-3 text-xs">{show.response}</pre></Card>}
        {show?.depositXml && <Card title="Deposit XML" actions={<CopyButton text={show.depositXml} />}><pre className="max-h-[480px] overflow-auto rounded bg-surface p-3 text-xs">{show.depositXml}</pre></Card>}
      </div>
    </>
  );
}
