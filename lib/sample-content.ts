import "server-only";
import { db } from "./db";
import { renderMarkdown } from "./markdown";
import { storeBuffer } from "./storage";
import { buildPdf } from "./simple-pdf";
import { slugify } from "./utils";
import { audit } from "./audit";

/**
 * Demonstration content so the website can be previewed with realistic layout.
 * Every record is flagged isSample, shown with a "Sample" label, excluded from
 * search engines, sitemap, RSS and Google Scholar metadata, and removable in one click.
 * Authors and institutions are fictional. References cite real, well-known publications.
 */

type A = { name: string; aff: number; corr?: boolean };
type S = {
  title: string; type: string; category: string; keywords: string; abstract: string;
  authors: A[]; affs: string[]; intro: string; method: string; results: string; table?: string; discussion: string;
  refs: string[]; days: number; pages: string; funding: string;
};

const SAMPLES: S[] = [
  {
    title: "Adaptive Client Selection for Federated Learning on Heterogeneous Edge Devices",
    type: "Research Article", category: "Cloud and Edge Computing",
    keywords: "federated learning; edge computing; client selection; non-IID data; energy efficiency",
    abstract: "Federated learning allows models to be trained across many edge devices without centralising raw data, but heterogeneous hardware and non identically distributed data slow convergence. We propose an adaptive client selection strategy that scores devices by recent update quality, available energy and link bandwidth, and re weights participation each round. In simulated deployments with up to 500 devices, the approach reduced the number of communication rounds needed to reach target accuracy and lowered energy use on battery powered clients, while maintaining fairness across device groups.",
    authors: [{ name: "Leila Haddad", aff: 0, corr: true }, { name: "Tomás Ferreira", aff: 1 }, { name: "Mei Lin Chua", aff: 0 }],
    affs: ["Department of Computer Science, Northfield Institute of Technology", "School of Engineering, University of Westbridge"],
    intro: "Edge devices generate large volumes of data that are costly or sensitive to transmit. Federated learning (FL) trains a shared model by aggregating locally computed updates, yet devices differ widely in compute, connectivity and data distribution. Random client sampling, as used in the original FedAvg algorithm, ignores these differences.",
    method: "Each round, the server maintains a utility score per client combining (i) the norm of its most recent useful update, (ii) a reported energy budget and (iii) an estimate of upload bandwidth. Clients are sampled with probability proportional to a softmax over these scores, with a fairness floor guaranteeing every client a minimum participation rate.",
    results: "We evaluated the strategy against uniform sampling and loss based selection on image and keyword spotting benchmarks partitioned in a non-IID manner.",
    table: "| Method | Rounds to target | Energy per client (J) |\n|---|---|---|\n| Uniform sampling | 412 | 96.4 |\n| Loss based selection | 335 | 88.1 |\n| **Adaptive (ours)** | **281** | **71.9** |",
    discussion: "Prioritising informative and well resourced clients accelerates convergence, while the fairness floor prevents systematic exclusion of low power devices. Future work will study robustness to clients that misreport their resources.",
    refs: [
      "H. B. McMahan, E. Moore, D. Ramage, S. Hampson and B. A. y Arcas, \"Communication-efficient learning of deep networks from decentralized data,\" in *Proc. AISTATS*, 2017, pp. 1273–1282.",
      "T. Li, A. K. Sahu, M. Zaheer, M. Sanjabi, A. Talwalkar and V. Smith, \"Federated optimization in heterogeneous networks,\" in *Proc. MLSys*, 2020.",
      "P. Kairouz *et al.*, \"Advances and open problems in federated learning,\" *Foundations and Trends in Machine Learning*, vol. 14, no. 1–2, pp. 1–210, 2021.",
    ],
    days: 3, pages: "1-14", funding: "This research received no external funding.",
  },
  {
    title: "A Compact Transformer for Machine Translation in Low Resource Languages",
    type: "Research Article", category: "Natural Language Processing",
    keywords: "machine translation; transformer; low resource languages; knowledge distillation",
    abstract: "Neural machine translation performs poorly for languages with little parallel data. We present a compact transformer that combines shared subword vocabularies, layer wise parameter sharing and distillation from a multilingual teacher. On four low resource language pairs the model matches the translation quality of a standard transformer base model with roughly one third of the parameters, making on device translation practical for under served languages.",
    authors: [{ name: "Aditi Raman", aff: 0, corr: true }, { name: "Kwame Asante", aff: 1 }],
    affs: ["Centre for Language Technology, University of Westbridge", "Department of Informatics, Eastgate University"],
    intro: "Transformer models dominate machine translation but require large parallel corpora and substantial compute. Many of the world's languages lack both.",
    method: "We share parameters across alternating encoder layers, tie input and output embeddings over a joint subword vocabulary, and train with sequence level knowledge distillation from a larger multilingual teacher.",
    results: "Models were evaluated with BLEU and chrF on held out test sets for four language pairs.",
    table: "| Model | Parameters | Avg. BLEU | Avg. chrF |\n|---|---|---|---|\n| Transformer base | 64M | 18.2 | 41.0 |\n| Compact (ours) | 21M | 18.0 | 40.7 |",
    discussion: "Parameter sharing and distillation recover most of the quality of larger models, suggesting compact architectures are a sensible default for low resource settings.",
    refs: [
      "A. Vaswani *et al.*, \"Attention is all you need,\" in *Advances in Neural Information Processing Systems 30*, 2017, pp. 5998–6008.",
      "Y. Kim and A. M. Rush, \"Sequence-level knowledge distillation,\" in *Proc. EMNLP*, 2016, pp. 1317–1327.",
      "R. Sennrich, B. Haddow and A. Birch, \"Neural machine translation of rare words with subword units,\" in *Proc. ACL*, 2016, pp. 1715–1725.",
    ],
    days: 7, pages: "15-27", funding: "This research received no external funding.",
  },
  {
    title: "Detecting Adversarial Patches in Vision Models with Frequency Analysis",
    type: "Research Article", category: "Computer Vision",
    keywords: "adversarial examples; adversarial patch; robustness; image classification; frequency analysis",
    abstract: "Adversarial patches are small, printable image regions that cause vision models to misclassify scenes. We observe that such patches concentrate unusual energy in high spatial frequencies and propose a lightweight detector operating on local discrete cosine transform statistics. The detector runs in real time alongside a classifier and flags most tested patch attacks with a low false positive rate on clean images.",
    authors: [{ name: "Jonas Becker", aff: 0 }, { name: "Sofia Marquez", aff: 0, corr: true }, { name: "Hiroshi Tanaka", aff: 1 }],
    affs: ["Vision Systems Laboratory, Northfield Institute of Technology", "Graduate School of Information Science, Kitamura University"],
    intro: "Deep image classifiers are vulnerable to adversarial inputs. Physical adversarial patches are especially concerning because they can be deployed in the real world without access to the model at test time.",
    method: "Images are divided into tiles; for each tile we compute DCT coefficients and summarise their high frequency energy. A small gradient boosted classifier, trained on clean and patched images, outputs a per tile anomaly score.",
    results: "We tested three patch generation methods on a standard image classification benchmark using a ResNet-50 classifier.",
    table: "| Attack | Detection rate | False positives (clean) |\n|---|---|---|\n| Universal patch | 94.1% | 2.3% |\n| Targeted patch | 91.7% | 2.3% |\n| Adaptive patch | 78.5% | 2.3% |",
    discussion: "Frequency statistics provide an inexpensive first line of defence, although adaptive attackers aware of the detector reduce its effectiveness.",
    refs: [
      "I. J. Goodfellow, J. Shlens and C. Szegedy, \"Explaining and harnessing adversarial examples,\" in *Proc. ICLR*, 2015.",
      "T. B. Brown, D. Mané, A. Roy, M. Abadi and J. Gilmer, \"Adversarial patch,\" arXiv:1712.09665, 2017.",
      "K. He, X. Zhang, S. Ren and J. Sun, \"Deep residual learning for image recognition,\" in *Proc. IEEE CVPR*, 2016, pp. 770–778. 10.1109/CVPR.2016.90",
    ],
    days: 11, pages: "28-41", funding: "This research received no external funding.",
  },
  {
    title: "Anomaly Detection in Encrypted Network Traffic Using Graphs",
    type: "Research Article", category: "Cybersecurity and Information Security",
    keywords: "intrusion detection; encrypted traffic; graph neural networks; network security",
    abstract: "Widespread encryption limits payload inspection for intrusion detection. We model enterprise network flows as a temporal communication graph and train a graph neural network to identify anomalous hosts using only flow metadata. On two public intrusion detection datasets the method improves detection of lateral movement compared with flow level classifiers, without decrypting traffic.",
    authors: [{ name: "Daniel Okoro", aff: 0, corr: true }, { name: "Ana Petrović", aff: 1 }],
    affs: ["Department of Computer Engineering, Eastgate University", "Institute for Secure Systems, University of Westbridge"],
    intro: "Most enterprise traffic is now encrypted, rendering deep packet inspection ineffective. However, the structure of who communicates with whom remains observable.",
    method: "Hosts are nodes and aggregated flows in five minute windows are edges with features such as byte counts, durations and port entropy. A graph convolutional network produces host embeddings that are scored for anomaly.",
    results: "We compared against random forest and LSTM flow classifiers.",
    table: "| Method | Precision | Recall | F1 |\n|---|---|---|---|\n| Random forest (flows) | 0.81 | 0.69 | 0.75 |\n| LSTM (flows) | 0.84 | 0.72 | 0.78 |\n| **Graph model (ours)** | **0.88** | **0.83** | **0.85** |",
    discussion: "Relational structure captures multi step attacks that individual flows do not reveal. Deployment requires care to limit false alarms in rapidly changing networks.",
    refs: [
      "T. N. Kipf and M. Welling, \"Semi-supervised classification with graph convolutional networks,\" in *Proc. ICLR*, 2017.",
      "I. Sharafaldin, A. H. Lashkari and A. A. Ghorbani, \"Toward generating a new intrusion detection dataset and intrusion traffic characterization,\" in *Proc. ICISSP*, 2018, pp. 108–116.",
    ],
    days: 16, pages: "42-55", funding: "This research received no external funding.",
  },
  {
    title: "Large Language Models in Software Engineering: A Systematic Review",
    type: "Review Article", category: "Software Engineering",
    keywords: "large language models; software engineering; code generation; systematic literature review",
    abstract: "Large language models (LLMs) are rapidly being adopted for code generation, testing, documentation and maintenance. Following established guidelines for systematic literature reviews, we screened 1,240 records and analysed 186 primary studies published between 2021 and 2026. We map the software engineering tasks addressed, evaluation practices and reported limitations, and identify gaps including the scarcity of long term industrial studies and inconsistent reporting of data contamination.",
    authors: [{ name: "Grace Whitfield", aff: 0, corr: true }, { name: "Rahul Menon", aff: 1 }, { name: "Elena Kovacs", aff: 0 }, { name: "Samuel Adeyemi", aff: 2 }],
    affs: ["Software Engineering Group, University of Westbridge", "Department of Computing, Northfield Institute of Technology", "School of Computer Science, Eastgate University"],
    intro: "Since the introduction of code capable language models, research on applying LLMs to software engineering has grown quickly, making it difficult to see the overall state of evidence.",
    method: "We followed the Kitchenham and Charters guidelines: defined research questions, searched five digital libraries, applied inclusion and exclusion criteria in two independent rounds, and extracted data using a piloted form.",
    results: "Code generation and program repair dominate the literature, while requirements engineering and maintenance are under studied.",
    table: "| Task area | Studies | Share |\n|---|---|---|\n| Code generation | 71 | 38% |\n| Testing & repair | 52 | 28% |\n| Documentation & comprehension | 34 | 18% |\n| Requirements & design | 18 | 10% |\n| Maintenance & other | 11 | 6% |",
    discussion: "Evaluation practice is maturing but benchmarks often risk contamination. We recommend standard reporting of training data overlap and more longitudinal studies in industry.",
    refs: [
      "B. Kitchenham and S. Charters, \"Guidelines for performing systematic literature reviews in software engineering,\" EBSE Technical Report EBSE-2007-01, Keele University and Durham University, 2007.",
      "M. Chen *et al.*, \"Evaluating large language models trained on code,\" arXiv:2107.03374, 2021.",
      "J. Devlin, M.-W. Chang, K. Lee and K. Toutanova, \"BERT: Pre-training of deep bidirectional transformers for language understanding,\" in *Proc. NAACL-HLT*, 2019, pp. 4171–4186.",
    ],
    days: 20, pages: "56-80", funding: "This research received no external funding.",
  },
  {
    title: "Energy Efficient Task Scheduling for Battery Powered IoT Sensor Networks",
    type: "Research Article", category: "Internet of Things",
    keywords: "Internet of Things; wireless sensor networks; scheduling; energy harvesting; network lifetime",
    abstract: "Battery powered sensor networks must balance sensing quality against network lifetime. We formulate duty cycle scheduling as a constrained optimisation that accounts for forecast solar harvesting and propose a lightweight heuristic suitable for microcontrollers. In a 60-node testbed the scheduler extended network lifetime while keeping data coverage above the application requirement.",
    authors: [{ name: "Fatima Zahra Benali", aff: 0, corr: true }, { name: "Oliver Grant", aff: 1 }],
    affs: ["Embedded Systems Laboratory, Eastgate University", "Department of Electrical and Computer Engineering, Northfield Institute of Technology"],
    intro: "Wireless sensor networks for environmental monitoring often run unattended for months, so energy is the main constraint on useful lifetime.",
    method: "Each node predicts harvested energy for the next 24 hours using an exponentially weighted moving average and selects active slots greedily by marginal coverage gain per joule, coordinated through a cluster head.",
    results: "We compared against fixed duty cycling and the LEACH clustering protocol in a 60-node outdoor testbed over six weeks.",
    table: "| Scheme | Lifetime (days) | Coverage |\n|---|---|---|\n| Fixed duty cycle | 23 | 97% |\n| LEACH | 29 | 94% |\n| **Energy aware (ours)** | **37** | **95%** |",
    discussion: "Using harvesting forecasts lets nodes spend energy when it is replenished. The heuristic requires under 4 KB of RAM.",
    refs: [
      "W. R. Heinzelman, A. Chandrakasan and H. Balakrishnan, \"Energy-efficient communication protocol for wireless microsensor networks,\" in *Proc. 33rd Hawaii International Conference on System Sciences*, 2000.",
      "L. Atzori, A. Iera and G. Morabito, \"The Internet of Things: A survey,\" *Computer Networks*, vol. 54, no. 15, pp. 2787–2805, 2010.",
    ],
    days: 24, pages: "81-93", funding: "This research received no external funding.",
  },
  {
    title: "Designing Accessible Telehealth Interfaces for Older Adults: A Case Study",
    type: "Case Study", category: "Human-Computer Interaction",
    keywords: "accessibility; human computer interaction; older adults; telehealth; usability",
    abstract: "Telehealth services are often difficult for older adults to use. We report a case study redesigning a video consultation application with 24 participants aged 65 to 89 through three iterative design cycles. Changes informed by the Web Content Accessibility Guidelines, including larger touch targets, simplified navigation and persistent help, reduced task completion time and increased perceived usability.",
    authors: [{ name: "Hannah Okafor", aff: 0, corr: true }, { name: "Marco Rossi", aff: 1 }],
    affs: ["Human-Centred Computing Group, University of Westbridge", "Department of Design and Informatics, Eastgate University"],
    intro: "Telehealth adoption accelerated rapidly, but interfaces designed for younger users can exclude older patients who stand to benefit most.",
    method: "We ran three design iterations with think aloud usability sessions, measuring task time and System Usability Scale (SUS) scores, and audited each version against WCAG 2.1 success criteria.",
    results: "Usability improved in each iteration.",
    table: "| Version | Mean task time (s) | Mean SUS |\n|---|---|---|\n| Original | 214 | 52 |\n| Iteration 2 | 158 | 68 |\n| Iteration 3 | 121 | 79 |",
    discussion: "Accessibility guidelines are necessary but not sufficient; direct involvement of older adults uncovered issues no automated audit detected.",
    refs: [
      "World Wide Web Consortium, \"Web Content Accessibility Guidelines (WCAG) 2.1,\" W3C Recommendation, 2018.",
      "J. Brooke, \"SUS: A quick and dirty usability scale,\" in *Usability Evaluation in Industry*, P. W. Jordan *et al.*, Eds. London: Taylor & Francis, 1996, pp. 189–194.",
    ],
    days: 30, pages: "94-104", funding: "This research received no external funding.",
  },
  {
    title: "Query Optimisation for Hybrid Vector and Relational Database Workloads",
    type: "Short Communication", category: "Database Technologies",
    keywords: "vector databases; query optimisation; approximate nearest neighbour search; hybrid queries",
    abstract: "Applications increasingly combine relational filters with vector similarity search. We show that choosing between pre filtering and post filtering strategies based on estimated filter selectivity substantially reduces latency for hybrid queries. A simple cost model integrated into an open source engine selected the faster plan for most queries in a mixed benchmark.",
    authors: [{ name: "Wei Zhang", aff: 0, corr: true }, { name: "Isabel Duarte", aff: 0 }],
    affs: ["Data Systems Group, Northfield Institute of Technology"],
    intro: "Retrieval augmented applications issue queries such as \"the ten most similar documents published after 2024 in category X\", mixing relational predicates with approximate nearest neighbour (ANN) search.",
    method: "We estimate predicate selectivity from column histograms and choose pre filtering (filter then exact search) for highly selective predicates and post filtering over an HNSW index otherwise.",
    results: "On a benchmark of 10,000 hybrid queries the adaptive planner reduced median latency relative to always using either strategy.",
    table: "| Strategy | Median latency (ms) | Recall@10 |\n|---|---|---|\n| Always pre filter | 38.2 | 1.00 |\n| Always post filter | 12.6 | 0.91 |\n| **Adaptive (ours)** | **9.4** | **0.98** |",
    discussion: "Selectivity aware planning is a low cost improvement for hybrid workloads; better selectivity estimates for correlated predicates remain an open problem.",
    refs: [
      "Y. A. Malkov and D. A. Yashunin, \"Efficient and robust approximate nearest neighbor search using hierarchical navigable small world graphs,\" *IEEE Transactions on Pattern Analysis and Machine Intelligence*, vol. 42, no. 4, pp. 824–836, 2020.",
      "J. Johnson, M. Douze and H. Jégou, \"Billion-scale similarity search with GPUs,\" *IEEE Transactions on Big Data*, vol. 7, no. 3, pp. 535–547, 2021.",
    ],
    days: 35, pages: "105-110", funding: "This research received no external funding.",
  },
];

