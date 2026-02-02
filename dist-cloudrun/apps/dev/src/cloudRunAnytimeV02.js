import express from "express";
import { anytimeV02Router } from "../../server/src/routes/anytimeV02";
const app = express();
// body
app.use(express.json({ limit: "2mb" }));
// BAD_JSON -> 400
app.use((err, _req, res, next) => {
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
        return res.status(400).json({ error: "BAD_JSON", message: String(err?.message ?? err) });
    }
    return next(err);
});
// health
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
// SSOT: auth/quota slot (replace in real deploy)
app.use("/anytime/v02", (_req, _res, next) => next());
// mount
app.use("/anytime/v02", anytimeV02Router);
// minimal 500 shield
app.use((err, _req, res, _next) => {
    const msg = String(err?.message ?? err ?? "unknown");
    res.status(500).json({ error: "UNHANDLED", message: msg });
});
// Cloud Run uses PORT env
const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`[cloudrun-anytime-v02] listening on :${port}`));
