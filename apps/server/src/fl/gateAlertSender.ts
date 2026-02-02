// apps/server/src/fl/gateAlertSender.ts
// Phase 18 Step 2: Env-gated alert sender (default no-op)

export type GateAlertPayload = {
  wsId: string;
  reason: string;
  count: number;
  atMs: number;
};

export async function sendGateAlert(payload: GateAlertPayload) {
  if (process.env.FL_ALERTS_ENABLED !== "true") return;

  // Example: webhook (optional)
  const url = process.env.FL_ALERT_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[FL_GATE_ALERT] ws=${payload.wsId} reason=${payload.reason} count=${payload.count}`,
        atMs: payload.atMs,
      }),
    });
  } catch {
    // swallow
  }
}
