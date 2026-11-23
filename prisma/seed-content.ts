export const CATEGORIES = [
  "Artificial Intelligence and Machine Learning",
  "Deep Learning and Neural Networks",
  "Computer Vision",
  "Natural Language Processing",
  "Data Science and Big Data Analytics",
  "Software Engineering",
  "Cybersecurity and Information Security",
  "Internet of Things",
  "Cloud and Edge Computing",
  "Robotics and Autonomous Systems",
  "Human-Computer Interaction",
  "Algorithms and Computational Intelligence",
  "Distributed Systems",
  "Database Technologies",
  "Information Systems",
];

const J = "the Journal";

export const PAGES: { slug: string; title: string; kind: "PAGE" | "POLICY"; body: string; seo?: string }[] = [
  {
    slug: "about",
    title: "About the Journal",
    kind: "PAGE",
    seo: "Overview, mission, vision, publication model and peer-review model of the journal.",
    body: `## Journal Overview
The International Journal of Computer Science and Technology is an independent, international, peer-reviewed, open-access journal publishing original research in computer science and information technology. It provides a forum for researchers, practitioners and educators worldwide to share rigorous, reproducible and impactful work.

## Journal Mission
To publish high-quality, original research that advances computing and emerging technologies, through a transparent, fair and timely peer-review process, and to make that research freely available to readers everywhere.

## Vision
To become a trusted international venue for computing research, recognised for editorial integrity, methodological rigour and openness.

## History
The journal was established in 2026 as an independent academic publication. *(Administrators: update this section with the journal's founding details.)*

## Publication Model
The journal publishes continuously online and compiles articles into numbered volumes and issues. All published articles receive permanent URLs and, once the journal's DOI arrangements are in place, registered Digital Object Identifiers.

## Peer-Review Model
All research manuscripts undergo editorial screening followed by double-anonymous peer review by at least two independent experts. Final decisions are made by the Editor-in-Chief or an authorised editor. See the [Peer Review Policy](/peer-review).

## Open Access Statement
All articles are published open access under a Creative Commons licence, allowing anyone to read, download, share and reuse the work with proper attribution. See the [Open Access Policy](/open-access).

## Publication Frequency
See the journal information panel for the current publication frequency.

## Publisher Information
Publisher details are shown in the journal information panel and footer.

## Contact Information
For editorial enquiries please use the [Contact](/contact) page.`,
  },
  {
    slug: "aims-scope",
    title: "Aims & Scope",
    kind: "PAGE",
    seo: "Research fields accepted by the journal in computer science and information technology.",
    body: `The journal publishes original research articles, review articles, short communications and case studies across the breadth of computer science and information technology. Submissions should present a clear contribution to knowledge, be methodologically sound and be of interest to an international readership.

Theoretical, experimental, applied and interdisciplinary contributions are welcome. Manuscripts outside the scope below may be returned without review.`,
  },
  {
    slug: "for-authors",
    title: "For Authors",
    kind: "PAGE",
    seo: "Submission instructions, manuscript preparation guidelines and author resources.",
    body: `## Before You Submit
- Ensure the manuscript is original, not published elsewhere and not under consideration by another journal.
- Read the [Publication Ethics](/publication-ethics), [AI Usage Policy](/ai-usage-policy) and [Publication Fees](/publication-fees) pages.
- All authors must have approved the submission and the author order.

## Manuscript Preparation
- **Format:** DOC, DOCX or PDF. Supplementary material may be uploaded as ZIP.
- **Anonymisation:** The journal operates double-anonymous peer review. Remove author names, affiliations, acknowledgements and self-identifying references from the manuscript file. Author details are entered separately in the submission form.
- **Structure:** Title, abstract (150–300 words), 4–8 keywords, introduction, related work, methods, results, discussion, conclusion and references.
- **References:** Any consistent style is accepted at submission; IEEE style is used for publication. Include DOIs where available.
- **Figures and tables:** Embed in the manuscript at submission; high-resolution files may be requested on acceptance.

## Required Declarations
Every submission must include a conflict-of-interest statement, funding statement, originality declaration and, where applicable, ethics approval details.

## Submission Process
1. [Register](/register) for an author account and verify your email address.
2. Go to [Submit Manuscript](/submit) and complete the form.
3. You will receive a manuscript ID (e.g. JCS-2026-00001) and can track progress from your [author dashboard](/author/dashboard).

## After Acceptance
Accepted articles are copy-edited, typeset and published online. Authors will be asked to approve proofs before publication.`,
  },
  {
    slug: "contact",
    title: "Contact",
    kind: "PAGE",
    body: `For questions about submissions, peer review, or the journal, please contact the editorial office using the details below or the contact form. For the status of a submitted manuscript, please log in to your author dashboard first.`,
  },
  // ── Policies ──
  {
    slug: "publication-ethics",
    title: "Publication Ethics",
    kind: "POLICY",
    body: `${J} is committed to the highest standards of publication ethics and follows the principles and guidance of the Committee on Publication Ethics (COPE).

## Duties of Authors
- Submit only original work, properly acknowledging the work of others.
- Do not submit the same manuscript to more than one journal at a time.
- List as authors only those who made a significant contribution, and agree on authorship order before submission.
- Disclose all funding sources and potential conflicts of interest.
- Report data honestly; fabrication, falsification and image manipulation are serious misconduct.
- Notify the journal promptly of any significant error discovered in a published work.

## Duties of Reviewers
- Keep manuscripts confidential and do not use unpublished material for personal advantage.
- Declare conflicts of interest and decline reviews where impartiality may be compromised.
- Provide objective, constructive and timely reviews.

## Duties of Editors
- Evaluate manuscripts solely on their academic merit, without regard to authors' race, gender, religion, nationality or institution.
- Maintain confidentiality of submissions and reviewer identities.
- Handle complaints and allegations of misconduct following COPE flowcharts.

## Handling Misconduct
Suspected misconduct will be investigated. Outcomes may include rejection, correction, expression of concern or retraction. See the [Retraction Policy](/retraction-policy).`,
  },
  {
    slug: "peer-review",
    title: "Peer Review Policy",
    kind: "POLICY",
    body: `## Review Model
${J} uses **double-anonymous peer review**: reviewers do not know the identity of the authors, and authors do not know the identity of the reviewers.

## Workflow
1. **Technical check** — the editorial office checks completeness, formatting, anonymisation and similarity.
2. **Editorial screening** — the Editor-in-Chief or Managing Editor assesses scope and quality and may reject without review.
3. **Editor assignment** — a handling editor with relevant expertise is assigned.
4. **Peer review** — at least two independent reviewers are invited. Reviewers recommend: Accept, Minor Revision, Major Revision, or Reject.
5. **Decision** — the handling editor makes a recommendation; an authorised editor issues the final decision.
6. **Revision** — revised manuscripts must include a point-by-point response and may be re-reviewed.

## Reviewer Selection
Reviewers are selected for expertise and independence. Reviewers must not be from the authors' institutions or recent collaborators.

## Timelines
Reviewers are normally asked to complete reviews within 21 days. The journal aims to give a first decision within 8 weeks.

## Appeals
Authors may appeal a decision by writing to the editorial office with a detailed rationale. Appeals are considered by an editor not involved in the original decision.`,
  },
  {
    slug: "plagiarism-policy",
    title: "Plagiarism Policy",
    kind: "POLICY",
    body: `All submissions are expected to be original. Plagiarism in any form — including copying text, ideas, data or figures without attribution, and redundant (self-)publication — is unacceptable.

## Similarity Checking
Manuscripts may be screened using a legitimate similarity-checking service. Similarity reports are assessed by editors in context; a numeric score alone does not determine plagiarism.

## Handling
- Minor overlap: authors may be asked to revise and cite properly.
- Substantial plagiarism before publication: the manuscript will be rejected.
- Plagiarism discovered after publication: handled according to the [Retraction Policy](/retraction-policy).`,
  },
  {
    slug: "open-access",
    title: "Open Access Policy",
    kind: "POLICY",
    body: `${J} is a fully open-access journal. All articles are freely available online immediately upon publication, without subscription or registration barriers.

Readers may read, download, copy, distribute, print, search and link to the full texts of articles, and use them for any lawful purpose, provided the original work is properly cited, in accordance with the article licence.

This policy is consistent with the Budapest Open Access Initiative definition of open access.`,
  },
  {
    slug: "copyright",
    title: "Copyright & Licensing",
    kind: "POLICY",
    body: `## Copyright
Authors retain copyright of their articles. Authors grant ${J} a licence to publish the article and to identify itself as the original publisher.

## Author Rights
Authors may:
- Share their article in any repository or website.
- Reuse their article in future works, with citation of the original publication.
- Deposit preprints and accepted versions at any time.

## Licence
Articles are published under the Creative Commons Attribution 4.0 International licence (CC BY 4.0) unless stated otherwise on the article page. See the [Licensing Policy](/licensing-policy).`,
  },
  {
    slug: "licensing-policy",
    title: "Licensing Policy",
    kind: "POLICY",
    body: `Published articles are licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). This licence permits unrestricted use, distribution and reproduction in any medium, provided the original work is properly cited.

The licence applicable to each article is shown on the article page and embedded in the article metadata.`,
  },
  {
    slug: "article-withdrawal-policy",
    title: "Article Withdrawal Policy",
    kind: "POLICY",
    body: `## Before Publication
Authors may withdraw a manuscript at any point before acceptance by contacting the editorial office or using the withdrawal option in the author dashboard, giving a reason. Withdrawal after acceptance requires the agreement of the Editor-in-Chief.

## After Publication
Published articles are part of the permanent scholarly record and are not removed. In exceptional circumstances (e.g. legal issues), an article may be removed with a notice retaining its bibliographic information. Otherwise see the [Retraction Policy](/retraction-policy) and [Corrections Policy](/corrections-policy).`,
  },
  {
    slug: "retraction-policy",
    title: "Retraction Policy",
    kind: "POLICY",
    body: `Retractions follow the COPE Retraction Guidelines. An article may be retracted when there is clear evidence of unreliable findings (due to misconduct or honest error), plagiarism, redundant publication, unethical research or compromised peer review.

Retracted articles remain accessible but are clearly marked as retracted, and a linked retraction notice explaining the reason is published. Metadata, including registered DOI records, is updated accordingly.`,
  },
  {
    slug: "corrections-policy",
    title: "Corrections Policy",
    kind: "POLICY",
    body: `Errors in published articles that affect the scholarly record are corrected through a published **Erratum** (publisher error) or **Corrigendum** (author error), linked to the original article. Minor typographical errors that do not affect interpretation may be corrected without notice at the editors' discretion. Requests for correction should be sent to the editorial office.`,
  },
  {
    slug: "conflict-of-interest",
    title: "Conflict of Interest Policy",
    kind: "POLICY",
    body: `All authors, reviewers and editors must disclose any financial or non-financial interests that could be perceived as influencing their work.

- **Authors** must provide a conflict-of-interest statement at submission (state "The authors declare no conflict of interest" where applicable).
- **Reviewers** must decline invitations where a conflict exists, such as collaboration with the authors in the past three years, institutional affiliation, or competing interests.
- **Editors** must recuse themselves from handling manuscripts where they have a conflict; such manuscripts are handled by another editor.`,
  },
  {
    slug: "research-ethics",
    title: "Research Ethics Policy",
    kind: "POLICY",
    body: `Research involving human participants, human data, or animals must be conducted in accordance with applicable ethical standards (e.g. the Declaration of Helsinki) and approved by an appropriate ethics committee or institutional review board.

Authors must state the approving body and reference number in the submission and the manuscript, and confirm that informed consent was obtained where required. Research using personal data must comply with applicable data protection law. Studies with dual-use or security implications should discuss responsible disclosure.`,
  },
  {
    slug: "ai-usage-policy",
    title: "AI Usage Policy",
    kind: "POLICY",
    body: `## Authors
- AI tools (including large language models) cannot be listed as authors, as they cannot take responsibility for the work.
- Use of AI tools for writing assistance, code generation, data analysis or image generation must be disclosed in the submission form and in the manuscript (e.g. in the Methods or Acknowledgements).
- Authors remain fully responsible for the accuracy, originality and integrity of all content.

## Reviewers and Editors
Reviewers and editors must not upload manuscripts or review content to generative AI tools, as this breaches confidentiality. Limited use for language polishing of the reviewer's own text must be disclosed to the editor.`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    kind: "POLICY",
    body: `## Data We Collect
When you register or submit a manuscript we collect your name, email address, institutional affiliation, country, ORCID iD and research interests. We also store submitted files, review reports and correspondence.

## How We Use Your Data
Personal data is used solely for operating the journal: managing submissions, peer review, publication and communication. Published articles include author names and affiliations as part of the scholarly record.

## Confidentiality
Reviewer identities are confidential. Unpublished manuscripts are only accessible to the authors, assigned editors and assigned reviewers.

## Your Rights
You may request access to, correction of, or deletion of your personal data (subject to the requirements of maintaining the scholarly record) by contacting the editorial office.

## Cookies
The site uses a strictly necessary session cookie to keep you signed in. If analytics are enabled, this will be stated here.

## Data Security
Data is transmitted over HTTPS, passwords are stored using strong one-way hashing, and access is restricted by role.`,
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use",
    kind: "POLICY",
    body: `By using this website you agree to these terms.

- Content published in the journal is licensed as stated on each article page.
- You must not attempt to access manuscripts, accounts or areas of the system that you are not authorised to access.
- You are responsible for keeping your account credentials secure.
- Submissions must comply with the journal's policies; the journal may suspend accounts that violate them.
- The website is provided "as is"; the journal is not liable for any loss arising from its use.`,
  },
  {
    slug: "publication-fees",
    title: "Publication Fees (APC Policy)",
    kind: "POLICY",
    body: `## Article Processing Charges
*(Administrators: state the journal's actual APC here.)* There is no charge for submission or peer review. If an article processing charge applies, it is payable only after acceptance.

## Waivers
Waivers or discounts may be available for authors from low- and middle-income countries or without funding. Requests should be made at submission and do not influence editorial decisions.

## Other Charges
There are no page charges, colour charges or reader subscription charges.`,
  },
  {
    slug: "archiving-policy",
    title: "Archiving Policy",
    kind: "POLICY",
    body: `${J} is committed to the long-term preservation of its published content. All published articles, metadata and files are backed up regularly, and permanent URLs are maintained for every article and issue.

The journal intends to participate in a recognised digital preservation service (such as LOCKSS, CLOCKSS or Portico) and will list the service here once arrangements are in place. Authors are also permitted to deposit published versions in institutional or subject repositories.`,
  },
];

