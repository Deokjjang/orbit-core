import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { runItem4 } from '../src/items';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

describe('Item4 hysteresis contract', () => {
  it('prev HOLD dampens leaving HOLD (1-step)', () => {
    // 어떤 seed에서는 coreLabel이 HOLD가 아닐 수 있으니, 여러 seed로 시도해 coreLabel이 PROCEED/STOP인 케이스를 찾는다.
    // 발견 즉시 "hysteresisApplied=true and label=HOLD"를 강제한다.
    let found = false;

    for (let seed = 1; seed <= 200; seed++) {
      const r = runItem4({ requestId: `i4-${seed}`, preset: 'FREE', seed, init, constraints: [], prevLabel: 'HOLD' });
      if (r.basis.coreLabel !== 'HOLD') {
        found = true;
        expect(r.basis.hysteresisApplied).toBe(true);
        expect(r.label).toBe('HOLD');
        break;
      }
    }

    expect(found).toBe(true);
  });
});
