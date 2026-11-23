import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, SelectField, Checkbox, Field } from "@/components/ui";
import { SubmitButton, AuthorsEditor, EthicsToggle } from "@/components/client";
import { ARTICLE_TYPES } from "@/lib/constants";
import { submitManuscript } from "./actions";

export default async function Submit() {
  const u = await requireUser("/author/submit");
  const [cats, j] = await Promise.all([db.researchCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), getJournal()]);
  return (
    <>
      <PTitle title="Submit a manuscript" subtitle={<>Please read the <Link className="link" href="/for-authors" target="_blank">submission guidelines</Link> before submitting. Fields marked * are required.</>} />
      <form action={submitManuscript} className="space-y-6" encType="multipart/form-data">
        <Card title="1. Manuscript details">
          <div className="grid gap-4">
            <TextField label="Manuscript title" name="title" required maxLength={500} />
            <TextArea label="Abstract" name="abstract" required rows={7} maxLength={5000} hint="150–300 words recommended." />
            <TextField label="Keywords" name="keywords" required hint="4–8 keywords separated by commas or semicolons." />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Article type" name="articleType" required options={ARTICLE_TYPES} placeholder="Select…" />
              <SelectField label="Research field" name="categoryId" required options={cats.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select…" />
            </div>
          </div>
        </Card>

        <Card title="2. Authors">
          <p className="mb-4 text-sm text-muted">List all authors in the order they should appear. Select one corresponding author. Author details are hidden from reviewers.</p>
          <AuthorsEditor initial={[{ fullName: u.fullName, email: u.email, affiliation: u.affiliation ?? "", country: u.country ?? "", orcid: u.orcid ?? "" }]} />
        </Card>

        <Card title="3. Files">
          <div className="grid gap-5">
            <Field label="Manuscript file (anonymised)" name="manuscriptFile" required hint={`DOC, DOCX or PDF. Max ${j.maxUploadMb} MB. Remove author names and affiliations for double-anonymous review.`}>
              <input id="manuscriptFile" name="manuscriptFile" type="file" required accept=".doc,.docx,.pdf" className="input" />
            </Field>
            <Field label="Supplementary files (optional)" name="supplementaryFiles" hint="DOC, DOCX, PDF, ZIP, XLSX, CSV or images. You may select multiple files.">
              <input id="supplementaryFiles" name="supplementaryFiles" type="file" multiple accept=".doc,.docx,.pdf,.zip,.xlsx,.csv,.png,.jpg,.jpeg" className="input" />
            </Field>
            <TextArea label="Cover letter (optional)" name="coverLetter" rows={5} hint="Visible to editors only." />
            <Field label="…or upload a cover letter file (optional)" name="coverLetterFile">
              <input id="coverLetterFile" name="coverLetterFile" type="file" accept=".doc,.docx,.pdf" className="input" />
            </Field>
          </div>
        </Card>

        <Card title="4. Declarations">
          <div className="grid gap-5">
            <TextArea label="Conflict of interest" name="conflictOfInterest" required rows={2} defaultValue="The authors declare no conflict of interest." />
            <TextArea label="Funding information" name="fundingStatement" required rows={2} placeholder="e.g. This research was funded by … (grant no. …), or: This research received no external funding." />
            <div>
              <span className="label">Ethics approval <span className="text-red-600">*</span> (conditional)</span>
              <EthicsToggle />
            </div>
            <TextArea label="AI usage disclosure" name="aiUsageDisclosure" rows={2} hint={<>Describe any use of AI tools in preparing the work, or leave blank if none. See the <Link className="link" href="/ai-usage-policy" target="_blank">AI Usage Policy</Link>.</>} />
            <Checkbox name="originality" required label="I confirm that this manuscript is original, has not been published previously, is not under consideration elsewhere, and that all authors have approved its submission." />
            <Checkbox name="policies" required label={<>I have read and agree to the journal&apos;s <Link className="link" href="/publication-ethics" target="_blank">Publication Ethics</Link> and <Link className="link" href="/copyright" target="_blank">Copyright & Licensing</Link> policies.</>} />
          </div>
        </Card>

        <div className="flex justify-end"><SubmitButton className="btn-primary px-8 py-3">Submit manuscript</SubmitButton></div>
      </form>
    </>
  );
}
