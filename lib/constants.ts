export const MANUSCRIPT_STATUSES = {
  SUBMITTED: "Submitted",
  TECHNICAL_CHECK: "Technical Check",
  AWAITING_EDITOR: "Awaiting Editor Assignment",
  EDITOR_ASSIGNED: "Editor Assigned",
  UNDER_REVIEW: "Under Review",
  REVISION_REQUIRED: "Revision Required",
  REVISED_SUBMITTED: "Revised Manuscript Submitted",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  IN_PRODUCTION: "Accepted for Production",
  PUBLISHED: "Published",
  WITHDRAWN: "Withdrawn",
} as const;
export type ManuscriptStatus = keyof typeof MANUSCRIPT_STATUSES;

// Public-facing tracking stages (section 7.3)
export const TRACKING_STAGES = [
  { label: "Submission Received", statuses: ["SUBMITTED"] },
  { label: "Initial Editorial Screening", statuses: ["TECHNICAL_CHECK", "AWAITING_EDITOR"] },
  { label: "Editor Assigned", statuses: ["EDITOR_ASSIGNED"] },
  { label: "Under Peer Review", statuses: ["UNDER_REVIEW", "REVISION_REQUIRED", "REVISED_SUBMITTED"] },
  { label: "Editorial Decision", statuses: ["ACCEPTED", "REJECTED", "IN_PRODUCTION"] },
  { label: "Final Publication", statuses: ["PUBLISHED"] },
];

export const ARTICLE_TYPES = [
  "Research Article",
  "Review Article",
  "Short Communication",
  "Case Study",
  "Survey",
  "Technical Note",
  "Editorial",
];

export const RECOMMENDATIONS = {
  ACCEPT: "Accept",
  MINOR_REVISION: "Minor Revision",
  MAJOR_REVISION: "Major Revision",
  REJECT: "Reject",
} as const;

export const BOARD_POSITIONS = {
  EDITOR_IN_CHIEF: "Editor in Chief",
  MANAGING_EDITOR: "Managing Editor",
  ASSOCIATE_EDITOR: "Associate Editors",
  SECTION_EDITOR: "Section Editors",
  BOARD_MEMBER: "Editorial Board Members",
  ADVISORY_BOARD: "Advisory Board Members",
} as const;

export const FILE_KINDS: Record<string, string> = {
  MANUSCRIPT: "Manuscript",
  SUPPLEMENTARY: "Supplementary file",
  COVER_LETTER: "Cover letter",
  REVISION: "Revised manuscript",
  RESPONSE_LETTER: "Response to reviewers",
  SIMILARITY_REPORT: "Similarity report",
  EDITORIAL: "Editorial document",
  ACCEPTED: "Accepted manuscript",
};

export const MANUSCRIPT_EXT = [".doc", ".docx", ".pdf"];
export const SUPPLEMENTARY_EXT = [".doc", ".docx", ".pdf", ".zip", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"];
export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
