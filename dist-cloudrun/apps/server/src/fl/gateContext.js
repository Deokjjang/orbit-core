// apps/server/src/fl/gateContext.ts
// Phase 15 Step 1: SSOT execution context for FL Gate
export function createGateContext(args) {
    return {
        wsId: args.wsId,
        requestId: args.requestId,
        uid: args.uid,
        intent: args.intent,
        attempt: args.attempt ?? 0,
        startedAtMs: Date.now(),
    };
}
