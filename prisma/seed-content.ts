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
  "Human Computer Interaction",
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
    seo: "About IJCST: scope, peer review, open access and editorial policy.",
    body: `**International Journal of Computer Science and Technology (IJCST)** is an open access journal. We publish original research in all areas of computer science and information technology.

We accept research articles, reviews, short communications and case studies. Our editors look for work that is sound. The methods must be clear, the results must support the conclusions, and the study must add to what is known. We also publish negative results and replication studies.

## Peer review
Every research paper goes through double anonymous peer review. Authors and reviewers do not know each other's identity. At least two independent experts review each paper. The Editor in Chief or a Managing Editor makes the final decision. Read our [peer review policy](/peer-review).

## Open access
All articles are free to read and download on the day they are published. We use the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) licence. Authors keep their copyright.

## Publishing model
We publish articles online as soon as they are ready. Each article then joins the current issue. Every article has a permanent web address and full citation data.

## Editorial independence
Editors make decisions on scholarly merit only. A decision never depends on an author's country, institution or ability to pay. We follow the guidance of the Committee on Publication Ethics (COPE).

## Contact
Use our [contact page](/contact) for any question about the journal.`,
  },
  {
    slug: "aims-scope",
    title: "Aims and scope",
    kind: "PAGE",
    seo: "Subject areas covered by IJCST.",
    body: `IJCST publishes original research across computer science and information technology. This includes theory, algorithms, systems, applications and human aspects of computing.

We publish work that is technically sound and clearly reported. Theoretical, experimental and applied studies are all welcome. So are new datasets, benchmarks and software tools when they are well documented.

Papers outside computing may be returned without review. If you are not sure your work fits, [contact us](/contact) before you submit.

Our main subject areas are listed below.`,
  },
  {
    slug: "for-authors",
    title: "Submission guidelines",
    kind: "PAGE",
    seo: "How to prepare and submit a paper to IJCST.",
    body: `## Before you submit
Your paper must be original. It must not be published or under review anywhere else. Preprints on servers such as arXiv are allowed. Please mention the preprint in your cover letter.

All authors must approve the paper and the author order.

## Preparing your paper
Please use the [journal template](#templates).

**Files.** Submit a DOCX or PDF file. You can add data, code or extra figures as separate files or one ZIP file.

**Anonymity.** We use double anonymous review. Remove author names, affiliations and acknowledgements from the file. Do not cite your own work in a way that reveals who you are. Also clear the author name in the file properties.

**Title.** Keep it short and specific, ideally under 20 words.

**Abstract.** Write one paragraph of 150 to 300 words. State the problem, the method, the main results and the conclusion. Do not include citations.

**Keywords.** Give 4 to 8 keywords.

**Structure.** We suggest Introduction, Related Work, Methods, Results, Discussion and Conclusion.

**Figures and tables.** Number them in order and cite each one in the text. Each figure needs a clear caption.

**References.** Use IEEE numbered style. Include a DOI for each reference where one exists.

## Data and code
We encourage you to share your data and code in a public repository. Describe where to find them in your data availability statement.

## Declarations
The submission form asks for statements on competing interests, funding, ethics approval, data availability and any use of AI tools.

## Suggested reviewers
You may suggest up to five reviewers and name up to three people who should not review your paper. Do not suggest recent co authors or colleagues from your institution.

## How to submit
1. [Create an account](/register) and verify your email.
2. Start a [new submission](/submit). It takes about 15 minutes.
3. You will get a manuscript ID right away. Follow your paper's progress in your [author dashboard](/author/dashboard).

## After acceptance
We copy edit and typeset your paper, send you proofs to check, and publish it online.`,
  },
  {
    slug: "contact",
    title: "Contact",
    kind: "PAGE",
    body: `Write to the editorial office with questions about scope, submission or review.

To check the status of a paper, please [log in](/login) to your author dashboard first. It shows every stage of review.

We reply within three working days.`,
  },
  {
    slug: "publication-ethics",
    title: "Publication ethics",
    kind: "POLICY",
    body: `The journal follows the guidance of the Committee on Publication Ethics (COPE).

## Authors
Submit only original work and cite the work of others correctly. Do not send the same paper to two journals at once. List as authors only those who made a real contribution. Declare all funding and competing interests. Report data honestly. Tell us quickly if you find an error in a published paper.

## Reviewers
Keep every paper confidential. Do not use unpublished findings for your own work. Decline a review if you have a conflict of interest. Give fair, clear and timely feedback.

## Editors
Judge papers on their scholarly merit alone. Keep submissions and reviewer identities confidential. Handle complaints and suspected misconduct using COPE procedures.

## Misconduct
We investigate every allegation. Outcomes can include rejection, correction, an expression of concern or retraction. See our [retraction policy](/retraction-policy).`,
  },
  {
    slug: "peer-review",
    title: "Peer review policy",
    kind: "POLICY",
    body: `## Double anonymous review
Reviewers do not know who the authors are. Authors do not know who the reviewers are. This helps reduce bias.

## What reviewers assess
Reviewers check that the methods are sound and clearly described, that the results support the conclusions, and that the work is original and clearly written.

## The process
1. **Technical check.** The editorial office checks that the submission is complete and anonymous.
2. **Editorial assessment.** An editor decides whether to send the paper for review and assigns a handling editor.
3. **Peer review.** At least two independent experts review the paper. Each recommends accept, minor revision, major revision or reject.
4. **Decision.** The Editor in Chief or a Managing Editor makes the decision and sends the reviewers' comments to the authors.
5. **Revision.** Authors reply to each comment. The revised paper may go back to the same reviewers.

## Timelines
Reviewers have 21 days to submit a report. We aim to give a first decision within eight weeks.

## Conflicts of interest
Reviewers must not have worked with the authors in the last three years or work at the same institution. Editors with a conflict do not handle the paper.

## Appeals
You may appeal a decision by writing to the editorial office. An editor who was not involved in the first decision will review the appeal.`,
  },
  {
    slug: "plagiarism-policy",
    title: "Plagiarism policy",
    kind: "POLICY",
    body: `All papers must be original. Copying text, ideas, data or figures without credit is plagiarism. So is publishing the same work twice.

We may check submissions with a similarity checking service. Editors read each report in context. A similarity score alone does not decide a case.

If we find minor overlap, we ask the authors to revise. If we find serious plagiarism before publication, we reject the paper. If we find it after publication, we follow our [retraction policy](/retraction-policy).`,
  },
  {
    slug: "open-access",
    title: "Open access",
    kind: "POLICY",
    body: `Every article in IJCST is free to read, download and share from the day it is published. No subscription or registration is needed.

## Licence
Articles use the [Creative Commons Attribution 4.0 licence (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Anyone may share and adapt the work for any purpose if they credit the authors and the journal.

## Copyright
Authors keep their copyright. They give the journal the right to publish the article. Authors may post any version of their article in any repository at any time.

This policy follows the Budapest Open Access Initiative.`,
  },
  {
    slug: "copyright",
    title: "Copyright and licensing",
    kind: "POLICY",
    body: `Authors keep the copyright to their articles. They give the journal a licence to publish the article and to be named as its original publisher.

Authors may:
- share their article anywhere;
- reuse it in later work with a citation;
- post preprints and accepted versions at any time.

Articles are published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) unless the article page says otherwise. See our [licensing policy](/licensing-policy).`,
  },
  {
    slug: "licensing-policy",
    title: "Licensing policy",
    kind: "POLICY",
    body: `Published articles use the [Creative Commons Attribution 4.0 International licence (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Anyone may use, share and reproduce the work in any medium if they cite the original article.

The licence for each article is shown on its page and in its metadata.`,
  },
  {
    slug: "article-withdrawal-policy",
    title: "Article withdrawal policy",
    kind: "POLICY",
    body: `## Before publication
Authors may withdraw a paper before acceptance. Use the withdraw option in your author dashboard or write to the editorial office with a reason. After acceptance, withdrawal needs the agreement of the Editor in Chief.

## After publication
Published articles stay in the permanent record and are not removed. In rare legal cases we may remove the content but keep the citation details. Other cases follow our [retraction](/retraction-policy) and [corrections](/corrections-policy) policies.`,
  },
  {
    slug: "retraction-policy",
    title: "Retraction policy",
    kind: "POLICY",
    body: `We follow the COPE retraction guidelines. We retract an article when there is clear evidence of unreliable results, plagiarism, duplicate publication, unethical research or compromised peer review.

A retracted article stays online. It is clearly marked as retracted, with a linked notice that explains why. We also update its metadata.`,
  },
  {
    slug: "corrections-policy",
    title: "Corrections policy",
    kind: "POLICY",
    body: `If an error affects the scholarly record, we publish a correction linked to the original article. We call it an erratum when the error is ours and a corrigendum when it comes from the authors.

Small typing errors that do not change the meaning may be fixed without a notice. To request a correction, write to the editorial office.`,
  },
  {
    slug: "conflict-of-interest",
    title: "Conflict of interest policy",
    kind: "POLICY",
    body: `Authors, reviewers and editors must disclose any interest that could affect, or seem to affect, their work.

**Authors** give a competing interests statement with every submission. If there is none, write "The authors declare no competing interests."

**Reviewers** must decline a review if they have worked with the authors in the last three years, work at the same institution, or have any other conflict.

**Editors** with a conflict step aside, and another editor handles the paper.`,
  },
  {
    slug: "research-ethics",
    title: "Research ethics",
    kind: "POLICY",
    body: `Research with human participants, personal data or animals must follow recognised ethical standards and be approved by an ethics committee or review board.

State the name of the approving body and the approval number in your submission and in the paper. Confirm that you obtained informed consent where needed. Research using personal data must follow data protection law. Work with security implications should explain how vulnerabilities were disclosed responsibly.`,
  },
  {
    slug: "ai-usage-policy",
    title: "AI usage policy",
    kind: "POLICY",
    body: `## Authors
AI tools cannot be listed as authors because they cannot take responsibility for the work. If you used AI tools for writing, code, analysis or images, say so in the submission form and in the paper. You remain responsible for everything in your paper.

## Reviewers and editors
Do not upload any manuscript or review to an AI tool. This would break confidentiality. If you use a tool only to polish your own wording, tell the editor.`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy policy",
    kind: "POLICY",
    body: `## What we collect
When you register or submit a paper, we collect your name, email, institution, country, ORCID iD and research interests. We also store your files, reviews and messages.

## How we use it
We use your data only to run the journal: handling submissions, peer review, publication and communication. Published articles show author names and affiliations.

## Confidentiality
Reviewer identities stay confidential. Only the authors, the assigned editors and the assigned reviewers can see an unpublished paper.

## Your rights
You can ask to see, correct or delete your data by contacting the editorial office. Some data in published articles must stay in the scholarly record.

## Cookies
We use one essential cookie to keep you signed in. If we add analytics, we will say so here.

## Security
All traffic uses HTTPS. Passwords are stored with strong one way hashing. Access to data depends on each user's role.`,
  },
  {
    slug: "terms-of-use",
    title: "Terms of use",
    kind: "POLICY",
    body: `By using this website you agree to these terms.

- Each article's licence is shown on its page.
- Do not try to access accounts, papers or areas you are not authorised to use.
- Keep your password secure.
- Submissions must follow the journal's policies. We may suspend accounts that break them.
- The website is provided as it is. The journal is not liable for any loss arising from its use.`,
  },
  {
    slug: "publication-fees",
    title: "Publication fees",
    kind: "POLICY",
    body: `Submission and peer review are free. Readers never pay to read articles.

## Article processing charge
The article processing charge (APC) is **US$150** per accepted article. It is charged only after acceptance, once the author has approved the final proof. The APC covers copy editing, typesetting, hosting, metadata and DOI registration, and long term archiving.

## How to pay
After you approve your proof, we email you an invoice with a secure payment link. You can pay by card online. Bank transfer is also possible; the invoice explains how.

## Waivers
Authors without funding and authors in low and middle income countries can ask for a full or partial waiver when they submit. Waiver requests are handled by the editorial office. Editors and reviewers never see them, and they have no effect on editorial decisions.

There are no page charges or colour figure charges.`,
  },
  {
    slug: "archiving-policy",
    title: "Archiving policy",
    kind: "POLICY",
    body: `We keep every published article, file and record backed up. Every article and issue keeps its permanent web address.

We plan to join a recognised preservation service such as LOCKSS, CLOCKSS or Portico and will name it here when it is in place. Authors may also deposit their published articles in institutional or subject repositories.`,
  },
];

