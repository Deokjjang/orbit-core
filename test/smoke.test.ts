import { describe, it, expect } from 'vitest';
import { EvaluateResultInternalSchema } from '../src/core/schema';


describe('ORBIT Core smoke', () => {
  it('validates minimal EvaluateResult', () => {
    const sample = {
      requestId: 'req-1',
      attractors: [{
        id: 'a1',
        center: { core: { v: 0.2, r: -0.1, u: 0.4, i: -0.3 } },
        energy: {
          base: { v: 0.04, r: 0.01, u: 0.16, i: 0.09 },
          total: 0.30
        },
        members: 12,
        signals: {
          topAxes: ['u', 'v'],
          riskDirection: 'FLAT',
          uncertaintyDensity: 'MEDIUM'
        }
      }],
      rankingInternal: [{ attractorId: 'a1', percentile: 50 }],
      outcome: { scale: 3, z: 1, label: 'HOLD' },

      // ✅ NEW: trace 필수
      trace: {
        events: [
          { pass: 'pass1', kind: 'SPREAD', n: 1, seed: 1 },
          { pass: 'pass1', kind: 'COMPETE', inN: 1, outK: 1, diversityMin: 0.30 },
          { pass: 'pass2', kind: 'RELAX', inK: 1, steps: 30, radius: 0.18, seed: 2 },
          { pass: 'pass2', kind: 'CLUSTER', inK: 1, eps: 0.06, minPts: 5, clusters: 1, noise: 0 },
          { pass: 'pass2', kind: 'RANK', attractors: 1 },
          { pass: 'pass2', kind: 'GATE', scale: 3, percentileBasis: 'median', label: 'HOLD' },
        ]
      }
    };

    const parsed = EvaluateResultInternalSchema.safeParse(sample);
    if (!parsed.success) {
      // 디버그용: 어떤 필드가 깨지는지 즉시 보이게
      // eslint-disable-next-line no-console
      console.log(parsed.error.format());
    }
    expect(parsed.success).toBe(true);
  });
});
