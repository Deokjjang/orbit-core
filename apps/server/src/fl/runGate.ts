// apps/server/src/fl/runGate.ts
// Phase 5 Step 2: Server wiring (resolve activePolicyDocId -> build envelope -> call Gate)
// SSOT: No ORBIT interpretation. No policy logic here. Just transport + wiring.
import { sendGateAlert } from "./gateAlertSender";
import { detectGateConsecutiveFailures } from "./gateAlert";
import { createGateContext } from "./gateContext";
import { decideGateRetry } from "./retryPolicy";
import { assertGateAuthorization } from "./authorizeGate";
import { normalizeGateError } from "./gateErrors";
import { assertGatePreflight } from "./preflightCheck";
import { logGateResultEvent } from "./gateEventLog";
import { getFirestore } from "firebase-admin/firestore";
import {
  buildFlGateEnvelope,
  type FlGateInputEnvelope,
  type FlVerdict,
  type ApprovalState,
  type OrbitChainBundle,
} from "./gateEnvelope";

export type FlGateResult = {
  verdict: FlVerdict;
  approval?: {
    state: ApprovalState; // PENDING -> APPROVED
    approvalId?: string; // optional, Gate may issue
  };
  // Gate-owned evidence/audit identifiers (optional)
  evidenceId?: string;
};

export type FlGateCaller = (input: FlGateInputEnvelope) => Promise<FlGateResult>;

/**
 * Resolve active policy doc id from:
 *   workspaces/{wsId}/meta/settings.activePolicyDocId
 *
 * NOTE:
 * - This file only reads the pointer. It does NOT parse policy content/version.
 * - If you later want policy version, Gate should read it by policyDocId.
 */
export async function resolveActivePolicyDocId(wsId: string): Promise<string> {
  const db = getFirestore();
  const ref = db.doc(`workspaces/${wsId}/meta/settings`);
  const snap = await ref.get();

  const data = snap.exists ? (snap.data() as Record<string, unknown>) : null;
  const policyDocId = (data?.activePolicyDocId as string | undefined) ?? "";

  if (!policyDocId) throw new Error("missing_activePolicyDocId");
  return policyDocId;
}

/**
 * Main wiring entry: ORBIT chain bundle -> FL Gate
 * - No interpretation of ORBIT outputs/signals.
 * - Gate caller is injected (module call or HTTP) to keep this layer thin.
 */
