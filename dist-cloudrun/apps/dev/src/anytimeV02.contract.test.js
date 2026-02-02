import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { anytimeV02Router } from "../../server/src/public/anytimeV02";
// NOTE: repo???��? supertest ?�으�??�치 ?�요. (?�스???�패 ???�려�?
function makeApp() {
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    // BAD_JSON -> 400 (same rule as smoke server)
    app.use((err, _req, res, next) => {
        if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
            return res.status(400).json({ error: "BAD_JSON", message: String(err?.message ?? err) });
        }
        return next(err);
    });
    app.use("/anytime/v02", anytimeV02Router);
    return app;
}
describe("anytime v0.2 contract (http)", () => {
    const app = makeApp();
    it("deepOff: returns orbit.exec.v0.2 + deep.disabled", async () => {
        const payload = {
            repro: { requestId: "ct-off", seed: 1, presetId: "default", codeVersion: "test" },
            budget: { totalUnits: 10, deepMaxUnits: 0 },
            exposure: { exposure: "minimal" },
            hooksInput: { base: { coreResult: {}, minBar: {} }, lite: {} },
        };
        const res = await request(app).post("/anytime/v02/run").send(payload).set("Content-Type", "application/json");
        expect(res.status).toBe(200);
        expect(res.body.version).toBe("orbit.exec.v0.2");
        expect(res.body.deep?.enabled).toBe(false);
        expect(Array.isArray(res.body.deep?.plan)).toBe(true);
        expect(res.body.deep?.plan?.length).toBe(0);
    });
    it("deepOn: returns plan + EXEC_OK + unitsUsedTotal>0", async () => {
        const payload = {
            repro: { requestId: "ct-on", seed: 2, presetId: "default", codeVersion: "test" },
            budget: { totalUnits: 50, deepMaxUnits: 20 },
            exposure: { exposure: "minimal" },
            hooksInput: { base: { coreResult: {}, minBar: {} }, lite: {} },
        };
        const res = await request(app).post("/anytime/v02/run").send(payload).set("Content-Type", "application/json");
        expect(res.status).toBe(200);
        expect(res.body.version).toBe("orbit.exec.v0.2");
        expect(res.body.deep?.enabled).toBe(true);
        expect(res.body.deep?.handledReasonsByIndex?.every((x) => x === "EXEC_OK")).toBe(true);
        expect(res.body.deep?.units?.unitsUsedTotal).toBeGreaterThan(0);
    });
    it("bad json: returns 400 BAD_JSON", async () => {
        const res = await request(app)
            .post("/anytime/v02/run")
            .set("Content-Type", "application/json")
            .send("{"); // broken JSON
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("BAD_JSON");
    });
});
