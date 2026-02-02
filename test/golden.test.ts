import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Constraint, State } from '../src/core/types';
import { evaluate } from '../src/core/evaluate';

// super-minimal rule parser for golden tests only (SSOT)
// Supported examples:
// - "core.r > 0.6"  (HARD reject)
// - "max(0, core.u - 0.2)" (SOFT penalty)
function makeConstraintFromRule(x: { name: string; type: 'HARD'|'SOFT'; rule: string }): Constraint {
  const rule = x.rule.trim();

  if (x.type === 'HARD') {
    // pattern: "core.<axis> > number"
    const m = rule.match(/^core\.(v|r|u|i)\s*>\s*(-?\d+(\.\d+)?)$/);
    if (!m) throw new Error(`Unsupported HARD rule: ${rule}`);
    const axis = m[1] as 'v'|'r'|'u'|'i';
    const thr = Number(m[2]);
    return {
      name: x.name,
      type: 'HARD',
      evaluate: (s) => ({ reject: s.core[axis] > thr }),
    };
  }

  // SOFT
  // pattern: "max(0, core.<axis> - number)"
  const m = rule.match(/^max\(0,\s*core\.(v|r|u|i)\s*-\s*(-?\d+(\.\d+)?)\s*\)$/);
  if (!m) throw new Error(`Unsupported SOFT rule: ${rule}`);
  const axis = m[1] as 'v'|'r'|'u'|'i';
  const thr = Number(m[2]);
  return {
    name: x.name,
    type: 'SOFT',
    evaluate: (s) => ({ penalty: Math.max(0, s.core[axis] - thr) }),
  };
}

type GoldenCase = {
  name: string;
  requestId: string;
  init: State;
  constraints: any[];
  opts: { preset: 'FREE'|'PLUS'|'PRO'|'ENTERPRISE_ANALYTICAL'; seed: number };
  expect: {
    attractorsMin: number;
    attractorsMax: number;
    allowedLabels: string[];
    mustHaveTraceKinds?: string[];
  };
};

describe('golden-set', () => {
  const dir = path.join(process.cwd(), 'test', 'golden', 'cases');
  const files = fs
  .readdirSync("test/golden/cases")
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !f.startsWith("adapter_"));

  for (const f of files) {
    const full = path.join(dir, f);
    const raw = fs.readFileSync(full, 'utf-8');
    const c = JSON.parse(raw) as GoldenCase;

    it(`${c.name} (${f})`, () => {
      const constraints: Constraint[] = (c.constraints ?? []).map((x) => makeConstraintFromRule(x));
      const res = evaluate(c.requestId, c.init, constraints, c.opts);

      expect(res.attractors.length).toBeGreaterThanOrEqual(c.expect.attractorsMin);
      expect(res.attractors.length).toBeLessThanOrEqual(c.expect.attractorsMax);
      expect(c.expect.allowedLabels).toContain(res.outcome.label);

      if (c.expect.mustHaveTraceKinds) {
        const kinds = res.trace.events.map((e: any) => e.kind);
        for (const k of c.expect.mustHaveTraceKinds) expect(kinds).toContain(k);
      }

      // SSOT guard: public output must not leak internal ranking
      expect((res as any).rankingInternal).toBeUndefined();
    });
  }
});
