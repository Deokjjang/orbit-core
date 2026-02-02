import { evaluate } from '../../core/evaluate';
// simple hysteresis: if previous was HOLD, require strong push to leave HOLD
function applyHysteresis(core, prev) {
    if (!prev)
        return { label: core, applied: false };
    if (prev === 'HOLD') {
        if (core === 'PROCEED' || core === 'STOP') {
            // damp 1-step transitions out of HOLD
            return { label: 'HOLD', applied: true };
        }
    }
    return { label: core, applied: false };
}
function normalizeLabel(x) {
    if (x === 'PROCEED')
        return 'PROCEED';
    if (x === 'STOP')
        return 'STOP';
    return 'HOLD';
}
export function runItem4(req) {
    const res = evaluate(req.requestId, req.init, req.constraints, { preset: req.preset, seed: req.seed });
    const coreLabel = normalizeLabel(res.outcome.label);
    const h = applyHysteresis(coreLabel, req.prevLabel);
    return {
        requestId: res.requestId,
        itemId: 'item4',
        label: h.label,
        basis: { coreLabel, hysteresisApplied: h.applied },
    };
}
