// ORBIT v0.2 — Deep Extension: robustness.perturb (STUB, analytical opt-in)
// 목적: exposure=analytical일 때만 analytics 블록 포함
// 경계: 결정/집행/정책/승인/감사 금지, deep 분리 결과만 제공

import type { DeepContextV02, DeepRunResultV02 } from "./deepModuleV02";

function isAnalytical(ctx: DeepContextV02): boolean {
  const exp = (ctx.envelope as any)?.exposure;
  return exp?.exposure === "analytical";
}

export const robustnessPerturbV02 = {
  moduleId: "robustness.perturb",

  shouldRun: (_ctx: DeepContextV02) => true,

  // 고정 비용: 2 units
  estimateUnits: (_ctx: DeepContextV02) => 2,

  async run(ctx: DeepContextV02): Promise<DeepRunResultV02> {
    const analytics = isAnalytical(ctx)
      ? {
          analytics: {
            stabilityTier: "UNKNOWN",
            note: "stub analytics (no-op)",
          },
        }
      : {};

    return {
      moduleId: "robustness.perturb",
      unitsUsed: 2,
      tags: ["stub", "v0.2", isAnalytical(ctx) ? "analytical" : "minimal"],
      output: {
        kind: "INLINE",
        inline: {
          kind: "ROBUSTNESS_STUB",
          note: "stub result (no-op)",
          ...analytics,
        },
      },
    };
  },
};
