# Pre-registration: does a Parallax debate page change how readers see the other side?

**Version 1 — written 2026-10-03, before any data was collected.**
Amendments are added at the bottom with their date and reason; nothing above
this line changes after the first participant is randomized. The protocol is
also filed on OSF Registries before data collection (link to be added here).

## Question

Does reading one Parallax debate page reduce readers' errors about what people
on the other side of the question actually believe, without reducing their
factual accuracy?

## Design

- **Randomization at arrival**, individual level, 1:1, two arms.
  - **Arm A — answer first:** the reader answers the measures, then reads the page.
  - **Arm B — read first:** the reader reads the page, then answers the same measures.
- Nobody answers twice. Everybody reads the content. The effect is the
  difference between arms on the post-arrival answers.
- One debate in the confirmatory run: the pilot debate, in its reviewed
  version (steelmen signed, excerpts verified). The page version is frozen by
  its Git commit hash, recorded here before launch.
- **Primary sample:** a paid online panel of adults living in France. Both arms
  must finish before payment, which keeps attrition low and symmetric.
- **Secondary sample:** the same randomization embedded on the public site.
  It is analysed with the same script and reported as exploratory.

## Measures

Before randomization, every participant states their own position on the
question and their agreement (yes / no) with six statements written for the
debate. The page shows at most three of them with their observed values
("revealed items"). The other three never appear on the page ("held-out
items").

| Role | Measure |
| --- | --- |
| **Primary (behavioral)** | Prediction error on held-out items: mean absolute gap, in percentage points, between the participant's estimate of the share of the other side who agree with a statement and the observed share among Arm A participants of that side. |
| Secondary | "People who hold the other position are reasonable": 1 (strongly disagree) to 7 (strongly agree). |
| Guard | Three factual multiple-choice questions on the debate, scored 0–3. |
| Manipulation check | Prediction error on revealed items. |
| Exploratory | "What surprised you?" (optional free text, not stored in the research dataset); two-week follow-up for volunteers. |

"The other side" is defined by the participant's own stated position. A
participant who chooses a middle position estimates both outer positions;
their error is averaged.

## Hypotheses

- **H1 (primary):** Arm B has a lower held-out prediction error than Arm A.
- **H2 (secondary):** Arm B rates the other side as more reasonable than Arm A.
- **H3 (guard):** Arm B's factual accuracy is not lower than Arm A's.

## Sample size

400 completed participants per arm (800 total). For a two-sided test at
α = 0.05 and power 0.80, this detects a standardized difference of 0.20,
about 0.3 point on the 1–7 scale. With 175 per arm, only 0.30 SD would be
detectable. The size is fixed in advance; there is no interim look and no
optional stopping. The standard deviation of the primary measure is unknown
until data exist; the sample size does not change when it becomes known.

## Analysis

- Intention to treat: every randomized participant who completes the measures.
- The only exclusion is one attention check placed **before** randomization.
- Estimate: OLS of each outcome on arm, with the participant's own position as
  a covariate, heteroskedasticity-robust standard errors, 95% confidence
  intervals. The H1 effect is also reported as a relative reduction of Arm A's
  mean error.
- The analysis script is committed to this repository before data collection
  and runs unchanged on the final dataset.

## Decision rules

- **The loop works** if H1 shows a reduction of at least 20% with a 95% CI
  that excludes zero, or H2 shows at least +0.3 point with a CI that excludes
  zero, **and** H3 does not show a significant loss of accuracy.
- **The loop fails** if the upper bound of the 95% CI is below a 10% error
  reduction for H1 **and** below +0.2 point for H2. Then the reading loop is
  redesigned before a ninth debate is written.
- **The page misleads** if reasonableness rises while factual accuracy falls
  (CI below zero). Then the balance of the page is reviewed before any other
  work.
- **The result does not count** as confirmatory if completion rates of the two
  arms differ by more than 10 percentage points. Both rates are published.

## Data and privacy

No account, no IP address stored, no persistent identifier, no cookie. Panel
identifiers stay with the panel provider. One anonymous record per completed
reading, with the date only. Stated positions are opinions: no record can be
linked to a person, and the on-site variant shows a clear notice before the
first question. A legal review of this collection is required before launch.

## Publication

Results are published whatever they are, null results included, with the
anonymous dataset and the script. No per-debate delta is displayed on the site
and debates are never ranked by their effect.

## Amendments

None.
