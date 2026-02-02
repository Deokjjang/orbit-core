// test/anytime_v02.smoke.test.ts

import { describe, it, expect } from "vitest";
import { runAnytimeV02 } from "../src/core/anytime/runAnytime";
import { deepRegistryV02 } from "../src/core/anytime/registry";

describe("anytime v0.2 smoke", () => {
  it("creates envelope with base/lite and runs deep stub within budget", async () => {
    const env = await runAnytimeV02({
      repro: {
        requestId: "req_00000001",
        seed: 42,
        presetId: "std",
        codeVersion: "dev",
        docHash: "doc_1",
        adapterVersion: "adapter.v0.1",
        rulePackIds: ["adapter.sample.v0.1"],
        // createdAt 제거 (ReproMetaV02에 없음)
      },
      budget: { totalUnits: 3, deepMaxUnits: 1 },
      hooks: {
        runBase: async () => ({
          coreResult: { kind: "INLINE", inline: { ok: true } } as any,
          minBar: {
            hasOptionsStructure: true,
            hasRiskOrStabilitySignals: true,
            hasHoldOrProceedReason: true,
            hasWorstOrStableScenario: true,
          },
          coreInternal: { candidates: [] },
        }),
        buildLite: async () => ({
          signals: { item4: "HOLD", item5: "USE" },
          notes: ["signal-only"],
        }),
      },
      deepRegistry: deepRegistryV02,
    });

    expect(env.version).toBe("orbit.exec.v0.2");

    // base.coreResult is unknown in schema => cast in test
    expect((env.base.coreResult as any).kind).toBe("INLINE");

    expect(env.lite.signals).toBeTruthy();

    expect(env.deep.enabled).toBe(true);
    expect(env.deep.plan.length).toBe(3);

    // budget=1, first module estimate=1 => 1 step ok, then stop
    expect(env.deep.steps.length).toBe(1);
    expect(env.deep.steps[0].moduleId).toBe("diversity.dpp");
    expect(env.deep.stoppedReason).toBe("BUDGET_EXHAUSTED");

    expect(env.deep.remainingPlan.length).toBe(2);
    expect(env.deep.plan[0]).toBe("diversity.dpp");

        // --- SSOT: deep ledger invariants (regression lock) ---
    expect(env.deep.handledReasonsByIndex.length).toBe(env.deep.plan.length);
    expect(env.deep.units.unitsEstimatedByIndex.length).toBe(env.deep.plan.length);
    expect(env.deep.units.unitsUsedByIndex.length).toBe(env.deep.plan.length);

    // remainingPlan must equal plan.slice(handledPlanIndex)
    expect(env.deep.remainingPlan).toEqual(env.deep.plan.slice(env.deep.handledPlanIndex));

    // handledPlanIndex must be first UNHANDLED (or plan.length)
    const firstUnhandled = env.deep.handledReasonsByIndex.indexOf("UNHANDLED");
    const expectedHandledIdx = firstUnhandled === -1 ? env.deep.plan.length : firstUnhandled;
    expect(env.deep.handledPlanIndex).toBe(expectedHandledIdx);

    // budget stop rule
    const shouldStop =
      env.deep.handledPlanIndex < env.deep.plan.length &&
      env.deep.handledReasonsByIndex[env.deep.handledPlanIndex] === "UNHANDLED";
    expect((env.deep.stoppedReason ?? null) === "BUDGET_EXHAUSTED").toBe(shouldStop);

    // deterministic units rule (A-plan): used == estimated
    expect(env.deep.units.unitsUsedByIndex).toEqual(env.deep.units.unitsEstimatedByIndex);

  });
});
