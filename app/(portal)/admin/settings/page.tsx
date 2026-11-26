import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJournal, homepageOf } from "@/lib/journal";
import { PTitle } from "@/components/portal";
import { Card, TextField, TextArea, Checkbox, Field } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { back } from "@/lib/actions-util";
import { str, optStr, bool, int } from "@/lib/utils";
import { storeFile, isRealFile, UploadError } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { IMAGE_EXT } from "@/lib/constants";

const ISSN_RE = /^\d{4}-\d{3}[\dX]$/;

function issnValid(issn: string) {
  if (!ISSN_RE.test(issn)) return false;
  const d = issn.replace("-", "");
  const sum = [...d.slice(0, 7)].reduce((s, c, i) => s + parseInt(c, 10) * (8 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return (check === 10 ? "X" : String(check)) === d[7];
}

async function save(fd: FormData) {
  "use server";
  const u = await requirePermission("content.manage");
  for (const k of ["printIssn", "eIssn", "issnL"]) {
    const v = str(fd, k);
    if (v && !issnValid(v)) back("/admin/settings", { error: `${k === "eIssn" ? "e-ISSN" : k === "issnL" ? "ISSN-L" : "Print ISSN"} "${v}" is not a valid ISSN (format 1234-567X with a correct check digit).` });
  }
  const doiPrefix = optStr(fd, "doiPrefix");
  if (doiPrefix && !/^10\.\d{4,9}$/.test(doiPrefix)) back("/admin/settings", { error: "DOI prefix must look like 10.12345" });
  let logoFileId: string | undefined;
  const logo = fd.get("logo");
  if (isRealFile(logo)) {
    try { logoFileId = (await storeFile(logo, { allowed: [...IMAGE_EXT], folder: "branding", uploadedById: u.id, visibility: "PUBLIC" })).id; }
    catch (e) { if (e instanceof UploadError) back("/admin/settings", { error: e.message }); throw e; }
  }
  let heroImageFileId: string | undefined;
  const hero = fd.get("heroImage");
  if (isRealFile(hero)) {
    try { heroImageFileId = (await storeFile(hero, { allowed: [...IMAGE_EXT], folder: "branding", uploadedById: u.id, visibility: "PUBLIC" })).id; }
    catch (e) { if (e instanceof UploadError) back("/admin/settings", { error: e.message }); throw e; }
  }
  const j = await getJournal();
  await db.journal.update({
    where: { id: "journal" },
    data: {
      name: str(fd, "name") || j.name, shortName: str(fd, "shortName") || j.shortName, abbreviation: optStr(fd, "abbreviation"), tagline: optStr(fd, "tagline"), description: optStr(fd, "description"),
      printIssn: optStr(fd, "printIssn"), eIssn: optStr(fd, "eIssn"), issnL: optStr(fd, "issnL"), issnAuthority: optStr(fd, "issnAuthority"), publicationCountry: optStr(fd, "publicationCountry"),
      publisherName: optStr(fd, "publisherName"), publisherAddress: optStr(fd, "publisherAddress"), publicationFrequency: optStr(fd, "publicationFrequency"),
      contactEmail: optStr(fd, "contactEmail"), contactPhone: optStr(fd, "contactPhone"), contactAddress: optStr(fd, "contactAddress"),
      isOpenAccess: bool(fd, "isOpenAccess"), licenseName: optStr(fd, "licenseName"), licenseUrl: optStr(fd, "licenseUrl"),
      doiPrefix, crossrefDepositorName: optStr(fd, "crossrefDepositorName"), crossrefDepositorEmail: optStr(fd, "crossrefDepositorEmail"), crossrefTestMode: bool(fd, "crossrefTestMode"),
      manuscriptPrefix: (str(fd, "manuscriptPrefix") || "JCS").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "JCS",
      maxUploadMb: Math.min(Math.max(int(fd, "maxUploadMb", 4), 1), 100),
      footerText: optStr(fd, "footerText"), copyrightStatement: optStr(fd, "copyrightStatement"),
      emailSenderName: optStr(fd, "emailSenderName"), emailSenderAddress: optStr(fd, "emailSenderAddress"), editorialOfficeEmail: optStr(fd, "editorialOfficeEmail"),
      requireMfaForStaff: bool(fd, "requireMfaForStaff"),
      homepage: { ...homepageOf(j), headline: optStr(fd, "headline") ?? undefined, description: optStr(fd, "heroDescription") ?? undefined, heroImageAlt: optStr(fd, "heroImageAlt") ?? undefined, ...(heroImageFileId ? { heroImageFileId } : {}), ...(bool(fd, "removeHeroImage") ? { heroImageFileId: null } : {}) },
      ...(logoFileId ? { logoFileId } : {}), ...(bool(fd, "removeLogo") ? { logoFileId: null } : {}),
    },
  });
  await audit(u.id, "settings.updated", "Journal", "journal");
  back("/admin/settings", { ok: "Settings saved." });
}

export default async function Settings() {
  await requirePermission("content.manage");
  const j = await getJournal();
  const hp = homepageOf(j);
  return (
    <>
      <PTitle title="Journal settings" subtitle="Only enter verified information (ISSN, DOI prefix, publisher)." />
      <form action={save} className="space-y-6" encType="multipart/form-data">
        <Card title="Identity & branding">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><TextField label="Journal name" name="name" defaultValue={j.name} required /></div>
            <TextField label="Short name / acronym" name="shortName" defaultValue={j.shortName} required />
            <TextField label="Abbreviated title (ISO 4)" name="abbreviation" defaultValue={j.abbreviation ?? ""} />
            <div className="sm:col-span-2"><TextField label="Tagline" name="tagline" defaultValue={j.tagline ?? ""} /></div>
            <div className="sm:col-span-2"><TextArea label="Short description" name="description" rows={3} defaultValue={j.description ?? ""} /></div>
            <Field label="Logo (square image)" name="logo">
              <input id="logo" type="file" name="logo" accept=".png,.jpg,.jpeg,.webp" className="input" />
              {j.logoFileId && <div className="mt-2 flex items-center gap-2"><img src={`/api/files/${j.logoFileId}`} alt="" className="h-12" /><Checkbox name="removeLogo" label="Remove (use default mark)" /></div>}
            </Field>
            <TextField label="Publication frequency" name="publicationFrequency" defaultValue={j.publicationFrequency ?? ""} />
          </div>
        </Card>
        <Card title="Homepage hero">
          <div className="grid gap-4">
            <TextField label="Headline" name="headline" defaultValue={hp.headline ?? ""} placeholder={j.tagline ?? ""} />
            <TextArea label="Hero description" name="heroDescription" rows={3} defaultValue={hp.description ?? ""} placeholder={j.description ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <Field label="Homepage image" name="heroImage" hint="Landscape image, ideally 1600×1200 px (JPG, PNG or WebP). Leave empty to use the default network illustration.">
                <input id="heroImage" type="file" name="heroImage" accept=".jpg,.jpeg,.png,.webp" className="input" />
                <div className="mt-2 flex items-center gap-3">
                  <img src={hp.heroImageFileId ? `/api/files/${hp.heroImageFileId}` : "/images/hero-network.svg"} alt="" className="h-20 w-28 rounded object-cover" />
                  {hp.heroImageFileId && <Checkbox name="removeHeroImage" label="Use default illustration" />}
                </div>
              </Field>
              <TextField label="Image description (alt text)" name="heroImageAlt" defaultValue={hp.heroImageAlt ?? ""} hint="Describes the image for screen-reader users." />
            </div>
          </div>
        </Card>
        <Card title="ISSN">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Print ISSN (if applicable)" name="printIssn" defaultValue={j.printIssn ?? ""} placeholder="leave blank until assigned" />
            <TextField label="Electronic ISSN (e-ISSN)" name="eIssn" defaultValue={j.eIssn ?? ""} placeholder="leave blank until assigned" />
            <TextField label="ISSN-L" name="issnL" defaultValue={j.issnL ?? ""} />
            <TextField label="ISSN registration authority" name="issnAuthority" defaultValue={j.issnAuthority ?? ""} placeholder="e.g. ISSN National Centre for …" />
            <TextField label="Publication country" name="publicationCountry" defaultValue={j.publicationCountry ?? ""} />
          </div>
          <p className="hint mt-2">Never invent ISSN numbers — enter them only after official assignment. Check digits are validated.</p>
        </Card>
        <Card title="Publisher & contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Publisher name" name="publisherName" defaultValue={j.publisherName ?? ""} />
            <TextField label="Editorial contact email" name="contactEmail" type="email" defaultValue={j.contactEmail ?? ""} />
            <TextArea label="Publisher address" name="publisherAddress" rows={2} defaultValue={j.publisherAddress ?? ""} />
            <TextArea label="Contact address" name="contactAddress" rows={2} defaultValue={j.contactAddress ?? ""} />
            <TextField label="Phone" name="contactPhone" defaultValue={j.contactPhone ?? ""} />
          </div>
        </Card>
        <Card title="Access & licensing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Checkbox name="isOpenAccess" defaultChecked={j.isOpenAccess} label="Open-access journal" />
            <TextField label="Default licence" name="licenseName" defaultValue={j.licenseName ?? ""} />
            <TextField label="Licence URL" name="licenseUrl" defaultValue={j.licenseUrl ?? ""} />
            <div className="sm:col-span-3"><TextField label="Copyright statement (footer)" name="copyrightStatement" defaultValue={j.copyrightStatement ?? ""} /></div>
            <div className="sm:col-span-3"><TextField label="Additional footer text" name="footerText" defaultValue={j.footerText ?? ""} /></div>
          </div>
        </Card>
        <Card title="DOI / Crossref">
          <div id="doi" className="grid gap-4 sm:grid-cols-3">
            <TextField label="DOI prefix" name="doiPrefix" defaultValue={j.doiPrefix ?? ""} placeholder="10.xxxxx — assigned by Crossref" />
            <TextField label="Depositor name" name="crossrefDepositorName" defaultValue={j.crossrefDepositorName ?? ""} />
            <TextField label="Depositor email" name="crossrefDepositorEmail" type="email" defaultValue={j.crossrefDepositorEmail ?? ""} />
            <Checkbox name="crossrefTestMode" defaultChecked={j.crossrefTestMode} label="Use Crossref test system (test.crossref.org)" />
          </div>
          <p className="hint mt-2">Crossref login credentials are stored as server environment variables (CROSSREF_USERNAME, CROSSREF_PASSWORD), never in the database.</p>
        </Card>
        <Card title="Email sender">
          <div id="email" className="grid gap-4 sm:grid-cols-3">
            <TextField label="Sender name" name="emailSenderName" defaultValue={j.emailSenderName ?? ""} placeholder={j.name} />
            <TextField label="Sender email (journal domain)" name="emailSenderAddress" type="email" defaultValue={j.emailSenderAddress ?? ""} />
            <TextField label="Editorial office notification email" name="editorialOfficeEmail" type="email" defaultValue={j.editorialOfficeEmail ?? ""} hint="Blank = all Editors-in-Chief & Managing Editors" />
          </div>
        </Card>
        <Card title="Submissions & security">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Manuscript ID prefix" name="manuscriptPrefix" defaultValue={j.manuscriptPrefix} hint="IDs look like JCS-2026-00001" />
            <TextField label="Max upload size (MB)" name="maxUploadMb" type="number" min={1} max={100} defaultValue={j.maxUploadMb} hint="Vercel functions accept ~4.5 MB request bodies; raise only on self-hosted servers." />
            <Checkbox name="requireMfaForStaff" defaultChecked={j.requireMfaForStaff} label="Require 2FA for editors and administrators" />
          </div>
        </Card>
        <div className="flex justify-end"><SubmitButton className="btn-primary px-8">Save settings</SubmitButton></div>
      </form>
    </>
  );
}
