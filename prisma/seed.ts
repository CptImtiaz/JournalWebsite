import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES, ROLE_DESCRIPTIONS, PERMISSIONS, ROLE_PERMISSIONS } from "../lib/roles.ts";
import { CATEGORIES, PAGES, EMAIL_TEMPLATES } from "./seed-content.ts";
import { PAGES as PAGES_V1 } from "./seed-content-v1.ts";
import { PAGES as PAGES_V2, EMAIL_TEMPLATES as EMAIL_V2 } from "./seed-content-v2.ts";

const db = new PrismaClient();
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  for (const [key, name] of Object.entries(ROLES)) {
    const role = await db.role.upsert({ where: { key }, update: { name, description: ROLE_DESCRIPTIONS[key as keyof typeof ROLES] }, create: { key, name, description: ROLE_DESCRIPTIONS[key as keyof typeof ROLES] } });
    const perms = await db.permission.findMany({ where: { key: { in: ROLE_PERMISSIONS[key as keyof typeof ROLES] } } });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (perms.length) await db.rolePermission.createMany({ data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })) });
  }

  await db.journal.upsert({
    where: { id: "journal" },
    update: {},
    create: {
      id: "journal",
      name: "International Journal of Computer Science and Technology",
      shortName: "IJCST",
      abbreviation: "Int. J. Comput. Sci. Technol.",
      tagline: "Advancing Research in Computing and Emerging Technologies.",
      description: "An open access journal for original research in computer science and information technology.",
      publicationFrequency: "Biannual (two issues per year)",
      manuscriptPrefix: "JCS",
      isOpenAccess: true,
      copyrightStatement: "Articles are published open access under CC BY 4.0. Authors retain copyright.",
    },
  });

  for (const [i, name] of CATEGORIES.entries()) {
    await db.researchCategory.upsert({ where: { slug: slug(name) }, update: {}, create: { name, slug: slug(name), sortOrder: i } });
  }
  for (const [i, p] of PAGES.entries()) {
    const existing = await db.page.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await db.page.create({ data: { slug: p.slug, title: p.title, kind: p.kind, body: p.body, seoDescription: p.seo, sortOrder: i } });
      continue;
    }
    // Content upgrade: replace text only if it is still the previous default (never overwrite admin edits).
    const olds = [PAGES_V1, PAGES_V2].map((v) => v.find((o) => o.slug === p.slug)?.body).filter(Boolean);
    if (olds.includes(existing.body) && existing.body !== p.body) {
      await db.page.update({ where: { slug: p.slug }, data: { title: p.title, body: p.body, seoDescription: p.seo ?? existing.seoDescription } });
      console.log(`Updated default content for /${p.slug}`);
    }
  }
  await db.journal.updateMany({ where: { id: "journal", description: "An international peer-reviewed academic journal dedicated to publishing original research, innovative methodologies and scientific contributions in computer science and information technology." }, data: { description: "An open access journal for original research in computer science and information technology." } });
  await db.journal.updateMany({ where: { id: "journal", description: "An open access journal publishing original, peer-reviewed research from across all areas of computer science and information technology." }, data: { description: "An open access journal for original research in computer science and information technology." } });
  for (const t of EMAIL_TEMPLATES) {
    const e = await db.emailTemplate.findUnique({ where: { key: t.key } });
    if (!e) await db.emailTemplate.create({ data: { key: t.key, name: t.name, subject: t.subject, bodyHtml: t.body } });
    else {
      const old = EMAIL_V2.find((o) => o.key === t.key);
      if (old && e.bodyHtml === old.body && e.subject === old.subject && (old.body !== t.body || old.subject !== t.subject))
        await db.emailTemplate.update({ where: { key: t.key }, data: { name: t.name, subject: t.subject, bodyHtml: t.body } });
    }
  }

  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      const sa = await db.role.findUniqueOrThrow({ where: { key: "SUPER_ADMIN" } });
      await db.user.create({
        data: {
          email,
          fullName: "Super Administrator",
          passwordHash: await bcrypt.hash(password, 12),
          emailVerifiedAt: new Date(),
          privacyConsentAt: new Date(),
          roles: { create: [{ roleId: sa.id }] },
        },
      });
      console.log(`Created super administrator ${email}`);
    }
  }
  console.log("Seed complete");
}

main().finally(() => db.$disconnect());
