# Product vision

> **Target direction, not a statement of current implementation or legal
> status.** The [README](../README.md) and [roadmap](04-roadmap.md) describe
> what exists today. Parallax is currently an independently maintained open-source
> project; no nonprofit or association status is claimed.

## What Parallax Is

An open-source, public-interest platform where difficult topics can be debated in a
structured, inspectable way. Unlike traditional social media — where debates
become chaotic, hostile, and repetitive — Parallax uses AI to organize
arguments, check sources against claims, and reveal the real reasons people
disagree.

**Core belief:** once the facts are laid out, what remains between people is
rarely bad faith. It is **different values**, different **bets on the
future**, and unequal **trust in institutions**. Seeing that someone
prioritizes, predicts, or trusts differently makes them harder to see as an
enemy. The order facts → understanding → values is logical, not
psychological: people weigh the facts of a side they already find reasonable,
so a debate page starts with the people.

## The Problem

Online debate is broken in predictable ways:

- **Chaos** — arguments are scattered, repeated, and hard to follow.
- **Hostility** — people attack each other instead of engaging with ideas.
- **Manipulation** — misinformation spreads faster than corrections.
- **Caricature** — people argue against weak versions of opposing views.
- **Hidden disagreement** — we fight about "facts" when we actually disagree
  about values.

The result: people get angrier, more divided, and less informed.

## The Solution

A debate page where:

1. Anyone can create a **topic** (a debate question).
2. AI organizes all contributions into a **structured map**: positions,
   arguments, atomic claims.
3. Every claim is linked to **sources**, and each link is labeled (supports,
   partially supports, contradicts, does not support, unclear).
4. Every position is presented at its **strongest** (steel-manning).
5. The **values** behind each position are made explicit, so readers
   understand *why* people disagree.
6. Every position's **trade-offs** are spelled out — what you gain and what
   you give up.

```
TOPIC: Should cities implement congestion pricing?
│
├── POSITION A: Yes, invest revenue in transit
│   ├── Steelman · Arguments · Claims
│   ├── Evidence (source-labeled)
│   └── Values · Trade-offs
│
├── POSITION B: No, it is unfair
│   └── … same structure, same fairness
│
├── POSITION C: Yes, but with equity protections
│   └── …
│
└── VALUE ANALYSIS
    Efficient mobility vs. fairness vs. environmental
    protection vs. institutional trust
```

## Principles

### Objectivity through structure
We don't tell people what to think. We organize information so they can think
clearly.

### All positions treated equally
Every serious position gets its strongest version, verified sources, visible
counter-arguments, and its underlying values revealed.

### Values, not enemies
When a debate is reduced to its underlying values, opponents stop looking evil
and start looking like people with different priorities.

### Transparency
All AI prompts public. All algorithms open source. All moderation decisions
logged. Anyone can audit how the system works.

### Understanding over winning
No rewards for "destroying" opponents. The platform rewards genuine
engagement and fairly representing views you disagree with.

## What Makes Parallax Different

| Traditional social media | Parallax |
| --- | --- |
| Arguments scattered in comments | Arguments organized by position |
| Sources rarely checked | Claim–source alignment labeled |
| Opponents caricatured | Opponents steel-manned |
| Value disagreements hidden | Values explicitly surfaced |
| Rewards outrage | Rewards understanding |
| Often opaque and engagement-driven | Open source, auditable, public-interest |

## Why open source and public-interest governance

People must be able to **trust** that the platform is not manipulating them:

- **Open source** — anyone can see exactly how the AI works.
- **Public-interest incentives** — the project should not reward outrage or
  allow funders to control editorial outcomes.
- **Transparent governance target** — future governance decisions and conflicts
  should be documented publicly. No particular legal structure is claimed yet.

We show our work. If you don't trust us, verify.

## Future Exploration: Agent-Based Verification

A longer-term idea: open the platform to AI agents that **propose** content
and **verify** contributions through random-sample consensus (e.g. 30 randomly
drawn agents confirm or refute a proposition; unanimity validates, otherwise a
wider vote is triggered). The compute agents spend in exchange for access
could power the platform for free.

This is deliberately **not** in the MVP: it needs a serious abuse model first
(Sybil attacks, prompt injection, correlated model errors). See the threat
questions in [02-product.md](02-product.md) (Decision 10) and the research
brief in [05-research.md](05-research.md). Until then, the live validation
mechanism is bridging consensus, not agent voting (see
[07-engine.md](07-engine.md) section 2).

## Summary

- **What:** structured, inspectable debate on any topic.
- **How:** AI organizes arguments, labels claim–source alignment, and surfaces
  values — humans review everything.
- **Why:** to turn hostile debate into genuine understanding.
- **Trust target:** open source, inspectable, and increasingly auditable.
