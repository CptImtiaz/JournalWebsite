import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { SubmissionWizard } from "@/components/submission-wizard";
import { ARTICLE_TYPES } from "@/lib/constants";
import { submitManuscript } from "./actions";

export const metadata = { title: "Submit manuscript" };

export default async function Submit() {
  const u = await requireUser("/author/submit");
  const [cats, j] = await Promise.all([db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }), getJournal()]);
  return (
    <>
      <PTitle
        title={`Submit to ${j.shortName}`}
        subtitle={<>New manuscript submission to <em>{j.name}</em>. Need help? Read the <Link className="link" href="/for-authors" target="_blank">guide for authors</Link>.</>}
      />
      <SubmissionWizard
        action={submitManuscript}
        categories={cats}
        types={ARTICLE_TYPES.filter((t) => t !== "Editorial")}
        me={{ fullName: u.fullName, email: u.email, affiliation: u.affiliation ?? "", country: u.country ?? "", orcid: u.orcid ?? "" }}
        maxMb={j.maxUploadMb}
      />
    </>
  );
}
