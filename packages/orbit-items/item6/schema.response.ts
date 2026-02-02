import { z } from "zod";

/**
 * Item 6 — Multi-Model Consensus Router
 * Response Schema v0.1 (FREEZE)
 *
 * Hard rules:
 * - No numeric scores/probabilities/percentiles
 * - No majority vote / no truth-claim
 * - No gate/policy/approval semantics
 */

export const TierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const Item6ConsensusSchema = z.enum(["AGREE", "PARTIAL", "DISAGREE"]);

export const Item6OverlapSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const Item6VarianceSignalSchema = z.object({
  name: z.enum([
    "contradiction",
    "missing_key_answer",
    "overclaim_divergence",
    "citation_divergence",
    "u_high",
    "item5_reject_present",
    "item5_hold_heavy",
  ]),
  severity: TierSchema,
});

export const Item6ClusterSchema = z.object({
  id: z.string(),
  summary: z.string().min(1),
  candidateIds: z.array(z.string()).min(1),
  // signal-only: what drove this clustering
  signals: z.array(
    z.object({
      name: z.string(),
      severity: TierSchema,
    })
  ),
});

export const Item6ResponseSchema = z.object({
  itemId: z.literal("item6"),
  requestId: z.string(),
  consensus: Item6ConsensusSchema,
  overlap: Item6OverlapSchema,
  varianceSignals: z.array(Item6VarianceSignalSchema),
  clusters: z.array(Item6ClusterSchema).min(1).max(5),
  meta: z.object({
    noMajorityVote: z.literal(true),
    noTruthClaim: z.literal(true),
    noGate: z.literal(true),
    version: z.literal("v0.1"),
  }),
});

export type Item6Response = z.infer<typeof Item6ResponseSchema>;
