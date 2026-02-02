import { Item8RequestSchema, Item8ResultSchema, } from "./schema";
/* ============================================================
 * Item8 ??Time & Revisit Scheduler (v0.1)
 *
 * Rules (signal-only):
 * - NEVER: when "no_action_needed" or "resolved" style signals exist
 * - NOW: default when stakes high OR conflict present
 * - LATER: when missing evidence / high uncertainty dominate
 *
 * BOUNDARY:
 * - MUST NOT emit HOLD
 * - timing is about revisit, not approval/execute
 * ============================================================ */
function hasSignal(req, code) {
    return (req.signals ?? []).some(s => s.code === code);
}
function anyCodePrefix(req, prefix) {
    return (req.signals ?? []).some(s => s.code.startsWith(prefix));
}
export function runItem8(raw) {
    const req = Item8RequestSchema.parse(raw);
    const signals = [];
    const stakes = req.meta?.stakes ?? "low";
    const hasResolved = hasSignal(req, "resolved") || hasSignal(req, "no_action_needed");
    const hasConflict = hasSignal(req, "conflict_detected") ||
        anyCodePrefix(req, "conflict_") ||
        hasSignal(req, "disagree") ||
        hasSignal(req, "models_disagree");
    const hasMissing = hasSignal(req, "missing_evidence") ||
        anyCodePrefix(req, "missing_") ||
        hasSignal(req, "constraints_missing");
    const hasHighU = hasSignal(req, "u_high") || anyCodePrefix(req, "u_");
    // NEVER when clearly resolved
    if (hasResolved) {
        signals.push({
            code: "stable_now",
            severity: "LOW",
            note: "signals indicate resolved/stable",
        });
        return Item8ResultSchema.parse({
            timing: "NEVER",
            signals,
        });
    }
    // NOW when stakes high or conflict present
    if (stakes === "high" || hasConflict) {
        signals.push({
            code: hasConflict ? "revisit_now_conflict" : "revisit_now_high_stakes",
            severity: "HIGH",
            note: "immediate revisit suggested",
        });
        return Item8ResultSchema.parse({
            timing: "NOW",
            signals,
        });
    }
    // LATER when missing/high uncertainty
    if (hasMissing || hasHighU) {
        // simple default: 24h later; no timezone assumption (ISO)
        const revisitAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        signals.push({
            code: "revisit_suggested",
            severity: "MED",
            note: "revisit suggested due to uncertainty/missing signals",
        });
        return Item8ResultSchema.parse({
            timing: "LATER",
            revisitAt,
            signals,
        });
    }
    // default: NOW (low friction)
    signals.push({
        code: "revisit_now_default",
        severity: "LOW",
        note: "default revisit",
    });
    return Item8ResultSchema.parse({
        timing: "NOW",
        signals,
    });
}
