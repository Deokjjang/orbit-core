// ORBIT Core — SSOT Types (v0.1)

export type Axis = number; // [-1, 1]

export interface CoreState {
  v: Axis; // value
  r: Axis; // risk
  u: Axis; // uncertainty
  i: Axis; // irreversibility
}

export type OptionalAxes = Record<string, Axis>;

export interface State {
  core: CoreState;
  optional?: OptionalAxes;
}

export type ConstraintType = 'HARD' | 'SOFT';

export interface Constraint {
  name: string;
  type: ConstraintType;
  // HARD: true => reject
  // SOFT: penalty >= 0
  evaluate: (s: State) => { reject?: boolean; penalty?: number };
}

export interface EnergyBreakdown {
  base: Record<string, number>;      // per-axis contributions
  coupling?: Record<string, number>; // at most 2 terms
  barrier?: Array<{ name: string; penalty: number }>;
  total: number;
}

export interface Attractor {
  id: string;
  center: State;
  energy: EnergyBreakdown;
  members: number; // count
  signals: ExplainSignals;
}

export interface ExplainSignals {
  topAxes: Array<keyof CoreState | string>;
  riskDirection: 'UP' | 'DOWN' | 'FLAT';
  uncertaintyDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  couplingHints?: string[];
}

export type QuantizationScale = 3 | 5 | 7;

export interface QuantizedOutcome {
  scale: QuantizationScale;
  z: number; // bucket index
  label: string;
}

export interface EvaluateResultPublic {
  requestId: string;
  attractors: Attractor[];
  outcome: QuantizedOutcome;
  trace: OrbitTrace;
}

export interface EvaluateResultInternal extends EvaluateResultPublic {
  // internal only
  rankingInternal: Array<{ attractorId: string; percentile: number }>;
}

export type PassId = 'pass1' | 'pass2';

export type TraceEvent =
  | { pass: PassId; kind: 'SPREAD'; n: number; seed: number }
  | { pass: PassId; kind: 'CONSTRAINTS'; hardRejected: number; softCount: number }
  | { pass: PassId; kind: 'COMPETE'; inN: number; outK: number; diversityMin: number }
  | { pass: PassId; kind: 'RELAX'; inK: number; steps: number; radius: number; seed: number }
  | { pass: PassId; kind: 'CLUSTER'; inK: number; eps: number; minPts: number; clusters: number; noise: number }
  | { pass: PassId; kind: 'RANK'; attractors: number }
  | { pass: 'pass2'; kind: 'GATE'; scale: QuantizationScale; percentileBasis: 'median'; label: string };

export interface OrbitTrace {
  events: TraceEvent[];
}
