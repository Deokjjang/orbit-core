// src/core/extensions/smc.changepoint.ts
import { allowAnalytical } from "../anytime/exposure";
export const smcChangepointV02 = {
    moduleId: "smc.changepoint",
    tier: "deep",
    implemented: true,
    shouldRun: (_ctx) => true,
    estimateUnits: (_ctx) => 2,
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