export const EMAIL_TEMPLATES: { key: string; name: string; subject: string; body: string }[] = [
  { key: "account_registered", name: "Account registration (Author)", subject: "Welcome to {{journal_name}}", body: "<p>Dear {{name}},</p><p>Thank you for registering an account with {{journal_name}}. You can now sign in and submit manuscripts once your email address is verified.</p>" },
  { key: "verify_email", name: "Email verification (Author)", subject: "Verify your email address for {{journal_name}}", body: "<p>Dear {{name}},</p><p>Please verify your email address by clicking the link below (valid for 48 hours):</p><p><a href=\"{{verify_url}}\">{{verify_url}}</a></p>" },
  { key: "password_reset", name: "Password reset (User)", subject: "Reset your password for {{journal_name}}", body: "<p>Dear {{name}},</p><p>We received a request to reset your password. Use the link below within 1 hour:</p><p><a href=\"{{reset_url}}\">{{reset_url}}</a></p><p>If you did not request this, you can ignore this email.</p>" },
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
  { key: "alert_confirm", name: "Article alerts: confirm subscription", subject: "Confirm your article alerts from {{journal_name}}", body: "<p>Thank you for signing up for new article alerts from {{journal_name}}.</p><p>Please confirm your email address:</p><p><a href=\"{{confirm_url}}\">{{confirm_url}}</a></p><p>If you did not sign up, you can ignore this email.</p>" },
  { key: "alert_new_article", name: "Article alerts: new article", subject: "New in {{journal_name}}: {{title}}", body: "<p><strong>{{title}}</strong></p><p>{{authors}}</p><p>{{abstract}}</p><p><a href=\"{{url}}\">Read the full article</a></p><p style=\"font-size:12px;color:#6B7280\">You receive this because you signed up for article alerts. <a href=\"{{unsubscribe_url}}\">Unsubscribe</a></p>" },
  { key: "proof_ready", name: "Proofs ready (Author)", subject: "Proofs ready for your article {{manuscript_id}}", body: "<p>Dear {{name}},</p><p>The proofs of your accepted article <strong>\"{{title}}\"</strong> are ready.</p><p>Please check them carefully and either approve them or list any corrections within 3 working days:</p><p><a href=\"{{url}}\">{{url}}</a></p><p>Only corrections of errors can be made at this stage.</p>" },
  { key: "proof_response", name: "Proof response (Editorial office)", subject: "Proof {{decision}}: {{manuscript_id}}", body: "<p>The author has responded to the proofs of \"{{title}}\" ({{manuscript_id}}): <strong>{{decision}}</strong>.</p><p>{{corrections}}</p><p><a href=\"{{url}}\">Open the article</a></p>" },
  { key: "payment_request", name: "Payment request (Author)", subject: "Invoice {{invoice_number}} for your article in {{journal_name}}", body: "<p>Dear {{name}},</p><p>Thank you for approving the proofs of \"{{title}}\".</p><p>The article processing charge is <strong>{{amount}}</strong>. You can pay securely online here:</p><p><a href=\"{{url}}\">{{url}}</a></p><p>Your article will be published once payment is received. If you need a waiver, reply to this email.</p>" },
  { key: "payment_received", name: "Payment received (Author)", subject: "Payment received: invoice {{invoice_number}}", body: "<p>Dear {{name}},</p><p>We have received your payment of <strong>{{amount}}</strong> for \"{{title}}\". Thank you.</p><p>Your article will now be scheduled for publication.</p><p><a href=\"{{url}}\">View receipt</a></p>" },
  { key: "contact_message", name: "Contact form (Editorial office)", subject: "Contact form: {{subject}}", body: "<p><strong>From:</strong> {{name}} &lt;{{email}}&gt;</p><p>{{message}}</p>" },
];
