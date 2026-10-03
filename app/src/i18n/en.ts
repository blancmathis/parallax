import type {
  ClaimType,
  DebateFixture,
  EvidenceLabel,
  ReviewStatus,
} from "../types";

type Direction = DebateFixture["arguments"][number]["direction"];
type SourceType = DebateFixture["sources"][number]["source_type"];
type RetrievalStatus = DebateFixture["sources"][number]["retrieval_status"];

type MethodLabel = {
  cls: EvidenceLabel;
  name: string;
  desc: string;
};

const evidenceLabels: Record<EvidenceLabel, string> = {
  supports_claim: "supports",
  partially_supports_claim: "partially supports",
  contradicts_claim: "contradicts",
  does_not_support_claim: "does not support",
  unclear: "unclear",
};

const directionLabels: Record<Direction, string> = {
  supports: "supports",
  opposes: "opposes",
  qualifies: "nuance",
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  unreviewed: "unreviewed",
  approved: "approved",
  contested: "contested",
  rejected: "rejected",
};

const sourceTypes: Record<SourceType, string> = {
  article: "article",
  paper: "paper",
  report: "report",
  law: "law",
  dataset: "dataset",
  video: "video",
  other: "other",
};

const retrievalStatuses: Record<RetrievalStatus, string> = {
  found: "found",
  missing: "missing",
  blocked: "blocked",
  failed: "retrieval failed",
  partial: "partial",
};

const methodLabels: MethodLabel[] = [
  {
    cls: "supports_claim",
    name: "supports",
    desc: "The source directly supports the claim as stated.",
  },
  {
    cls: "partially_supports_claim",
    name: "partially supports",
    desc: "The source supports a narrower or weaker version of the claim.",
  },
  {
    cls: "contradicts_claim",
    name: "contradicts",
    desc: "The source conflicts with the claim.",
  },
  {
    cls: "does_not_support_claim",
    name: "does not support",
    desc: "The source is real and relevant, but does not back this claim.",
  },
  {
    cls: "unclear",
    name: "unclear",
    desc: "The relationship needs more review before labeling.",
  },
];

