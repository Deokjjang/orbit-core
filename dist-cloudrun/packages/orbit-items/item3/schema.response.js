import { z } from "zod";
/**
 * Item 3 — Uncertainty Mapper
 * Response Schema v0.1 (FREEZE)
 *
 * Hard rules:
 * - No numeric scores/probabilities/percentiles
 * - No gate/decision fields
 */
export const TierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const PrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const QuestionTargetSchema = z.enum(["user", "system", "evidence"]);
export const UncertaintySourceSchema = z.object({
    type: z.enum(["MISSING", "CONFLICT", "AMBIGUOUS", "ASSUMPTION", "STALE"]),
    where: z.enum(["axis", "constraint", "evidence", "scenario"]),
    ref: z.string().optional(),
    signal: z.string(),
});
export const UncertaintyDensitySchema = z.object({
    byAxis: z.object({
        u: TierSchema,
        r: TierSchema,
        i: TierSchema,
        v: TierSchema,
    }),
    byScenario: z.array(z.object({
        scenarioId: z.string(),
        tier: TierSchema,
    })),
});
export const UncertaintySchema = z.object({
    overallTier: TierSchema,
    density: UncertaintyDensitySchema,
    sources: z.array(UncertaintySourceSchema),
});
export const QuestionSchema = z.object({
    id: z.string(),
    priority: PrioritySchema,
    target: QuestionTargetSchema,
    text: z.string().min(1),
});
export const SignalSchema = z.object({
    name: z.enum([
        "u_spike",
        "evidence_gap",
        "constraint_conflict",
        "assumption_heavy",
        "stale_evidence",
        "axis_missing_optional",
        "scenario_underdefined",
    ]),
    severity: TierSchema,
});
export const Item3ResponseSchema = z.object({
    itemId: z.literal("item3"),
    requestId: z.string(),
    uncertainty: UncertaintySchema,
    questions: z.array(QuestionSchema).max(6),
    signals: z.array(SignalSchema),
    meta: z.object({
        noDecision: z.literal(true),
        noGate: z.literal(true),
        version: z.literal("v0.1"),
    }),
});
