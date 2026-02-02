// ORBIT v0.2 ??Anytime Handler (SSOT)
// 목적: ?��? ?�청 ??v0.2 Anytime ?�행 ?�일 ?�들??
// 경계: 결정/집행/?�책 ?�석 금�?, ?�행/?�반�?
import { runAnytimeV02 } from "../../../../src/core/anytime/runAnytime";
import { deepRegistryV02 } from "../../../../src/core/anytime/registry";
export async function handleAnytimeV02(body) {
    const { repro, budget, exposure, hooksInput = { base: {}, lite: {} } } = (body ?? {});
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
