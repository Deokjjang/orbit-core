import express from "express";
import { anytimeV02Router } from "../public/anytimeV02";
const app = express();
app.use(express.json({ limit: "2mb" }));
// JSON parse error -> 400 (dev smoke only)
app.use((err, _req, res, next) => {
    if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
        return res.status(400).json({ error: "BAD_JSON", message: String(err?.message ?? err) });
    }
    return next(err);
});
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.use("/anytime/v02", anytimeV02Router);
const port = Number(process.env.PORT ?? 4317);
app.listen(port, () => console.log(`[anytime-v02-smoke] http://localhost:${port}`));
