import { runItem10 } from "../../../../packages/orbit-items/item10";

async function main() {
  const ok = runItem10({
    requestId: "smoke_item10_ok",
    meta: { loop: 1, slots: 1, budget: { credits: 5 } },
    workspace: { id: "ws1", plan: "free" },
  });
  console.log("[OK]", ok.verdict, ok.signals.length);

  const hold = runItem10({
    requestId: "smoke_item10_hold",
    meta: { loop: 5 }, // exceeds free loop
    workspace: { id: "ws1", plan: "free" },
  });
  console.log("[HOLD]", hold.verdict, hold.signals.map(s => s.code));

  const block = runItem10({
    requestId: "smoke_item10_block",
    meta: { budget: { credits: 9999 } }, // exceeds free budget
    workspace: { id: "ws1", plan: "free" },
  });
  console.log("[BLOCK]", block.verdict, block.signals.map(s => s.code));
}

main();
