import { describe, it, expect } from 'vitest';
import type { Constraint, State } from '../src/core/types';
import { computeEnergy } from '../src/core/energy';

const baseState: State = { core: { v: 0.2, r: -0.1, u: 0.4, i: -0.3 } };

describe('energy + constraints', () => {
  it('hard constraint rejects without needing barrier energy', () => {
    const hard: Constraint = {
      name: 'no_positive_risk',
      type: 'HARD',
      evaluate: (s) => ({ reject: s.core.r > 0 }),
    };

    const res = computeEnergy({ core: { ...baseState.core, r: 0.5 } }, [hard]);
    expect(res.hardRejected).toBe(true);
    expect(res.hardRejects).toContain('no_positive_risk');
  });

  it('soft constraint adds barrier penalty', () => {
    const soft: Constraint = {
      name: 'u_soft',
      type: 'SOFT',
      evaluate: (s) => ({ penalty: Math.max(0, s.core.u - 0.2) }),
    };

    const res = computeEnergy(baseState, [soft], { barrierMode: 'linear' });
    expect(res.hardRejected).toBe(false);
    expect(res.breakdown.barrier?.length).toBe(1);
    expect(res.breakdown.total).toBeGreaterThan(0);
  });

  it('coupling terms are limited to <=2', () => {
    const soft: Constraint = {
      name: 'noop',
      type: 'SOFT',
      evaluate: () => ({ penalty: 0 }),
    };

    expect(() =>
      computeEnergy(baseState, [soft], {
        coupling: [
          { name: 'c1', weight: 1, term: (s) => s.core.u * s.core.r },
          { name: 'c2', weight: 1, term: (s) => s.core.u * s.core.i },
          { name: 'c3', weight: 1, term: (s) => s.core.v * s.core.r },
        ],
      })
    ).toThrow(/<= 2/);
  });
});
