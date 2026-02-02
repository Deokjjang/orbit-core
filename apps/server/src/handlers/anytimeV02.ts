// ORBIT v0.2 ??Anytime Handler (SSOT)
// ëª©ì : ?¸ë? ?”ì²­ ??v0.2 Anytime ?¤í–‰ ?¨ì¼ ?¸ë“¤??
// ê²½ê³„: ê²°ì •/ì§‘í–‰/?•ì±… ?´ì„ ê¸ˆì?, ?¤í–‰/?´ë°˜ë§?

import { runAnytimeV02 } from "../../../../src/core/anytime/runAnytime";
import { deepRegistryV02 } from "../../../../src/core/anytime/registry";

export type AnytimeV02Request = {
  repro: any;
  budget: any;
  exposure?: any; // minimal | analytical
  hooksInput: {
    base: any;
    lite: any;
  };
};

export async function handleAnytimeV02(body: AnytimeV02Request) {
  const { repro, budget, exposure, hooksInput = { base: {}, lite: {} } } = (body ?? ({} as any));

  const env = await runAnytimeV02({
    repro,
    budget,
    exposure,
    deepRegistry: deepRegistryV02,
    hooks: {
      runBase: async () => hooksInput.base,
      buildLite: async () => hooksInput.lite,
    },
  });

  return env;
}
