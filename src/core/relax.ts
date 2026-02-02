import type { Constraint, State } from './types';
import { computeEnergy, type EnergyOptions } from './energy';
import { mulberry32, randNormal, clamp } from './rng';

export interface RelaxOptions {
  seed?: number;
  steps?: number;
  radius?: number;
}

/**
 * Relax (non-gradient):
 * - start from each state
 * - propose random neighbor within radius
 * - accept if energy strictly improves
 * - reapply constraints via computeEnergy (hard rejects block move)
 */
export function relax(
  states: State[],
  constraints: Constraint[],
  energyOpts: EnergyOptions = {},
  opts: RelaxOptions = {}
): State[] {
  const steps = opts.steps ?? 30;
  const radius = opts.radius ?? 0.18;
  const seed = opts.seed ?? 0;
  // 기존??rng 만들 ??opts.seed ?�고 ?�었?�면 ?�로 교체
  const rng = mulberry32(seed);

  return states.map((s0) => {
    let s = s0;

    let best = computeEnergy(s, constraints, energyOpts);
    // if hard rejected, keep as-is (caller should have filtered already)
    if (best.hardRejected) return s;

    for (let t = 0; t < steps; t++) {
      const c = s.core;
      const proposal: State = {
        core: {
          v: clamp(c.v + randNormal(rng, 0, radius), -1, 1),
          r: clamp(c.r + randNormal(rng, 0, radius), -1, 1),
          u: clamp(c.u + randNormal(rng, 0, radius), -1, 1),
          i: clamp(c.i + randNormal(rng, 0, radius), -1, 1),
        },
        optional: s.optional ? { ...s.optional } : undefined,
      };

      const e = computeEnergy(proposal, constraints, energyOpts);
      if (e.hardRejected) continue;

      if (e.breakdown.total < best.breakdown.total) {
        s = proposal;
        best = e; // accept-if-better
      }
    }

    return s;
  });
}
