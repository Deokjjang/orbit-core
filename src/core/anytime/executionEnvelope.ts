// src/core/anytime/executionEnvelope.ts
import { z } from "zod";

/**
 * ORBIT v0.2 Anytime Execution — SSOT-LOCKED Envelope
 *
 * DeepBundle is a consumption ledger.
 * - plan: registry snapshot (order locked elsewhere)
 * - handledReasonsByIndex: length=plan.length, UNHANDLED suffix only
 * - handledPlanIndex: first UNHANDLED index (or plan.length)
 * - remainingPlan: MUST equal plan.slice(handledPlanIndex) (persisted + enforced)
 * - stoppedReason: BUDGET_EXHAUSTED only, and only if UNHANDLED suffix exists
 * - steps: EXEC_OK only, steps.length == count(EXEC_OK)
 * - errors: EXEC_ERR only, mapped to indices where reason==EXEC_ERR
 * - units: A-plan deterministic (usedByIndex == estimatedByIndex, total == sum)
 */

export const EXECUTION_ENVELOPE_VERSION_V02 = "orbit.exec.v0.2" as const;

// -----------------------------
// Enums / Small Schemas
// -----------------------------

export const HandledReasonV02 = z.enum([
  "EXEC_OK",
  "EXEC_ERR",
  "POLICY_SKIP",
  "UNIMPL",
  "UNHANDLED",
]);
export type HandledReasonV02 = z.infer<typeof HandledReasonV02>;

export const StoppedReasonV02 = z.enum(["BUDGET_EXHAUSTED"]);
export type StoppedReasonV02 = z.infer<typeof StoppedReasonV02>;

export const ExposureModeV02 = z.enum(["minimal", "analytical"]);
export type ExposureModeV02 = z.infer<typeof ExposureModeV02>;

export const ExposureV02 = z.object({
  exposure: ExposureModeV02.default("minimal"),
  audience: z.enum(["general", "expert", "enterprise"]).optional(),
  stakes: z.enum(["low", "high"]).optional(),
});
export type ExposureV02 = z.infer<typeof ExposureV02>;

// -----------------------------
// Repro / Budget
// -----------------------------

export const ReproMetaV02 = z.object({
  requestId: z.string().min(1),
  seed: z.number().int(),
  presetId: z.string().min(1),
  codeVersion: z.string().min(1),

  docHash: z.string().min(1).optional(),
  adapterVersion: z.string().min(1).optional(),
  rulePackIds: z.array(z.string().min(1)).optional(),

  runtime: z
    .object({
      node: z.string().min(1).optional(),
      platform: z.string().min(1).optional(),
    })
    .optional(),
});
export type ReproMetaV02 = z.infer<typeof ReproMetaV02>;

export const BudgetV02 = z
  .object({
    totalUnits: z.number().int().nonnegative(),
    deepMaxUnits: z.number().int().nonnegative(),
  })
  .superRefine((v, ctx) => {
    if (v.deepMaxUnits > v.totalUnits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "BudgetV02: deepMaxUnits must be <= totalUnits",
      });
    }
  });
export type BudgetV02 = z.infer<typeof BudgetV02>;

// -----------------------------
// ResultRef
// -----------------------------

export const ResultRefKindV02 = z.enum(["INLINE", "URI"]);
export type ResultRefKindV02 = z.infer<typeof ResultRefKindV02>;

export const ResultRefV02 = z
  .object({
    kind: ResultRefKindV02,
    inline: z.unknown().optional(),
    uri: z.string().min(1).optional(),
    contentType: z.string().min(1).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "INLINE") {
      if (typeof v.inline === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ResultRefV02(INLINE): inline must be present",
        });
      }
      if (typeof v.uri !== "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ResultRefV02(INLINE): uri must be absent",
        });
      }
    }
    if (v.kind === "URI") {
      if (typeof v.uri !== "string" || v.uri.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ResultRefV02(URI): uri must be present",
        });
      }
      if (typeof v.inline !== "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ResultRefV02(URI): inline must be absent",
        });
      }
    }
  });
export type ResultRefV02 = z.infer<typeof ResultRefV02>;

// -----------------------------
// Base / Lite (loose by design)
// -----------------------------

export const BaseBundleV02 = z.object({
  coreResult: z.unknown(),
  minBar: z.unknown(),
});
export type BaseBundleV02 = z.infer<typeof BaseBundleV02>;

export const LiteBundleV02 = z.object({
  signals: z.unknown().optional(),
  notes: z.array(z.string()).optional(),
});
export type LiteBundleV02 = z.infer<typeof LiteBundleV02>;

// -----------------------------
// Deep Ledger
// -----------------------------

