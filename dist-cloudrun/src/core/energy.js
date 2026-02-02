import { evalConstraints } from './constraints';
function clamp01NonNeg(x) {
    if (!Number.isFinite(x))
        return 0;
    return x < 0 ? 0 : x;
}
function barrierTransform(x, mode) {
    const p = clamp01NonNeg(x);
    switch (mode) {
        case 'linear':
            return p;
        case 'log1p':
            return Math.log1p(p);
        case 'reciprocal':
            // higher penalty grows fast near 0 -> 1, stable for large values
            return p / (1 + p);
        default:
            return p;
    }
}
/**
 * Energy SSOT:
 * E = E_base(core) + E_coupling(<=2) + E_barrier(soft penalties)
 * HARD constraints do not add energy; they reject.
 */
export function computeEnergy(state, constraints, opts = {}) {
    const w = { v: 1, r: 1, u: 1, i: 1, ...(opts.w ?? {}) };
    const barrierMode = opts.barrierMode ?? 'log1p';
    // 1) constraints eval
    const ce = evalConstraints(state, constraints);
    // 2) base energy (square terms; v is still in energy space, not "reward" yet)
    const { v, r, u, i } = state.core;
    const base = {
        v: w.v * (v * v),
        r: w.r * (r * r),
        u: w.u * (u * u),
        i: w.i * (i * i),
    };
    // 3) coupling (<=2)
    const coupling = {};
    const couplings = opts.coupling ?? [];
    if (couplings.length > 2) {
        throw new Error('SSOT violation: coupling terms must be <= 2');
    }
    for (const c of couplings) {
        const t = c.term(state);
        coupling[c.name] = c.weight * (t * t);
    }
    // 4) barrier energy from soft penalties (transformed)
    const barrier = ce.softPenalties.map((x) => ({
        name: x.name,
        penalty: barrierTransform(x.penalty, barrierMode),
    }));
    const total = Object.values(base).reduce((a, b) => a + b, 0) +
        Object.values(coupling).reduce((a, b) => a + b, 0) +
        barrier.reduce((a, b) => a + b.penalty, 0);
    const breakdown = {
        base,
        coupling: Object.keys(coupling).length ? coupling : undefined,
        barrier: barrier.length ? barrier : undefined,
        total,
    };
    return {
        hardRejected: ce.hardRejected,
        hardRejects: ce.hardRejects,
        breakdown,
    };
}
