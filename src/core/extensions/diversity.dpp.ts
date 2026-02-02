// src/core/extensions/diversity.dpp.ts

import {
  DeepModuleV02,
  PolicyCtxOnlyV02,
  UnitsCtxOnlyV02,
  DeepContextV02,
  DeepRunResultV02,
} from "../anytime/deepModule";

export const diversityDppV02: DeepModuleV02 = {
  moduleId: "diversity.dpp",
  tier: "deep",
  implemented: true,

  // ??PolicyCtxOnly
  shouldRun: (_ctx: PolicyCtxOnlyV02) => {
    return true;
  },

  // ??UnitsCtxOnly (결정??
  estimateUnits: (_ctx: UnitsCtxOnlyV02) => {
    return 1;
  },

  // ??DeepContextV02
  run: async (_ctx: DeepContextV02): Promise<DeepRunResultV02> => {
    return {
      moduleId: "diversity.dpp",
      unitsUsed: 1,
      tags: ["stub"],

      // ??DeepOutputV02 ??리터??고정
      output: {
        kind: "INLINE",
        inline: {
          diversity: "stub",
        },
      },
    };
  },
};
