// apps/server/src/fl/gateSlo.ts
// Phase 16 Step 1: SLO metrics for FL Gate (read-only)
import { getFirestore } from "firebase-admin/firestore";
export async function computeGateSlo(args) {
    const db = getFirestore();
    const snap = await db
        .collection("events")
        .where("wsId", "==", args.wsId)
        .where("atMs", ">=", args.fromMs)
        .where("atMs", "<=", args.toMs)
        .get();
    let total = 0, success = 0, failure = 0, retries = 0;
    const latencies = [];
    snap.docs.forEach(d => {
        const e = d.data();
        if (e.type === "FL_GATE_RESULT") {
            total += 1;
            if (e.verdict === "ALLOW")
                success += 1;
            else
                failure += 1;
            if (typeof e.latencyMs === "number")
                latencies.push(e.latencyMs);
        }
        if (e.type === "FL_GATE_RETRY")
            retries += 1;
    });
    latencies.sort((a, b) => a - b);
    const pick = (p) => latencies.length
        ? latencies[Math.floor(p * latencies.length)]
        : undefined;
    return {
        windowMs: args.toMs - args.fromMs,
        total, success, failure, retries,
        p50LatencyMs: pick(0.5),
        p95LatencyMs: pick(0.95),
    };
}
