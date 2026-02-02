// src/core/anytime/runAnytime.ts
//
// ORBIT v0.2 ??Anytime Runner (SSOT FINAL)
//
// SSOT (deep ledger):
// - plan: registry snapshot order (string[])
// - handledPlanIndex: first UNHANDLED index (0..plan.length)
// - handledReasonsByIndex: length=plan.length, UNHANDLED suffix only
// - remainingPlan: plan.slice(handledPlanIndex)
// - stoppedReason: "BUDGET_EXHAUSTED" | null (budget only)
// - steps: EXEC_OK only (success only), must include planIndex + outputRef
// - errors: EXEC_ERR only, must include planIndex
// - units: byIndex arrays length=plan.length, fill(0); A-plan => used==estimated for EXEC_OK

import {
  ExecutionEnvelopeV02,
  ReproMetaV02,
  BudgetV02,
  ResultRefV02,
  createEnvelopeV02,
} from "./executionEnvelope";
import {
  DeepModuleRegistryV02,
  DeepContextV02,
  buildDeepPlanV02,
  DeepRunResultV02,
} from "./deepModule";
import { ExposurePolicyV02 } from "./exposure";
import { decideDeepBudgetV02 } from "./deepBudgetPolicy";

export type ExecutionEnvelopeV02WithExposure =
  ExecutionEnvelopeV02 & { exposurePolicy: ExposurePolicyV02 };

export type BaseRunOutputV02 = {
  coreResult: ResultRefV02;
  minBar: {
    hasOptionsStructure: boolean;
    hasRiskOrStabilitySignals: boolean;
    hasHoldOrProceedReason: boolean;
    hasWorstOrStableScenario: boolean;
  };
  coreInternal?: any;
};

export type LiteBuildOutputV02 = {
  signals: Record<string, any>;
  notes?: string[];
};

export type AnytimeHooksV02 = {
  runBase: () => Promise<BaseRunOutputV02>;
  buildLite: (base: BaseRunOutputV02) => Promise<LiteBuildOutputV02>;
  toResultRef?: (moduleId: string, raw: any) => Promise<ResultRefV02>;
};

function inlineRef(inline: any): ResultRefV02 {
  return ResultRefV02.parse({ kind: "INLINE", inline });
}

function canSpendDeepUnits(
  env: { deep: { units: { unitsBudgeted: number; unitsUsedTotal: number } } },
  nextUnits: number
) {
  if (nextUnits < 0) return false;
  return env.deep.units.unitsUsedTotal + nextUnits <= env.deep.units.unitsBudgeted;
}

function spendDeepUnitsAPlan(
  env: {
    deep: {
      units: {
        unitsUsedTotal: number;
        unitsEstimatedByIndex: number[];
        unitsUsedByIndex: number[];
      };
    };
  },
  planIndex: number,
  unitsEstimated: number
) {
  // SSOT A-plan: usedByIndex[i] == estimatedByIndex[i] (deterministic)
  env.deep.units.unitsEstimatedByIndex[planIndex] = unitsEstimated;
  env.deep.units.unitsUsedByIndex[planIndex] = unitsEstimated;
  env.deep.units.unitsUsedTotal = env.deep.units.unitsUsedByIndex.reduce((a, b) => a + b, 0);
}

