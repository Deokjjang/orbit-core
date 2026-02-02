// Public API (LOCKED)
// - Only export: evaluate + types + schemas
// - Do NOT export internal modules (spread/relax/cluster/rank/gate/etc.)

export { evaluate } from './core/evaluate';
// ✅ v0.2 anytime wrapper (단일 진입점)
export { evaluateWithAnytimeV02 } from "./core/anytime/router_v01_to_v02";
export { OrbitTraceSchema, TraceEventSchema } from './core/schema';

export type {
  Axis,
  CoreState,
  OptionalAxes,
  State,
  ConstraintType,
  Constraint,
  EnergyBreakdown,
  Attractor,
  ExplainSignals,
  QuantizationScale,
  QuantizedOutcome,
  EvaluateResultPublic,
  EvaluateResultInternal,
} from './core/types';

export {
  CoreStateSchema,
  StateSchema,
  EnergyBreakdownSchema,
  ExplainSignalsSchema,
  AttractorSchema,
  QuantizedOutcomeSchema,
  EvaluateResultSchema,
} from './core/schema';
