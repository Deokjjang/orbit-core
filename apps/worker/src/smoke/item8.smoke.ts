import { runItem8 } from "../../../../packages/orbit-items/item8";

async function main() {
  const never = runItem8({
    requestId: "smoke_item8_never",
    signals: [{ code: "resolved", severity: "LOW" }],
    meta: { stakes: "low" },
  });
  console.log("[NEVER]", never.timing, Boolean(never.revisitAt));

  const now = runItem8({
    requestId: "smoke_item8_now",
    signals: [{ code: "conflict_detected", severity: "HIGH" }],
    meta: { stakes: "low" },
  });
  console.log("[NOW]", now.timing, Boolean(now.revisitAt));

  const later = runItem8({
    requestId: "smoke_item8_later",
    signals: [{ code: "missing_evidence", severity: "MED" }],
    meta: { stakes: "low" },
  });
  console.log("[LATER]", later.timing, Boolean(later.revisitAt));
}

main();
