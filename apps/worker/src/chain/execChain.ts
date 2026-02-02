import { runOrbitChain } from "../../../../packages/orbit-chain/runChain";
import type {
  ChainInput,
  ChainOptions,
  ChainStepId,
} from "../../../../packages/orbit-chain/contract";

// ê¸°ì¡´ item executors
import { execItem3 } from "../items/item3";
import { execItem5 } from "../items/item5";
import { execItem6 } from "../items/item6";
import { execItem7 } from "../items/item7";
import { execItem8 } from "../items/item8";
import { execItem9 } from "../items/item9";
import { execItem10 } from "../items/item10";
// item1/2/4???´ë? ì¡´ìž¬?œë‹¤ê³?ê°€??

const runner = async (step: ChainStepId, payload: unknown) => {
  switch (step) {
    case "item3": return execItem3(payload);
    case "item5": return execItem5(payload);
    case "item6_pre":case "item6_post":return execItem6(payload);
    case "item7": return execItem7(payload);
    case "item8": return execItem8(payload);
    case "item9": return execItem9(payload);
    case "item10": return execItem10(payload);

    // Phase1 items ??trace only
    case "item1":
    case "item2":
    case "item4":
      return { signals: [{ code: "phase1_noop", severity: "LOW" }] };

    default:
      return { signals: [{ code: "unknown_step", severity: "LOW" }] };
  }
};

export async function execChain(input: ChainInput, options: ChainOptions) {
  return runOrbitChain(input, options, runner, "worker");
}
