import { z } from 'zod';
const Axis = z.number().min(-1).max(1);
export const CoreStateSchema = z.object({
    v: Axis,
    r: Axis,
    u: Axis,
    i: Axis,
});
export const StateSchema = z.object({
    core: CoreStateSchema,
    // ✅ zod 최신 타입 시그니처 대응: (keySchema, valueSchema)
    optional: z.record(z.string(), Axis).optional(),
});
export const EnergyBreakdownSchema = z.object({
    base: z.record(z.string(), z.number()),
    coupling: z.record(z.string(), z.number()).optional(),
    barrier: z.array(z.object({ name: z.string(), penalty: z.number().min(0) })).optional(),
    total: z.number(),
});
export const ExplainSignalsSchema = z.object({
    topAxes: z.array(z.string()),
    riskDirection: z.enum(['UP', 'DOWN', 'FLAT']),
    uncertaintyDensity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    couplingHints: z.array(z.string()).optional(),
});
export const AttractorSchema = z.object({
    id: z.string(),
    center: StateSchema,
    energy: EnergyBreakdownSchema,
    members: z.number().int().nonnegative(),
    signals: ExplainSignalsSchema,
});
export const QuantizedOutcomeSchema = z.object({
    scale: z.union([z.literal(3), z.literal(5), z.literal(7)]),
    z: z.number().int(),
    label: z.string(),
});
// ---- Trace (MUST be declared before EvaluateResultSchema) ----
export const TraceEventSchema = z.discriminatedUnion('kind', [
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('SPREAD'), n: z.number().int().positive(), seed: z.number().int() }),
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('CONSTRAINTS'), hardRejected: z.number().int().nonnegative(), softCount: z.number().int().nonnegative() }),
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('COMPETE'), inN: z.number().int().positive(), outK: z.number().int().positive(), diversityMin: z.number() }),
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('RELAX'), inK: z.number().int().positive(), steps: z.number().int().positive(), radius: z.number(), seed: z.number().int() }),
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('CLUSTER'), inK: z.number().int().positive(), eps: z.number(), minPts: z.number().int().positive(), clusters: z.number().int().nonnegative(), noise: z.number().int().nonnegative() }),
    z.object({ pass: z.enum(['pass1', 'pass2']), kind: z.literal('RANK'), attractors: z.number().int().positive() }),
    z.object({ pass: z.literal('pass2'), kind: z.literal('GATE'), scale: z.union([z.literal(3), z.literal(5), z.literal(7)]), percentileBasis: z.literal('median'), label: z.string() }),
]);
export const OrbitTraceSchema = z.object({
    events: z.array(TraceEventSchema),
});
export const EvaluateResultPublicSchema = z.object({
    requestId: z.string(),
    attractors: z.array(AttractorSchema).min(1),
    outcome: QuantizedOutcomeSchema,
    trace: OrbitTraceSchema,
});
export const EvaluateResultInternalSchema = EvaluateResultPublicSchema.extend({
    rankingInternal: z.array(z.object({
        attractorId: z.string(),
        percentile: z.number().min(0).max(100),
    })),
});
export const EvaluateResultSchema = EvaluateResultInternalSchema;
