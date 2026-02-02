import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { evaluateInternal } from '../src/core/evaluate';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

describe('determinism', () => {
  it('same input + same seed => identical output', () => {
    const a = evaluateInternal('req-a', init, [], { preset: 'FREE', seed: 777 });
    const b = evaluateInternal('req-a', init, [], { preset: 'FREE', seed: 777 });
    expect(a).toEqual(b);
  });

  it('different seed => usually different output', () => {
    const a = evaluateInternal('req-a', init, [], { preset: 'FREE', seed: 777 });
    const b = evaluateInternal('req-a', init, [], { preset: 'FREE', seed: 778 });

    // deterministic engine이지만 "다른 시드면 대체로 다름"
    // 최소한 attractor center 중 하나는 달라지는지 체크
    expect(JSON.stringify(a.attractors)).not.toEqual(JSON.stringify(b.attractors));
  });
});
