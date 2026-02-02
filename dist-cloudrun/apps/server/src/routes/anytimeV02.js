// apps/server/src/routes/anytimeV02.ts
//
// ORBIT v0.2 Anytime Route (SSOT)
// - Single entrypoint for v0.2 execution.
// - v0.1?�v0.2 wrap path is guarded in handler (501 unless ORBIT_ALLOW_V01_WRAP=1).
import { Router } from "express";
import { handleAnytimeV02 } from "../handlers/anytimeV02";
import { POST as runV01WrapPOST } from "../orbit/runAnytimeV02Route";
export const anytimeV02Router = Router();
// ??v0.2 native anytime (recommended)
anytimeV02Router.post("/run", async (req, res) => {
    try {
        const env = await handleAnytimeV02(req.body ?? {});
        res.status(200).json(env);
    }
    catch (e) {
        res.status(500).json({ error: "ANYTIME_V02_FAILED", message: String(e?.message ?? e) });
    }
});
// ??v0.1?�v0.2 wrap (disabled by default; guarded in handler)
anytimeV02Router.post("/wrap-v01", async (req, res) => {
    // Express req/res ??Web Request/Response ?�댑??
    const webReq = new Request("http://local/anytime-v02/wrap-v01", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req.body ?? {}),
    });
    const webRes = await runV01WrapPOST(webReq);
    const status = webRes.status;
    const json = await webRes.json().catch(() => ({ error: "BAD_RESPONSE" }));
    res.status(status).json(json);
});