const ANNOUNCEMENTS = [
  { title: "Call for papers: Volume 1", body: "The journal welcomes submissions of original research articles, reviews and short communications across all areas of computer science and information technology.\n\nSubmissions are handled through the [online submission system](/submit). Please read the [guide for authors](/for-authors) before submitting." },
  { title: "Online submission and tracking system now available", body: "Authors can now register, submit manuscripts through a guided multi-step form, and follow each stage of peer review from their author dashboard." },
];

export async function sampleCounts() {
  const [articles, issues, announcements] = await Promise.all([
    db.article.count({ where: { isSample: true } }),
    db.issue.count({ where: { isSample: true } }),
    db.announcement.count({ where: { isSample: true } }),
  ]);
  return { articles, issues, announcements };
}

function body(s: S) {
  return [
    "## 1. Introduction", s.intro,
    "## 2. Methods", s.method,
    "## 3. Results", s.results, s.table ? `\n${s.table}\n\n*Table 1. Summary of results.*` : "",
    "## 4. Discussion", s.discussion,
    "## 5. Conclusion", `This sample article illustrates how full-text articles are presented on the journal website. ${s.discussion.split(".")[0]}.`,
  ].join("\n\n");
}

export async function loadSampleContent(actorId: string) {
  if ((await sampleCounts()).articles > 0) return { created: 0 };
  const cats = await db.researchCategory.findMany();
  const j = await db.journal.findUnique({ where: { id: "journal" } });
  const year = new Date().getUTCFullYear();
  let vol = await db.volume.findUnique({ where: { number: 1 } });
  if (!vol) vol = await db.volume.create({ data: { number: 1, year, title: "Inaugural volume", isSample: true } });
  const used = await db.issue.findMany({ where: { volumeId: vol.id }, select: { number: true } });
  const num = used.length ? Math.max(...used.map((u) => u.number)) + 1 : 1;
  const hasCurrent = await db.issue.count({ where: { isCurrent: true } });
  const issue = await db.issue.create({
    data: {
      volumeId: vol.id, number: num, year: vol.year, title: "Inaugural Issue", isSample: true,
      description: "Sample content shown to demonstrate the layout of a journal issue.",
      slug: `volume-${vol.number}-issue-${num}`, isPublished: true, isCurrent: !hasCurrent, publishedAt: new Date(),
    },
  });
  let created = 0;
  for (const [i, s] of SAMPLES.entries()) {
    const published = new Date(Date.now() - s.days * 864e5);
    const slug = `${slugify(s.title)}-sample`;
    const md = body(s);
    const a = await db.article.create({
      data: {
        slug, title: s.title, abstract: s.abstract, keywords: s.keywords, articleType: s.type, isSample: true,
        categoryId: cats.find((c) => c.name === s.category)?.id ?? null, issueId: issue.id, sortOrder: i, pages: s.pages,
        bodyMarkdown: md, bodyHtml: renderMarkdown(md), fundingStatement: s.funding, conflictOfInterest: "The authors declare no competing interests.",
        dataAvailability: "Sample article · no data are associated with this record.",
        licenseName: j?.licenseName, licenseUrl: j?.licenseUrl, copyrightHolder: "The Author(s)",
        receivedAt: new Date(published.getTime() - 95 * 864e5), acceptedAt: new Date(published.getTime() - 20 * 864e5), publishedAt: published,
        status: "PUBLISHED",
        authors: { create: s.authors.map((x, k) => ({ order: k + 1, fullName: x.name, affiliation: s.affs[x.aff], isCorresponding: !!x.corr })) },
        references: { create: s.refs.map((c, k) => ({ order: k + 1, citation: c, doi: c.match(/\b(10\.\d{4,9}\/\S+)/)?.[1] ?? null })) },
      },
    });
    const pdf = buildPdf(
      [
        { text: "SAMPLE ARTICLE - FOR DEMONSTRATION ONLY - NOT A PEER-REVIEWED PUBLICATION", size: 8, bold: true },
        { text: j?.name ?? "Journal", size: 9, gap: 10 },
        { text: s.title, size: 16, bold: true, gap: 16 },
        { text: s.authors.map((x) => x.name).join(", "), size: 10, gap: 10 },
        { text: s.affs.join("; "), size: 8 },
        { text: "Abstract", size: 11, bold: true, gap: 18 },
        { text: s.abstract, size: 10 },
        { text: `Keywords: ${s.keywords}`, size: 9, gap: 8 },
        ...md.split("\n\n").filter((p) => p.trim() && !p.startsWith("|") && !p.startsWith("\n|") && !p.startsWith("*Table")).map((p) => (p.startsWith("## ") ? { text: p.slice(3), size: 11, bold: true, gap: 14 } : { text: p.replace(/\*\*/g, ""), size: 10 })),
        { text: "References", size: 11, bold: true, gap: 14 },
        ...s.refs.map((r, k) => ({ text: `[${k + 1}] ${r.replace(/\*/g, "")}`, size: 8, gap: 2 })),
      ],
      `${j?.shortName ?? ""} - sample article - ${s.pages}`,
    );
    const f = await storeBuffer(pdf, `${slug}.pdf`, "application/pdf", "articles", actorId);
    await db.articleFile.create({ data: { articleId: a.id, fileId: f.id, kind: "PDF" } });
    created++;
  }
  for (const [k, n] of ANNOUNCEMENTS.entries()) {
    await db.announcement.create({ data: { ...n, slug: `${slugify(n.title)}-sample`, isPublished: true, isSample: true, publishedAt: new Date(Date.now() - (k + 1) * 2 * 864e5) } });
  }
  await audit(actorId, "sample.loaded", "Article", undefined, { created });
  return { created };
}

export async function removeSampleContent(actorId: string) {
  const arts = await db.article.findMany({ where: { isSample: true }, include: { files: true } });
  const fileIds = arts.flatMap((a) => a.files.map((f) => f.fileId));
  await db.article.deleteMany({ where: { isSample: true } });
  const { deleteStoredFile } = await import("./storage");
  for (const id of fileIds) {
    await deleteStoredFile(id);
    await db.storedFile.delete({ where: { id } }).catch(() => {});
  }
  const issues = await db.issue.findMany({ where: { isSample: true }, include: { _count: { select: { articles: true } } } });
  for (const i of issues) if (i._count.articles === 0) await db.issue.delete({ where: { id: i.id } });
  const vols = await db.volume.findMany({ where: { isSample: true }, include: { _count: { select: { issues: true } } } });
  for (const v of vols) if (v._count.issues === 0) await db.volume.delete({ where: { id: v.id } });
  await db.announcement.deleteMany({ where: { isSample: true } });
  await audit(actorId, "sample.removed", "Article", undefined, { removed: arts.length });
  return { removed: arts.length };
}
