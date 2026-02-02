import { evaluate } from '../../core/evaluate';
function membersTier(m) {
    if (m >= 40)
        return 'LARGE';
    if (m >= 15)
        return 'MEDIUM';
    return 'SMALL';
}
export function runItem1(req) {
    const res = evaluate(req.requestId, req.init, req.constraints, { preset: req.preset, seed: req.seed });
    return {
        requestId: res.requestId,
        itemId: 'item1',
        map: res.attractors.map((a) => ({
            attractorId: a.id,
            summary: {
                topAxes: a.signals.topAxes.map(String),
                riskDirection: a.signals.riskDirection,
                uncertaintyDensity: a.signals.uncertaintyDensity,
            },
            membersHint: membersTier(a.members),
        })),
        outcome: { label: res.outcome.label, scale: res.outcome.scale },
        traceKinds: res.trace.events.map((e) => e.kind),
    };
}
