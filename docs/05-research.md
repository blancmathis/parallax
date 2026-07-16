# Research Brief

This brief is for external research (Deep Research or equivalent) before the
architecture beyond Milestone 1 is finalized.

## Research Goal

Determine whether Parallax should reuse existing argument-mapping concepts,
avoid known product traps, and adjust the MVP before coding.

The research should produce decisions, not a long essay.

## Core Questions

### 1. Existing Products

Research products and projects related to:

- structured debate
- argument mapping
- collective deliberation
- civic debate platforms
- source-backed claim verification
- AI-assisted discussion summarization

Candidate names to investigate:

- Kialo
- Pol.is
- DebateGraph
- Argdown
- Truthmapping
- Wikidebate / wiki-style debate systems
- claim-review or fact-checking schemas

Output required:

- What each product does well.
- Where it seems to fail or remain niche.
- What incentives it uses.
- Whether it structures debates by claims, arguments, votes, positions, or
  clusters.
- What Parallax should copy, avoid, or deliberately do differently.

### 2. Argument Model

Find whether Parallax should model debates as:

- tree of arguments
- graph of claims and evidence
- positions with supporting/opposing claims
- issue-based information system
- pro/con table
- value/trade-off map

Output required:

- Recommended model for the MVP.
- Main trade-off of that model.
- Whether existing formats or schemas should be reused.

### 3. Source Verification

Research practical source-verification workflows for AI systems.

Focus on:

- citation-grounded generation
- claim-source alignment
- source retrieval
- quote/span extraction
- evidence labels
- hallucination prevention
- audit trails

Output required:

- Minimum reliable verification pipeline.
- Labels to use and labels to avoid.
- Failure modes to expose to users.

### 4. Moderation and Incentives

Research how deliberation platforms prevent:

- bad-faith participation
- brigading
- source spam
- endless edit wars
- biased summaries
- moderator capture
- false neutrality

Output required:

- MVP-safe moderation model.
- Later-stage governance model.
- Incentives to avoid in v1.

### 5. Agent Consensus

Research whether random AI-agent consensus can be made trustworthy.

Questions:

- How do we identify independent agents?
- What prevents Sybil attacks?
- Is unanimous model agreement meaningful?
- How do agents handle primary-source verification?
- What attacks are specific to LLM agents?
- Could the system use agents only as reviewers, not authorities?

Output required:

- Threat model.
- Recommendation: do not build, prototype privately, or include in MVP.
- Minimum safeguards if prototyped.

## Deep Research Prompt

Use this prompt for a deep research session:

```text
I am designing Parallax, an open-source, public-interest structured debate platform.
The goal is to help users understand debates by organizing topics into positions,
arguments, atomic claims, source-backed evidence labels, underlying values,
trade-offs, and an audit trail. The MVP should avoid becoming a chaotic social
network.

Research existing structured debate, argument mapping, collective deliberation,
fact-checking, and AI-assisted discussion tools. Compare Kialo, Pol.is,
DebateGraph, Argdown, Truthmapping, wiki-style debate systems, and any other
relevant projects.

I need actionable product and architecture recommendations for a first MVP:

1. What models of structured debate have worked or failed?
2. Should the MVP use positions, claims, arguments, evidence links, values, or a
   graph model as the primary structure?
3. What source-verification workflow is credible for an AI-assisted product?
4. What moderation and incentive choices should be avoided in v1?
5. Is random AI-agent consensus a viable verification mechanism? Include a
   threat model.
6. What should Parallax copy, avoid, and do differently?

Return:
- concise competitor map
- product traps
- recommended MVP shape
- data model implications
- AI pipeline implications
- moderation implications
- open risks
- citations / links for key claims
```

## Technical Research Prompt

Use this prompt for a technical session:

```text
Design a technical architecture for an MVP of an AI-assisted structured debate
platform. The product has topics, positions, arguments, atomic claims, sources,
evidence links, values, trade-offs, contributions, reviews, revisions, and audit
events.

The AI pipeline must process a seed packet, retrieve sources, extract claims,
classify claim-source alignment, cluster positions, generate steelmans, map
values/trade-offs, and run a critic pass. Outputs must be validated and auditable.

Recommend:
- data model
- JSON schemas
- AI pipeline stages
- source retrieval strategy
- evidence span storage
- review workflow
- audit log design
- failure handling
- MVP stack

Avoid over-engineering. The first prototype should render one excellent debate
page before becoming a social platform.
```

## Expected Research Artifact

After research, create:

- `docs/06-research-notes.md`: sourced findings.
- Updates to `docs/02-product.md` if a decision changes.
- Updates to `docs/03-data-model.md` if the model changes.
- Updates to `docs/04-roadmap.md` if build order changes.
