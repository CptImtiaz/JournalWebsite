export const ROLES = {
  SUPER_ADMIN: "Super Administrator",
  JOURNAL_ADMIN: "Journal Administrator",
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  MANAGING_EDITOR: "Managing Editor",
  ASSOCIATE_EDITOR: "Associate Editor",
  REVIEWER: "Reviewer",
  AUTHOR: "Author",
  READER: "Reader",
} as const;
export type RoleKey = keyof typeof ROLES;

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Full system access",
  JOURNAL_ADMIN: "Website and publishing management",
  EDITOR_IN_CHIEF: "Editorial oversight and final decisions",
  MANAGING_EDITOR: "Submission and editorial coordination",
  ASSOCIATE_EDITOR: "Assigned manuscript management",
  REVIEWER: "Assigned review access only",
  AUTHOR: "Own submissions and publication records",
  READER: "Public articles and journal content",
};

export const PERMISSIONS = {
  "admin.access": "Access the administrator dashboard",
  "users.manage": "Create, modify, deactivate users and assign roles",
  "content.manage": "Edit website pages, policies, announcements, board, settings",
  "publishing.manage": "Manage articles, volumes, issues and DOI deposits",
  "email.manage": "Manage email templates and view delivery logs",
  "audit.view": "View audit logs",
  "manuscripts.view_all": "View every manuscript",
  "manuscripts.view_assigned": "View manuscripts assigned as handling editor",
  "manuscripts.assign_editor": "Assign handling editors",
  "manuscripts.manage_reviews": "Invite reviewers and manage reviews",
  "manuscripts.decide": "Issue official editorial decisions",
  "manuscripts.recommend": "Make editorial recommendations",
  "reviews.perform": "Review assigned manuscripts",
  "submissions.create": "Submit manuscripts",
} as const;
export type PermissionKey = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: Object.keys(PERMISSIONS) as PermissionKey[],
  JOURNAL_ADMIN: ["admin.access", "content.manage", "publishing.manage", "email.manage", "audit.view", "manuscripts.view_all", "submissions.create"],
  EDITOR_IN_CHIEF: ["manuscripts.view_all", "manuscripts.assign_editor", "manuscripts.manage_reviews", "manuscripts.decide", "manuscripts.recommend", "publishing.manage", "admin.access", "submissions.create"],
  MANAGING_EDITOR: ["manuscripts.view_all", "manuscripts.assign_editor", "manuscripts.manage_reviews", "manuscripts.decide", "manuscripts.recommend", "admin.access", "submissions.create"],
  ASSOCIATE_EDITOR: ["manuscripts.view_assigned", "manuscripts.manage_reviews", "manuscripts.recommend", "submissions.create"],
  REVIEWER: ["reviews.perform", "submissions.create"],
  AUTHOR: ["submissions.create"],
  READER: [],
};

export const STAFF_ROLES: RoleKey[] = ["SUPER_ADMIN", "JOURNAL_ADMIN", "EDITOR_IN_CHIEF", "MANAGING_EDITOR", "ASSOCIATE_EDITOR"];
export const EDITOR_ROLES: RoleKey[] = ["EDITOR_IN_CHIEF", "MANAGING_EDITOR", "ASSOCIATE_EDITOR"];

export function permissionsFor(roles: string[]): Set<PermissionKey> {
  const s = new Set<PermissionKey>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r as RoleKey] ?? []) s.add(p);
  return s;
}
