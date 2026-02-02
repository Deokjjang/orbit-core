// apps/server/src/fl/gateEnvelope.ts
// Phase 5 Step 1: ORBIT -> FL Gate transport envelope (NO INTERPRETATION)
// SSOT: This file only defines transport shape + tiny builders. No policy logic.

// ORBIT output is opaque to FL Gate transport layer.
export type Opaque = unknown;

export type FlVerdict = "ALLOW" | "REQUIRE_APPROVAL" | "BLOCK";
export type ApprovalState = "PENDING" | "APPROVED";

export type PolicyRef = {
  policyDocId: string; // workspaces/{wsId}/meta/settings.activePolicyDocId (resolved outside)
  version?: string; // optional if policy doc embeds version
};

// Minimal identity for idempotency & audit correlation
export type GateRequestKey = {
  wsId: string;
  requestId: string; // ORBIT requestId SSOT (must exist)
};

// ORBIT trace is carried as-is. No signal parsing here.
export type OrbitChainTrace = {
  step: string; // e.g. "item6_post"
  status: "SUCCEEDED" | "SKIPPED" | "FAILED";
  signalShape?: "none" | "array" | "object" | "other";
  // MUST remain opaque. Gate must not interpret ORBIT signals.
  signals?: Opaque;
};

export type OrbitChainBundle = {
  env: "worker" | "server";
  steps: string[]; // ordered steps executed/attempted
  traces: OrbitChainTrace[];
  // outputs remain opaque; Gate must not depend on internal structure
  outputsByStep?: Record<string, Opaque>;
};

// What FL Gate receives from ORBIT-side server wiring.
// This is a transport container, not a decision input with semantics.
export type FlGateInputEnvelope = {
  key: GateRequestKey;
  policy: PolicyRef;

  // Optional caller metadata (for audit), not used for decisions here.
  actor?: {
    uid?: string;
    ip?: string;
    userAgent?: string;
  };

  orbit: OrbitChainBundle;

  // Optional execution intent metadata (Gate owns execution/idempotency).
  intent?: {
    kind: "DRY_RUN" | "EXECUTE";
    // client-provided idempotency key is allowed, but Gate should enforce single EXECUTION event.
    idempotencyKey?: string;
  };

  createdAtMs: number;
};

// Helper: create minimal envelope without interpreting ORBIT.
export function buildFlGateEnvelope(args: {
  wsId: string;
  requestId: string;
  policyDocId: string;
  policyVersion?: string;

  env: "worker" | "server";
  steps: string[];
  traces: OrbitChainTrace[];
  outputsByStep?: Record<string, Opaque>;

  actor?: FlGateInputEnvelope["actor"];
  intent?: FlGateInputEnvelope["intent"];
  nowMs?: number;
}): FlGateInputEnvelope {
  if (!args.requestId) throw new Error("missing_requestId");
  if (!args.wsId) throw new Error("missing_wsId");
  if (!args.policyDocId) throw new Error("missing_policyDocId");

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