export async function runAnytimeV02(args: {
  repro: ReproMetaV02;
  budget: BudgetV02;
  hooks: AnytimeHooksV02;
  deepRegistry?: DeepModuleRegistryV02;
  exposure?: ExposurePolicyV02;
}): Promise<ExecutionEnvelopeV02WithExposure> {
  const repro = ReproMetaV02.parse(args.repro);
  const budget = BudgetV02.parse(args.budget);
  const exposurePolicy = ExposurePolicyV02.parse(args.exposure ?? {});

  const baseOut = await args.hooks.runBase();
  const liteOut = await args.hooks.buildLite(baseOut);

  const deepBudget = decideDeepBudgetV02(budget);

  // Create with empty deep (plan length 0 is valid)
  const env0 = createEnvelopeV02({
    repro,
    budget,
    base: {
      coreResult: baseOut.coreResult,
      minBar: baseOut.minBar,
    },
    lite: {
      signals: liteOut.signals ?? {},
      notes: liteOut.notes ?? [],
    },
    deep: {
      enabled: deepBudget.enabled,
      plan: [],
      handledPlanIndex: 0,
      handledReasonsByIndex: [],
      remainingPlan: [],
      stoppedReason: null,
      steps: [],
      errors: [],
      units: {
        unitsBudgeted: deepBudget.unitsBudgeted,
        unitsUsedTotal: 0,
        unitsEstimatedByIndex: [],
        unitsUsedByIndex: [],
      },
    },
  });

  const env = Object.assign(env0, { exposure: exposurePolicy }) as ExecutionEnvelopeV02WithExposure;

  const reg = args.deepRegistry;
  if (!reg || !env.deep.enabled) return env;

  const toRef =
    args.hooks.toResultRef ??
    (async (_moduleId: string, raw: any) => inlineRef(raw));

  // 1) full plan (registry order snapshot)
  const fullPlan = buildDeepPlanV02(reg, {
  envelope: env,
  coreInternal: baseOut.coreInternal,
});

  env.deep.plan = fullPlan.map((p) => p.moduleId);

  // 2) ledger init (SSOT)
  // ??1) plan ÎßåÎì† ÏßÅÌõÑ( env.deep.plan = ... ) Î∞îÎ°ú ?ÑÎûò??Ï∂îÍ?/ÍµêÏ≤¥

const n = env.deep.plan.length;

// ledger Ï¥àÍ∏∞??(SSOT lock)
env.deep.handledPlanIndex = 0;
env.deep.handledReasonsByIndex = new Array(n).fill("UNHANDLED");
env.deep.remainingPlan = env.deep.plan.slice(0);

env.deep.units = {
  unitsBudgeted: env.deep.units?.unitsBudgeted ?? deepBudget.unitsBudgeted,
  unitsUsedTotal: 0,
  unitsEstimatedByIndex: new Array(n).fill(0),
  unitsUsedByIndex: new Array(n).fill(0),
};

env.deep.steps = [];
env.deep.errors = [];
env.deep.stoppedReason = null;

  env.deep.units.unitsEstimatedByIndex = new Array(n).fill(0);
  env.deep.units.unitsUsedByIndex = new Array(n).fill(0);
  env.deep.units.unitsUsedTotal = 0;

  // 3) deep run
  // ??2) deep ?§Ìñâ Î£®ÌîÑÎ•?"planIndex Í∏∞Î∞ò"?ºÎ°ú ÍµêÏ≤¥

for (let planIndex = 0; planIndex < env.deep.plan.length; planIndex++) {
  const moduleId = env.deep.plan[planIndex];
  const mod = reg.modules.find((m) => m.moduleId === moduleId);
  
  // planIndex Ï≤òÎ¶¨ ?? remainingPlan/handledPlanIndex??"?ÑÏû¨ index" ?òÎ? ?†Ï?
  env.deep.handledPlanIndex = planIndex;
  env.deep.remainingPlan = env.deep.plan.slice(planIndex);
  
  if (!mod) {
    env.deep.handledReasonsByIndex[planIndex] = "UNIMPL";
    continue;
  }

  // Policy/Units ctx only (SSOT)
  const policyCtx = { envelope: { exposure: env.exposure, deep: env.deep } };
  const unitsCtx = { envelope: { exposure: env.exposure, deep: env.deep } };

  if (!mod.shouldRun(policyCtx)) {
    env.deep.handledReasonsByIndex[planIndex] = "POLICY_SKIP";
    continue;
  }

  const unitsEstimated = Math.max(0, mod.estimateUnits(unitsCtx));

  // budget check
  const canSpend =
    env.deep.units.unitsUsedTotal + unitsEstimated <= env.deep.units.unitsBudgeted;

  if (!canSpend) {
    env.deep.stoppedReason = "BUDGET_EXHAUSTED";
    // ??indexÎ∂Ä??UNHANDLED suffix ?†Ï?(?¥Î? Í∏∞Î≥∏Í∞?UNHANDLED)
    break;
  }

  // A-plan: used==estimated (deterministic)
  env.deep.units.unitsEstimatedByIndex[planIndex] = unitsEstimated;
  env.deep.units.unitsUsedByIndex[planIndex] = unitsEstimated;
  env.deep.units.unitsUsedTotal = env.deep.units.unitsUsedByIndex.reduce((a, b) => a + b, 0);

  try {
    const ctx: DeepContextV02 = { envelope: env, coreInternal: baseOut.coreInternal };
    const res = await mod.run(ctx);

    const ref = await toRef(
      res.moduleId,
      res.output.kind === "INLINE" ? res.output.inline : res.output
    );

    env.deep.handledReasonsByIndex[planIndex] = "EXEC_OK";

    env.deep.steps.push({
      planIndex,
      moduleId: res.moduleId,
      outputRef: ref,
      unitsEstimated,
      unitsUsed: unitsEstimated, // A-plan
      tags: res.tags ?? [],
    });
  } catch (e: any) {
    env.deep.handledReasonsByIndex[planIndex] = "EXEC_ERR";

    env.deep.errors.push({
      planIndex,
      moduleId,
      handledReason: "EXEC_ERR",
      message: String(e?.message ?? "deep module execution error"),
      name: typeof e?.name === "string" ? e.name : undefined,
      stack: typeof e?.stack === "string" ? e.stack : undefined,
    });

    // SSOT: ?êÎü¨??"Ï§ëÎã® ?¥Ïú†"Í∞Ä ?ÑÎãà??ledger??EXEC_ERRÎ°?Í∏∞Î°ù?òÍ≥† Í≥ÑÏÜç?†Ï?/Ï§ëÎã®?†Ï? ?ïÏ±Ö ?ÑÏöî.
    // v0.2 ?§Ï∫ê?¥Îî© ?®Í≥Ñ: Ï¶âÏãú Ï§ëÎã®(?òÎ?Î∂Ä???ÑÎãò, ?§ÌñâÎπÑÏö©/?¨ÌòÑ??Î≥¥Ïàò??
    break;
  }
}

// Î£®ÌîÑ Ï¢ÖÎ£å ?? handledPlanIndex??"Ï≤?UNHANDLED index"?¨Ïïº ??
const firstUnhandled = env.deep.handledReasonsByIndex.indexOf("UNHANDLED");
env.deep.handledPlanIndex =
  firstUnhandled === -1 ? env.deep.plan.length : firstUnhandled;

env.deep.remainingPlan = env.deep.plan.slice(env.deep.handledPlanIndex);

  return env;
}
