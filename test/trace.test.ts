import { describe, it, expect } from 'vitest';
import type { Constraint, State } from '../src/core/types';
import { evaluateInternal, evaluate } from '../src/core/evaluate';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

describe('Evaluate (end-to-end)', () => {
  it('public evaluate returns no rankingInternal', () => {
    const soft: Constraint = {
      name: 'u_soft',
      type: 'SOFT',
      evaluate: (s) => ({ penalty: Math.max(0, s.core.u - 0.15) }),
    };

    const res = evaluate('req-42', init, [soft], { preset: 'FREE', seed: 7 });
    expect(res.attractors.length).toBeGreaterThanOrEqual(2);
    expect(res.attractors.length).toBeLessThanOrEqual(5);
    expect((res as any).rankingInternal).toBeUndefined();
  });

  it('internal evaluate contains rankingInternal', () => {
    const res = evaluateInternal('req-43', init, [], { preset: 'FREE', seed: 7 });
    expect(res.rankingInternal.length).toBeGreaterThan(0);
  });
});
