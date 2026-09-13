import { z } from "zod";

const nonEmptyString = z.string().refine((value) => value.trim().length > 0, {
  message: "Expected a non-blank string.",
});
const id = nonEmptyString;
const isoDateTime = z.string().datetime({ offset: true });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const reviewStatus = z.enum([
  "unreviewed",
  "approved",
  "contested",
  "rejected",
]);
const generatedBy = z.enum(["human", "ai", "mixed"]);
const claimType = z.enum([
  "factual",
  "causal",
  "predictive",
  "normative",
  "definitional",
]);

const topicSchema = z.strictObject({
  id,
  title: nonEmptyString,
  question: nonEmptyString,
  summary: nonEmptyString,
  status: z.enum(["draft", "published", "archived"]),
  current_revision_id: id,
  created_at: isoDateTime,
  created_by: id,
});

const revisionSchema = z.strictObject({
  id,
  topic_id: id,
  revision_number: z.number().int().positive(),
  status: z.enum(["draft", "published", "superseded"]),
  published_at: isoDateTime,
  published_by: id,
});

const positionSchema = z.strictObject({
  id,
  topic_id: id,
  title: nonEmptyString,
  short_summary: nonEmptyString,
  steelman: nonEmptyString,
  status: z.enum(["draft", "published", "contested", "archived"]),
  argument_ids: z.array(id),
  value_ids: z.array(id),
  tradeoff_ids: z.array(id),
  generated_by: generatedBy,
  review_status: reviewStatus,
});

const argumentSchema = z.strictObject({
  id,
  position_id: id,
  direction: z.enum(["supports", "opposes", "qualifies"]),
  summary: nonEmptyString,
  claim_ids: z.array(id).min(1),
  generated_by: generatedBy,
  review_status: reviewStatus,
});

const claimSchema = z
  .strictObject({
    id,
    text: nonEmptyString,
    claim_type: z.array(claimType).min(1),
    topic_id: id,
    evidence_link_ids: z.array(id),
    generated_by: generatedBy,
    review_status: reviewStatus,
  })
  .superRefine((claim, context) => {
    if (
      claim.claim_type.some((type) => type !== "normative") &&
      claim.evidence_link_ids.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["evidence_link_ids"],
        message: "Non-normative claims require at least one evidence link.",
      });
    }
  });

const sourceSchema = z.strictObject({
  id,
  url: z
    .url()
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "Sources require an absolute http(s) URL.",
    }),
  title: nonEmptyString,
  publisher: nonEmptyString,
  source_type: z.enum([
    "article",
    "paper",
    "report",
    "law",
    "dataset",
    "video",
    "other",
  ]),
  retrieval_status: z.enum([
    "found",
    "missing",
    "blocked",
    "failed",
    "partial",
  ]),
  retrieved_at: isoDate,
  quality_notes: z.string(),
  content_hash: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/i)
    .nullable()
    .optional(),
});

const sourceExcerptSchema = z.strictObject({
  id,
  source_id: id,
  text: nonEmptyString,
  locator: nonEmptyString,
  extracted_by: z.enum(["human", "ai", "system"]),
  created_at: isoDateTime.optional(),
});

const evidenceLinkSchema = z.strictObject({
  id,
  claim_id: id,
  source_id: id,
  label: z.enum([
    "supports_claim",
    "partially_supports_claim",
    "contradicts_claim",
    "does_not_support_claim",
    "unclear",
  ]),
  rationale: nonEmptyString,
  confidence: z.number().min(0).max(1),
  review_status: reviewStatus,
  source_excerpt_id: id.nullable().optional(),
});

const valueSchema = z.strictObject({
  id,
  topic_id: id,
  name: nonEmptyString,
  description: nonEmptyString,
  position_ids: z.array(id).min(1),
  tension_with: z.array(nonEmptyString),
});

const tradeoffSchema = z.strictObject({
  id,
  topic_id: id,
  position_id: id,
  gain: nonEmptyString,
  cost: nonEmptyString,
  risk: nonEmptyString,
  review_status: reviewStatus,
});

const auditEventSchema = z.strictObject({
  id,
  topic_id: id,
  revision_id: id,
  actor_type: z.enum(["user", "admin", "ai", "system"]),
  actor_id: id,
  event_type: nonEmptyString,
  summary: nonEmptyString,
  created_at: isoDateTime,
});