export const DeepStepV02 = z.object({
  planIndex: z.number().int().nonnegative(),
  moduleId: z.string().min(1),
  outputRef: ResultRefV02,
  unitsEstimated: z.number().int().nonnegative(),
  unitsUsed: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)).default([]),
});
export type DeepStepV02 = z.infer<typeof DeepStepV02>;

export const DeepErrorV02 = z.object({
  planIndex: z.number().int().nonnegative(),
  moduleId: z.string().min(1),
  handledReason: z.literal("EXEC_ERR").default("EXEC_ERR"),
  message: z.string().min(1),
  name: z.string().min(1).optional(),
  stack: z.string().optional(),
});
export type DeepErrorV02 = z.infer<typeof DeepErrorV02>;

export const DeepUnitsV02 = z
  .object({
    unitsBudgeted: z.number().int().nonnegative(),
    unitsUsedTotal: z.number().int().nonnegative(),
    unitsEstimatedByIndex: z.array(z.number().int().nonnegative()),
    unitsUsedByIndex: z.array(z.number().int().nonnegative()),
  })
  .superRefine((u, ctx) => {
    if (u.unitsEstimatedByIndex.length !== u.unitsUsedByIndex.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepUnitsV02: unitsEstimatedByIndex length must match unitsUsedByIndex length",
      });
      return;
    }
    const sumUsed = u.unitsUsedByIndex.reduce((a, b) => a + b, 0);
    if (sumUsed !== u.unitsUsedTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepUnitsV02: unitsUsedTotal must equal sum(unitsUsedByIndex)",
      });
    }
  });
export type DeepUnitsV02 = z.infer<typeof DeepUnitsV02>;

export const DeepBundleV02 = z
  .object({
    enabled: z.boolean(),

    plan: z.array(z.string().min(1)),
    handledPlanIndex: z.number().int().nonnegative(),
    handledReasonsByIndex: z.array(HandledReasonV02),

    remainingPlan: z.array(z.string().min(1)),

    stoppedReason: StoppedReasonV02.nullable().default(null),

    steps: z.array(DeepStepV02).default([]),
    errors: z.array(DeepErrorV02).default([]),

    units: DeepUnitsV02,
  })
  .superRefine((d, ctx) => {
    const n = d.plan.length;

    // lengths
    if (d.handledReasonsByIndex.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: handledReasonsByIndex length must equal plan.length",
      });
      return;
    }
    if (d.units.unitsEstimatedByIndex.length !== n || d.units.unitsUsedByIndex.length !== n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: unitsByIndex length must equal plan.length",
      });
      return;
    }
    if (d.handledPlanIndex > n) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: handledPlanIndex must be <= plan.length",
      });
      return;
    }

    // remainingPlan == plan.slice(handledPlanIndex)
    const expectedRemaining = d.plan.slice(d.handledPlanIndex);
    if (
      d.remainingPlan.length !== expectedRemaining.length ||
      d.remainingPlan.some((m, i) => m !== expectedRemaining[i])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: remainingPlan must equal plan.slice(handledPlanIndex)",
      });
    }

    // handledPlanIndex == first UNHANDLED index (or n)
    const firstUnhandled = d.handledReasonsByIndex.indexOf("UNHANDLED");
    const computedFirstUnhandled = firstUnhandled === -1 ? n : firstUnhandled;

    // UNHANDLED suffix
    for (let i = computedFirstUnhandled; i < n; i++) {
      if (d.handledReasonsByIndex[i] !== "UNHANDLED") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DeepBundleV02: UNHANDLED suffix violation",
        });
        break;
      }
    }
    for (let i = 0; i < computedFirstUnhandled; i++) {
      if (d.handledReasonsByIndex[i] === "UNHANDLED") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DeepBundleV02: UNHANDLED prefix violation",
        });
        break;
      }
    }
    if (d.handledPlanIndex !== computedFirstUnhandled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: handledPlanIndex must equal indexOfFirst(UNHANDLED) (or plan.length)",
      });
    }

    // stoppedReason budget-only
    const shouldBeStopped =
      d.handledPlanIndex < n && d.handledReasonsByIndex[d.handledPlanIndex] === "UNHANDLED";
    if (d.stoppedReason === "BUDGET_EXHAUSTED" && !shouldBeStopped) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DeepBundleV02: stoppedReason="BUDGET_EXHAUSTED" requires UNHANDLED suffix at handledPlanIndex',
      });
    }
    if (d.stoppedReason === null && shouldBeStopped) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: if UNHANDLED suffix exists, stoppedReason must be BUDGET_EXHAUSTED",
      });
    }

    // steps == count(EXEC_OK)
    const execOkCount = d.handledReasonsByIndex.filter((r) => r === "EXEC_OK").length;
    if (d.steps.length !== execOkCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DeepBundleV02: steps.length must equal count(reasons == EXEC_OK)",
      });
    }

    // steps mapping + uniqueness
    const seen = new Set<string>();
    for (const s of d.steps) {
      if (s.planIndex >= n) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: step.planIndex out of range" });
        break;
      }
      const expectedModuleId = d.plan[s.planIndex];
      if (s.moduleId !== expectedModuleId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: step.moduleId must equal plan[planIndex]" });
        break;
      }
      if (seen.has(s.moduleId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: steps.moduleId must be unique" });
        break;
      }
      seen.add(s.moduleId);

      if (d.handledReasonsByIndex[s.planIndex] !== "EXEC_OK") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: step implies EXEC_OK at planIndex" });
        break;
      }

      // deterministic A-plan
      if (s.unitsUsed !== s.unitsEstimated) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DeepBundleV02: step.unitsUsed must equal step.unitsEstimated (A-plan)",
        });
        break;
      }
    }

    // errors mapping to EXEC_ERR
    for (const e of d.errors) {
      if (e.planIndex >= n) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: error.planIndex out of range" });
        break;
      }
      const expectedModuleId = d.plan[e.planIndex];
      if (e.moduleId !== expectedModuleId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: error.moduleId must equal plan[planIndex]" });
        break;
      }
      if (d.handledReasonsByIndex[e.planIndex] !== "EXEC_ERR") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DeepBundleV02: error implies EXEC_ERR at planIndex" });
        break;
      }
    }

    // A-plan: unitsUsedByIndex == unitsEstimatedByIndex, total == sum
    for (let i = 0; i < n; i++) {
      if (d.units.unitsUsedByIndex[i] !== d.units.unitsEstimatedByIndex[i]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DeepBundleV02: unitsUsedByIndex[i] must equal unitsEstimatedByIndex[i] (A-plan)",
        });
        break;
      }
    }
  });
