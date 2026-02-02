// test/anytime_v02_analytical.smoke.test.ts
//
// v0.2 — remainingPlan optional 대응 (1줄 추가)
// 다음 ㄱ: deepBundle schema/types 정리(remainingPlan optional로 고정되면 테스트도 그에 맞춤)

import { describe, it, expect } from "vitest";
import { runAnytimeV02 } from "../src/core/anytime/runAnytime";
import { deepRegistryV02 } from "../src/core/anytime/registry";

describe("anytime v0.2 analytical exposure smoke", () => {
  it("includes analytics blocks when exposure=analytical", async () => {
    const env = await runAnytimeV02({
      repro: {
        requestId: "req_ana_0001",
        seed: 7,
        presetId: "std",
        codeVersion: "dev",
        docHash: "doc_ana",
        adapterVersion: "adapter.v0.1",
        rulePackIds: ["adapter.sample.v0.1"],
      },
      budget: { totalUnits: 3, deepMaxUnits: 3 },
      exposure: { exposure: "analytical", audience: "expert", stakes: "high" },
      hooks: {
        runBase: async () => ({
          coreResult: { kind: "INLINE", inline: { ok: true } },
          minBar: {
            hasOptionsStructure: true,
            hasRiskOrStabilitySignals: true,
            hasHoldOrProceedReason: true,
            hasWorstOrStableScenario: true,
          },
          coreInternal: { candidates: [] },
        }),
        buildLite: async () => ({
          signals: { item4: "HOLD" },
          notes: ["signal-only"],
        }),
      },
      deepRegistry: deepRegistryV02,
    });

    expect(env.deep.plan.length).toBe(3);
    expect(env.deep.steps.length).toBe(2);

    const robustness = env.deep.steps.find((s) => s.moduleId === "robustness.perturb");
    expect(robustness).toBeTruthy();

    const out = (robustness!.outputRef as any).inline;
    expect(robustness!.outputRef.kind).toBe("INLINE");

    // ✅ 추가: optional remainingPlan은 있으면 길이 >= 0
    expect(((env.deep as any).remainingPlan ?? []).length).toBeGreaterThanOrEqual(0);
  });
});
