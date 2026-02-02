import type { Constraint, State } from './types';
import { computeEnergy, type EnergyOptions } from './energy';

export interface Candidate {
  id: string;
  state: State;
  hardRejected: boolean;
  hardRejects: string[];
  totalEnergy: number;
}

export interface CompeteOptions {
  selectK: number;
  diversityMin?: number; // SSOT default 0.30
}

function coreDistance01(a: State, b: State): number {
  const da = a.core.v - b.core.v;
  const db = a.core.r - b.core.r;
  const dc = a.core.u - b.core.u;
  const dd = a.core.i - b.core.i;
  // max Euclidean distance in [-1,1]^4 is 4 -> normalize to [0,1]
  const d = Math.sqrt(da * da + db * db + dc * dc + dd * dd);
  return d / 4;
}

function farEnough(s: State, picked: State[], minD: number): boolean {
  for (const p of picked) {
    if (coreDistance01(s, p) < minD) return false;
  }
  return true;
}

/**
 * Compete ??select candidates with:
 * - HARD rejects removed
 * - lower energy first
 * - enforce diversityMin (default 0.30)
 *
 * If diversity blocks filling K, we fill remaining slots without diversity (do not stall).
 */
export function compete(
  states: State[],
  constraints: Constraint[],
  energyOpts: EnergyOptions = {},
  opts: CompeteOptions
): Candidate[] {
  const K = Math.max(1, Math.floor(opts.selectK));
  const diversityMin = opts.diversityMin ?? 0.30;

  const candidates: Candidate[] = states.map((s, idx) => {
    const e = computeEnergy(s, constraints, energyOpts);
    return {
      id: `c${idx}`,
      state: s,
      hardRejected: e.hardRejected,
      hardRejects: e.hardRejects,
      totalEnergy: e.breakdown.total,
    };
  });

  const valid = candidates.filter((c) => !c.hardRejected);
  valid.sort((a, b) => a.totalEnergy - b.totalEnergy);

  const picked: Candidate[] = [];
  const pickedStates: State[] = [];

  // pass 1: respect diversity
  for (const c of valid) {
    if (picked.length >= K) break;
    if (farEnough(c.state, pickedStates, diversityMin)) {
      picked.push(c);
      pickedStates.push(c.state);
    }
  }

  // pass 2: fill remaining ignoring diversity (never stall)
  if (picked.length < K) {
    for (const c of valid) {
      if (picked.length >= K) break;
      if (picked.find((x) => x.id === c.id)) continue;
      picked.push(c);
    }
  }

  return picked;
}
