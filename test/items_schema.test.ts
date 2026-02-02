import { describe, it, expect } from 'vitest';
import type { State } from '../src/core/types';
import { runItem1, runItem2, runItem4 } from '../src/items';
import { Item1ResponseSchema, Item2ResponseSchema, Item4ResponseSchema } from '../src/items/schemas';

const init: State = { core: { v: 0.1, r: 0.0, u: 0.2, i: -0.1 } };

describe('items schemas', () => {
  it('item1 schema validates', () => {
    const r = runItem1({ requestId: 's1', preset: 'FREE', seed: 1, init, constraints: [] });
    expect(Item1ResponseSchema.safeParse(r).success).toBe(true);
  });

  it('item2 schema validates', () => {
    const r = runItem2({ requestId: 's2', preset: 'FREE', seed: 2, init, constraints: [] });
    expect(Item2ResponseSchema.safeParse(r).success).toBe(true);
  });

  it('item4 schema validates', () => {
    const r = runItem4({ requestId: 's4', preset: 'FREE', seed: 3, init, constraints: [], prevLabel: 'HOLD' });
    expect(Item4ResponseSchema.safeParse(r).success).toBe(true);
  });
});
