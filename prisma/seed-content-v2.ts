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
    title: "Journal information",
    kind: "PAGE",
    seo: "Journal information for IJCST: scope, editorial criteria, double-anonymous peer review, open access and publication model.",
    body: `**International Journal of Computer Science and Technology (IJCST)** is an open access journal publishing original research from across all areas of computer science and information technology.

We publish primary research, reviews and short communications that are scientifically valid and technically sound. Editors and reviewers ask whether the conclusions follow from the evidence, whether the methods are described well enough to be reproduced, and whether the work adds to what is already known. We do not reject work for being incremental, negative or of specialist interest, provided it is sound.

## Our mission
To make rigorous computing research freely available to everyone, everywhere, and to give researchers at every career stage and in every country a fair, transparent route to publication.

## What we publish
- **Research Articles** — original studies with full methods, results and discussion.
- **Review Articles and Surveys** — critical syntheses that organise a field and identify open problems.
- **Short Communications and Technical Notes** — concise reports of significant findings, tools, datasets or techniques.
- **Case Studies** — in-depth analyses of systems, deployments or projects with lessons for practice.

The full list of subject areas is given in [Aims and scope](/aims-scope).

## Peer review
Every research manuscript is assessed through **double-anonymous peer review**: reviewers do not know who the authors are, and authors do not know who reviewed their work. Each submission is evaluated by an academic editor and at least two independent reviewers with relevant expertise. Final decisions are made by the Editor-in-Chief or a Managing Editor. Read more in our [Peer review policy](/peer-review).

## Open access
All articles are free to read, download and share from the day they are published. Articles are published under the [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) licence and authors keep the copyright to their work. See [Open access](/open-access).

## Publication model
Articles are published online as soon as they are ready and are collected into numbered volumes and issues. Each article receives a permanent web address, machine-readable metadata for discovery services and, once the journal's registration with Crossref is complete, a Digital Object Identifier (DOI).

## Editorial independence
Editorial decisions are made by the editors alone, on the basis of the scholarly merit of the work. They are not influenced by the authors' nationality, institution, seniority or ability to pay, nor by any commercial consideration. We follow the guidance of the Committee on Publication Ethics (COPE) — see [Publication ethics](/publication-ethics).

## Contact
Questions about the journal or a submission can be sent through our [contact page](/contact).`,
  },
  {
    slug: "aims-scope",
    title: "Aims and scope",
    kind: "PAGE",
    seo: "The subject areas covered by IJCST across computer science and information technology.",
    body: `**IJCST** publishes original research from across the full breadth of computer science and information technology — from theory and algorithms to systems, applications and the human aspects of computing.

Our aim is simple: to publish work that is **scientifically valid, technically sound and clearly reported**, and to make it freely available to the widest possible readership. We welcome theoretical, experimental, applied and interdisciplinary contributions, including replication studies, negative results and new datasets, benchmarks or open-source tools, when they are rigorously described.

Manuscripts are assessed on the soundness of their methods and the support their evidence gives to their conclusions. Work that falls clearly outside computing, or that applies standard techniques without a methodological or empirical contribution to computer science, may be returned without review.

The subject areas below describe the core of the journal's scope. If you are unsure whether your work fits, [contact the editorial office](/contact) before submitting.`,
  },
  {
    slug: "for-authors",
    title: "Submission guidelines",
    kind: "PAGE",
    seo: "How to prepare and submit a manuscript to IJCST: templates, formatting, anonymisation, declarations and the submission process.",
    body: `## Before you submit
- Your manuscript must be **original**, not published elsewhere and not under consideration by another journal. Posting a preprint (for example on arXiv) is welcome — please tell us in your cover letter.
- All authors must have **approved the manuscript** and agree with the order of authors.
- Read our [Publication ethics](/publication-ethics), [AI usage policy](/ai-usage-policy) and [Publication fees](/publication-fees) pages.

## Preparing your manuscript
Use the [journal template](#templates) — it sets the structure, heading levels, captions, declarations and reference style for you.

- **File format:** DOCX or PDF for review. Supplementary material (data, code, extra figures) may be uploaded as separate files or a ZIP archive.
- **Anonymisation:** IJCST uses double-anonymous peer review. Remove author names, affiliations, acknowledgements, funding identifiers that reveal identity, and self-identifying references (“in our previous work [3]” → “in [3]”). Clear the author field in the document properties. Author details are entered separately in the submission form.
- **Title:** concise and specific, ideally under 20 words.
- **Abstract:** a single paragraph of 150–300 words stating the problem, approach, main results and conclusions, without citations.
- **Keywords:** 4–8 terms that are not already in the title.
- **Structure:** Introduction, Related work, Methods, Results, Discussion and Conclusion are recommended for research articles; reviews may use thematic sections.
- **Figures and tables:** number them in order, cite each one in the text, and give every figure a self-contained caption. Higher-resolution files may be requested on acceptance.
- **References:** IEEE numeric style, numbered in order of first citation. Include DOIs wherever they exist.

## Reproducibility
We strongly encourage authors to share the data and code needed to reproduce their results in a public repository with a persistent identifier, and to describe access conditions in a **Data and code availability** statement. Reviewers may ask to see materials during review.

## Required declarations
Every submission includes statements on **competing interests**, **funding**, **ethics approval** (where human participants, personal data or animals are involved), **data availability** and any **use of generative AI tools**. The submission form guides you through each one.

## Suggesting reviewers
You may suggest up to five independent experts and name up to three people you would prefer not to review your work, with reasons. Suggested reviewers must not be recent collaborators or colleagues at your institutions. Editors are not obliged to follow suggestions.

## How to submit
1. [Create an account](/register) and verify your email address.
2. Start a [new submission](/submit). The seven-step form takes about 15 minutes and saves your progress on your device.
3. You will receive a manuscript ID (for example JCS-2026-00001) immediately, and can follow every stage of review from your [author dashboard](/author/dashboard).

## After acceptance
Accepted articles are copy-edited, typeset and published online as soon as they are ready, then assigned to the current issue. You will be asked to approve proofs and to provide final source files.`,
  },
  {
    slug: "contact",
    title: "Contact",
    kind: "PAGE",
    body: `The editorial office is happy to help with questions about the journal's scope, the submission process or the status of a manuscript.

- **Submission status:** please [log in](/login) to your author dashboard first — every stage of review is shown there in real time.
- **Pre-submission enquiries:** describe your work in a few sentences and we will tell you whether it fits the journal's scope.
- **Reviewers and editors:** if you would like to review for IJCST or have a question about an assignment, write to us using the form.

We aim to reply to every message within three working days.`,
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
    title: "Peer review policy",
    kind: "POLICY",
    body: `Peer review is the core of what a journal does. At IJCST it is designed to be **rigorous, fair and constructive**.

## Double-anonymous review
Reviewers are not told who the authors are, and authors are not told who reviewed their work. This reduces bias related to authors' names, institutions, countries or career stage. Authors help by submitting an anonymised manuscript; editors check anonymisation during the technical check.

## Editorial criteria
Editors and reviewers assess whether a manuscript is:
- **Scientifically valid** — the conclusions are supported by the evidence and the analysis;
- **Technically sound** — methods are appropriate, correctly applied and described in enough detail to be reproduced;
- **Original** — it adds to existing knowledge and acknowledges prior work fairly;
- **Clearly reported** — it can be understood by a specialist reader.

## How a manuscript moves through review
1. **Technical check** — the editorial office confirms the submission is complete, anonymised and within scope, and may run a similarity check.
2. **Editorial assessment** — the Editor-in-Chief or a Managing Editor decides whether to send the manuscript for review and assigns a handling editor with relevant expertise.
3. **Peer review** — at least two independent reviewers are invited. Reviewers recommend *Accept*, *Minor revision*, *Major revision* or *Reject*, write comments for the authors, and may send confidential comments to the editor.
4. **Decision** — the handling editor makes a recommendation and the Editor-in-Chief or a Managing Editor issues the decision, with the reviewers' comments for the authors.
5. **Revision** — authors respond point by point. Revised manuscripts may be returned to the same reviewers.

## Timelines
We ask reviewers to complete their reports within 21 days and aim to give authors a first decision within eight weeks of submission. Authors can see the current stage of their manuscript at any time in their dashboard.

## Reviewer selection and conflicts of interest
Reviewers are chosen for their expertise and independence. They must not have collaborated with the authors in the last three years, work at the same institution, or have any other competing interest. Editors with a conflict of interest are not involved in handling the manuscript.

## Appeals
Authors who believe a decision was based on a factual error or misunderstanding may appeal by writing to the editorial office with a detailed explanation. Appeals are considered by an editor who was not involved in the original decision.`,
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
    title: "Open access",
    kind: "POLICY",
    body: `Every article published in IJCST is **open access**: free to read, download, copy, share and reuse from the day of publication, by anyone, anywhere, with no subscription or registration.

## Licence
Articles are published under the [Creative Commons Attribution 4.0 International licence (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Anyone may share and adapt the work for any purpose, including commercially, provided they give appropriate credit to the authors and the original publication.

## Authors keep their copyright
Authors retain copyright and grant the journal the right to publish the article and to identify itself as the original publisher. Authors may deposit any version of their article — preprint, accepted manuscript or published version — in institutional or subject repositories without embargo.

## Why open access matters
Open access means research reaches every reader who can use it: students, practitioners, policy makers and researchers in institutions without journal subscriptions. It also lets text- and data-mining tools work with the full literature.

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
    title: "Publication fees",
    kind: "POLICY",
    body: `*(Administrators: replace this paragraph with the journal's actual article processing charge, or state that no fee is charged.)*

## What is free
There is **no charge** to submit a manuscript or for peer review. Readers never pay to access articles.

## Article processing charge (APC)
If an APC applies, it is payable only **after acceptance** and covers editorial management, typesetting, metadata and DOI registration, hosting and long-term preservation.

## Waivers and discounts
We do not want cost to prevent sound research from being published. Authors without funding, and authors based in low- and middle-income countries, may request a full or partial waiver at submission. Waiver requests are handled by the editorial office and are **never** seen by the editors or reviewers making decisions.

## No hidden charges
There are no page charges, colour-figure charges or fees for supplementary material.`,
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
