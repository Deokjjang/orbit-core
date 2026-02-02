import type { Attractor, ExplainSignals } from './types';

function density(u: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const au = Math.abs(u);
  if (au < 0.33) return 'LOW';
  if (au < 0.66) return 'MEDIUM';
  return 'HIGH';
}

export function explainFromAttractor(a: Attractor): ExplainSignals {
  const core = a.center.core;
  const axes = Object.entries(core)
    .map(([k, v]) => ({ k, w: Math.abs(v) }))
    .sort((x, y) => y.w - x.w)
    .slice(0, 2)
    .map((x) => x.k);

  return {
    topAxes: axes,
    riskDirection: core.r > 0.1 ? 'UP' : core.r < -0.1 ? 'DOWN' : 'FLAT',
    uncertaintyDensity: density(core.u),
  };
}
