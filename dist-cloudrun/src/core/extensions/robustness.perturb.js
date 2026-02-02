// src/core/extensions/robustness.perturb.ts
import { allowAnalytical } from "../anytime/exposure";
export const robustnessPerturbV02 = {
    moduleId: "robustness.perturb",
    tier: "deep",
    implemented: true,
    shouldRun(_ctx) {
        return true;
    },
    estimateUnits(_ctx) {
        return 2;
    },
    async run(ctx) {
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
        const output = { kind: "INLINE", inline };
        return {
            moduleId: "robustness.perturb",
            output: { kind: "INLINE", inline }, // ??boolean 말고 payload
            unitsUsed: 2,
            tags: analytical ? ["analytics", "stub"] : ["stub"],
        };
    },
};
