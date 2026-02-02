import type { ChainStepId } from "../../../../packages/orbit-chain/contract";
import type { ItemRequestBase } from "../../../../src/items/envelope";

// Phase1 core items (server-only)
import { runItem1, runItem2, runItem4 } from "../../../../src/items";

export async function serverRunner(
  step: ChainStepId,
  payload: unknown
): Promise<unknown> {
  const req = payload as ItemRequestBase;

  switch (step) {
    case "item1":
      return runItem1(req);

    case "item2":
      return runItem2(req);

    case "item4":
      return runItem4(req);

    // Phase2+ items are NOT executed on server
    // worker is responsible
    default:
      return { signals: [] };
  }
}
