// src/core/anytime/deepBudgetPolicy.ts
//
// ORBIT v0.2 SSOT ??Deep Budget Policy (baseResult + liteBundle always, deepBundle budgeted)
// ëª©ì : deep ?¤í–‰???œì˜ˆ?????ë™?¬í™”?ë¡œ ê°•ì œ?˜ëŠ” ?•ì±… ?ˆì´?´ë? ë¶„ë¦¬ ê³ ì •
// - deepMaxUnitsê°€ 0?´ë©´ deep ë¹„í™œ??
// - deep??registry ?œì„œ?€ë¡? estimate ê¸°ì??¼ë¡œë§?? ì 
// - ?•ì±…?€ ?´ì˜(?¬ë ˆ??ê³?ë¶„ë¦¬: ?´ë? unitsë§??¤ë£¸
//
// ?¤ìŒ ?? runAnytimeV02?ì„œ deep budget ?ë‹¨?????Œì¼ ?¨ìˆ˜ë¡?ì¹˜í™˜(ë¶€ë¶?êµì²´)

import { z } from "zod";
import { BudgetV02 } from "./executionEnvelope";

export const DeepBudgetDecisionV02 = z.object({
  enabled: z.boolean(),
  unitsBudgeted: z.number().int().nonnegative(),
});

export type DeepBudgetDecisionV02 = z.infer<typeof DeepBudgetDecisionV02>;

export function decideDeepBudgetV02(budget: BudgetV02): DeepBudgetDecisionV02 {
  // SSOT: base/lite????ƒ ?˜í–‰, deep??deepMaxUnitsë¡œë§Œ ?œì–´
  const enabled = budget.deepMaxUnits > 0;
  return {
    enabled,
    unitsBudgeted: enabled ? budget.deepMaxUnits : 0,
  };
}
