import { z } from "zod";
/**
 * Item 3 — Uncertainty Mapper
 * Request Schema v0.1 (FREEZE)
 *
 * Boundary:
 * - No Gate invocation
 * - No state mutation
 * - Must run even when optional fields are absent
 */
// Minimal Scenario (adapter-level; keep lean)
export const ScenarioSchema = z.object({
    id: z.string(),
    label: z.string(),
    assumptions: z.array(z.string()).optional(),
});
// Core state: (v,r,u,i) ∈ [-1,1]
export const CoreStateSchema = z.object({
    v: z.number().min(-1).max(1),
    r: z.number().min(-1).max(1),
    u: z.number().min(-1).max(1),
    i: z.number().min(-1).max(1),
});
export const StateSchema = z.object({
    core: CoreStateSchema,
    // optional plugin axes (no constraints here; plugin-defined)
    optional: z.record(z.string(), z.number()).optional(),
});
// Constraints are optional; Item3 only reads signals
export const HardConstraintSchema = z.object({
    name: z.string(),
    rule: z.string(), // expression or DSL-compiled string; Item3 does NOT evaluate for enforcement
    ref: z.string().optional(), // link to scenario/evidence/section if available
});
export const SoftConstraintSchema = z.object({
    name: z.string(),
    g: z.number().optional(), // kept for compatibility; do NOT output externally
    beta: z.number().optional(),
    ref: z.string().optional(),
});
export const ConstraintsSchema = z.object({
    hard: z.array(HardConstraintSchema).optional(),
    soft: z.array(SoftConstraintSchema).optional(),
});
export const EvidenceLinkSchema = z.object({
    docHash: z.string(),
    sectionId: z.string(),
    span: z.object({
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
    }),
});
export const Item3RequestSchema = z.object({
    requestId: z.string(),
    scenarioSet: z.array(ScenarioSchema).min(1),
    state: StateSchema,
    constraints: ConstraintsSchema.optional(),
    evidenceLinks: z.array(EvidenceLinkSchema).optional(),
    context: z
        .object({
        locale: z.string().optional(),
        domain: z.string().optional(),
        notes: z.string().optional(),
        // upstream may pass "stale" hint; Item3 only signals it
        evidenceStale: z.boolean().optional(),
    })
        .optional(),
});
