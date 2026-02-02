import { describe, it, expect } from 'vitest';
import type { Constraint, State } from '../src/core/types';
import { computeEnergy } from '../src/core/energy';
import { spread } from '../src/core/spread';
import { compete } from '../src/core/compete';
import { relax } from '../src/core/relax';
import { clusterDBSCAN } from '../src/core/cluster';

const init: State = { core: { v: 0, r: 0, u: 0, i: 0 } };

describe('Relax + Cluster', () => {
  it('Relax should not increase best energy for a set (typically decreases)', () => {
    const soft: Constraint = {
      name: 'u_soft',
      type: 'SOFT',
      evaluate: (s) => ({ penalty: Math.max(0, s.core.u - 0.1) }),
    };

    const xs = spread(init, { n: 200, seed: 11, sigmaCore: 0.7 });
    const picked = compete(xs, [soft], {}, { selectK: 25 }).map((c) => c.state);

    const beforeBest = Math.min(...picked.map((s) => computeEnergy(s, [soft]).breakdown.total));
    const relaxed = relax(picked, [soft], {}, { steps: 40, radius: 0.15, seed: 99 });
    const afterBest = Math.min(...relaxed.map((s) => computeEnergy(s, [soft]).breakdown.total));

    expect(afterBest).toBeLessThanOrEqual(beforeBest);
  });

  it('DBSCAN cluster returns 2~5 clusters (with fallback)', () => {
    const xs = spread(init, { n: 180, seed: 3, sigmaCore: 0.9 });
    const relaxed = relax(xs, [], {}, { steps: 10, radius: 0.10, seed: 1 });

    const res = clusterDBSCAN(relaxed, { eps: 0.06, minPts: 5, minClusters: 2, maxClusters: 5 });
    expect(res.clusters.length).toBeGreaterThanOrEqual(2);
    expect(res.clusters.length).toBeLessThanOrEqual(5);
  });
});
