// src/items/item2/run.ts

import type { ItemRequestBase } from '../envelope';
import { evaluate } from '../../core/evaluate';
import type { Item2Response, RiskTier } from './types';

function tierFromRiskSignal(
  direction: 'UP' | 'DOWN' | 'FLAT',
  uncertainty: 'LOW' | 'MEDIUM' | 'HIGH'
): RiskTier {
  // SSOT: risk-first, uncertainty increases tier conservatively
  if (direction === 'UP') return uncertainty === 'LOW' ? 'MEDIUM' : 'HIGH';
  if (direction === 'FLAT') return uncertainty === 'HIGH' ? 'MEDIUM' : 'LOW';
  return 'LOW'; // DOWN
}

export function runItem2(req: ItemRequestBase): Item2Response {
  const res = evaluate(req.requestId, req.init, req.constraints, {
    preset: req.preset,
    seed: req.seed,
  });

  return {
    requestId: res.requestId,
    itemId: 'item2',
    risk: res.attractors.map((a) => ({
      attractorId: a.id,
      tier: tierFromRiskSignal(a.signals.riskDirection, a.signals.uncertaintyDensity),
      direction: a.signals.riskDirection,
    })),
  };
}
