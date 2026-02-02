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
import { ReproMetaV02, BudgetV02, ResultRefV02, createEnvelopeV02, } from "./executionEnvelope";
import { buildDeepPlanV02, } from "./deepModule";
import { ExposurePolicyV02 } from "./exposure";
import { decideDeepBudgetV02 } from "./deepBudgetPolicy";
function inlineRef(inline) {
    return ResultRefV02.parse({ kind: "INLINE", inline });
}
function canSpendDeepUnits(env, nextUnits) {
    if (nextUnits < 0)
        return false;
    return env.deep.units.unitsUsedTotal + nextUnits <= env.deep.units.unitsBudgeted;
}
function spendDeepUnitsAPlan(env, planIndex, unitsEstimated) {
    // SSOT A-plan: usedByIndex[i] == estimatedByIndex[i] (deterministic)
    env.deep.units.unitsEstimatedByIndex[planIndex] = unitsEstimated;
    env.deep.units.unitsUsedByIndex[planIndex] = unitsEstimated;
    env.deep.units.unitsUsedTotal = env.deep.units.unitsUsedByIndex.reduce((a, b) => a + b, 0);
}
export async function runAnytimeV02(args) {
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
    const env = Object.assign(env0, { exposure: exposurePolicy });
    const reg = args.deepRegistry;
    if (!reg || !env.deep.enabled)
        return env;
    const toRef = args.hooks.toResultRef ??
        (async (_moduleId, raw) => inlineRef(raw));
    // 1) full plan (registry order snapshot)
    const fullPlan = buildDeepPlanV02(reg, {
        envelope: env,
        coreInternal: baseOut.coreInternal,
    });
    env.deep.plan = fullPlan.map((p) => p.moduleId);
    // 2) ledger init (SSOT)
    // ??1) plan 만든 직후( env.deep.plan = ... ) 바로 ?�래??추�?/교체
    const n = env.deep.plan.length;
    // ledger 초기??(SSOT lock)
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
    // ??2) deep ?�행 루프�?"planIndex 기반"?�로 교체
    for (let planIndex = 0; planIndex < env.deep.plan.length; planIndex++) {
        const moduleId = env.deep.plan[planIndex];
        const mod = reg.modules.find((m) => m.moduleId === moduleId);
        // planIndex 처리 ?? remainingPlan/handledPlanIndex??"?�재 index" ?��? ?��?
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
        const canSpend = env.deep.units.unitsUsedTotal + unitsEstimated <= env.deep.units.unitsBudgeted;
        if (!canSpend) {
            env.deep.stoppedReason = "BUDGET_EXHAUSTED";
            // ??index부??UNHANDLED suffix ?��?(?��? 기본�?UNHANDLED)
            break;
        }
        // A-plan: used==estimated (deterministic)
        env.deep.units.unitsEstimatedByIndex[planIndex] = unitsEstimated;
        env.deep.units.unitsUsedByIndex[planIndex] = unitsEstimated;
        env.deep.units.unitsUsedTotal = env.deep.units.unitsUsedByIndex.reduce((a, b) => a + b, 0);
        try {
            const ctx = { envelope: env, coreInternal: baseOut.coreInternal };
            const res = await mod.run(ctx);
            const ref = await toRef(res.moduleId, res.output.kind === "INLINE" ? res.output.inline : res.output);
            env.deep.handledReasonsByIndex[planIndex] = "EXEC_OK";
            env.deep.steps.push({
                planIndex,
                moduleId: res.moduleId,
                outputRef: ref,
                unitsEstimated,
                unitsUsed: unitsEstimated, // A-plan
                tags: res.tags ?? [],
            });
        }
        catch (e) {
            env.deep.handledReasonsByIndex[planIndex] = "EXEC_ERR";
            env.deep.errors.push({
                planIndex,
                moduleId,
                handledReason: "EXEC_ERR",
                message: String(e?.message ?? "deep module execution error"),
                name: typeof e?.name === "string" ? e.name : undefined,
                stack: typeof e?.stack === "string" ? e.stack : undefined,
            });
            // SSOT: ?�러??"중단 ?�유"가 ?�니??ledger??EXEC_ERR�?기록?�고 계속?��?/중단?��? ?�책 ?�요.
            // v0.2 ?�캐?�딩 ?�계: 즉시 중단(?��?부???�님, ?�행비용/?�현??보수??
            break;
        }
    }
    // 루프 종료 ?? handledPlanIndex??"�?UNHANDLED index"?�야 ??
    const firstUnhandled = env.deep.handledReasonsByIndex.indexOf("UNHANDLED");
    env.deep.handledPlanIndex =
        firstUnhandled === -1 ? env.deep.plan.length : firstUnhandled;
    env.deep.remainingPlan = env.deep.plan.slice(env.deep.handledPlanIndex);
    return env;
}
