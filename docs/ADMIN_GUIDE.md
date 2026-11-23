# Administrator Guide

Sign in at `/login`. Your dashboard links appear in the left sidebar according to your roles.

## 1. First-time setup checklist
1. **Account → Security**: enable two-factor authentication. Then change the initial admin password (**Account → Profile**).
2. **Admin → Journal settings**: journal name, logo, description, publisher, contact email, publication frequency, licence, email sender, manuscript ID prefix. Enter ISSN and DOI prefix **only after official assignment** (ISSN check digits are validated).
3. **Admin → Pages & policies**: review every page and policy. They are starting drafts and must reflect the journal's actual practice (e.g. the APC amount in *Publication Fees*, the founding history in *About*).
4. **Admin → Users & roles**: create accounts for your Editor-in-Chief, Managing Editor, Associate Editors and other administrators.
5. **Admin → Editorial board**: add genuinely confirmed members. A profile can only be published after ticking “appointment confirmed”.
6. **Admin → SEO & navigation**: menu, footer links, meta description, optional Google Analytics ID.
7. Check the **System readiness** panel on the admin dashboard (SMTP, file storage, Crossref, ISSN, cron).

## 2. Roles
| Role | Can do |
|---|---|
| Super Administrator | Everything, including user/role management |
| Journal Administrator | Website content, publishing, email, audit logs, all manuscripts (read) |
| Editor-in-Chief | All manuscripts, assign editors, manage reviews, **official decisions**, publishing |
| Managing Editor | All manuscripts, assign editors, manage reviews, official decisions |
| Associate Editor | Only manuscripts assigned to them; invite reviewers; **recommendations** (not final decisions) |
| Reviewer | Only their own review assignments (author identities hidden) |
| Author | Own submissions |
| Reader | Public content |

Users can hold several roles. Deactivating a user immediately signs them out everywhere. **Journal settings → Require 2FA** forces 2FA for all editorial/admin roles.

## 3. Manuscript workflow
1. Author submits → receives ID like `JCS-2026-00001`; editorial office is emailed.
2. Editor opens **Editorial → All manuscripts → manuscript**:
   - set **Technical Check / Awaiting Editor Assignment**;
   - **Assign** a handling editor (emailed);
   - upload a **similarity report** (from a legitimate service) or editorial files — never visible to authors/reviewers;
   - **Invite reviewers** from the pool or by name + email (new reviewers get an account and a set-password link). Set the number of days to complete.
3. Reviewers accept/decline, download the anonymised files, and submit: recommendation, comments to author, confidential comments to editor, optional annotated file.
4. Editors monitor progress, change deadlines, send reminders (also automatic daily), cancel assignments, and use the **internal discussion** notes.
5. **Decision** (EIC / Managing Editor): Accept, Minor Revision, Major Revision, Reject + decision letter. Tick “release reviewer comments” to share the comments-to-author (never reviewer names or confidential comments). The author is emailed.
   Associate Editors record a **recommendation** that is sent to the EIC/ME.
6. Revisions: the author uploads a revised file + response; the manuscript returns as *Revised Manuscript Submitted*; invite reviewers for the next round or decide.
7. After acceptance: **Send to production** creates the article record pre-filled from the manuscript.

## 4. Publishing articles
**Admin → Articles → article**: complete metadata (pages/article number, dates, licence), authors (given/family names, ORCID, ROR), full text (Markdown → HTML), references (one per line; DOIs auto-linked), upload the final **PDF**, supplementary files and figures. Assign to an issue and click **Publish**. The author is notified. Published files get permanent public links; unpublished files remain private.

Retraction: **Mark retracted** (the page stays online with a retraction banner); also publish a retraction notice.

## 5. Volumes, issues and archives
**Admin → Volumes & issues**: create a volume (number + year) and issues. In an issue: title, description, publication date, cover image, optional full-issue PDF, add/remove/reorder articles, **Publish issue**, **Make current issue**. Each issue has a permanent URL `/archives/<year>/volume-N-issue-M`.

## 6. DOIs (Crossref)
Requires Crossref membership (or a sponsoring organisation). Set the DOI prefix and depositor in settings, and ask your developer/host to set `CROSSREF_USERNAME` / `CROSSREF_PASSWORD`.
In **Admin → DOI → Manage**: *Generate Crossref metadata* (XML preview), *Submit / update deposit* (test or production system per settings), then *Verify registration* — the DOI is shown publicly **only** once it actually resolves via doi.org.

## 7. Email
**Admin → Email**: SMTP status, sender, test email, editable HTML templates (with `{{placeholders}}`), delivery log with failed-email retry. Without SMTP configured messages are recorded as “logged” but not sent.

## 8. Website content
Pages & policies (Markdown), research categories (add/edit/reorder/deactivate), announcements, contact-form messages, navigation menus and footer.

## 9. Audit logs
**Admin → Audit logs** records logins, role changes, decisions, publications, settings changes, deletions, etc., with user and IP.

## 10. Backups
- Neon/Vercel Postgres provide point-in-time restore; additionally schedule `pg_dump` exports (see TECHNICAL.md) and **test restoring** them periodically.
- Vercel Blob files: periodically export using the Blob API/CLI.
