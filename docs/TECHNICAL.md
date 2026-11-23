# Technical Documentation

## Architecture
- **Next.js 15 App Router** monolith: React server components render pages; mutations are **server actions** (built-in origin/CSRF checks). Route handlers under `app/api/*` serve files, citations, JATS, cron.
- **PostgreSQL via Prisma** (`prisma/schema.prisma`).
- **Vercel Blob (private)** for all uploaded files; files are always streamed through `/api/files/[id]`, which enforces access control (`lib/access.ts`). Locally, files go to `.uploads/`.
- **Email**: `lib/email.ts` renders DB templates, logs every message in `EmailNotification`, sends through SMTP (Nodemailer) when configured.
- **Cron**: `vercel.json` runs `/api/cron/reminders` daily (review reminders, failed-email retries, cleanup). Authenticated with `CRON_SECRET`.

```
app/(public)    public site, auth pages, article/issue/archive pages
app/(portal)    authenticated dashboards: account, author, reviewer, editor, admin
app/api         files, article PDF/cite/JATS, cron
lib/            auth, roles/permissions, storage, email, crossref, citations, jats, markdown
prisma/         schema, seed + default content
scripts/        vercel-build.mjs (generate → db push → seed → next build)
```

## Data model (main entities)
Users, Roles, Permissions, RolePermission, UserRole, Session, AuthToken, LoginAttempt, AuthorProfile, ReviewerProfile, EditorialBoardMember, ResearchCategory, Manuscript, ManuscriptAuthor, ManuscriptFile, ManuscriptRevision, ManuscriptStatusEvent, ReviewerAssignment, ReviewReport, EditorialDecision, EditorialNote, Journal (settings), Volume, Issue, Article, ArticleAuthor, ArticleFile, ArticleReference, DoiRecord, StoredFile, Page (pages & policies), Announcement, EmailTemplate, EmailNotification, ContactMessage, NewsletterSubscriber, AuditLog.

## Security
- Passwords: bcrypt (cost 12); minimum 10 chars with letters + digits.
- Sessions: random 256-bit token in an HttpOnly, Secure, SameSite=Lax cookie; only a SHA-256 hash stored; 7-day expiry; revocable per user.
- MFA: TOTP (RFC 6238) for any user; can be enforced for editorial/admin roles.
- Login restrictions: 5 failed attempts per email / 30 per IP per 15 minutes; rate limits on registration, password reset and contact form.
- Email verification and single-use, expiring reset tokens (hashed in DB).
- RBAC in `lib/roles.ts`; every page/action checks permissions server-side. Associate editors are limited to assigned manuscripts; reviewers to accepted assignments; authors to their own submissions.
- Double-anonymous review: reviewers never receive author data; authors never see reviewer identities, confidential comments, editorial notes, similarity reports or editorial files.
- Uploads: extension allow-list, magic-byte verification, size limit, basic malware screening (EICAR, executables, active PDF content) with optional external scanner (`MALWARE_SCAN_URL`), SHA-256 recorded, private storage.
- XSS: React escaping + `sanitize-html` for all Markdown/HTML. SQL injection: Prisma parameterised queries.
- Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). HTTPS by Vercel.
- Audit log for critical actions.

## Scholarly metadata & SEO
- Article pages: Google Scholar `citation_*` tags, Dublin Core `DC.*`, Schema.org `ScholarlyArticle` JSON-LD, Open Graph, canonical URLs, breadcrumbs.
- `/sitemap.xml`, `/robots.txt`, `/feed.xml` (RSS).
- Citation export: APA, IEEE, Harvard, Vancouver, BibTeX, RIS (`/api/articles/<slug>/cite?format=`).
- JATS XML export (`/api/articles/<slug>/jats`); Crossref 5.3.1 deposit XML (`lib/crossref.ts`) with ORCID, ROR, references, licence (AccessIndicators).

## Environment variables
See `.env.example`.

## Backups & restore
```bash
pg_dump "$DATABASE_URL_UNPOOLED" -Fc -f journal-$(date +%F).dump      # backup
pg_restore -d "$RESTORE_TEST_DATABASE_URL" --clean journal-YYYY-MM-DD.dump  # restore test
```
Neon provides point-in-time recovery branches. Exercise a restore at least quarterly.

## Known limits / future work
- Vercel functions accept ~4.5 MB request bodies; for larger manuscripts self-host or add direct-to-Blob client uploads.
- ORCID OAuth sign-in, plagiarism-service API integration, newsletter sending, multilingual UI and preservation-service (LOCKSS/CLOCKSS/Portico) integration are prepared for but not implemented.
