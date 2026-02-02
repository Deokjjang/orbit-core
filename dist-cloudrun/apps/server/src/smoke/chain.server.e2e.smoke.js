import { sendGateAlert } from "../fl/gateAlertSender";
import { runOrbitChain } from "../../../../packages/orbit-chain/runChain";
import { serverRunner } from "../chain/serverRunner";
import { runGateAfterOrbit } from "../orbit/orbitGateWiring";
import { approveGateExecution } from "../fl/approveGate";
import { getGateStatus } from "../fl/getGateStatus";
import { buildGateDailyRollup } from "../fl/gateDailyRollup";
import { assertGateAuthorization } from "../fl/authorizeGate";
import { computeGateSlo } from "../fl/gateSlo";
import { detectGateConsecutiveFailures } from "../fl/gateAlert";
async function main() {
    const input = {
        wsId: "ws_test",
        requestId: "smoke_chain_server",
        // Phase1 items need ItemRequestBase shape:
        init: { core: { u: 0.4, r: 0.2, i: 0.3, v: 0.1 } },
        constraints: [],
        preset: "FREE",
        seed: 1,
        // optional extras (router ignores if unused)
        signals: [],
        meta: { plan: "free" },
        gateExecute: true, // EXECUTE smoke
    };
    const options = {
        branching: { allowSkip: true, allowRetry: false },
        loop: 1,
        exposure: "minimal",
        audience: "general",
        stakes: "low",
    };
    const result = await runOrbitChain(input, options, serverRunner, "server");
    const chain = result.chain;
    await runGateAfterOrbit({
        wsId: input.wsId,
        requestId: input.requestId,
        orbit: {
            env: "server",
            steps: chain.steps,
            traces: chain.traces,
            outputsByStep: chain.outputsByStep,
        },
        intent: { kind: "EXECUTE" },
    });
    console.log("[STEPS]", chain.traces.map((t) => `${t.step}:${t.status}`));
    console.log("[TRACES]", chain.traces);
}
main();
async function approveSmoke() {
    const res = await approveGateExecution({
        wsId: "ws_test",
        requestId: "smoke_chain_server",
        approverUid: "user_admin",
    });
    console.log("[APPROVE]", res);
}
approveSmoke();
async function gateStatusSmoke() {
    const status = await getGateStatus({
        wsId: "ws_test",
        requestId: "smoke_chain_server",
    });
    console.log("[GATE_STATUS]", status);
}
gateStatusSmoke();
async function gateDailyRollupSmoke() {
    const now = Date.now();
    const fromMs = now - 7 * 24 * 60 * 60 * 1000; // last 7 days
    const data = await buildGateDailyRollup({
        wsId: "ws_test",
        fromMs,
        toMs: now,
    });
    console.log("[GATE_DAILY_ROLLUP]", data);
}
gateDailyRollupSmoke();
async function gateAuthSmoke() {
    try {
        // 비�?리자 ???�패 기�?
        await assertGateAuthorization({
            wsId: "ws_test",
            uid: "user_non_admin",
            action: "APPROVE",
        });
        console.error("AUTH_SMOKE_FAIL: non-admin should not pass");
    }
    catch {
        console.log("[AUTH_SMOKE_OK] non-admin blocked");
    }
}
gateAuthSmoke();
async function gateSloSmoke() {
    const now = Date.now();
    const fromMs = now - 24 * 60 * 60 * 1000; // last 24h
    const data = await computeGateSlo({
        wsId: "ws_test",
        fromMs,
        toMs: now,
    });
    console.log("[GATE_SLO]", data);
}
gateSloSmoke();
async function gateAlertSmoke() {
    const alert = await detectGateConsecutiveFailures({
        wsId: "ws_test",
        windowMs: 10 * 60 * 1000,
        threshold: 3,
    });
    console.log("[GATE_ALERT]", alert);
}
gateAlertSmoke();
async function gateAlertSenderSmoke() {
    // FL_ALERTS_ENABLED !== "true" ???�태?�서 ?�류 ?�이 ?�과?�야 ??
    await sendGateAlert({
        wsId: "ws_test",
        reason: "CONSECUTIVE_FAILURES",
        count: 3,
        atMs: Date.now(),
    });
    console.log("[GATE_ALERT_SENDER] no-op OK");
}
gateAlertSenderSmoke();
