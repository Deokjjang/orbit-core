// apps/server/src/fl/gateContext.ts
// Phase 15 Step 1: SSOT execution context for FL Gate

export type GateExecutionContext = {
  wsId: string;
  requestId: string;
  uid?: string; // actor/approver
  intent: "DRY_RUN" | "EXECUTE";
  attempt: number;
  startedAtMs: number;
};

export function createGateContext(args: {
  wsId: string;
  requestId: string;
  uid?: string;
  intent: "DRY_RUN" | "EXECUTE";
  attempt?: number;
}): GateExecutionContext {
  return {
    wsId: args.wsId,
    requestId: args.requestId,
    uid: args.uid,
    intent: args.intent,
    attempt: args.attempt ?? 0,
    startedAtMs: Date.now(),
  };
}
