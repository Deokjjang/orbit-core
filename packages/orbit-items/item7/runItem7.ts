import {
  Item7RequestSchema,
  Item7ResultSchema,
  type Item7Request,
  type Item7Result,
} from "./schema";

/* ============================================================
 * Item7 ??Sense / Anomaly Detector (v0.1)
 *
 * Heuristics (signal-only):
 * - spike: sudden large delta between consecutive observations
 * - drift: consistent directional change across window
 * - oscillation: alternating sign deltas across window
 *
 * Notes:
 * - Uses simple, explainable heuristics (no scores exposed)
 * - Thresholds are internal constants (v0.1 conservative)
 * ============================================================ */

const SPIKE_THRESHOLD = 0.5;      // internal-only
const DRIFT_MIN_STEPS = 3;
const OSC_MIN_ALTERNATIONS = 3;

function deltas(vals: number[]): number[] {
  const ds: number[] = [];
  for (let i = 1; i < vals.length; i++) ds.push(vals[i] - vals[i - 1]);
  return ds;
}

function hasSpike(ds: number[]): boolean {
  return ds.some(d => Math.abs(d) >= SPIKE_THRESHOLD);
}

function hasDrift(ds: number[]): boolean {
  if (ds.length < DRIFT_MIN_STEPS) return false;
  const sign = Math.sign(ds[0]);
  if (sign === 0) return false;
  return ds.slice(1).every(d => Math.sign(d) === sign && Math.abs(d) > 0);
}

function hasOscillation(ds: number[]): boolean {
  let alternations = 0;
  for (let i = 1; i < ds.length; i++) {
    if (Math.sign(ds[i]) !== Math.sign(ds[i - 1]) && Math.sign(ds[i]) !== 0) {
      alternations++;
    }
  }
  return alternations >= OSC_MIN_ALTERNATIONS;
}

export function runItem7(raw: unknown): Item7Result {
  const req = Item7RequestSchema.parse(raw);

  const obs = req.observations;
  const window = req.meta?.window ?? obs.length;

  // pick last window
  const sliced = obs.slice(Math.max(0, obs.length - window));

  // analyze each axis independently; emit max-severity signal per axis
  const signals: Item7Result["signals"] = [];

  const axes: Array<keyof Item7Request["observations"][number]["state"]> = [
    "u",
    "r",
    "i",
    "v",
  ];

  for (const axis of axes) {
    const vals = sliced
      .map(o => o.state[axis])
      .filter((v): v is number => typeof v === "number");

    if (vals.length < 2) continue;

    const ds = deltas(vals);

    if (hasSpike(ds)) {
      signals.push({
        code: "spike_detected",
        severity: "HIGH",
        note: `spike on axis ${axis}`,
      });
      continue;
    }

    if (hasOscillation(ds)) {
      signals.push({
        code: "oscillation_detected",
        severity: "MED",
        note: `oscillation on axis ${axis}`,
      });
      continue;
    }

    if (hasDrift(ds)) {
      signals.push({
        code: "drift_detected",
        severity: "LOW",
        note: `drift on axis ${axis}`,
      });
      continue;
    }
  }

  if (signals.length === 0) {
    signals.push({
      code: "stable",
      severity: "LOW",
      note: "no significant anomaly detected",
    });
  }

  return Item7ResultSchema.parse({ signals });
}
