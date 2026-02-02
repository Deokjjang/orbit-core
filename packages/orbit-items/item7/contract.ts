/* ============================================================
 * Item7 — Sense / Anomaly Detector (Contract v0.1)
 * PURPOSE:
 * - detects transition anomalies from state stream
 * - signals only (drift / spike / oscillation)
 *
 * BOUNDARY:
 * - NO gate / decision / recommendation
 * - NO content judgment
 * - NO numeric score/probability exposure
 * ============================================================ */

export type Item7SignalCode =
  | "drift_detected"
  | "spike_detected"
  | "oscillation_detected"
  | "stable";

export type Item7Request = {
  requestId: string;

  // minimal rolling state observations
  observations: Array<{
    t: number; // timestamp (ms or logical tick)
    state: {
      u?: number;
      r?: number;
      i?: number;
      v?: number;
    };
  }>;

  // optional hints
  meta?: {
    window?: number; // observation window size
  };
};

export type Item7Result = {
  signals: Array<{
    code: Item7SignalCode;
    severity: "LOW" | "MED" | "HIGH";
    note?: string;
  }>;
};
