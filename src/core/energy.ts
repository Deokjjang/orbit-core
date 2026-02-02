import type { Constraint, EnergyBreakdown, State } from './types';
import { evalConstraints } from './constraints';

export type BarrierMode = 'linear' | 'log1p' | 'reciprocal';

export interface EnergyOptions {
  // axis weights for base term
  w?: Partial<Record<'v' | 'r' | 'u' | 'i', number>>;
  // coupling terms: at most 2, names are keys in breakdown
  coupling?: Array<{
    name: string;
    weight: number;
    // returns a signed value; we square it to keep energy >= 0
    term: (s: State) => number;
  }>;
  barrierMode?: BarrierMode;
}

export interface EnergyResult {
  hardRejected: boolean;
  hardRejects: string[];
  breakdown: EnergyBreakdown;
}

function clamp01NonNeg(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return x < 0 ? 0 : x;
}

function barrierTransform(x: number, mode: BarrierMode): number {
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
export function computeEnergy(
  state: State,
  constraints: Constraint[],
  opts: EnergyOptions = {}
): EnergyResult {
  const w = { v: 1, r: 1, u: 1, i: 1, ...(opts.w ?? {}) };
  const barrierMode: BarrierMode = opts.barrierMode ?? 'log1p';

  // 1) constraints eval
  const ce = evalConstraints(state, constraints);

  // 2) base energy (square terms; v is still in energy space, not "reward" yet)
  const { v, r, u, i } = state.core;
  const base: Record<string, number> = {
    v: w.v * (v * v),
    r: w.r * (r * r),
    u: w.u * (u * u),
    i: w.i * (i * i),
  };

  // 3) coupling (<=2)
  const coupling: Record<string, number> = {};
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

  const total =
    Object.values(base).reduce((a, b) => a + b, 0) +
    Object.values(coupling).reduce((a, b) => a + b, 0) +
    barrier.reduce((a, b) => a + b.penalty, 0);

  const breakdown: EnergyBreakdown = {
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
