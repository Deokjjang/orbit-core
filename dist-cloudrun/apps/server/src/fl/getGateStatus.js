// apps/server/src/fl/getGateStatus.ts
// Phase 7 Step 1: Read-only Gate status query (no execution, no interpretation)
import { getFirestore } from "firebase-admin/firestore";
export async function getGateStatus(args) {
    const db = getFirestore();
    // evidence lookup (SSOT)
    const q = await db
        .collection(`workspaces/${args.wsId}/evidence`)
        .where("requestId", "==", args.requestId)
        .limit(1)
        .get();
    if (q.empty)
        return { state: "NOT_FOUND" };
    const doc = q.docs[0];
    const data = doc.data();
    return {
        state: "FOUND",
        verdict: data.verdict,
        approval: data.approval,
        evidenceId: doc.id,
        updatedAtMs: data.updatedAtMs,
    };
}
