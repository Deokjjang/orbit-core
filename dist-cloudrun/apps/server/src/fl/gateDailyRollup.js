// apps/server/src/fl/gateDailyRollup.ts
// Phase 12 Step 1: Daily rollup for FL Gate events (read-only aggregation)
import { getFirestore } from "firebase-admin/firestore";
function toDateKey(ts) {
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
export async function buildGateDailyRollup(args) {
    const db = getFirestore();
    const snap = await db
        .collection("events")
        .where("wsId", "==", args.wsId)
        .where("type", "==", "FL_GATE_RESULT")
        .where("atMs", ">=", args.fromMs)
        .where("atMs", "<=", args.toMs)
        .get();
    const map = new Map();
    snap.docs.forEach((d) => {
        const e = d.data();
        const key = toDateKey(e.atMs);
        if (!map.has(key)) {
            map.set(key, { date: key, total: 0, byVerdict: {} });
        }
        const r = map.get(key);
        r.total += 1;
        const v = String(e.verdict ?? "NA");
        r.byVerdict[v] = (r.byVerdict[v] ?? 0) + 1;
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
