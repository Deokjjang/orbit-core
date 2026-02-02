// src/core/extensions/smc.changepoint.ts

import type { DeepModuleV02, PolicyCtxOnlyV02, UnitsCtxOnlyV02 } from "../anytime/deepModule";
import { allowAnalytical } from "../anytime/exposure";

export const smcChangepointV02: DeepModuleV02 = {
  moduleId: "smc.changepoint",
  tier: "deep",
  implemented: true,

  shouldRun: (_ctx: PolicyCtxOnlyV02) => true,

  estimateUnits: (_ctx: UnitsCtxOnlyV02) => 2,

  run: async (ctx) => {
    const analytical = allowAnalytical({
      exposure: ctx.envelope.exposure.exposure,
      audience: ctx.envelope.exposure.audience ?? "general",
      stakes: ctx.envelope.exposure.stakes ?? "low",
    });

    const payload = analytical
      ? { ok: true, analytics: { note: "stub" } }
      : { ok: true };

    return {
      moduleId: "smc.changepoint",
      output: { kind: "INLINE", inline: payload },
      unitsUsed: 2,
      tags: analytical ? ["analytics", "stub"] : ["stub"],
    };
  },
};
