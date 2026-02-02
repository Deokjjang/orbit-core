// src/core/anytime/router_v01_to_v02.ts
//
// ORBIT v0.2 SSOT ??Non-intrusive Router (v0.1 ??v0.2)
// 목적: 기존 v0.1 evaluate/chain??**?�정 ?�이** 감싸??
//       Anytime v0.2 ExecutionEnvelope�??�격.
// ?�칙: 비침?? 결과 ?�염 금�?, 결정/?��?부??금�?.
//
// ?�음 ?? ???�우?��? ?�제 ?�출 지???�버/?�커) ??곳에�??�결
import { runAnytimeV02 } from "./runAnytime";
import { deepRegistryV02 } from "./registry";
import { ResultRefV02 } from "./executionEnvelope";
// v0.1 entry (기존 그�?�??�용)
import { evaluate } from "../evaluate"; // ??기존 v0.1 ?��? 진입??
// ... 중략 ...
export async function evaluateWithAnytimeV02(args) {
    // ??가?�는 "?�기" (?�수 바디 최상??
    if (process.env.ORBIT_ALLOW_V01_WRAP !== "1") {
        throw new Error("V01_WRAP_DISABLED");
    }
    return runAnytimeV02({
        repro: {
            requestId: args.repro.requestId,
            seed: args.repro.seed,
            presetId: args.repro.presetId,
            codeVersion: args.repro.codeVersion,
            docHash: args.repro.docHash,
            adapterVersion: args.repro.adapterVersion,
            rulePackIds: args.repro.rulePackIds ?? [],
        },
        budget: args.budget,
        hooks: {
            runBase: async () => {
                const out = await evaluate(...args.v01);
                return {
                    coreResult: ResultRefV02.parse({ kind: "INLINE", inline: out }),
                    minBar: {
                        hasOptionsStructure: true,
                        hasRiskOrStabilitySignals: true,
                        hasHoldOrProceedReason: true,
                        hasWorstOrStableScenario: true,
                    },
                    coreInternal: out,
                };
            },
            buildLite: async () => ({
                signals: { v01: "wrapped" },
                notes: ["wrapped v0.1 output; signal-only"],
            }),
        },
        deepRegistry: deepRegistryV02,
    });
}
