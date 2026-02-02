// src/core/evaluate.ts (FULL REPLACE)

import type {
  Constraint,
  Attractor,
  State,
  TraceEvent,
  EvaluateResultPublic,
  EvaluateResultInternal,
} from './types';

import type { EnergyOptions } from './energy';
import { computeEnergy } from './energy';

import { spread } from './spread';
import { compete } from './compete';
import { relax } from './relax';
import { clusterDBSCAN } from './cluster';
import { rankInternal } from './rank';
import { explainFromAttractor } from './explain';
import { gateQuantize } from './gate';
import { splitSeed } from './seed';

import type { PresetId } from './presets';
import { PRESETS, assertPreset } from './presets';

export interface EvaluateOptions {
  preset: PresetId;
  seed: number;
  energy?: EnergyOptions; // keep optional; preset doesn't override energy math
}

// stable sort helper
function stableSort<T>(xs: T[], key: (x: T) => number): T[] {
  return xs
    .map((x, i) => ({ x, i, k: key(x) }))
    .sort((a, b) => (a.k - b.k) || (a.i - b.i))
    .map((t) => t.x);
}

// ??Internal engine (single implementation SSOT)
export function evaluateInternal(
  requestId: string,
  init: State,
  constraints: Constraint[],
  opts: EvaluateOptions
): EvaluateResultInternal {
  const events: TraceEvent[] = [];

  const preset = PRESETS[opts.preset];
  assertPreset(preset);

  const seedSpread = splitSeed(opts.seed, 1);
  const seedRelax = splitSeed(opts.seed, 2);
  const seedCluster = splitSeed(opts.seed, 3); // reserved (cluster deterministic by input order)

  const energyOpts = opts.energy;

  // Pass1: Spread
  const xs = spread(init, { n: preset.spreadN, seed: seedSpread });
  events.push({ pass: 'pass1', kind: 'SPREAD', n: xs.length, seed: seedSpread });

  // Pass1: Compete
  const pickedStates = compete(xs, constraints, energyOpts, {
    selectK: preset.selectK,
    diversityMin: 0.30, // SSOT default
  }).map((c) => c.state);

  events.push({
    pass: 'pass1',
    kind: 'COMPETE',
    inN: xs.length,
    outK: pickedStates.length,
    diversityMin: 0.30,
  });

  // Pass2: Relax
  const relaxed = relax(pickedStates, constraints, energyOpts, {
    seed: seedRelax,
    steps: preset.relaxSteps,
    radius: preset.relaxRadius,
  });

  events.push({
    pass: 'pass2',
    kind: 'RELAX',
    inK: pickedStates.length,
    steps: preset.relaxSteps,
    radius: preset.relaxRadius,
    seed: seedRelax,
  });

  // Pass2: Cluster (stabilize input order first)
  const relaxedSorted = stableSort(relaxed, (s) => computeEnergy(s, constraints, energyOpts).breakdown.total);

  const cl = clusterDBSCAN(relaxedSorted, {
    eps: preset.eps,
    minPts: preset.minPts,
    minClusters: preset.minClusters,
    maxClusters: preset.maxClusters,
  });

  events.push({
    pass: 'pass2',
    kind: 'CLUSTER',
    inK: relaxedSorted.length,
    eps: preset.eps,
    minPts: preset.minPts,
    clusters: cl.clusters.length,
    noise: cl.noise.length,
  });

  // Attractors
  const rawAttractors: Attractor[] = cl.clusters.map((c) => {
    const e = computeEnergy(c.center, constraints, energyOpts);
    const a: Attractor = {
      id: 'tmp',
      center: c.center,
      energy: e.breakdown,
      members: c.members.length,
      signals: { topAxes: [], riskDirection: 'FLAT', uncertaintyDensity: 'MEDIUM' },
    };
    a.signals = explainFromAttractor(a);
    return a;
  });

  const attractorsSorted = stableSort(rawAttractors, (a) => a.energy.total).map((a, idx) => ({
    ...a,
    id: `a${idx + 1}`,
  }));

  // Rank (internal)
  const rankingInternal = rankInternal(attractorsSorted);
  events.push({ pass: 'pass2', kind: 'RANK', attractors: attractorsSorted.length });

  // Gate (expression only): median percentile
  const median =
    stableSort(rankingInternal, (x) => x.percentile)[Math.floor(rankingInternal.length / 2)]?.percentile ?? 50;

  const outcome = gateQuantize(median, preset.gateScale);

  events.push({
    pass: 'pass2',
    kind: 'GATE',
    scale: preset.gateScale,
    percentileBasis: 'median',
    label: outcome.label,
  });

  void seedCluster;

  return {
    requestId,
    attractors: attractorsSorted,
    rankingInternal,
    outcome,
    trace: { events },
  };
}

// ??Public wrapper (no percentile leak)
export function evaluate(
  requestId: string,
  init: State,
  constraints: Constraint[],
  opts: EvaluateOptions
): EvaluateResultPublic {
  const internal = evaluateInternal(requestId, init, constraints, opts);
  const { rankingInternal: _drop, ...pub } = internal;
  return pub;
}
