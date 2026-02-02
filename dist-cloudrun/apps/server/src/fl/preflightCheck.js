// apps/server/src/fl/preflightCheck.ts
// Phase 11 Step 1: Preflight checks before EXECUTE (HARD FAIL on violation)
export function assertGatePreflight(args) {
    if (!args.wsId)
        throw new Error("preflight_missing_wsId");
    if (!args.requestId)
        throw new Error("preflight_missing_requestId");
    if (args.intentKind === "EXECUTE") {
        const env = process.env.NODE_ENV ?? "development";
        if (env !== "production") {
            throw new Error("preflight_execute_non_production");
        }
        if (process.env.FL_EXECUTE_ENABLED !== "true") {
            throw new Error("preflight_execute_flag_disabled");
        }
        if (!args.approverUid) {
            throw new Error("preflight_missing_approverUid");
        }
    }
}
