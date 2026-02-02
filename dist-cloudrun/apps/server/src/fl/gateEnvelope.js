// apps/server/src/fl/gateEnvelope.ts
// Phase 5 Step 1: ORBIT -> FL Gate transport envelope (NO INTERPRETATION)
// SSOT: This file only defines transport shape + tiny builders. No policy logic.
// Helper: create minimal envelope without interpreting ORBIT.
export function buildFlGateEnvelope(args) {
    if (!args.requestId)
        throw new Error("missing_requestId");
    if (!args.wsId)
        throw new Error("missing_wsId");
    if (!args.policyDocId)
        throw new Error("missing_policyDocId");
    return {
        key: { wsId: args.wsId, requestId: args.requestId },
        policy: { policyDocId: args.policyDocId, version: args.policyVersion },
        actor: args.actor,
        orbit: {
            env: args.env,
            steps: args.steps,
            traces: args.traces,
            outputsByStep: args.outputsByStep,
        },
        intent: args.intent,
        createdAtMs: args.nowMs ?? Date.now(),
    };
}
