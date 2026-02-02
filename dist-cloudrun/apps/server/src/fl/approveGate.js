// apps/server/src/fl/approveGate.ts
// Phase 6 Step 2: Approval endpoint wiring (thin, Gate-owned)
import { createRequire } from "module";
import { getFirestore } from "firebase-admin/firestore";
import { assertGateAuthorization } from "./authorizeGate";
function resolveGateApprove() {
    const req = createRequire(import.meta.url);
    const candidates = [
        "apps/server/src/fl/gateKernel",
        "apps/server/src/fl/gate",
        "packages/fl-gate",
        "@dvem/fl-gate",
    ];
    const entryNames = ["approve", "approveGate", "approveExecution"];
    for (const p of candidates) {
        try {
            const mod = req(p);
            for (const n of entryNames) {
                if (typeof mod?.[n] === "function")
                    return mod[n];
            }
        }
        catch { }
    }
    throw new Error("gate_approve_kernel_not_found");
}
export async function approveGateExecution(args) {
    if (!args.wsId || !args.requestId || !args.approverUid) {
        throw new Error("missing_params");
    }
    // optional guard: ensure evidence exists before approval
    const db = getFirestore();
    const q = await db
        .collection(`workspaces/${args.wsId}/evidence`)
        .where("requestId", "==", args.requestId)
        .limit(1)
        .get();
    if (q.empty)
        throw new Error("evidence_not_found");
    const approve = resolveGateApprove();
    await assertGateAuthorization({
        wsId: args.wsId,
        uid: args.approverUid,
        action: "APPROVE",
    });
    return approve({
        wsId: args.wsId,
        requestId: args.requestId,
        approverUid: args.approverUid,
    });
}
