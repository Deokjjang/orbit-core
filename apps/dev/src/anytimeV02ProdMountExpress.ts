import express from "express";
import { anytimeV02Router } from "../../server/src/public/anytimeV02";

const app = express();

// body parser
app.use(express.json({ limit: "2mb" }));

// minimal health
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// SSOT: auth/quota slot (no logic here; wire real impl in runtime)
app.use("/anytime/v02", (_req, _res, next) => next());

// mount (SSOT)
app.use("/anytime/v02", anytimeV02Router);

// (optional) global error safety (keep minimal)
app.use((err: any, _req: any, res: any, _next: any) => {
  const msg = String(err?.message ?? err ?? "unknown");
  res.status(500).json({ error: "UNHANDLED", message: msg });
});

const port = Number(process.env.PORT ?? 4317);
app.listen(port, () => console.log(`[anytime-v02-prod-mount] http://localhost:${port}`));
