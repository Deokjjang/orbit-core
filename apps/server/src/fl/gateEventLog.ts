// apps/server/src/fl/gateEventLog.ts
// Phase 9 Step 3: Idempotent event logger for FL Gate (best-effort, no throw)

import { getFirestore } from "firebase-admin/firestore";
import type { FlGateResult } from "./runGate";

export async function logGateResultEvent(args: {
  wsId: string;
  requestId: string;
  result: FlGateResult;
}) {
  try {
    const db = getFirestore();
    const id = `${args.wsId}_${args.requestId}_${args.result?.verdict ?? "NA"}`;
    await db
      .doc(`events/${id}`)
      .set(
        {
          type: "FL_GATE_RESULT",
          wsId: args.wsId,
          requestId: args.requestId,
          verdict: args.result?.verdict,
          evidenceId: args.result?.evidenceId,
          atMs: Date.now(),
        },
        { merge: true }
      );
  } catch {
    // swallow
  }
}
