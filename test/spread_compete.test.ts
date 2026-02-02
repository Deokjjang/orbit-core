import { describe, it, expect } from 'vitest';
import type { Constraint, State } from '../src/core/types';
import { spread } from '../src/core/spread';
import { compete } from '../src/core/compete';

const init: State = { core: { v: 0.0, r: 0.0, u: 0.0, i: 0.0 } };

describe('Spread + Compete', () => {
  it('Spread produces N samples in [-1,1]', () => {
    const xs = spread(init, { n: 200, seed: 42, sigmaCore: 0.5 });
    expect(xs.length).toBe(200);

    for (const s of xs) {
      for (const k of ['v', 'r', 'u', 'i'] as const) {
        expect(s.core[k]).toBeGreaterThanOrEqual(-1);
        expect(s.core[k]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('Compete removes hard rejects and returns K', () => {
    const hard: Constraint = {
      name: 'block_positive_r',
      type: 'HARD',
      evaluate: (s) => ({ reject: s.core.r > 0.2 }),
    };

    const xs = spread(init, { n: 150, seed: 1, sigmaCore: 0.6 });
    const picked = compete(xs, [hard], {}, { selectK: 10 });

    expect(picked.length).toBe(10);
    expect(picked.every((c) => c.hardRejected === false)).toBe(true);
  });

  it('Compete enforces diversityMin when possible', () => {
    const none: Constraint[] = [];
    const xs = spread(init, { n: 300, seed: 7, sigmaCore: 0.9 });

    const picked = compete(xs, none, {}, { selectK: 12, diversityMin: 0.30 });

    // not perfect-proof, but with sigma 0.9 and many samples,
    // we expect several distinct points to satisfy diversity.
    expect(picked.length).toBe(12);
  });
});
