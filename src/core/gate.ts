import type { QuantizationScale, QuantizedOutcome } from './types';

export function gateQuantize(percentile: number, scale: QuantizationScale): QuantizedOutcome {
  const buckets = scale;
  const z = Math.max(0, Math.min(buckets - 1, Math.floor((percentile / 100) * buckets)));

  const labels3 = ['STOP', 'HOLD', 'PROCEED'];
  const labels5 = ['STOP', 'HOLD', 'WATCH', 'PROCEED', 'STRONG_PROCEED'];
  const labels7 = ['STRONG_STOP', 'STOP', 'HOLD', 'WATCH', 'PROCEED', 'STRONG_PROCEED', 'MAX'];

  const labels =
    scale === 3 ? labels3 :
    scale === 5 ? labels5 : labels7;

  return { scale, z, label: labels[z] };
}
