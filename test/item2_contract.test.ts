import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { runItem2 } from '../src/items';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

function keys(o: any): string[] {
  return Object.keys(o).sort();
}

describe('Item2 contract (risk-first, no value leak)', () => {
  it('response keys are whitelisted', () => {
    const res = runItem2({ requestId: 'i2', preset: 'FREE', seed: 1, init, constraints: [] });

    expect(keys(res)).toEqual(['itemId', 'requestId', 'risk']);
    expect(res.itemId).toBe('item2');

    for (const row of res.risk as any[]) {
      expect(keys(row)).toEqual(['attractorId', 'direction', 'tier']);
      // ensure no accidental value fields
      expect('v' in row).toBe(false);
      expect('value' in row).toBe(false);
      expect('score' in row).toBe(false);
      expect('percentile' in row).toBe(false);
    }
  });
});
