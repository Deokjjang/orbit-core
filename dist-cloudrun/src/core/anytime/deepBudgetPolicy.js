// src/core/anytime/deepBudgetPolicy.ts
//
// ORBIT v0.2 SSOT ??Deep Budget Policy (baseResult + liteBundle always, deepBundle budgeted)
// 목적: deep ?�행???�예?????�동?�화?�로 강제?�는 ?�책 ?�이?��? 분리 고정
// - deepMaxUnits가 0?�면 deep 비활??
// - deep??registry ?�서?��? estimate 기�??�로�??�점
// - ?�책?� ?�영(?�레??�?분리: ?��? units�??�룸
//
// ?�음 ?? runAnytimeV02?�서 deep budget ?�단?????�일 ?�수�?치환(부�?교체)
import { z } from "zod";
export const DeepBudgetDecisionV02 = z.object({
    enabled: z.boolean(),
    unitsBudgeted: z.number().int().nonnegative(),
});
export function decideDeepBudgetV02(budget) {
    // SSOT: base/lite????�� ?�행, deep??deepMaxUnits로만 ?�어
    const enabled = budget.deepMaxUnits > 0;
    return {
        enabled,
        unitsBudgeted: enabled ? budget.deepMaxUnits : 0,
    };
}
