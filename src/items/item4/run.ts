import type { ItemRequestBase, ItemResponseBase } from '../envelope';
import { evaluate } from '../../core/evaluate';

export type HoldLabel = 'PROCEED' | 'HOLD' | 'STOP';

export interface Item4Request extends ItemRequestBase {
  prevLabel?: HoldLabel; // hysteresis input
}

export interface Item4Response extends ItemResponseBase {
  itemId: 'item4';
  label: HoldLabel;
  basis: {
    coreLabel: string; // from quantization (e.g. PROCEED/HOLD/STOP depending on gate impl)
    hysteresisApplied: boolean;
  };
}

// simple hysteresis: if previous was HOLD, require strong push to leave HOLD
function applyHysteresis(core: HoldLabel, prev?: HoldLabel): { label: HoldLabel; applied: boolean } {
  if (!prev) return { label: core, applied: false };

  if (prev === 'HOLD') {
    if (core === 'PROCEED' || core === 'STOP') {
      // damp 1-step transitions out of HOLD
      return { label: 'HOLD', applied: true };
    }
  }
  return { label: core, applied: false };
}

function normalizeLabel(x: string): HoldLabel {
  if (x === 'PROCEED') return 'PROCEED';
  if (x === 'STOP') return 'STOP';
  return 'HOLD';
}

export function runItem4(req: Item4Request): Item4Response {
  const res = evaluate(req.requestId, req.init, req.constraints, { preset: req.preset, seed: req.seed });

  const coreLabel = normalizeLabel(res.outcome.label);
  const h = applyHysteresis(coreLabel, req.prevLabel);

  return {
    requestId: res.requestId,
    itemId: 'item4',
    label: h.label,
    basis: { coreLabel, hysteresisApplied: h.applied },
  };
}