const fixtureShapeSchema = z.strictObject({
  topic: topicSchema,
  revision: revisionSchema,
  positions: z.array(positionSchema).min(1),
  arguments: z.array(argumentSchema).min(1),
  claims: z.array(claimSchema).min(1),
  sources: z.array(sourceSchema).min(1),
  source_excerpts: z.array(sourceExcerptSchema).optional(),
  evidence_links: z.array(evidenceLinkSchema).min(1),
  values: z.array(valueSchema),
  tradeoffs: z.array(tradeoffSchema),
  audit_events: z.array(auditEventSchema).min(1),
});

type Identified = { id: string };

function idsFor(
  values: Identified[],
  collection: string,
  context: z.RefinementCtx,
): Set<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      context.addIssue({
        code: "custom",
        path: [collection, index, "id"],
        message: `Duplicate ${collection} id: ${value.id}.`,
      });
    }
    ids.add(value.id);
  });
  return ids;
}

function requireReference(
  ids: Set<string>,
  value: string,
  path: (string | number)[],
  label: string,
  context: z.RefinementCtx,
): void {
  if (!ids.has(value)) {
    context.addIssue({
      code: "custom",
      path,
      message: `Unknown ${label} reference: ${value}.`,
    });
  }
}

/** Runtime fixture contract used by tests and suitable for validating JSON data. */
export const debateFixtureSchema = fixtureShapeSchema.superRefine(
  (fixture, context) => {
    const positionIds = idsFor(fixture.positions, "positions", context);
    const argumentIds = idsFor(fixture.arguments, "arguments", context);
    const claimIds = idsFor(fixture.claims, "claims", context);
    const sourceIds = idsFor(fixture.sources, "sources", context);
    const excerptIds = idsFor(
      fixture.source_excerpts ?? [],
      "source_excerpts",
      context,
    );
    const evidenceIds = idsFor(
      fixture.evidence_links,
      "evidence_links",
      context,
    );
    const valueIds = idsFor(fixture.values, "values", context);
    const tradeoffIds = idsFor(fixture.tradeoffs, "tradeoffs", context);
    idsFor(fixture.audit_events, "audit_events", context);

    if (fixture.topic.current_revision_id !== fixture.revision.id) {
      context.addIssue({
        code: "custom",
        path: ["topic", "current_revision_id"],
        message: "Topic must point to the fixture revision.",
      });
    }
    if (fixture.revision.topic_id !== fixture.topic.id) {
      context.addIssue({
        code: "custom",
        path: ["revision", "topic_id"],
        message: "Revision must belong to the fixture topic.",
      });
    }

    fixture.positions.forEach((position, positionIndex) => {
      if (position.topic_id !== fixture.topic.id) {
        context.addIssue({
          code: "custom",
          path: ["positions", positionIndex, "topic_id"],
          message: "Position must belong to the fixture topic.",
        });
      }
      position.argument_ids.forEach((argumentId, referenceIndex) => {
        requireReference(
          argumentIds,
          argumentId,
          ["positions", positionIndex, "argument_ids", referenceIndex],
          "argument",
          context,
        );
        const argument = fixture.arguments.find((item) => item.id === argumentId);
        if (argument && argument.position_id !== position.id) {
          context.addIssue({
            code: "custom",
            path: ["positions", positionIndex, "argument_ids", referenceIndex],
            message: `Argument ${argumentId} belongs to another position.`,
          });
        }
      });
      position.value_ids.forEach((valueId, referenceIndex) =>
        requireReference(
          valueIds,
          valueId,
          ["positions", positionIndex, "value_ids", referenceIndex],
          "value",
          context,
        ),
      );
      position.tradeoff_ids.forEach((tradeoffId, referenceIndex) =>
        requireReference(
          tradeoffIds,
          tradeoffId,
          ["positions", positionIndex, "tradeoff_ids", referenceIndex],
          "tradeoff",
          context,
        ),
      );
    });

    fixture.arguments.forEach((argument, argumentIndex) => {
      requireReference(
        positionIds,
        argument.position_id,
        ["arguments", argumentIndex, "position_id"],
        "position",
        context,
      );
      const position = fixture.positions.find(
        (item) => item.id === argument.position_id,
      );
      if (position && !position.argument_ids.includes(argument.id)) {
        context.addIssue({
          code: "custom",
          path: ["arguments", argumentIndex, "position_id"],
          message: `Position ${position.id} does not reference argument ${argument.id}.`,
        });
      }
      argument.claim_ids.forEach((claimId, referenceIndex) =>
        requireReference(
          claimIds,
          claimId,
          ["arguments", argumentIndex, "claim_ids", referenceIndex],
          "claim",
          context,
        ),
      );
    });

    fixture.claims.forEach((claim, claimIndex) => {
      if (claim.topic_id !== fixture.topic.id) {
        context.addIssue({
          code: "custom",
          path: ["claims", claimIndex, "topic_id"],
          message: "Claim must belong to the fixture topic.",
        });
      }
      claim.evidence_link_ids.forEach((evidenceId, referenceIndex) => {
        requireReference(
          evidenceIds,
          evidenceId,
          ["claims", claimIndex, "evidence_link_ids", referenceIndex],
          "evidence link",
          context,
        );
        const link = fixture.evidence_links.find((item) => item.id === evidenceId);
        if (link && link.claim_id !== claim.id) {
          context.addIssue({
            code: "custom",
            path: ["claims", claimIndex, "evidence_link_ids", referenceIndex],
            message: `Evidence link ${evidenceId} belongs to another claim.`,
          });
        }
      });
    });

    fixture.evidence_links.forEach((link, linkIndex) => {
      requireReference(
        claimIds,
        link.claim_id,
        ["evidence_links", linkIndex, "claim_id"],
        "claim",
        context,
      );
      requireReference(
        sourceIds,
        link.source_id,
        ["evidence_links", linkIndex, "source_id"],
        "source",
        context,
      );
      if (link.source_excerpt_id) {
        requireReference(
          excerptIds,
          link.source_excerpt_id,
          ["evidence_links", linkIndex, "source_excerpt_id"],
          "source excerpt",
          context,
        );
        const excerpt = fixture.source_excerpts?.find(
          (item) => item.id === link.source_excerpt_id,
        );
        if (excerpt && excerpt.source_id !== link.source_id) {
          context.addIssue({
            code: "custom",
            path: ["evidence_links", linkIndex, "source_excerpt_id"],
            message: `Source excerpt ${excerpt.id} belongs to another source.`,
          });
        }
      }
      const claim = fixture.claims.find((item) => item.id === link.claim_id);
      if (claim && !claim.evidence_link_ids.includes(link.id)) {
        context.addIssue({
          code: "custom",
          path: ["evidence_links", linkIndex, "claim_id"],
          message: `Claim ${claim.id} does not reference evidence link ${link.id}.`,
        });
      }
    });

    fixture.source_excerpts?.forEach((excerpt, excerptIndex) => {
      requireReference(
        sourceIds,
        excerpt.source_id,
        ["source_excerpts", excerptIndex, "source_id"],
        "source",
        context,
      );
    });

    fixture.values.forEach((value, valueIndex) => {
      if (value.topic_id !== fixture.topic.id) {
        context.addIssue({
          code: "custom",
          path: ["values", valueIndex, "topic_id"],
          message: "Value must belong to the fixture topic.",
        });
      }
      value.position_ids.forEach((positionId, referenceIndex) => {
        requireReference(
          positionIds,
          positionId,
          ["values", valueIndex, "position_ids", referenceIndex],
          "position",
          context,
        );
        const position = fixture.positions.find((item) => item.id === positionId);
        if (position && !position.value_ids.includes(value.id)) {
          context.addIssue({
            code: "custom",
            path: ["values", valueIndex, "position_ids", referenceIndex],
            message: `Position ${position.id} does not reference value ${value.id}.`,
          });
        }
      });
    });

    fixture.tradeoffs.forEach((tradeoff, tradeoffIndex) => {
      if (tradeoff.topic_id !== fixture.topic.id) {
        context.addIssue({
          code: "custom",
          path: ["tradeoffs", tradeoffIndex, "topic_id"],
          message: "Tradeoff must belong to the fixture topic.",
        });
      }
      requireReference(
        positionIds,
        tradeoff.position_id,
        ["tradeoffs", tradeoffIndex, "position_id"],
        "position",
        context,
      );
      const position = fixture.positions.find(
        (item) => item.id === tradeoff.position_id,
      );
      if (position && !position.tradeoff_ids.includes(tradeoff.id)) {
        context.addIssue({
          code: "custom",
          path: ["tradeoffs", tradeoffIndex, "position_id"],
          message: `Position ${position.id} does not reference tradeoff ${tradeoff.id}.`,
        });
      }
    });

    fixture.audit_events.forEach((event, eventIndex) => {
      if (event.topic_id !== fixture.topic.id) {
        context.addIssue({
          code: "custom",
          path: ["audit_events", eventIndex, "topic_id"],
          message: "Audit event must belong to the fixture topic.",
        });
      }
      if (event.revision_id !== fixture.revision.id) {
        context.addIssue({
          code: "custom",
          path: ["audit_events", eventIndex, "revision_id"],
          message: "Audit event must point to the fixture revision.",
        });
      }
    });
  },
);

export type RuntimeDebateFixture = z.infer<typeof debateFixtureSchema>;
