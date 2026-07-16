import type {
  ClaimType,
  Contribution,
  ContributionType,
  DebateFixture,
  EvidenceLabel,
  ReviewStatus,
} from "../types";

type Direction = DebateFixture["arguments"][number]["direction"];
type SourceType = DebateFixture["sources"][number]["source_type"];
type RetrievalStatus = DebateFixture["sources"][number]["retrieval_status"];
type ActorType = DebateFixture["audit_events"][number]["actor_type"];

type ContributionOption = {
  id: ContributionType;
  label: string;
  hint: string;
};

type MethodLabel = {
  cls: EvidenceLabel;
  name: string;
  desc: string;
};

const contributionTypes: ContributionOption[] = [
  {
    id: "new_claim",
    label: "New claim",
    hint: "Add an assertion a position relies on (with a source if you have one).",
  },
  {
    id: "new_source",
    label: "New source",
    hint: "Attach a public source to an existing claim.",
  },
  {
    id: "challenge_evidence_label",
    label: "Challenge a label",
    hint: "Argue that a claim-source alignment label is wrong.",
  },
  {
    id: "challenge_steelman",
    label: "Challenge a steelman",
    hint: "A supporter of this view would not recognize it? Say why.",
  },
  {
    id: "new_position",
    label: "Missing position",
    hint: "A serious answer to the question that is not represented yet.",
  },
];

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

const contributionStatusLabels: Record<Contribution["status"], string> = {
  submitted: "submitted",
  accepted: "accepted",
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
  partial: "partial",
};

const actorTypes: Record<ActorType, string> = {
  user: "user",
  admin: "admin",
  ai: "AI",
  system: "system",
};