export async function runFlGateForOrbit(args: {
  wsId: string;
  requestId: string;

  orbit: OrbitChainBundle;

  actor?: FlGateInputEnvelope["actor"];
  intent?: FlGateInputEnvelope["intent"];

  callGate: FlGateCaller;

  // Optional override (tests)
  policyDocIdOverride?: string;
  nowMs?: number;
}): Promise<FlGateResult> {
  if (!args.requestId) throw new Error("missing_requestId");
  if (!args.wsId) throw new Error("missing_wsId");
  
  const policyDocId =
    args.policyDocIdOverride ?? (await resolveActivePolicyDocId(args.wsId));

  const envelope = buildFlGateEnvelope({
    wsId: args.wsId,
    requestId: args.requestId,
    policyDocId,
    policyVersion: undefined, // version is Gate-owned (read by policyDocId)
    env: args.orbit.env,
    steps: args.orbit.steps,
    traces: args.orbit.traces,
    outputsByStep: args.orbit.outputsByStep,
    actor: args.actor,
    intent: args.intent,
    nowMs: args.nowMs,
  });
// ---- Phase 8 Safety Guards ----
assertGatePreflight({ intentKind: args.intent?.kind, wsId: args.wsId, requestId: args.requestId, approverUid: args.actor?.uid });
// ---- Phase 11 Preflight Event (best-effort) ----
if (args.intent?.kind === "EXECUTE") {
  try {
    const db = getFirestore();
    await db.collection("events").add({
      type: "FL_GATE_PREFLIGHT",
      wsId: args.wsId,
      requestId: args.requestId,
      atMs: Date.now(),
    });
  } catch {}
}
if (args.intent?.kind === "EXECUTE") {
  await assertGateAuthorization({
    wsId: args.wsId,
    uid: args.actor?.uid!,
    action: "EXECUTE",
  });
}
// ------------------------------------------------

// ---- Phase 10 Env Guard (HARD) ----
const env = process.env.NODE_ENV ?? "development";

// EXECUTE??production?ì„œë§??ˆìš©
if (args.intent?.kind === "EXECUTE" && env !== "production") {
  throw new Error("execute_not_allowed_in_non_production");
}
// ---- Phase 10 Execute Kill-Switch (HARD) ----
// ?´ì˜?ì„œì¡°ì°¨ ëª…ì‹œ???Œëž˜ê·??†ìœ¼ë©?EXECUTE ê¸ˆì?
if (args.intent?.kind === "EXECUTE" && process.env.FL_EXECUTE_ENABLED !== "true") {
  throw new Error("execute_disabled_by_flag");
}
// --------------------------------------------
// ----------------------------------

// EXECUTE??ë°˜ë“œ??idempotencyKey ?„ìš”
if (args.intent?.kind === "EXECUTE" && !args.intent.idempotencyKey) {
  throw new Error("execute_requires_idempotencyKey");
}
// ---- Phase 8 Idempotency (server-side guard) ----
if (args.intent?.kind === "EXECUTE") {
  const db = getFirestore();
  const idemRef = db.doc(
    `workspaces/${args.wsId}/_gate_idem/${args.intent.idempotencyKey}`
  );

  const snap = await idemRef.get();
  if (snap.exists) {
    // ?´ë? EXECUTE ì²˜ë¦¬????ì¤‘ë³µ ì°¨ë‹¨
    throw new Error("execute_already_processed");
  }

  // ? ì  ê¸°ë¡ (race ìµœì†Œ??
  await idemRef.set({
    requestId: args.requestId,
    createdAtMs: Date.now(),
  });
}
// ------------------------------------------------
// ---- Phase 8 Idempotency (server-side guard) ----
let idemRef: FirebaseFirestore.DocumentReference | null = null;

if (args.intent?.kind === "EXECUTE") {
  const db = getFirestore();
  idemRef = db.doc(
    `workspaces/${args.wsId}/_gate_idem/${args.intent.idempotencyKey}`
  );

  const snap = await idemRef.get();
  if (snap.exists) {
    throw new Error("execute_already_processed");
  }

  // ? ì  ê¸°ë¡
  await idemRef.set({
    requestId: args.requestId,
    createdAtMs: Date.now(),
  });
}
// runFlGateForOrbit ?œìž‘ë¶€
const ctx = createGateContext({
  wsId: args.wsId,
  requestId: args.requestId,
  uid: args.actor?.uid,
  intent: args.intent?.kind ?? "DRY_RUN",
  attempt: (args as any).attempt,
});

// ---- Phase 17 Alert Hook (best-effort) ----
try {
  const alert = await detectGateConsecutiveFailures({
    wsId: ctx.wsId,
    windowMs: 10 * 60 * 1000, // 10m
    threshold: 3,
  });
  if (alert) {
    // hook point (Slack/Webhook/etc.) ???¬ê¸°?œëŠ” ë¡œê·¸ë§?
    const db = getFirestore();
    await db.collection("events").add({
      type: "FL_GATE_ALERT",
      ...alert,
    });
    // alert ?ì„± ??
await sendGateAlert(alert);
  }
} catch {}
// -----------------------------------------

try {
  const result = await args.callGate(envelope);

  await logGateResultEvent({
    wsId: ctx.wsId,
    requestId: ctx.requestId,
    result,
  });

  return result;
} catch (e) {
  const code = normalizeGateError(e);
  const decision = decideGateRetry(code, ctx.attempt);

  // retry observe
  try {
    const db = getFirestore();
    await db.collection("events").add({
      type: "FL_GATE_RETRY",
      wsId: ctx.wsId,
      requestId: ctx.requestId,
      attempt: ctx.attempt,
      decision,
      atMs: Date.now(),
    });
  } catch {}

  if (decision.retry) {
    await new Promise((r) => setTimeout(r, decision.backoffMs));
    return runFlGateForOrbit({
      ...args,
      attempt: ctx.attempt + 1,
    } as any);
  }

  throw Object.assign(new Error(code), { cause: e });
}
}