export const EMAIL_TEMPLATES: { key: string; name: string; subject: string; body: string }[] = [
  { key: "account_registered", name: "Account registration (Author)", subject: "Welcome to {{journal_name}}", body: "<p>Dear {{name}},</p><p>Thank you for registering an account with {{journal_name}}. You can now sign in and submit manuscripts once your email address is verified.</p>" },
  { key: "verify_email", name: "Email verification (Author)", subject: "Verify your email address — {{journal_name}}", body: "<p>Dear {{name}},</p><p>Please verify your email address by clicking the link below (valid for 48 hours):</p><p><a href=\"{{verify_url}}\">{{verify_url}}</a></p>" },
  { key: "password_reset", name: "Password reset (User)", subject: "Password reset request — {{journal_name}}", body: "<p>Dear {{name}},</p><p>We received a request to reset your password. Use the link below within 1 hour:</p><p><a href=\"{{reset_url}}\">{{reset_url}}</a></p><p>If you did not request this, you can ignore this email.</p>" },
  { key: "submission_confirmation", name: "Submission confirmation (Author)", subject: "Submission received: {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>Thank you for submitting your manuscript <strong>\"{{title}}\"</strong> to {{journal_name}}.</p><p>Your manuscript ID is <strong>{{manuscript_id}}</strong>. You can track its progress at <a href=\"{{url}}\">{{url}}</a>.</p>" },
  { key: "new_submission_office", name: "New submission (Editorial office)", subject: "New submission {{manuscript_id}}", body: "<p>A new manuscript has been submitted.</p><p><strong>{{manuscript_id}}</strong>: {{title}}<br>Article type: {{article_type}}</p><p><a href=\"{{url}}\">Open in the editorial system</a></p>" },
  { key: "editor_assigned", name: "Editor assignment (Assigned editor)", subject: "You have been assigned manuscript {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>You have been assigned as handling editor for <strong>{{manuscript_id}}</strong>: \"{{title}}\".</p><p><a href=\"{{url}}\">Open manuscript</a></p>" },
  { key: "reviewer_invitation", name: "Reviewer invitation (Reviewer)", subject: "Invitation to review for {{journal_name}}: {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>You are invited to review the manuscript \"<strong>{{title}}</strong>\" ({{manuscript_id}}).</p><p><strong>Abstract:</strong><br>{{abstract}}</p><p>The review is requested by <strong>{{due_date}}</strong>. Please accept or decline via your reviewer dashboard:</p><p><a href=\"{{url}}\">{{url}}</a></p>{{account_html}}" },
  { key: "review_reminder", name: "Review reminder (Reviewer)", subject: "Reminder: review for {{manuscript_id}} due {{due_date}}", body: "<p>Dear {{name}},</p><p>This is a reminder that your review of \"{{title}}\" ({{manuscript_id}}) is due on <strong>{{due_date}}</strong>.</p><p><a href=\"{{url}}\">Open your reviewer dashboard</a></p>" },
  { key: "review_submitted", name: "Review submitted (Editor)", subject: "Review submitted for {{manuscript_id}}", body: "<p>A review has been submitted for <strong>{{manuscript_id}}</strong>: \"{{title}}\".</p><p>Recommendation: <strong>{{recommendation}}</strong></p><p><a href=\"{{url}}\">Open manuscript</a></p>" },
  { key: "revision_requested", name: "Revision requested (Author)", subject: "Decision on {{manuscript_id}}: {{decision}}", body: "<p>Dear {{name}},</p><p>A decision has been made on your manuscript \"{{title}}\" ({{manuscript_id}}): <strong>{{decision}}</strong>.</p><div>{{letter}}</div><p>Please log in to view reviewer comments and upload your revision: <a href=\"{{url}}\">{{url}}</a></p>" },
  { key: "revision_received", name: "Revised manuscript received (Author & Editor)", subject: "Revised manuscript received: {{manuscript_id}}", body: "<p>The revised version (revision {{revision}}) of \"{{title}}\" ({{manuscript_id}}) has been received.</p><p><a href=\"{{url}}\">{{url}}</a></p>" },
  { key: "decision_accept", name: "Acceptance decision (Author)", subject: "Accepted: {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>We are pleased to inform you that your manuscript \"{{title}}\" ({{manuscript_id}}) has been <strong>accepted</strong> for publication in {{journal_name}}.</p><div>{{letter}}</div><p><a href=\"{{url}}\">View details</a></p>" },
  { key: "decision_reject", name: "Rejection decision (Author)", subject: "Decision on {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>Thank you for submitting \"{{title}}\" ({{manuscript_id}}). After careful consideration, we regret that we are unable to accept it for publication.</p><div>{{letter}}</div><p><a href=\"{{url}}\">View details</a></p>" },
  { key: "article_published", name: "Article published (Author)", subject: "Your article has been published: {{title}}", body: "<p>Dear {{name}},</p><p>Your article \"<strong>{{title}}</strong>\" has been published in {{journal_name}}.</p><p><a href=\"{{url}}\">{{url}}</a></p>" },
  { key: "status_changed", name: "Status update (Author)", subject: "Status update for {{manuscript_id}}: {{status}}", body: "<p>Dear {{name}},</p><p>The status of your manuscript \"{{title}}\" ({{manuscript_id}}) is now <strong>{{status}}</strong>.</p><p><a href=\"{{url}}\">Track your submission</a></p>" },
  { key: "contact_message", name: "Contact form (Editorial office)", subject: "Contact form: {{subject}}", body: "<p><strong>From:</strong> {{name}} &lt;{{email}}&gt;</p><p>{{message}}</p>" },
];