const contributionLabels: Record<ContributionType, string> = {
  new_claim: "new claim",
  new_source: "new source",
  new_position: "new position",
  challenge_evidence_label: "evidence label challenge",
  challenge_steelman: "steelman challenge",
  value_tradeoff_correction: "value/tradeoff correction",
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

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const en = {
  common: {
    localeName: "English",
    nav: {
      debates: "Debates",
      method: "Method",
      review: "Review queue",
      readDebate: "Read a debate",
      you: "You",
    },
    actions: {
      allDebates: "All debates",
      browseDebates: "Browse the debates",
      read: "Read",
      close: "Close",
      approve: "Approve",
      reject: "Reject",
      resetDemo: "Reset demo data (clears local contributions, reviews, and audit events)",
    },
    counts: {
      claims: (n: number) => plural(n, "claim", "claims"),
      sources: (n: number) => plural(n, "source", "sources"),
      publicSources: (n: number) => plural(n, "public source", "public sources"),
      evidenceLinks: (n: number) => plural(n, "evidence link", "evidence links"),
      draftContributions: (n: number) =>
        `${n} draft contribution${n === 1 ? "" : "s"} awaiting review — open the queue ->`,
      seriousAnswers: (n: number) => `${n} serious answer${n === 1 ? "" : "s"}.`,
      previewStats: (claims: number, sources: number, links: number) =>
        `${claims} claims · ${sources} public sources · ${links} evidence links.`,
      cardStats: (claims: number, sources: number, links: number) =>
        `${claims} claims · ${sources} sources · ${links} evidence links`,
      pendingPrefix: (n: number) => (n > 0 ? `${n} pending · ` : ""),
      sourceCount: (n: number) => `${n} source${n === 1 ? "" : "s"}`,
    },
    labels: {
      revision: "Revision",
      revisionShort: "rev.",
      publicPolicy: "Public policy",
      step: "Step",
      confidence: "confidence",
      retrieved: "retrieved",
      utc: "UTC",
      community: "Community",
      submitted: "Submitted",
      pending: "Pending",
      decided: "Decided",
      reviewer: "Reviewer",
      on: "on",
      proposedLabel: "proposed label",
      evidence: "Evidence",
      source: "source",
      noSourceYet: "no source yet",
      unreviewedStamp: "Unreviewed",
      openSource: "Open source",
      nonProfit: "Non-profit",
      auditable: "Auditable",
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
    contributionStatusLabels,
    contributionLabels,
    sourceTypes,
    retrievalStatuses,
    actorTypes,
    auditEventTypes: {
      topic_created: "topic created",
      source_added: "source added",
      source_retrieved: "source retrieved",
      claim_extracted: "claim extracted",
      evidence_labeled: "evidence labeled",
      position_generated: "position generated",
      revision_published: "revision published",
      contribution_submitted: "contribution submitted",
      review_completed: "review completed",
    } as Record<string, string>,
  },
  meta: {
    titleHome: "Parallax — The atlas of disagreement",
    titleDebates: "Debates — Parallax",
    titleMethod: "Method — Parallax",
    titleReview: "Review queue — Parallax",
    titleYou: "Your map — Parallax",
    description:
      "Parallax maps serious disagreement: every view at its strongest, every claim tied to its sources, every value named. Enough to build a grounded view — and to understand why reasonable people diverge: sometimes the same values weighed differently, sometimes different ones. No winner crowned.",
    ogTitle: "Parallax — Understand every view. Including your own.",
    ogDescription:
      "A non-profit, open-source atlas of disagreement. Facts, then the strongest case, then the values underneath. No winners declared. Ever.",
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
    reviewQueue: "Review queue",
    principleItems: [
      "No winners declared",
      "Every side steel-manned",
      "Every label auditable",
    ],
    projectItems: ["Open source", "Non-profit", "Milestone 1-3 prototype"],
    legal: {
      instrument: "parallax — an instrument for public reasoning",
      seed: "seed debates use public sources · structure unreviewed",
    },
    languageLabel: "Language",
    skipToContent: "Skip to content",
    primaryNavLabel: "Primary",
    commandPaletteLabel: "Search and jump to a page",
    ctaTakeQuiz: "Take the quiz",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    pendingCount: (n: number) =>
      `${n} contribution${n === 1 ? "" : "s"} pending review`,
  },
  landing: {
    hero: {
      kicker: "The atlas of disagreement",
      titleLine: "The living library of the",
      titleEm: "great debates.",
      lede:
        "Here, we advance every great question toward clear, structured, sourced answers. Every viewpoint, at its strongest.",
      primaryCta: "Explore the debates",
      secondaryCta: "Read the method",
      tertiaryCta: "Measure your own view",
      tertiaryCtaTime: "1-minute test",
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
    interactive: {
      eyebrow: "Read it, then test yourself",
      titleLine: "Don't just read it —",
      titleEm: "prove you can argue the other side.",
      lede:
        "Parallax is not a wall of text to scroll past. Take a position, then prove you can argue the other side — and watch your own view of \"them\" shift.",
      quizStep: "One minute",
      quizTitle: "Find where you stand",
      quizBody:
        "Five trade-offs map your priorities to the closest position — and to the values you share with the people who disagree.",
      steelStep: "The real test",
      steelTitle: "Argue the other side",
      steelBody:
        "Pass the steelman test on a view you reject. State it the way a supporter would, and earn a badge that proves you understood it.",
      deltaStep: "Measured on you, not on them",
      deltaMetric: "before → after",
      deltaBody:
        "Rate the other side before you read, and again after. The shift is computed on your own answers, stays in your browser, and is never sent to us — a mirror, not a metric we collect. Whether reading moves readers in general is a study we want to run, not a result we're claiming.",
      refrain: "This is where the enemy turns back into a person.",
      cta: "Start with the smartphones debate",
      profileLink: "or see your profile",
    },
    ai: {
      eyebrow: "Humans and AI",
      titleLine: "A compass for humans.",
      titleEm: "A corpus for AI.",
      lede:
        "The same engine serves both: a living base of verified, sourced reflection where humans and AI learn to think better — together.",
      buildStep: "AI helps build it",
      buildTitle: "AI proposes. Humans decide.",
      buildBody:
        "AI can extract claims, write a position at its strongest, or label how a source aligns. But every AI contribution is flagged, must carry a source, and is confirmed by a human before it enters the record. The AI proposes structure; it never publishes a verdict.",
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
    loop: {
      eyebrow: "The loop",
      titleLine: "Open contribution,",
      titleEm: "governed by review.",
      steps: [
        {
          verb: "Read",
          text: "a debate — positions, claims, evidence, values, trade-offs.",
        },
        {
          verb: "Contribute",
          text: "a draft — a claim, a source, a challenge, a missing position.",
        },
        {
          verb: "Review",
          text: "drafts stay pending until a reviewer accepts or rejects them, with a written rationale.",
        },
        {
          verb: "Audit",
          text: "every transformation lands on the record. Nothing changes silently.",
        },
      ],
      noteStart: "Try it: open any debate and press",
      noteButton: "Improve this debate",
      noteMiddle: "then play reviewer in the",
      noteLink: "review queue",
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
          title: "Non-profit",
          body: "Designed as a non-profit: no engagement metrics to juice, no side to favor.",
        },
        {
          title: "Auditable",
          body: "Every review decision is on the record; when the AI pipeline ships, every AI step is logged the same way. Neutrality is audited, not proclaimed — an external auditor is a deliverable, not a badge.",
        },
      ],
    },
    invite: {
      eyebrow: "You're invited",
      headline: "See a label you'd dispute?",
      headlineEm: "Touch it.",
      body:
        "Parallax isn't read-only. Contest a source label, add a better source, or write the missing position — no account needed. Your draft never edits the page directly: it waits for review, with a written rationale, on the record.",
      cta: "Open a live debate →",
    },
    whyNow: {
      eyebrow: "Why now",
      headline: "A timeless idea,",
      headlineEm: "finally buildable.",
      items: [
        {
          title: "The validation method is proven.",
          body: "Judgments confirmed only when they earn agreement across camps — not by majority — now work at scale. Community Notes showed it.",
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
          body: "Parallax is being set up as a French association loi 1901 to hold the mission, the corpus, and the governance, with any commercial work in a legally separate subsidiary — so the red lines can't be quietly sold off.",
        },
        {
          title: "Open corpus",
          body: "Code and corpus will carry explicit open licenses, irrevocable once attached; paying customers buy convenience, never influence over content.",
        },
        {
          title: "No attention economy",
          body: "No engagement metrics to optimize, no side to favor. Individual data — your quiz, your profile, your perception shift — is never sold; today it never leaves your browser.",
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
    next: "next",
    proposeTitle: "Propose a topic",
    proposeSummary:
      "General topic creation arrives with Milestone 6 — after the contribution and review loop has proven itself. Good candidates: public-policy questions with publicly inspectable sources.",
    notOpen: "not yet open",
    proposeHint: "your idea",
    proposeAction: "Propose it →",
    emptyTitle: "No debate matches that search.",
    emptyBody: "Try a broader term, or clear the filters to see every dossier.",
    emptyClear: "Clear filters",
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
    shapeValues: (n: number) =>
      `${n} claim${n === 1 ? "" : "s"} down to values`,
  },
  atlas: {
    spineAria: "Epistemic shape of this debate",
    spineSummary: (established: number, contested: number, values: number) =>
      `${established} settled, ${contested} contested, ${values} down to values`,
    revisedPrefix: "Revised",
    claimsCounted: (n: number) => `${n} claim${n === 1 ? "" : "s"} on the books`,
    viewAria: "Order the library",
    temperaments: {
      settled: "Mostly settled",
      contested: "Contested",
      values: "Values-dependent",
    } as Record<"settled" | "contested" | "values", string>,
    legend: {
      established: (n: number) => `${n} settled`,
      contested: (n: number) => `${n} contested`,
      values: (n: number) => `${n} down to values`,
    },
    views: {
      all: "All dossiers",
      contested: "Most contested",
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
        "Settled means evidence-backed, not a verdict — positions still disagree on what to DO with these facts.",
    },
  },
  debatePage: {
    notFound: "No such dossier.",
    communityPosition: "Community position",
    sharedClaim: (positions: string) => `shared with ${positions}`,
    evidenceEmpty: "No source has been attached to this claim yet.",
    communityUnmapped: "Not yet mapped on the values matrix.",
    legendCaption:
      "A label describes how one source relates to one claim — never whether the claim is \"true\".",
    argMeta: (claims: number, contested: number, dominant: string) =>
      `${claims} claim${claims === 1 ? "" : "s"} · ${
        contested > 0 ? `${contested} contested · ` : ""
      }mostly ${dominant}`,
    switcherPassed: "Steelman test passed",
    switcherMatch: "Your closest position",
    switcherTakeTest: "Steelman test available",
    openReviewQueue: "Open the review queue",
    continueEyebrow: "Keep going",
    continueTitle: "Understand the next one.",
    continueDelta: (delta: number) =>
      `You rated the other side +${delta} more reasonable after reading.`,
    continueProfileLink: "See it on your profile",
    continueYouLink: "your map",
    back: "<- All debates",
    heroStatus: (revision: number, sources: number) =>
      `Revision ${revision} · ${sources} public sources · structure not yet independently reviewed`,
    improve: "Improve this debate",
    step1: "Step 1",
    chooserEm: "Pick one to read it at its strongest.",
    communityAccepted: "Community · accepted",
    readingBelow: "Reading below ↓",
    readThisView: "Read this view ->",
    chooserNote: "Parallax organizes disagreement — it never picks a winner.",
    positionAria: "Position",
    readingEyebrow: (letter: string) => `Position ${letter} — read in full`,
    communityReadingEyebrow: "Community position — accepted in review",
    steelmanLabel: "The strongest case, as a supporter would make it",
    contested: "contested",
    communityChallenge: "Community challenge:",
    restsOn: "What this position rests on",
    restsHint:
      "Each argument leans on claims. Open a claim to see its sources and how they align.",
    communityAdditions: "Community additions",
    communityAdditionsHint: "Accepted in review. Sources still await alignment labeling.",
    communityNote:
      "This position was proposed by a visitor and accepted by a reviewer. It has no structured arguments yet — challenges and sources welcome.",
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
    communitySubmittedSource: "community-submitted · accepted in review · awaiting alignment labeling",
    auditTrail: "Audit trail",
    howToRead: "How to read this page",
    howToReadP1:
      "Every position is written as a steelman — the strongest version of that view, as a thoughtful supporter would state it.",
    howToReadP2Start: "Claims are linked to sources with alignment labels -",
    howToReadP2End:
      "A label is about one source and one claim. It is never a verdict on the debate.",
    howToReadP3:
      "Everything here is currently unreviewed: the structure was assembled by hand from the seed packet and has not yet been checked by independent reviewers.",
    evidenceNote:
      "Labels describe how each source relates to this exact claim — never whether the claim is \"true\".",
    communityChallengeProposes: (label: string) =>
      `Community challenge — proposes “${label}”`,
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
    faultWeightLead: "Ranked by what you weigh most",
    faultWeightNote:
      "Your quiz priorities, scored against each position's values. A lens, not a verdict.",
    faultWeightEmpty: "Take the values quiz to see which positions fit you.",
    faultWeightEmptyCta: "Find where you stand ↑",
  },
  contribute: {
    types: contributionTypes,
    improve: "Improve this debate",
    title: "Draft a contribution",
    submitted: "Submitted",
    pendingTitle: "Your draft is pending review.",
    pendingBody:
      "It will not change the published debate until a reviewer accepts it — with a written rationale, on the record.",
    openReview: "Open the review queue",
    draftAnother: "Draft another",
    whatAdding: "What are you adding?",
    whichPosition: "Which position?",
    choosePosition: "Choose a position...",
    whichClaim: "Which claim?",
    chooseClaim: "Choose a claim...",
    whichEvidenceLink: "Which evidence link?",
    chooseLink: "Choose the link...",
    currently: "currently",
    shouldBeLabeled: "It should be labeled...",
    positionTitle: "Position title",
    positionTitlePlaceholder: "e.g. \"Yes, but only city-by-city referendum\"",
    sourceUrl: "Source URL",
    optional: "(optional)",
    textareaPlaceholder: "Write it the way a careful reviewer would want to read it...",
    submit: "Submit for review",
    hint: "Drafts never edit the live debate directly.",
    bodyLabels: {
      new_claim: "The claim, stated atomically",
      new_source: "What does this source say about the claim?",
      challenge_evidence_label: "Why is the current label wrong?",
      challenge_steelman: "What would a supporter not recognize?",
      new_position: "The position, at its strongest",
      value_tradeoff_correction: "What value or tradeoff is mis-stated, and how?",
    } as Record<ContributionType, string>,
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
        "A question comes in, gets taken apart, and never stops being inspectable — the same machine runs at every scale.",
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
            "Each position rests on claims; each claim is tied to its sources with a precise alignment label. Sources are vetted — AI first, then people — and join a reusable library.",
        },
        {
          n: "4",
          key: "recurse",
          title: "Contested points fork off",
          body:
            "A claim contested enough becomes its own scoped question — a sub-debate — and the cycle starts over. A big topic is an atlas of sub-debates, not a page.",
        },
        {
          n: "5",
          key: "state",
          title: "Everything sorts into three",
          body:
            "At every level: established (survived scrutiny), contested (and exactly where it blocks), or values-dependent (a legitimate choice of priorities).",
        },
        {
          n: "6",
          key: "review",
          title: "Nothing changes silently",
          body:
            "Sensitive judgments ship only when reviewers from opposing camps converge. Every step is on the record, and everything stays contestable.",
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
      {
        title: "4 — Changes go through review, on the record",
        body:
          "Anyone can draft a contribution: a new claim, a new source, a challenge to a label or a steelman, a missing position. Drafts never touch the published debate. A reviewer accepts or rejects each one with a written rationale, and every step — submission, decision, publication — lands in the audit trail. Nothing changes silently.",
      },
    ],
    noVerified:
      "There is deliberately no \"verified true\". Truth usually needs synthesis across many sources and domain expertise. Claim-source alignment is narrower — and auditable. The label tells you what the source says about the claim; the verdict stays yours.",
    sources: {
      eyebrow: "Trusting the sources",
      title: "Verified without an arbiter.",
      lede:
        "The hardest question in any debate is whose sources to trust. Parallax never answers it for you by stamping a source \"reliable\" — the moment a platform plays referee, half its readers walk away. So we move the question, and show our work.",
      points: [
        {
          title: "Trust the claim, not the brand.",
          body:
            "A source is never \"reliable\" in the abstract — only usable, or not, for a specific claim, in a specific field, over a specific period. We trace every citation back to its primary source and check it actually says what it is quoted as saying.",
        },
        {
          title: "Two questions, kept apart.",
          body:
            "Integrity — is it fabricated, misquoted, retracted, funded by an interested party? — is judged separately from relevance — does it back my side? Disagreeing with a source's conclusion never counts against its integrity.",
        },
        {
          title: "Agreement across camps, not a majority.",
          body:
            "A judgment about a source only stands when reviewers who usually disagree both accept it. A brigade can't push it through; a single camp can't veto it — the mechanism behind X's Community Notes.",
        },
        {
          title: "Nothing is deleted.",
          body:
            "A weak source is flagged with its exact defect and pushed down — never erased. It stays on the record, with its reason, open to challenge.",
        },
      ],
      flowTitle: "How a source gets vetted",
      flow: [
        {
          step: "01",
          title: "An LLM checks first",
          body:
            "When a source comes in, the assistant traces it to its primary source, verifies the quote actually says what's claimed, and flags retractions or conflicts of interest — then drafts a neutral source card.",
        },
        {
          step: "02",
          title: "Then people analyze it",
          body:
            "Readers from different camps weigh its integrity and leave structured notes. Agreement across camps — not a show of hands — is what lets a verdict stand.",
        },
        {
          step: "03",
          title: "And it joins the library",
          body:
            "A source vetted by many becomes a reusable entry. Later debates cite it without re-litigating it, and the assistant can suggest already-verified sources as you build your case.",
        },
      ],
      libraryLine:
        "Verify a source once; reuse it everywhere. The longer Parallax runs, the stronger this commons of vetted evidence becomes — analyzed by thousands, owned by no one.",
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
      "AI can take part too — but anything it adds is flagged \"AI-proposed\", verified before it counts, and must cite a source. In fact no argument enters without one, whether it comes from a person or a machine.",
    note:
      "In this prototype the seed structure was assembled by hand; the AI pipeline arrives in Milestone 4 and will be held to the same contract.",
    cta: "Read a debate with this lens",
  },
  review: {
    targetPosition: (letter: string, title: string) => `Position ${letter} — ${title}`,
    targetClaim: (id: string, text: string) => `${id.toUpperCase()} — ${text}`,
    targetEvidence: (publisher: string, claim: string) => `Evidence: ${publisher} on ${claim}`,
    eyebrow: "Reviewer mode",
    title: "The review queue.",
    titleEm: "Nothing changes silently.",
    lede:
      "Draft contributions wait here. Approving merges them into the live debate view and publishes a new local revision; rejecting keeps them on the record with your rationale. In this prototype you are the reviewer — decisions persist in your browser.",
    clear: "The queue is clear.",
    emptyHintStart: "Open a debate and press",
    emptyHintButton: "Improve this debate",
    emptyHintEnd: "to draft a contribution, then come back here to review it.",
    rationalePlaceholder: "Written rationale — it goes on the record...",
    mergeAction: "Merge into the record",
    mergeHint:
      "Clone the published revision, apply this contribution, publish a new dated revision.",
    mergeAdminOnly:
      "Admin role required to merge — a reviewer accepts, an admin publishes.",
    mergeDeferred:
      "Not yet auto-mergeable — this contribution type needs human structuring first.",
    mergeDone: (slug: string) =>
      `Merged into a new published revision — open /debates/${slug}.`,
    mergeFailed: "Merge failed; the canonical record is unchanged.",
    mergedInto: (rev: string) => `Merged into the canonical record · ${rev}.`,
    sampleType: "new source",
    sampleTopic: "Should schools ban smartphones during class?",
    sampleTag: "sample",
    sampleTarget:
      "Claim: \"Banning phones during the school day improves adolescent mental wellbeing.\"",
    sampleBody:
      "A longitudinal study finds wellbeing gains concentrated in heavy users — worth attaching, but it supports a narrower claim than the one stated.",
    sampleHint:
      "A sample, so you can see what reviewing feels like. The controls are inert — draft a real contribution to use them.",
  },
  features: {
    voicesEyebrow: "Where this view comes from",
    voicesHint: "Values are often the trace of a story. Seed voices are realistic composites, curated like every other contribution.",
    voicesSample: "composite voice · seed content",
    statsDebates: "debates open to read",
    statsClaims: "claims, each tied to sources",
    statsSources: "public sources, hand-labeled",
    statsDeltas: "Process, not verdicts.",
    classroomsEyebrow: "For classrooms",
    classroomsTitle: "A ready-made lesson in disagreeing well.",
    classroomsBody: "One debate, the values quiz, the steelman test: a full civics session where the homework is to state the other side fairly. Teacher packs arrive with the pilot program.",
    classroomsCta: "Ask about the pilot",
    proposeTitle: "Propose a topic",
    proposeLede: "Good candidates are public-policy questions whose evidence is publicly inspectable. Drafts stay on your device until topic creation opens (Milestone 6).",
    proposeQuestion: "The debate question",
    proposeQuestionPh: "Should …?",
    proposeWhy: "Why it matters now",
    proposeWhyPh: "What makes this debate worth mapping…",
    proposeSources: "Two public sources to start from",
    proposeEmail: "Email",
    proposeEmailPh: "you@example.org",
    proposeEmailHint: "Optional — only used to tell you when your topic goes live.",
    proposeSubmit: "Save my proposal",
    proposeSavedToast: "Proposal saved on this device — topic creation opens with Milestone 6",
    proposeSavedTitle: "Saved, on your device.",
    proposeSavedBody: "When general topic creation opens, your draft will be right here, ready to submit through the same review pipeline as everything else.",
    nameOrigin: "A parallax is how astronomers measure the distance to stars: the same object, sighted from two viewpoints, reveals a truth no single viewpoint can reach.",
    libraryEyebrow: "The library",
    libraryTitle: "What the debate establishes,",
    libraryTitleEm: "the library keeps.",
    libThesis: "Disagreement isn't the obstacle to truth — it's how truth is made. A claim that survives the strongest objection its opponents can bring is worth more than one a neutral checker stamped.",
    libraryLede: "Every claim is built to end in one of three states — and all three are progress.",
    libEstablished: "Established",
    libEstablishedDesc: "The state a claim earns when it survives cross-camp review against the best counter-evidence anyone brings. Dated, revisable — never \"final\". (Today every seed claim is still unreviewed — the bar is the point.)",
    libContested: "Contested",
    libContestedDesc: "Where the evidence still conflicts. The debate page shows exactly where a claim blocks, and what evidence would unblock it.",
    libValues: "A values choice",
    libValuesDesc: "Facts shared, positions understood — what remains is a legitimate difference in priorities. Naming it is the resolution.",
    libProtoNote: "Cross-camp review is how this is designed to work, and what we're building. Today's prototype runs single-reviewer mode — and says so on every debate.",
    stateEyebrow: "State of the debate",
    stateEstablished: (n: number) => `${n} holding up`,
    stateContested: (n: number) => `${n} contested`,
    stateValues: (n: number) => `${n} values-dependent`,
    stateNote: "Derived from claim-source alignment. Cross-camp review will refine these states.",
    dedupTitle: "Similar claims already on the map",
    dedupHint: "Parallax merges duplicates instead of multiplying them. If your point is below, add a source or a distinction to it instead.",
    dedupUseIt: "This is my point",
    bridgeNote: "Production rule: a decision ships only when reviewers from opposing camps agree (bridging consensus). This prototype runs single-reviewer mode.",
    stewardTitle: "Steward eligibility",
    stewardHint: (done: number, total: number) => `Pass the steelman test on every position to earn moderation rights. ${done}/${total} earned.`,
    stewardEligible: "Eligible — you have proven you can state every side fairly.",
    engineTitle: "How a topic advances",
    engineLede: "The engine behind every page — designed for objectivity at scale, against spam, and for completeness.",
    engineItems: [
      { title: "A contribution is a diff, not a post", body: "Every submission is matched against the existing map first. Duplicates are merged, never multiplied — repetition and spam die at the gate, without censorship." },
      { title: "Bridging consensus, not majority", body: "Labels and steelmans are validated when reviewers from opposing camps agree — the mechanism behind Community Notes. Majorities can brigade; bridges cannot." },
      { title: "Moderation is earned by understanding", body: "To become a steward of a debate, pass the steelman test on every one of its positions. You may only moderate what you can state fairly." },
      { title: "Big topics fractalize", body: "A vast question becomes an atlas of sub-questions sharing one global claim library — a claim is verified once, cited everywhere." },
      { title: "AI does the mass work, humans judge", body: "Dedup, extraction, retrieval, first-pass labels: AI, fully audited. Validation, fairness, arbitration: humans, by bridging." },
    ],
    searchPh: "Search the debates…",
    allThemes: "All",
    revHistory: "history",
    revSeed: "seed structure published from the research packet",
    revLocal: "community contribution merged (local to this browser)",
    notFoundTitle: "This page does not exist.",
    notFoundBody: "But the debates do.",
    notFoundCta: "Browse the debates",
    skipToContent: "Skip to content",
    errorTitle: "Something came apart.",
    errorBody: "The page hit an error — the debates are still here.",
    errorCta: "Reload the page",
  },
  interactive: {
    scale: {
      min: "not at all",
      max: "completely",
    },
    quiz: {
      introEyebrow: "Before you read",
      introTitle: "Where do you stand?",
      introLede:
        "Five trade-offs, one minute. No right answers — just your priorities. Then see which position fits them, and which values you share with the other side.",
      start: "Start",
      privacy: "stays in your browser",
      sightedAt: (n: number) => `Sighted at ${n} · before reading`,
      baselineEyebrow: "Quick calibration",
      baselineQuestion:
        "People who disagree with you on this topic — how reasonable are they?",
      back: "← Back",
      resultEyebrow: "Your values, mapped",
      matchLead: "Your closest position",
      readFirst: "Read it first",
      bridgesLead: "And here is the part that matters:",
      bridge: (value: string, letter: string) =>
        `You share ${value.toLowerCase()} with people who answer ${letter}.`,
      lensNote:
        "Values are one lens, not a verdict — people also arrive at positions through their history, their fears, what they have lived. The map shows the lens. The person is always bigger than it.",
      savedToast: "Saved to your local profile — see /you",
      savedLink: "Saved to your profile →",
      compactLeadStart: "Your closest position is",
      compactLeadEnd: (values: string[]) =>
        ` — you lean ${values.join(" and ").toLowerCase()}.`,
      reRead: "Re-read it →",
      retake: "Retake the quiz",
    },
    steelman: {
      eyebrow: "Steelman test",
      title: "Do you really understand this view?",
      counter: (n: number, total: number, position: string) =>
        `Question ${n} of ${total} · ${position}`,
      exactly: "Exactly.",
      notQuite: "Not quite.",
      next: "Next question",
      seeResult: "See result",
      passStamp: "Steelman ✓",
      passTitle: "You can state this position the way a supporter would.",
      passBody:
        "That is the rarest skill in any debate — and the badge is now on your local profile. Try the test on the position you disagree with most.",
      failTitle: "Close — but a supporter would object.",
      failBody:
        "Re-read the steelman and the trade-off ledger, then try again. Understanding the other side is the whole game.",
      backToReading: "Back to reading",
      tryAgain: "Try again",
      badgeToast: "Steelman badge earned — saved to your profile",
    },
    perception: {
      eyebrow: "Before you go",
      beforeLabel: "Before",
      afterLabel: "After",
      movedDownStart: "Your answer moved",
      movedDownEnd:
        "after reading. That happens too — at least the disagreement is precise now instead of vague.",
      measuredLine: "We measured this on you — never on them.",
      question:
        "Same question as when you arrived: people who disagree with you on this — how reasonable are they?",
      noBaseline:
        "Noted. Take the values quiz next time before reading — then we can show you whether reading moved you.",
      movedUpStart: "Your answer moved",
      movedUpEnd:
        "after reading. Not because anyone won — because you saw what the other side actually values.",
      held:
        "Your answer held steady. Understanding doesn't always mean moving — it means knowing precisely where and why you differ.",
      movedDown: (delta: number) =>
        `Your answer moved ${delta}. That happens too — at least now the disagreement is precise instead of vague.`,
      note: "This number stays in your browser. It exists for you, not for us.",
    },
    you: {
      eyebrow: "Your map",
      titleLine: "What you value.",
      titleEm: "Who you understand.",
      lede:
        "Your quiz results, steelman badges, and perception shifts — all stored in this browser only. No account, no tracking, no server. Clearing your browser data clears this page.",
      emptyTitle: "Nothing here yet.",
      emptyBody:
        "Open a debate, take the one-minute values quiz, and try a steelman test. Your map builds itself.",
      emptyCta: "Start with a debate",
      previewLabel: "What your map will hold",
      previewValues: "The values you lean on, aggregated across every debate you read.",
      previewBadges: "A badge for each side you can argue as well as its own supporters.",
      previewDelta: "Whether reading moved your view of the people who disagree.",
      valuesTitle: "Your values profile",
      valuesHint: "Aggregated from every quiz you have taken. Not a verdict — a mirror.",
      debatesTitle: "Your debates",
      closestPosition: "Your closest position:",
      quizNotTaken: "Values quiz not taken yet",
      badgePassed: "Steelman test passed",
      badgeAttempt: (correct: number, total: number) =>
        `Best attempt: ${correct}/${total}`,
      badgeNotAttempted: "Steelman test not attempted",
      badgeLabel: "steelman badges",
      deltaUp: (delta: number) =>
        `Your view of the other side softened by +${delta} after reading.`,
      deltaHeld: "Your view of the other side held steady.",
      deltaDown: (delta: number) =>
        `Your view of the other side hardened by ${delta}.`,
      contributionsTitle: "Your contributions",
      contributionsSummary: (drafted: number, accepted: number, rejected: number, pending: number) =>
        `${drafted} drafted · ${accepted} accepted · ${rejected} rejected · ${pending} pending — `,
      reviewQueueLink: "see the review queue",
      reset: "Reset my profile",
      resetConfirm: "Clear your local profile (quiz results, badges, perception data)?",
    },
    palette: {
      home: "Home",
      allDebates: "All debates",
      method: "Method — how to read Parallax",
      review: "Review queue",
      you: "Your profile — values, badges",
      hintPage: "page",
      hintDebate: "debate",
      placeholder: "Jump to a page or a debate…",
      empty: "Nothing matches.",
    },
    debate: {
      share: "Share ⧉",
      debateLinkCopied: "Debate link copied — send it into the argument",
      claimLinkCopied: "Link to this claim copied",
      claimCopyTitle: "Copy link to this claim",
      smctaText: "Think you understand this view? Prove it — to yourself.",
      smctaEarned: "Steelman ✓ earned",
      smctaButton: "Take the steelman test",
    },
  },
  positionSignal: {
    eyebrow: "Where readers stand",
    beforeTitle: "Before you read — where do you stand?",
    afterTitle: "Now you've read it all — where do you stand?",
    pickFirst: "Pick first. Then we show you where everyone landed — no bandwagon.",
    undecided: "It depends / undecided",
    cast: "Register my position",
    casting: "Registering…",
    revealTitle: "Where readers landed",
    notLeaderboard:
      "A landscape, not a leaderboard — no winner, no ranking. Just where people stand.",
    priorityNote:
      "This is a priority, not a fact. You're marking which position you'd stand with — not whether the evidence is true.",
    youMark: "you",
    pctBand: (lo: number, hi: number) => `~${lo}–${hi}%`,
    withheld: "Too few to show",
    confidenceEmerging: "Emerging — too few signals to read much into yet.",
    confidenceForming: "Forming — a shape is appearing.",
    confidenceSettled: "Settled — a stable spread across many readers.",
    shiftTitle: "What moved",
    shiftLede:
      "Of readers who went through the whole debate, here's how the spread shifted.",
    shiftDelta: (pts: number, letter: string) =>
      `${pts > 0 ? "+" : ""}${pts} pts toward ${letter}`,
    shiftYouMoved: "You softened toward another position after reading.",
    shiftYouHeld: "You held your position after reading.",
    shiftDignity:
      "Softening, holding, and digging in all count equally. Moving isn't winning.",
    shiftEmpty: "Not enough readers have gone in-and-out yet to show the shift.",
    change: "Change my answer",
    privacy:
      "Only the anonymous total is ever stored. Your own pick stays in this browser and is never sold.",
    demoNote:
      "Demo distribution — not live data. Live aggregates appear once the signal has readers.",
    signedOutNote:
      "Sign in to register your position (keeps the count honest, never tied to you).",
  },
  claimEval: {
    stateLabel: {
      established: "Established",
      contested: "Contested",
      values: "A values choice",
    },
    byReview: (date: string) => `reviewed ${date}`,
    setState: "Record the state:",
    savedToast: "Claim evaluation recorded — on the library record",
    failedToast: "Could not record — reviewer role required",
    bridge: {
      status: {
        bridged_established: (n: number) =>
          `Established — bridged across ${n} opposing camp${n === 1 ? "" : "s"}`,
        bridged_contested: (n: number) =>
          `Contested — bridged across ${n} opposing camp${n === 1 ? "" : "s"}`,
        bridged_established_nocount: "Established — bridged across opposing camps",
        bridged_contested_nocount: "Contested — bridged across opposing camps",
        bridged_conflicting:
          "Camps reached different cross-camp conclusions — unresolved",
        pending_single_camp: "Pending — only one camp has endorsed this so far",
        insufficient: "No cross-camp verdict yet",
      },
      explainer:
        "Confirmed only when reviewers from opposing positions agree — not by majority, not by one reviewer. A single camp, at any size, cannot confirm.",
      scopeNote:
        "This measures cross-camp agreement on the claim's state only — not a full reliability verdict (the integrity-vs-relevance split and rotating juries are not yet in effect).",
      demo: "demo",
      endorse: "Endorse this state:",
      endorsed: (state: string) => `You endorsed: ${state}`,
      endorseSaved: "Endorsement recorded — counts only across distinct camps",
      endorseFailed:
        "Could not record your endorsement — reviewer role required",
      yourCamp: (camp: string) => `Your stance: ${camp}`,
      yourCampHint:
        "Only you see your stance. It is never shown publicly or to other reviewers.",
      camp: {
        prompt: "Before you endorse, declare your stance on this debate.",
        why: "Your stance is recorded once for this debate and is never shown publicly. It lets agreement be measured across camps — so one camp can't confirm alone.",
        pick: (letter: string, title: string) => `Position ${letter} — ${title}`,
        undecided: "Undecided / it depends",
        confirm: "Set my stance",
        saved: "Stance recorded for this debate",
        failed: "Could not record your stance — reviewer role required",
        lockHint:
          "Recorded once for this debate. Changing it later re-counts your endorsements under the new camp.",
      },
    },
  },
  sourceFloor: {
    legendEyebrow: "Source integrity",
    verdicts: {
      meets_floor: "clears the floor for this use",
      attribution_required: "attribute it for this use",
      context_required: "needs context for this use",
      below_floor: "below the floor for this use",
    } as Record<string, string>,
    verdictHint: {
      meets_floor:
        "No floor rule fired for this source on this claim. Not an endorsement, not “reliable”, not “true”.",
      attribution_required:
        "Usable only as an attributed viewpoint here, not as a standalone factual authority.",
      context_required:
        "A material attribute (sponsored / AI / undisclosed conflict / high-bar domain) must be disclosed before relying on it here.",
      below_floor:
        "A rule found this structurally inadequate for THIS use. Demoted and labelled — kept on record, never deleted. Not “false”, not “bad in the abstract”.",
    } as Record<string, string>,
    rules: {
      ugc_controversial_factual:
        "Unverified user content isn’t a valid source for a contested factual claim.",
      no_editorial_accountability:
        "No identifiable editorial accountability and no correction policy — negative presumption.",
      opinion_attribution:
        "Opinion or analysis — usable as an attributed viewpoint, not as a factual authority.",
      conflict_context:
        "A conflict, funding, sponsorship or AI generation must be disclosed before relying on this here.",
      high_bar_domain:
        "Health, law, finance or living-persons claims need a higher source bar than this clears.",
      documented_fabrication:
        "Documented fabrication on record (external proof) — visibility restricted, kept on record.",
      no_floor_rule: "No floor rule fired for this source on this claim.",
    } as Record<string, string>,
    attrValues: {
      content_genre: {
        primary: "primary / data",
        reporting: "reporting",
        analysis: "analysis",
        opinion: "opinion",
        sponsored: "sponsored",
        ugc: "user-generated",
        ai_generated: "AI-generated",
        unknown: "unknown",
      },
      editorial_accountability: {
        named_masthead: "named masthead",
        named_author: "named author",
        org_only: "organisation only",
        anonymous: "anonymous",
        none: "none",
        unknown: "unknown",
      },
      correction_policy: {
        documented: "documented",
        informal: "informal",
        none: "none",
        unknown: "unknown",
      },
      independence: {
        independent: "independent",
        funded_disclosed: "funded (disclosed)",
        funded_undisclosed: "funded (undisclosed)",
        self_interested: "self-interested",
        unknown: "unknown",
      },
      fabrication_record: {
        none_known: "none known",
        corrected_history: "corrections on record",
        retraction_history: "retractions on record",
        documented_fabrication: "documented fabrication",
      },
      expertise_basis: {
        peer_reviewed: "peer-reviewed",
        domain_expert: "domain expert",
        journalistic: "journalistic",
        lay: "lay",
        none: "none",
        unknown: "unknown",
      },
      identity_basis: {
        verified: "verified",
        pseudonymous: "pseudonymous",
        unverified: "unverified",
        unknown: "unknown",
      },
      sensitive_domain: {
        none: "—",
        health: "health",
        law: "law",
        finance: "finance",
        living_persons: "living persons",
      },
    } as Record<string, Record<string, string>>,
    drivenBy: (drivers: string) => `driven by ${drivers}`,
    demo: "demo",
    vsRelevance:
      "Two separate questions. The evidence label asks: does this source support THIS claim? Integrity asks: is this a credible source at all, by fixed rules? We never merge them.",
    notTruth:
      "This is a rules check on integrity, not a verdict on truth. v1 guarantees identical mechanical rules for every source — the controversy and high-bar-domain scope come from cross-camp signals, not one reviewer’s say-so. A source is never “reliable” in the abstract; the floor is always scoped to a use.",
    libraryReuse:
      "An assessment travels with the source, not the debate — assess a source once, and the floor re-scopes itself wherever that source is cited.",
    assess: {
      title: "Assess this source (integrity floor)",
      hint: "Declare the source’s mechanical attributes and any external proof. The verdict is computed by the rules, per claim — you don’t set it.",
      proofLabel:
        "External proof (for fabrication / no-accountability below-floor)",
      save: "Record attributes",
      saved:
        "Source assessed — the rules compute the verdict per claim, on the library record",
      failed: "Could not record — reviewer role required",
      verdictReadonly: "Verdict (computed by the rules):",
    },
  },
};

export type Messages = typeof en;
