# International Journal of Computer Science and Technology — Publishing Platform

A complete academic journal website and editorial management system: public journal site, author submission and tracking, double-anonymous peer review, editorial decisions, article production, volumes/issues/archives, DOI (Crossref) infrastructure, email notifications, CMS and administration.

**Stack:** Next.js 15 (App Router, server actions) · React 19 · TypeScript · PostgreSQL + Prisma · Tailwind CSS 4 · Vercel Blob (private file storage) · Nodemailer (SMTP) · deployed on Vercel.

- Administrator guide: [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md)
- Technical documentation: [`docs/TECHNICAL.md`](docs/TECHNICAL.md)

## Quick start (local)

```bash
cp .env.example .env          # set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma db push            # create tables
npm run db:seed               # roles, permissions, categories, policies, email templates, super admin
npm run dev                   # http://localhost:3000
```

## Deploy to Vercel

1. Import the GitHub repository in Vercel (framework: Next.js).
2. **Storage → Create/Connect database → Neon (Postgres)** and connect it to the project (sets `DATABASE_URL`).
3. **Storage → Blob → create a _private_ store** and connect it (sets `BLOB_READ_WRITE_TOKEN`).
4. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`, and (when available) SMTP and Crossref variables.
5. Redeploy. The build (`scripts/vercel-build.mjs`) syncs the schema and seeds default content idempotently.
6. Sign in at `/login` with the admin account, enable 2FA, and complete **Admin → Journal settings**.
