// apps/server/src/routes/gateApprove.route.ts
// Express ?�???�거 (any ?�용)
import { approveGateExecution } from "../fl/approveGate";
export async function gateApproveHandler(req, res) {
    try {
        const { wsId, requestId } = req.body ?? {};
        const approverUid = req.user?.uid ?? req.body?.approverUid;
        if (!wsId || !requestId || !approverUid) {
            return res.status(400).json({ error: "missing_params" });
        }
        const result = await approveGateExecution({
            wsId,
            requestId,
            approverUid,
        });
        return res.status(200).json({ ok: true, result });
    }
    catch (e) {
        return res.status(400).json({ error: String(e?.message ?? e) });
    }
}
