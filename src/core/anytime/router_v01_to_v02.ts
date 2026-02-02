// src/core/anytime/router_v01_to_v02.ts
//
// ORBIT v0.2 SSOT ??Non-intrusive Router (v0.1 ??v0.2)
// ëª©ì : ê¸°ì¡´ v0.1 evaluate/chain??**?˜ì • ?†ì´** ê°ì‹¸??
//       Anytime v0.2 ExecutionEnvelopeë¡??¹ê²©.
// ?ì¹™: ë¹„ì¹¨?? ê²°ê³¼ ?¤ì—¼ ê¸ˆì?, ê²°ì •/?˜ë?ë¶€??ê¸ˆì?.
//
// ?¤ìŒ ?? ???¼ìš°?°ë? ?¤ì œ ?¸ì¶œ ì§€???œë²„/?Œì»¤) ??ê³³ì—ë§??°ê²°

import { runAnytimeV02 } from "./runAnytime";
import { deepRegistryV02 } from "./registry";
import { ResultRefV02 } from "./executionEnvelope";
import { DeepModuleRegistryV02 } from "./deepModule";

// v0.1 entry (ê¸°ì¡´ ê·¸ë?ë¡??¬ìš©)
import { evaluate } from "../evaluate"; // ??ê¸°ì¡´ v0.1 ?‰ê? ì§„ì…??

// êµì²´ 1) v0.1 evaluate ?œê·¸?ˆì²˜ë¥?ê·¸ë?ë¡?ë°›ê¸°
type V01Args = Parameters<typeof evaluate>; // [input, opts, init, hooks] ê°™ì? 4?œí”Œ
type V01Output = Awaited<ReturnType<typeof evaluate>>;

// ... ì¤‘ëµ ...

export async function evaluateWithAnytimeV02(args: {
  v01: V01Args;
  repro: {
    requestId: string;
    seed: number;
    presetId: string;
    codeVersion: string;
    docHash?: string;
    adapterVersion?: string;
    rulePackIds?: string[];
  };
  budget: { totalUnits: number; deepMaxUnits: number };
}) {
  // ??ê°€?œëŠ” "?¬ê¸°" (?¨ìˆ˜ ë°”ë”” ìµœìƒ??
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
        const out: V01Output = await evaluate(...args.v01);
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
