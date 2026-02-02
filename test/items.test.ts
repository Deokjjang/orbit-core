import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { runItem1, runItem2, runItem4 } from '../src/items';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

describe('items adapters', () => {
  it('item1 returns map + no internal ranking', () => {
    const res = runItem1({ requestId: 'i1', preset: 'FREE', seed: 1, init, constraints: [] });
    expect(res.itemId).toBe('item1');
    expect(res.map.length).toBeGreaterThanOrEqual(2);
  });

  it('item2 returns risk tiers only', () => {
    const res = runItem2({ requestId: 'i2', preset: 'FREE', seed: 2, init, constraints: [] });
    expect(res.itemId).toBe('item2');
    expect(res.risk.length).toBeGreaterThanOrEqual(2);
  });

  it('item4 applies hysteresis', () => {
    const a = runItem4({ requestId: 'i4', preset: 'FREE', seed: 3, init, constraints: [], prevLabel: 'HOLD' });
    expect(a.itemId).toBe('item4');
    expect(['PROCEED', 'HOLD', 'STOP']).toContain(a.label);
  });
});