export type DeepBundleV02 = z.infer<typeof DeepBundleV02>;

// -----------------------------
// Envelope
// -----------------------------

export const ExecutionEnvelopeV02 = z.object({
  version: z.literal(EXECUTION_ENVELOPE_VERSION_V02),
  repro: ReproMetaV02,
  budget: BudgetV02,
  exposure: ExposureV02.default({ exposure: "minimal" }),
  base: BaseBundleV02,
  lite: LiteBundleV02,
  deep: DeepBundleV02,
});
export type ExecutionEnvelopeV02 = z.infer<typeof ExecutionEnvelopeV02>;

export type CreateEnvelopeV02Args = {
  repro: ReproMetaV02;
  budget: BudgetV02;
  exposure?: ExposureV02;
  base: BaseBundleV02;
  lite: LiteBundleV02;
  deep?: Partial<DeepBundleV02>;
};

/**
 * Create + hard-validate envelope at construction time (SSOT lock).
 * NOTE: remainingPlan and handledReasonsByIndex are always materialized.
 */
export function createEnvelopeV02(args: CreateEnvelopeV02Args): ExecutionEnvelopeV02 {
  const exposure = args.exposure ?? { exposure: "minimal" as const };

  const deepIn = args.deep ?? {};
  const plan = deepIn.plan ?? [];
  const n = plan.length;

  const handledPlanIndex = deepIn.handledPlanIndex ?? 0;
  const handledReasonsByIndex =
    deepIn.handledReasonsByIndex ?? new Array<HandledReasonV02>(n).fill("UNHANDLED");

  const remainingPlan = deepIn.remainingPlan ?? plan.slice(handledPlanIndex);

  const unitsEstimatedByIndex = deepIn.units?.unitsEstimatedByIndex ?? new Array<number>(n).fill(0);
  const unitsUsedByIndex = deepIn.units?.unitsUsedByIndex ?? new Array<number>(n).fill(0);
  const unitsUsedTotal = deepIn.units?.unitsUsedTotal ?? unitsUsedByIndex.reduce((a, b) => a + b, 0);

  const deep: DeepBundleV02 = {
    enabled: deepIn.enabled ?? Boolean(n),

    plan,
    handledPlanIndex,
    handledReasonsByIndex,
    remainingPlan,

    stoppedReason: deepIn.stoppedReason ?? null,

    steps: deepIn.steps ?? [],
    errors: deepIn.errors ?? [],

    units: {
      unitsBudgeted: deepIn.units?.unitsBudgeted ?? args.budget.deepMaxUnits,
      unitsUsedTotal,
      unitsEstimatedByIndex,
      unitsUsedByIndex,
    },
  };

  const envelope: ExecutionEnvelopeV02 = {
    version: EXECUTION_ENVELOPE_VERSION_V02,
    repro: args.repro,
    budget: args.budget,
    exposure,
    base: args.base,
    lite: args.lite,
    deep,
  };

  return ExecutionEnvelopeV02.parse(envelope);
}
