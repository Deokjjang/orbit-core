import { z } from "zod";
/**
 * Item 5 — Anti-Hallucination Filter
 * Response Schema v0.1 (FREEZE)
 *
 * Hard rules:
 * - No numeric scores/probabilities/percentiles
 * - No gate/policy/approval semantics
 * - No truth-claim
 */
export const TierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const Item5VerdictSchema = z.enum(["USE", "HOLD", "REJECT"]);
export const Item5ReasonSchema = z.object({
    signal: z.enum([
        "citation_missing",
        "citation_mismatch",
        "internal_inconsistency",
        "external_conflict",
        "overclaim",
        "coverage_gap",
        "u_high",
    ]),
    severity: TierSchema,
});
export const Item5NeedSchema = z.object({
    type: z.enum(["EVIDENCE", "CLARIFICATION", "REDUCTION"]),
    text: z.string().min(1),
});
export const Item5SignalsSchema = z.object({
    hasCitations: z.enum(["YES", "NO"]),
    consistency: z.enum(["OK", "WARN", "FAIL"]),
    conflict: z.enum(["NONE", "POSSIBLE", "CLEAR"]),
    coverage: z.enum(["GOOD", "PARTIAL", "POOR"]),
    uTier: TierSchema,
});
export const Item5ResponseSchema = z.object({
    itemId: z.literal("item5"),
    requestId: z.string(),
    verdict: Item5VerdictSchema,
    reasons: z.array(Item5ReasonSchema),
    needs: z.array(Item5NeedSchema),
    signals: Item5SignalsSchema,
    meta: z.object({
        noTruthClaim: z.literal(true),
        noGate: z.literal(true),
        version: z.literal("v0.1"),
    }),
});
