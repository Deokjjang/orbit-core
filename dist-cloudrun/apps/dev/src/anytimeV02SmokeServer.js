// apps/dev/src/anytimeV02SmokeServer.ts
//
// Minimal HTTP smoke server for ORBIT Anytime v0.2.
// Purpose: e2e sanity check without hunting runtime entrypoints.
//
// - mounts apps/server anytimeV02Router
// - provides GET /health
//
// NOTE: this is dev-only harness.
import express from "express";
import { anytimeV02Router } from "../../server/src/public/anytimeV02";
const app = express();
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
// Mount SSOT router
app.use("/anytime/v02", anytimeV02Router);
const port = Number(process.env.PORT ?? 4317);
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[anytime-v02-smoke] listening on http://localhost:${port}`);
});
