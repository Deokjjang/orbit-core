// src/core/extensions/robustness.perturb.ts
import { allowAnalytical } from "../anytime/exposure";
import type {
  DeepContextV02,
  DeepModuleV02,
  PolicyCtxOnlyV02,
  UnitsCtxOnlyV02,
  DeepOutputV02,
} from "../anytime/deepModule";

export const robustnessPerturbV02: DeepModuleV02 = {
  moduleId: "robustness.perturb",
  tier: "deep",
  implemented: true,

  shouldRun(_ctx: PolicyCtxOnlyV02) {
    return true;
  },

  estimateUnits(_ctx: UnitsCtxOnlyV02) {
    return 2;
  },

  async run(ctx: DeepContextV02) {
    const analytical = allowAnalytical({
  exposure: ctx.envelope.exposure.exposure,
  audience: ctx.envelope.exposure.audience ?? "general",
  stakes: ctx.envelope.exposure.stakes ?? "low",
});

    const inline = analytical
      ? {
          kind: "stub",
          module: "robustness.perturb",
          analytics: {
            stabilityTier: "UNKNOWN",
            notes: ["stub-only"],
          },
        }
      : {
          kind: "stub",
          module: "robustness.perturb",
          notes: ["stub-only"],
        };

    const output: DeepOutputV02 = { kind: "INLINE", inline };

    return {
  moduleId: "robustness.perturb",
  output: { kind: "INLINE", inline }, // ??boolean 말고 payload
  unitsUsed: 2,
  tags: analytical ? ["analytics", "stub"] : ["stub"],
};
  },
};
