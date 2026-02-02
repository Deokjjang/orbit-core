import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { runItem1 } from '../src/items';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

function keys(o: any): string[] {
  return Object.keys(o).sort();
}

describe('Item1 contract (structure-only, no decision leakage)', () => {
  it('response keys are whitelisted and contains no internal ranking', () => {
    const res = runItem1({ requestId: 'i1', preset: 'FREE', seed: 1, init, constraints: [] });

    expect(keys(res)).toEqual(['itemId', 'map', 'outcome', 'requestId', 'traceKinds']);
    expect((res as any).rankingInternal).toBeUndefined();

    for (const row of res.map as any[]) {
      expect(keys(row)).toEqual(['attractorId', 'membersHint', 'summary']);
      expect(keys(row.summary)).toEqual(['riskDirection', 'topAxes', 'uncertaintyDensity']);

      // leak bans
      expect('percentile' in row).toBe(false);
      expect('score' in row).toBe(false);
      expect('prob' in row).toBe(false);
      expect('value' in row).toBe(false);
      expect('v' in row).toBe(false);
    }
  });
});
