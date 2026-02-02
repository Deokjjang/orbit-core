import { runItem7 } from "../../../../packages/orbit-items/item7";

async function main() {
  // stable
  const stable = runItem7({
    requestId: "smoke_item7_stable",
    observations: [
      { t: 1, state: { u: 0.1 } },
      { t: 2, state: { u: 0.11 } },
      { t: 3, state: { u: 0.105 } },
    ],
  });
  console.log("[STABLE]", stable.signals.map(s => s.code));

  // spike
  const spike = runItem7({
    requestId: "smoke_item7_spike",
    observations: [
      { t: 1, state: { u: 0.1 } },
      { t: 2, state: { u: 0.9 } }, // big jump
      { t: 3, state: { u: 0.92 } },
    ],
  });
  console.log("[SPIKE]", spike.signals.map(s => s.code));

  // drift
  const drift = runItem7({
    requestId: "smoke_item7_drift",
    observations: [
      { t: 1, state: { u: 0.1 } },
      { t: 2, state: { u: 0.15 } },
      { t: 3, state: { u: 0.2 } },
      { t: 4, state: { u: 0.25 } },
    ],
  });
  console.log("[DRIFT]", drift.signals.map(s => s.code));

  // oscillation
  const oscillation = runItem7({
    requestId: "smoke_item7_osc",
    observations: [
      { t: 1, state: { u: 0.1 } },
      { t: 2, state: { u: -0.1 } },
      { t: 3, state: { u: 0.12 } },
      { t: 4, state: { u: -0.08 } },
      { t: 5, state: { u: 0.11 } },
    ],
  });
  console.log("[OSC]", oscillation.signals.map(s => s.code));
}

main();
