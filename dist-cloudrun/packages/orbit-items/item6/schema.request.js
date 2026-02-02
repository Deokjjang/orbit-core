import { z } from "zod";
/**
 * Item 6 — Multi-Model Consensus Router
 * Request Schema v0.1 (FREEZE)
 *
 * Notes:
 * - candidates are treated as opaque by default
 * - optional extracted claims can be provided by upstream adapters
 * - Item5 outputs are optional per-candidate signals (no truth-claim)
 */
export const TierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const EvidenceLinkSchema = z.object({
    docHash: z.string(),
    sectionId: z.string(),
    span: z.object({
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
    }),
});
export const Item3ThinSchema = z
    .object({
    overallTier: TierSchema,
    signals: z
        .array(z.object({
        name: z.string(),
        severity: TierSchema,
    }))
        .optional(),
    questions: z
        .array(z.object({
        id: z.string(),
        text: z.string(),
        priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    }))
        .optional(),
})
    .optional();
export const Item5ThinSchema = z
    .object({
    verdict: z.enum(["USE", "HOLD", "REJECT"]),
    reasons: z
        .array(z.object({
        signal: z.string(),
        severity: TierSchema,
    }))
        .optional(),
})
    .optional();
export const CandidateSchema = z.object({
    id: z.string(),
    text: z.string().min(1),
    claims: z
        .array(z.object({
        id: z.string(),
        text: z.string().min(1),
        evidenceRef: z.string().optional(),
    }))
        .optional(),
    meta: z
        .object({
        model: z.string().optional(),
        createdAt: z.string().optional(),
    })
        .optional(),
});
export const Item6RequestSchema = z.object({
    requestId: z.string(),
    candidates: z.array(CandidateSchema).min(2).max(8),
    evidenceLinks: z.array(EvidenceLinkSchema).optional(),
    // optional per-candidate Item5 signals; key = candidateId
    item5ByCandidateId: z.record(z.string(), Item5ThinSchema).optional(),
    uncertainty: Item3ThinSchema,
    context: z
        .object({
        domain: z.string().optional(),
        audience: z.enum(["general", "expert", "enterprise"]).optional(),
        stakes: z.enum(["low", "high"]).optional(),
        notes: z.string().optional(),
    })
        .optional(),
});
