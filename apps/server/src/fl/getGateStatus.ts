// apps/server/src/fl/getGateStatus.ts
// Phase 7 Step 1: Read-only Gate status query (no execution, no interpretation)

import { getFirestore } from "firebase-admin/firestore";

export type GateStatus =
  | { state: "NOT_FOUND" }
  | {
      state: "FOUND";
      verdict?: "ALLOW" | "REQUIRE_APPROVAL" | "BLOCK";
      approval?: { state: "PENDING" | "APPROVED"; approvedAtMs?: number };
      evidenceId?: string;
      updatedAtMs?: number;
    };

export async function getGateStatus(args: {
  wsId: string;
  requestId: string;
}): Promise<GateStatus> {
  const db = getFirestore();

  // evidence lookup (SSOT)
  const q = await db
    .collection(`workspaces/${args.wsId}/evidence`)
    .where("requestId", "==", args.requestId)
    .limit(1)
    .get();

  if (q.empty) return { state: "NOT_FOUND" };

  const doc = q.docs[0];
  const data = doc.data() as any;

  return {
    state: "FOUND",
    verdict: data.verdict,
    approval: data.approval,
    evidenceId: doc.id,
    updatedAtMs: data.updatedAtMs,
  };
}
