import { describe, it, expect } from 'vitest';

// ✅ must import ONLY from package root (public API)
import { evaluate, EvaluateResultSchema } from '../src/index.ts';
process.env.ORBIT_ALLOW_V01_WRAP = "1";

describe('public API lock', () => {
  it('evaluate + schemas are reachable from public entry', () => {
    expect(typeof evaluate).toBe('function');
    expect(typeof EvaluateResultSchema.safeParse).toBe('function');
  });
});
