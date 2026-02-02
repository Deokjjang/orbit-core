import type { State } from './types';
import { clamp, mulberry32, randNormal } from './rng';

export interface SpreadOptions {
  n: number;
  seed?: number;
  // sampling noise (std dev) for core axes
  sigmaCore?: number;     // default 0.25
  // sampling noise for optional axes
  sigmaOptional?: number; // default 0.20
}

/**
 * Spread ??distribution sampling around an initial state.
 * - Clamps to [-1,1]
 * - Must work with optional axes absent
 */
export function spread(init: State, opts: SpreadOptions): State[] {
  const n = Math.max(1, Math.floor(opts.n));
  const rng = mulberry32(opts.seed ?? 123456789);
  const sigmaCore = opts.sigmaCore ?? 0.25;
  const sigmaOptional = opts.sigmaOptional ?? 0.20;

  const out: State[] = [];
  for (let k = 0; k < n; k++) {
    const c = init.core;
    const core = {
      v: clamp(c.v + randNormal(rng, 0, sigmaCore), -1, 1),
      r: clamp(c.r + randNormal(rng, 0, sigmaCore), -1, 1),
      u: clamp(c.u + randNormal(rng, 0, sigmaCore), -1, 1),
      i: clamp(c.i + randNormal(rng, 0, sigmaCore), -1, 1),
    };

    let optional: Record<string, number> | undefined = undefined;
    if (init.optional && Object.keys(init.optional).length) {
      optional = {};
      for (const [k2, v2] of Object.entries(init.optional)) {
        optional[k2] = clamp(v2 + randNormal(rng, 0, sigmaOptional), -1, 1);
      }
    }

    out.push(optional ? { core, optional } : { core });
  }
  return out;
}
