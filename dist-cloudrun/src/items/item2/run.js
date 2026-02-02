// src/items/item2/run.ts
import { evaluate } from '../../core/evaluate';
function tierFromRiskSignal(direction, uncertainty) {
    // SSOT: risk-first, uncertainty increases tier conservatively
    if (direction === 'UP')
        return uncertainty === 'LOW' ? 'MEDIUM' : 'HIGH';
    if (direction === 'FLAT')
        return uncertainty === 'HIGH' ? 'MEDIUM' : 'LOW';
    return 'LOW'; // DOWN
}
export function runItem2(req) {
    const res = evaluate(req.requestId, req.init, req.constraints, {
        preset: req.preset,
        seed: req.seed,
    });
    return {
        requestId: res.requestId,
        itemId: 'item2',
        risk: res.attractors.map((a) => ({
            attractorId: a.id,
            tier: tierFromRiskSignal(a.signals.riskDirection, a.signals.uncertaintyDensity),
            direction: a.signals.riskDirection,
        })),
    };
}
