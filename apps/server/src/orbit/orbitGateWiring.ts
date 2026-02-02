import type { FlGateInputEnvelope } from "../fl/gateEnvelope";
import type { OrbitChainBundle } from "../fl/gateEnvelope";
import { runFlGateForOrbit, type FlGateResult } from "../fl/runGate";
import { createDefaultGateCaller } from "../fl/gateCaller";
import { getFirestore } from "firebase-admin/firestore";

export async function runGateAfterOrbit(args: {
  wsId: string;
  requestId: string;

  orbit: OrbitChainBundle;

  actor?: FlGateInputEnvelope["actor"];
  intent?: FlGateInputEnvelope["intent"];

  policyDocIdOverride?: string;
  nowMs?: number;
}): Promise<FlGateResult> {
  const callGate = createDefaultGateCaller();

  const gate = await runFlGateForOrbit({
    wsId: args.wsId,
    requestId: args.requestId,
    orbit: args.orbit,
    actor: args.actor,
    intent: args.intent,
    callGate,
    policyDocIdOverride: args.policyDocIdOverride,
    nowMs: args.nowMs,
  });

  // ---- Phase 6: Evidence SSOT write (best-effort, no side effects) ----
  if (gate?.evidenceId) {
    try {
      const db = getFirestore();
      const ref = db.doc(
        `workspaces/${args.wsId}/evidence/${gate.evidenceId}`
      );
      await ref.set(
        {
          requestId: args.requestId,
          createdAtMs: Date.now(),
          source: "FL_GATE",
        },
        { merge: true }
      );
    } catch {
      // intentionally swallowed: evidence write must not break ORBIT flow
    }
  }
  // --------------------------------------------------------------------

  return gate;
}
