import express from "express";
import { anytimeV02Router } from "./routes/anytimeV02";

import { createJobStore } from "../../../src/jobs/jobStoreFactory";
import { runItemUnifiedHandler } from "../../../src/api/runItemUnified";
import { getJobStatusHandler } from "../../../src/api/getJobStatus";
import { cancelJobHandler } from "../../../src/api/cancelJob";
import { runOrbitChain } from "../../../packages/orbit-chain/runChain";
import { runGateAfterOrbit } from "./orbit/orbitGateWiring";
import { approveGateExecution } from "./fl/approveGate";
import { getGateStatus } from "./fl/getGateStatus";
import { buildGateDailyRollup } from "./fl/gateDailyRollup";
import { computeGateSlo } from "./fl/gateSlo";

import { runItem3Sync } from "./routes/item3.sync";
import { runItem5Sync } from "./routes/item5.sync";
import { runItem6Sync } from "./routes/item6.sync";

import {
  runItem10,
  Item10RequestSchema,
  Item10ResultSchema,
} from "../../../packages/orbit-items/item10";
import {
  runItem8,
  Item8RequestSchema,
  Item8ResultSchema,
} from "../../../packages/orbit-items/item8";
import {
  runItem7,
  Item7RequestSchema,
  Item7ResultSchema,
} from "../../../packages/orbit-items/item7";
import {
  runItem9,
  Item9RequestSchema,
  Item9ResultSchema,
} from "../../../packages/orbit-items/item9";

export function createServerApp(runSync: any) {
  const jobStore = createJobStore();

  // NOTE: runItemUnifiedHandler expects runSync(req,res)
  const runSyncWrapped = async (req: any, res: any) => {
    const itemId = req?.body?.itemId;
    const raw = req?.body?.payload ?? req?.body?.input ?? req?.body;

    if (itemId === "item3") {
      const result = runItem3Sync(raw);
      return res.status(200).json(result);
    }

    if (itemId === "item5") {
      const result = runItem5Sync(raw);
      return res.status(200).json(result);
    }

    if (itemId === "item6") {
      const result = runItem6Sync(raw);
      return res.status(200).json(result);
    }

    if (itemId === "item10") {
      const parsed = Item10RequestSchema.parse(raw);
      const out = runItem10(parsed);
      const result = Item10ResultSchema.parse(out);
      return res.status(200).json(result);
    }
    
    if (itemId === "item8") {
  const parsed = Item8RequestSchema.parse(raw);
  const out = runItem8(parsed);
  const result = Item8ResultSchema.parse(out);
  return res.status(200).json(result);
}
    
    if (itemId === "item7") {
  const parsed = Item7RequestSchema.parse(raw);
  const out = runItem7(parsed);
  const result = Item7ResultSchema.parse(out);
  return res.status(200).json(result);
}

   if (itemId === "item9") {
  const parsed = Item9RequestSchema.parse(raw);
  const out = runItem9(parsed);
  const result = Item9ResultSchema.parse(out);
  return res.status(200).json(result);
}

   if (itemId === "chain") {
  const { input, options } = raw;

  // sync?ì„œ??runnerë¥??œë²„ ë¡œì»¬ë¡?ì£¼ìž… (stub)
const result = await runOrbitChain(
  input,
  options,
  async () => ({ signals: [] }),
  "server"
);

// ChainResult ??chain bundle
const chain = (result as any).chain;

// EXECUTE ê°€?? ëª…ì‹œ???”ì²­ + requestId ì¡´ìž¬
const gateIntent =
  input?.gateExecute === true
    ? { kind: "EXECUTE" as const, idempotencyKey: input.requestId }
    : { kind: "DRY_RUN" as const };

const gate = await runGateAfterOrbit({
  wsId: input.wsId,
  requestId: input.requestId,
  orbit: {
    env: "server",
    steps: chain.steps,
    traces: chain.traces,
    outputsByStep: chain.outputsByStep,
  },
  intent: gateIntent,
});

// (? íƒ) ?‘ë‹µ??verdict ?¸ì¶œ???„ìš”?˜ë©´ ìµœì†Œë§?ë³‘í•©
// result.gate = { verdict: gate.verdict };

return res.status(200).json(result);
}
    // fallback: existing sync handler (Phase1)
    return runSync(req, res);
  };
  const approveGateHandler = async (req: any, res: any) => {
  try {
    const { wsId, requestId } = req.body ?? {};
    const approverUid = req.user?.uid ?? req.body?.approverUid;

    if (!wsId || !requestId || !approverUid) {
      return res.status(400).json({ error: "missing_params" });
    }

    const result = await approveGateExecution({
      wsId,
      requestId,
      approverUid,
    });

    return res.status(200).json({ ok: true, result });
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
};
const getGateStatusHandler = async (req: any, res: any) => {
  try {
    const { wsId, requestId } = req.query ?? req.body ?? {};
    if (!wsId || !requestId) {
      return res.status(400).json({ error: "missing_params" });
    }

    const status = await getGateStatus({ wsId, requestId });
    return res.status(200).json(status);
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
};
const getGateDailyRollupHandler = async (req: any, res: any) => {
  try {
    const { wsId, fromMs, toMs } = req.query ?? req.body ?? {};
    if (!wsId || !fromMs || !toMs) {
      return res.status(400).json({ error: "missing_params" });
    }

    const data = await buildGateDailyRollup({
      wsId,
      fromMs: Number(fromMs),
      toMs: Number(toMs),
    });

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
};const getGateSloHandler = async (req: any, res: any) => {
  try {
    const { wsId, fromMs, toMs } = req.query ?? req.body ?? {};
    if (!wsId || !fromMs || !toMs) {
      return res.status(400).json({ error: "missing_params" });
    }

    const data = await computeGateSlo({
      wsId,
      fromMs: Number(fromMs),
      toMs: Number(toMs),
    });

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(400).json({ error: String(e?.message ?? e) });
  }
};

  return {
    runItem: runItemUnifiedHandler({ store: jobStore, runSync: runSyncWrapped }),
    getJob: getJobStatusHandler(jobStore),
    cancelJob: cancelJobHandler(jobStore),
    approveGate: approveGateHandler,
    getGateStatus: getGateStatusHandler,
    getGateSlo: getGateSloHandler,
    getGateDailyRollup: getGateDailyRollupHandler,
  };
}
// apps/server/src/main.ts
export function createExpressApp(runSync: any) {
  const handlers = createServerApp(runSync);

  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // ??ORBIT v0.2 Anytime (SSOT mount)
  // routes/anytimeV02.tsê°€ "/run", "/wrap-v01"???°ëŠ” ?„ì œ??
  // prefix???¬ê¸°??"/anytime/v02"ë¡?ê³ ì •?œë‹¤.
  app.use("/anytime/v02", anytimeV02Router);

  // (?´ë? ?¤ë¥¸ HTTP ê²°ì„ ???´ë”˜ê°€???ˆë‹¤ë©? ê·¸ìª½??ì¤‘ë³µ mount ???˜ê²Œ ?•ë¦¬?´ì•¼ ??
  // ?? app.post("/api/run", handlers.runItem) ... ?´ëŸ° ê²ƒë“¤?€ ê¸°ì¡´ ê²°ì„ ë¶€ê°€ ?´ë‹¹.

  return { app, handlers };
}
