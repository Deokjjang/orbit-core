// apps/server/src/fl/gateAlert.ts
// Phase 17 Step 1: Consecutive failure detector + alert hook (read-only)

import { getFirestore } from "firebase-admin/firestore";

export type GateAlert = {
  wsId: string;
  requestId?: string;
  reason: "CONSECUTIVE_FAILURES";
  count: number;
  atMs: number;
};

export async function detectGateConsecutiveFailures(args: {
  wsId: string;
  windowMs: number;
  threshold: number; // e.g. 3
}): Promise<GateAlert | null> {
  const db = getFirestore();
  const since = Date.now() - args.windowMs;

  const snap = await db
    .collection("events")
    .where("wsId", "==", args.wsId)
    .where("type", "==", "FL_GATE_RESULT")
    .where("atMs", ">=", since)
    .orderBy("atMs", "desc")
    .limit(args.threshold)
    .get();

  if (snap.size < args.threshold) return null;

  let failures = 0;
  snap.docs.forEach(d => {
    const e = d.data() as any;
    if (e.verdict !== "ALLOW") failures += 1;
  });

  if (failures >= args.threshold) {
    return {
      wsId: args.wsId,
      reason: "CONSECUTIVE_FAILURES",
      count: failures,
      atMs: Date.now(),
    };
  }

  return null;
}