export const en = {
  common: {
    localeName: "English",
    nav: {
      debates: "Debates",
      method: "Method",
    },
    actions: {
      allDebates: "All debates",
    },
    counts: {
      seriousAnswers: (n: number) => `${n} serious answer${n === 1 ? "" : "s"}.`,
      previewStats: (claims: number, sources: number, links: number) =>
        `${claims} claims · ${sources} public sources · ${links} evidence links.`,
      cardStats: (claims: number, sources: number, links: number) =>
        `${claims} claims · ${sources} sources · ${links} evidence links`,
      sourceCount: (n: number) => `${n} source${n === 1 ? "" : "s"}`,
    },
    labels: {
      revision: "Revision",
      revisionShort: "rev.",
      publicPolicy: "Public policy",
      confidence: "confidence",
      retrieved: "retrieved",
      evidence: "Evidence",
      noSourceYet: "no source yet",
      unreviewedStamp: "Unreviewed",
      nonProfit: "Public-interest project",
    },
    claimTypes: {
      factual: "factual",
      causal: "causal",
      predictive: "predictive",
      normative: "normative",
      definitional: "definitional",
    } as Record<ClaimType, string>,
    confidenceBuckets: {
      low: "low",
      med: "moderate",
      high: "high",
    } as Record<"low" | "med" | "high", string>,
    evidenceLabels,
    directionLabels,
    reviewStatusLabels,
    sourceTypes,
    retrievalStatuses,
  },
  meta: {
    titleHome: "Parallax — The atlas of disagreement",
    titleDebates: "Debates — Parallax",
    titleMethod: "Method — Parallax",
    description:
      "Parallax maps serious disagreement: every view at its strongest, every claim tied to its sources, every value named. Enough to build a grounded view — and to understand why reasonable people diverge: sometimes the same values weighed differently, sometimes different ones. No winner crowned.",
    ogTitle: "Parallax — Understand every view. Including your own.",
    ogDescription:
      "An open-source atlas of disagreement built with a public-interest purpose. Facts, then the strongest case, then the values underneath. No winners declared.",
    descriptionDebates:
      "Browse every debate on Parallax — each laid out flat: positions at their strongest, evidence, and the values underneath.",
    descriptionMethod:
      "How Parallax maps disagreement: steelmanned positions, sourced claims, named values, cross-camp consensus. No winners declared.",
    descriptionShort:
      "Disagreement, made inspectable. Every view at its strongest, every claim sourced, every value named.",
    titleNotFound: "Not found — Parallax",
    descriptionNotFound: "This page does not exist — but the debates do.",
    debateTail: "— a debate on Parallax, laid out flat: positions, evidence, values.",
  },
  chrome: {
    footerMotto:
      "Most disagreements are about values, not facts. When we see each other's values clearly, we stop being enemies.",
    explore: "Explore",
    principles: "Principles",
    project: "Project",
    allDebates: "All debates",
    howItWorks: "How it works",
    principleItems: [
      "No winners declared",
      "Every side steel-manned",
      "Every label auditable",
    ],
    projectItems: [
      "Open source",
      "Public-interest purpose",
      "Read-only drafts",
    ],
    legal: {
      instrument: "parallax — an instrument for public reasoning",
      seed: "seed debates use public sources · structure unreviewed",
    },
    languageLabel: "Language",
    primaryNavLabel: "Primary",
    ctaReadDebate: "Read a debate",
    commandPaletteLabel: "Search and jump to a page",
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },
  legal: {
    legal: {
      title: "Legal notice",
      lede: "Publisher identity and information about publishing Parallax.",
    },
    privacy: {
      title: "Privacy",
      lede: "You can read the dossiers without an account, cookies or trackers in the application.",
    },
    contact: {
      title: "Contact",
      lede: "An error in a claim, excerpt or label? Identify the passage so it can be reviewed.",
    },
    editorTitle: "Publisher and publication",
    editor: "Publisher",
    director: "Publication director",
    address: "Postal address",
    email: "Contact email",
    addressPending: "Postal address to be supplied before publication.",
    emailPending: "Contact email to be supplied before publication.",
    hostTitle: "Hosting provider",
    hostPolicy: "Cloudflare privacy policy",
    sourceTitle: "About the dossiers",
    sourceBody: "The current dossiers were prepared with AI tools. They have not yet been reviewed or signed by named people. Sources, excerpts and labels remain open to correction.",
    reportError: "Report an error",
    reportBody: "The GitHub form is public: do not publish personal or confidential information there. Identify the claim, source and relevant excerpt.",
    privateTitle: "Private contact",
    privateBody: "For a private enquiry or a request about your data, use the publisher’s email. Vulnerabilities can be reported through GitHub’s private security form.",
    securityLink: "Report a vulnerability privately",
    privacySections: [
      {
        title: "Reading without a profile",
        body: "The application has no account, collection form or opinion profile. It sets no cookies and includes no trackers or audience analytics. Fonts are hosted with the site.",
      },
      {
        title: "Storage in your browser",
        body: "localStorage holds only parallax.locale, with the value fr or en: the last language viewed. This preference stays in this browser and is not sent to a database. No vote, quiz, profile, contribution draft or reading history is stored. You can clear it in your browser settings; the page address determines the reading language.",
      },
      {
        title: "Hosting logs",
        body: "Cloudflare may process IP addresses and technical request information to route pages and keep them secure. Processing and retention depend on the hosting services and their configuration; we do not promise an absence of logs. See Cloudflare’s policy for its processing and international transfers.",
      },
      {
        title: "External links and messages",
        body: "Sources and GitHub links lead to third-party sites with their own rules. GitHub reports are public. If you email the publisher, the information in your message is used to handle your request, without enriching an opinion profile.",
      },
      {
        title: "Your rights",
        body: "Contact the publisher for access, correction or erasure requests concerning your data. You can also contact the CNIL, the French data protection authority. Do not send sensitive information in a public issue.",
      },
    ],
    rightsLink: "Contact the CNIL",
  },
  landing: {
    draftNote: "Intended method: these drafts prepared with AI tools still await human review and signatures.",
    projectMission: "A foundation of source-grounded, auditable reflection: a compass for humans, a corpus to align AI.",
    methodSummary: "Present each position at its strongest, connect claims to exact source excerpts, then name the values and uncertainties behind the disagreement. Review should make every step inspectable.",
    reviewers: {
      eyebrow: "Call for reviewers",
      headline: "Do you defend a position?",
      headlineEm: "Help us represent it fairly.",
      body: "We are looking for supporters of each position and source reviewers. The dossiers still await that review: read the protocol and how to sign a review.",
      cta: "Take part in the review",
    },
    hero: {
      kicker: "The atlas of disagreement",
      titleLine: "The dossier on every great debate,",
      titleEm: "reviewed by those who disagree.",
      lede:
        "Every position at its strongest, signed by its supporters. Every fact tied to the exact excerpt of its source. What remains — values, bets on the future, trust — stated without naming a winner.",
      primaryCta: "Explore the debates",
      secondaryCta: "Read the method",
    },
    schematic: {
      topicLabel: "topic",
      topic: "Should schools ban smartphones during class?",
      positionALabel: "position a",
      positionA: "Yes — ban them bell-to-bell",
      positionBLabel: "position b",
      positionB: "No — teach managed use",
      positionCLabel: "position c",
      positionC: "Restrict in class, allow between",
      claim: "claim",
      evidenceLabel: "how the sources align",
      evidence: "supports · partially · contradicts · unclear",
      valuesLabel: "values in tension",
      values: "focused learning · autonomy · equal classroom · family reachability",
      ariaLabel:
        "Schematic of one debate: a topic splits into three positions; each position's claims carry colored evidence dots — green supports, amber partially, red contradicts, slate unclear — and the values in tension are named below.",
      legendSupports: "supports",
      legendPartial: "partially",
      legendContradicts: "contradicts",
      legendUnclear: "unclear",
      legendGloss: "facts are labeled, not blessed — the verdict stays yours",
    },
    ticker: [
      "no winners declared",
      "every side steel-manned",
      "every claim sourced — or it doesn't stand",
      "claims, not comments",
      "sources labeled, never trusted blindly",
      "values surfaced",
      "trade-offs priced",
      "every change on the record",
    ],
    problem: {
      eyebrow: "Why this exists",
      titleLine1: "The other side is rarely as evil or stupid",
      titleEm1: "as we assume",
      titleLine2: "Lay the disagreement out, and the enemy",
      titleEm2: "becomes a person",
      lede:
        "We've never talked to each other more, nor understood each other worse. Online debate is built to reward heat. Understanding needs the opposite.",
      p1:
        "Comment threads scatter arguments, repeat them, and bury the good ones. Opponents get caricatured instead of answered. Sources go unchecked — and the real disagreement never surfaces.",
      p2Prefix: "Parallax starts from one belief:",
      p2Lead: "the other side is rarely as evil or stupid as we assume.",
      p2:
        "More often, the anger hides real reasons: facts you haven't seen, a view you've caricatured, values weighed differently. Sometimes it hides only emotion — and against the facts, that doesn't hold. Lay the disagreement out, and the enemy turns back into a person.",
      pullLine: "The enemy turns back into a person.",
    },
    pillars: {
      eyebrow: "What Parallax does",
      titleLine: "Three filters:",
      titleEm: "the facts, the strongest case, the values underneath.",
      lede:
        "Every debate passes through three filters — the same three reasons two reasonable people disagree.",
      filtersLink: "See all three filters on one live debate →",
      items: [
        {
          no: "02",
          title: "Then, the strongest case",
          cause: "The view you've caricatured.",
          body:
            "What survives the facts is written as each side's strongest fair version — one a thoughtful supporter would recognize. Anyone can contest a steelman; contested ones stay visible, flagged.",
        },
        {
          no: "01",
          title: "First, the facts",
          cause: "The facts you haven't seen.",
          body:
            "Claims link to sources with precise alignment labels — supports, partially supports, contradicts, unclear. Never \"verified true\". The label is auditable; the verdict is yours.",
        },
        {
          no: "03",
          title: "What's left is values",
          cause: "The values they weigh differently.",
          body:
            "Once the facts are shared and every side is understood, what's left is values — sometimes the same ones weighed differently, sometimes genuinely different ones, and both are legitimate. The values matrix and trade-off ledger name that choice instead of burying it under \"facts\".",
        },
      ],
    },
    stats: {
      creed: "No winners declared. Ever.",
      creedSub: "Every view stays — but every claim must be sourced, and a false one is refuted in plain sight.",
      chip: "Three seed debates · structure unreviewed by design",
    },
    ai: {
      eyebrow: "Humans and AI",
      titleLine: "A compass for humans.",
      titleEm: "A corpus for AI.",
      lede:
        "Today Parallax is a living collection of sourced, unreviewed debate maps. The longer-term aim is a contestable, reviewable corpus for people and AI systems.",
      buildStep: "The planned AI contract",
      buildTitle: "AI proposes. Humans decide.",
      buildBody:
        "AI tools helped prepare these draft dossiers. Claims, steelmen and source-alignment labels remain unreviewed until a named human decision.",
      alignStep: "It helps align AI",
      alignTitle: "A corpus to align AI.",
      alignBody:
        "Steelmanned positions, mapped values, and human trade-offs are exactly the pluralistic-values data alignment needs — with benchmarks that test whether a model represents every side fairly, and grounded, contestable knowledge to keep learning from.",
    },
    preview: {
      eyebrow: "The dossiers",
      title: "Three seed dossiers, open from day one.",
      note: "Assembled by hand from public sources and marked unreviewed until independently checked. That status is part of the product, not a disclaimer.",
      allDebates: "All debates ->",
    },
    trust: {
      titleStart: "\"If you don't trust us,",
      titleEm: "verify.",
      cols: [
        {
          title: "Open source",
          body: "All prompts, algorithms, and moderation logic are built to be public and inspectable.",
        },
        {
          title: "Public-interest purpose",
          body: "Parallax is currently an open-source project, not a registered non-profit. Its target is independent public-interest governance without engagement incentives or a favored camp.",
        },
        {
          title: "Auditable",
          body: "The content is stored in versioned files. Their Git history records actual edits; each draft states that it has no named human review yet.",
        },
      ],
    },
    invite: {
      eyebrow: "You're invited",
      headline: "See the sources behind a claim?",
      headlineEm: "Open it.",
      body:
        "Read each position and open a claim to inspect its sources and available excerpts. These drafts are read-only and have no named human review yet.",
      cta: "Open a debate demo →",
    },
    whyNow: {
      eyebrow: "Why now",
      headline: "A timeless idea,",
      headlineEm: "finally buildable.",
      items: [
        {
          title: "Cross-group agreement is a promising design reference.",
          body: "Cross-group review is a design reference. Parallax has no active review gate; signed review, coverage and resistance to coordination remain work to be validated.",
        },
        {
          title: "The build cost collapsed.",
          body: "One person produced a working bilingual prototype and a deep design corpus at near-zero spend — capital-efficient by construction.",
        },
        {
          title: "Two needs converge.",
          body: "Civic funders want depolarization; AI funders want pluralistic-values data and fairness benchmarks. One commons answers both — and it doesn't exist yet.",
        },
      ],
    },
    founder: {
      eyebrow: "Why this structure",
      headline: "Built to",
      headlineEm: "outlast its founder.",
      founderLine:
        "Parallax was built largely solo, with AI, by a builder from École 42 — all-in on AI since 2023, who came to this from the alignment side, not from politics. No partisan axe to grind: for a neutrality product, that's a feature, not a bio note. The working bilingual prototype is the evidence it can ship — fast, and cheaply.",
      insight:
        "The hardest part of aligning AI is whose ethics it follows, when humans don't agree. That's the same gap that turns neighbors into enemies. Parallax is the substrate for both.",
      cards: [
        {
          title: "Mission lock",
          body: "No legal entity or association exists today. The target is an independent public-interest structure that holds the mission, corpus, and governance, with any commercial work legally separated.",
        },
        {
          title: "Open corpus",
          body: "Code and corpus will carry explicit open licenses, irrevocable once attached; paying customers buy convenience, never influence over content.",
        },
        {
          title: "No attention economy",
          body: "The reading site has no account, opinion profile or ballot. Only the language preference is stored in this browser.",
        },
      ],
      fundingLine:
        "An open commons, funded by services around it — structured feeds and fairness benchmarks for AI labs and institutions, to be kept legally separate from the mission.",
      cta: "Back this, partner, or read the plan →",
    },
    close: {
      eyebrow: "Bring your piece",
      headline: "Nobody wins a debate here.",
      headlineEm: "Everybody gains one thing.",
      body:
        "We've never talked more, or understood each other less. Disagreement, handled well, is the rarest thing online: understanding that holds. You stop treating someone who prioritizes differently as an enemy — the enemy turns back into a person.",
      callToBelong:
        "Read. Contest. Bring your piece — it will be reviewed, and it will last.",
      cta: "Open the smartphones debate →",
    },
  },
  debatesIndex: {
    eyebrow: "The dossiers",
    titleLine: "Every debate,",
    titleEm: "organized.",
    lede:
      "Each dossier is a public-policy question decomposed into positions, claims, source-labeled evidence, values, and trade-offs — seeded from public sources, open to contributions, reviewed before changes land.",
    emptyTitle: "No debate matches that search.",
    emptyBody: "Try a broader term, or clear the filters to see every dossier.",
    emptyClear: "Clear filters",
    resultsCount: (n: number) => `${n} debate dossier${n === 1 ? "" : "s"} found.`,
    dataDemo: "Built-in demo dossiers are active; no live library is configured.",
    noteStart: "Seed packets were assembled by hand from public sources and are marked",
    noteStrong: "unreviewed",
    noteEnd: "until independently checked. That status is part of the product, not a disclaimer.",
  },
  debateCard: {
    read: "Read ->",
    shapeAria: "Library state of this debate's claims",
    shapeEstablished: (n: number) =>
      `${n} claim${n === 1 ? "" : "s"} holding up`,
    shapeContested: (n: number) =>
      `${n} claim${n === 1 ? "" : "s"} contested`,
    shapeProvisional: (n: number) =>
      `${n} provisional claim${n === 1 ? "" : "s"} awaiting review`,
    shapeValues: (n: number) =>
      `${n} claim${n === 1 ? "" : "s"} down to values`,
  },
  atlas: {
    spineAria: "Epistemic shape of this debate",
    spineSummary: (
      established: number,
      contested: number,
      provisional: number,
      values: number,
    ) =>
      `${established} established, ${contested} contested, ${provisional} provisional, ${values} values-dependent`,
    revisedPrefix: "Revised",
    claimsCounted: (n: number) => `${n} claim${n === 1 ? "" : "s"} on the books`,
    viewAria: "Order the library",
    temperaments: {
      settled: "Mostly settled",
      contested: "Contested",
      provisional: "Awaiting review",
      values: "Values-dependent",
    } as Record<"settled" | "contested" | "provisional" | "values", string>,
    legend: {
      established: (n: number) => `${n} established`,
      contested: (n: number) => `${n} contested`,
      provisional: (n: number) => `${n} provisional`,
      values: (n: number) => `${n} down to values`,
    },
    views: {
      all: "All dossiers",
      contested: "Most contested",
      provisional: "Most awaiting review",
      values: "Values-dependent",
      recent: "Recently revised",
    },
    ledger: {
      aria: "What the library holds",
      creed:
        "A young library, growing in public — and keeping its own books where you can see them.",
      claims: (_n: number) => "claims on the books",
      sources: (_n: number) => "public sources cited",
      links: (_n: number) => "source-to-claim labels",
      questions: (_n: number) => "questions opened",
      settledNote:
        "These are review states, not truth scores: established requires an approved claim evaluation; provisional means independent review is still pending.",
    },
  },
  draft: {
    title: "Unreviewed draft",
    provenance: "Prepared with AI tools; no named human review yet.",
    coverage: (positions: string, excerpts: number, links: number, percent: number | null) =>
      `Sources per position — ${positions} · links with a stored exact excerpt: ${excerpts}/${links}${percent === null ? "" : ` (${percent}%)`}.`,
    reviewers: "Reviewers: none yet.",
    excerptNote: "An excerpt’s presence does not certify its fidelity to the source: human review is still needed.",
    unverifiedExcerpt: "unverified excerpt",
  },
  debatePage: {
    notFound: "No such dossier.",
    sharedClaim: (positions: string) => `shared with ${positions}`,
    evidenceEmpty: "No source has been attached to this claim yet.",
    legendCaption:
      "A label describes how one source relates to one claim — never whether the claim is \"true\".",
    argMeta: (claims: number, contested: number, dominant: string) =>
      `${claims} claim${claims === 1 ? "" : "s"} · ${
        contested > 0 ? `${contested} contested · ` : ""
      }mostly ${dominant}`,
    continueEyebrow: "Keep going",
    continueTitle: "Understand the next one.",
    back: "<- All debates",
    heroStatus: (revision: number, sources: number) =>
      `Revision ${revision} · ${sources} public sources · structure not yet independently reviewed`,
    step1: "Step 1",
    chooserEm: "Pick one to read it at its strongest.",
    readingBelow: "Reading below ↓",
    readThisView: "Read this view ->",
    chooserNote: "Parallax organizes disagreement — it never picks a winner.",
    positionAria: "Position",
    readingEyebrow: (letter: string) => `Position ${letter} — read in full`,
    steelmanLabel: "The strongest case, as a supporter would make it",
    restsOn: "What this position rests on",
    restsHint:
      "Each argument leans on claims. Open a claim to see its sources and how they align.",
    asksAccept: "What it asks you to accept",
    youGain: "You gain",
    youPay: "You pay",
    youRisk: "You risk",
    inTensionWith: "in tension with",
    step2: "Step 2",
    disagreeTitle: "Why people disagree.",
    disagreeEm: "Same facts, different priorities.",
    disagreeLede:
      "Most of this debate is not about whether the facts are right — it is about which values come first. Each column is a position; each filled dot is a value it puts forward.",
    workEyebrow: "For the skeptical",
    workTitle: "Show the work.",
    workEm: "Every source, every change, on the record.",
    allSources: "All sources",
    fileHistory: "File history",
    fileHistoryNote: "Actual changes to this dossier are recorded in Git. Content dates describe the working version, not a human review.",
    fileHistoryLink: "See changes on GitHub",
    howToRead: "How to read this page",
    howToReadP1:
      "Every position is written as a steelman — the strongest version of that view, as a thoughtful supporter would state it.",
    howToReadP2Start: "Claims are linked to sources with alignment labels -",
    howToReadP2End:
      "A label is about one source and one claim. It is never a verdict on the debate.",
    howToReadP3:
      "These drafts were prepared with AI tools and have not yet been checked by named human reviewers. The file history records actual changes.",
    evidenceNote:
      "Labels describe how each source relates to this exact claim — never whether the claim is \"true\".",
    faultEyebrow: "The fault-line map",
    faultTitle: "Where this debate actually splits.",
    faultEm: "Read the agreement before the fight.",
    faultLede:
      "Every claim sorted by how its sources align — settled, contested, or a question of values. The same facts can still lead to different priorities; this map shows exactly where the disagreement lives.",
    faultCommonGround: (n: number) =>
      `${n} fact${n === 1 ? "" : "s"} both sides already stand on.`,
    faultCommonGroundFallback: (n: number) =>
      `${n} fact${n === 1 ? "" : "s"} hold up under the evidence.`,
    faultLaneSettled: "Settled",
    faultLaneSettledCaption: "Evidence-backed — not a verdict.",
    faultLaneContested: "Contested",
    faultLaneContestedCaption: "A live empirical dispute in the sources.",
    faultLaneValues: "Values",
    faultLaneValuesCaption: "No source can settle it — it is a priority.",
    faultBothSides: (positions: string) => `both sides cite this · ${positions}`,
    faultSettledNote:
      "Settled = evidence-backed, not a verdict; positions still disagree on what to DO with these facts.",
    faultEmptySettled: "No settled facts on the map yet.",
    faultEmptyContested: "Nothing is contested by the evidence right now.",
    faultEmptyValues: "No purely values-based claim surfaced yet.",
  },
  method: {
    labels: methodLabels,
    eyebrow: "The method",
    titleStart: "How to read",
    mission:
      "Most serious disagreements are about values, not facts. When we can see each other's values clearly — what each side is protecting, and what it is willing to pay — we stop treating the other as an enemy and start treating them as a person who weighs the world differently.",
    lede:
      "The product does not tell you what to think. It organizes a debate so you can think clearly — and shows its work at every step.",
    filtersEyebrow: "The three filters",
    filtersLede:
      "Every debate passes through the same sequence: first the facts, then the strongest case for each side, then the values that remain. Read in that order, a disagreement stops being a fight and becomes a map.",
    lifecycle: {
      eyebrow: "From start to finish",
      title: "The life of a topic.",
      intro:
        "This is the target lifecycle: a question is decomposed without losing its sources, scope, review state, or audit trail. Today's prototype demonstrates only part of that loop.",
      steps: [
        {
          n: "1",
          key: "ask",
          title: "A question is posed",
          body:
            "Anyone opens a topic — a readable title and an explicit scope. Before it is created, the system finds the closest existing debate and asks: the same question, a sub-question, broader, or genuinely new?",
        },
        {
          n: "2",
          key: "positions",
          title: "Positions are steel-manned",
          body:
            "Every serious answer is written at its strongest — the version a supporter would recognize. As many as genuinely exist, never forced into two camps.",
        },
        {
          n: "3",
          key: "evidence",
          title: "Claims meet their sources",
          body:
            "Each position rests on claims. In today's prototype, truth-apt claims can link to hand-labeled, unreviewed source cards; AI-assisted review and a reusable, versioned source library remain target behavior.",
        },
        {
          n: "4",
          key: "recurse",
          title: "Contested points fork off",
          body:
            "In the target system, a sufficiently contested claim can become its own scoped question and preserve its links back to the parent debate. Today's prototype does not yet create sub-debates.",
        },
        {
          n: "5",
          key: "state",
          title: "Every claim shows its review state",
          body:
            "Established means an approved evaluation; contested means a reviewed challenge; provisional means independent review is still pending; values-dependent names a legitimate choice of priorities.",
        },
        {
          n: "6",
          key: "review",
          title: "Nothing changes silently",
          body:
            "The target requires opposing-camp review for sensitive judgments. Current dossiers are unreviewed drafts; changes are recorded in the debate files’ Git history.",
        },
      ],
      recursionNote:
        "A sub-debate is a full debate — title, positions, sources, sub-debates. The same machine, at every scale.",
    },
    sections: [
      {
        title: "1 — Positions are steel-manned",
        body:
          "Every serious answer to the question is written as its strongest fair version — the way a thoughtful supporter would put it. A position is treated fairly when a reasonable supporter would recognize it as a strong version of their view. Reviewers can mark a steelman as contested; it stays visible, flagged — never silently removed.",
      },
      {
        title: "2 — Claims are atomic, and labeled against sources",
        body:
          "Arguments lean on claims; claims link to sources. Each link carries one of five alignment labels:",
      },
      {
        title: "3 — Values and trade-offs are made explicit",
        body:
          "Most of a hard debate is not about whether the facts are right — it is about which values come first: fairness, efficiency, freedom, safety, trust. Each position declares the values it prioritizes and the price it accepts: what you gain, what you pay, what you risk. That is usually where the real disagreement lives.",
      },
    ],
    noVerified:
      "There is deliberately no \"verified true\". Truth usually needs synthesis across many sources and domain expertise. Claim-source alignment is narrower — and auditable. The label tells you what the source says about the claim; the verdict stays yours.",
    sources: {
      eyebrow: "Trusting the sources",
      title: "Source use, without a global reliability stamp.",
      lede:
        "The hardest question in any debate is whose sources to trust. Parallax never answers it for you by stamping a source \"reliable\" — the moment a platform plays referee, half its readers walk away. So we move the question, and show our work.",
      points: [
        {
          title: "Trust the claim, not the brand.",
          body:
            "A source is never \"reliable\" in the abstract — only usable, or not, for a scoped claim. The target is to trace each citation to an exact source version and show the relationship; today's fixture coverage is partial and unreviewed.",
        },
        {
          title: "Two questions, kept apart.",
          body:
            "Integrity — is it fabricated, misquoted, retracted, funded by an interested party? — is judged separately from relevance — does it back my side? Disagreeing with a source's conclusion never counts against its integrity.",
        },
        {
          title: "Agreement across camps, not a majority.",
          body:
            "The target is review by people who hold differing positions. Current drafts have no named human review; no production review pool or sampling method is implemented.",
        },
        {
          title: "Nothing is deleted.",
          body:
            "The target keeps a challenged source visible with its exact defect and rationale rather than erasing the record. This full versioned source history is not implemented yet.",
        },
      ],
      flowTitle: "Target workflow for source review",
      flow: [
        {
          step: "01",
          title: "An assistant prepares the checks",
          body:
            "AI tools helped prepare the draft sources and labels. Their excerpts and proposed alignments require human review; readers cannot trigger an analysis.",
        },
        {
          step: "02",
          title: "People make the review decision",
          body:
            "The target is structured review by people from differing positions. No production reviewer pool, sampling method, or coverage threshold is implemented yet.",
        },
        {
          step: "03",
          title: "A reviewed version can join the library",
          body:
            "After sufficient scoped review, the target is a reusable, versioned source entry whose evidence, limits, and freshness remain visible. No reviewed source library exists in today's prototype.",
        },
      ],
      libraryLine:
        "Review one source version for one scoped use; the target is to reuse it without losing scope, freshness, or limitations. This reusable library is not implemented yet.",
      keyline:
        "We can promise a fair process — never a comfortable conclusion. You do the trusting; Parallax does the disclosure.",
    },
    aiTitle: "What the AI is allowed to do",
    proposes: "It proposes",
    neverSilently: "It never silently",
    proposesItems: [
      "extract claims and classify their type",
      "summarize and steelman positions",
      "label claim-source alignment",
      "map values and trade-offs",
      "flag weaknesses and missing positions",
    ],
    neverItems: [
      "deletes a serious position",
      "declares a debate solved",
      "decides a value is invalid",
      "hides uncertainty",
      "publishes contentious changes without review",
    ],
    aiSourceRule:
      "Target contract: AI outputs remain labeled \"AI-proposed, unreviewed\" until human review, with source provenance attached to every truth-apt claim.",
    note:
      "These draft dossiers were prepared with AI tools and have no named human review yet. Readers cannot trigger an analysis.",
    cta: "Read a debate with this lens",
  },
  features: {
    statsDebates: "debates open to read",
    statsClaims: "claims, each tied to sources",
    statsSources: "public sources, hand-labeled",
    classroomsEyebrow: "For classrooms",
    classroomsTitle: "A ready-made lesson in disagreeing well.",
    classroomsBody: "A debate, its sources and the strongest case for each side: a reading session where the exercise is to state the other side fairly. Teacher packs are planned for a pilot.",
    classroomsCta: "Ask about the pilot",
    nameOrigin: "A parallax is how astronomers measure the distance to stars: the same object, sighted from two viewpoints, reveals a truth no single viewpoint can reach.",
    libraryEyebrow: "The library",
    libraryTitle: "What the debate establishes,",
    libraryTitleEm: "the library keeps.",
    libThesis: "Disagreement isn't the obstacle to truth — it's how truth is made. A claim that survives the strongest objection its opponents can bring is worth more than one a neutral checker stamped.",
    libraryLede: "Every claim starts provisional and is designed to reach one of three reviewed outcomes — all three are progress.",
    libEstablished: "Established",
    libEstablishedDesc: "The state a claim earns when it survives cross-camp review against the best counter-evidence anyone brings. Dated, revisable — never \"final\". (Today every seed claim is still unreviewed — the bar is the point.)",
    libContested: "Contested",
    libContestedDesc: "Where the evidence still conflicts. The debate page shows exactly where a claim blocks, and what evidence would unblock it.",
    libValues: "A values choice",
    libValuesDesc: "Facts shared, positions understood — what remains is a legitimate difference in priorities. Naming it is the resolution.",
    libProtoNote: "Cross-camp review is the intended method. Every current dossier is an unreviewed draft; no named human reviewer has signed it yet.",
    stateEyebrow: "State of the debate",
    stateEstablished: (n: number) => `${n} holding up`,
    stateContested: (n: number) => `${n} contested`,
    stateValues: (n: number) => `${n} values-dependent`,
    stateNote: "Derived from review status and auditable claim evaluations. A source-alignment label alone never establishes a claim.",
    searchPh: "Search questions, arguments, claims, or sources…",
    allThemes: "All",
    notFoundTitle: "This page does not exist.",
    notFoundBody: "But the debates do.",
    notFoundCta: "Browse the debates",
    skipToContent: "Skip to content",
    errorTitle: "Something came apart.",
    errorBody: "The page hit an error — the debates are still here.",
    errorCta: "Reload the page",
  },
  interactive: {
    palette: {
      home: "Home",
      allDebates: "All debates",
      method: "Method — how to read Parallax",
      hintPage: "page",
      hintDebate: "debate",
      placeholder: "Search pages, debates, claims, or sources…",
      empty: "Nothing matches.",
    },
    debate: {
      share: "Share ⧉",
      debateLinkCopied: "Debate link copied — send it into the argument",
      claimLinkCopied: "Link to this claim copied",
      claimCopyTitle: "Copy link to this claim",
    },
  },
};

export type Messages = typeof en;
