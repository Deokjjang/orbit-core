import { createServerApp } from "./main";
const dummyRunSync = async (_itemId, _payload) => {
    throw new Error("dummyRunSync: not implemented for smoke");
};
function makeReq(body) {
    return { body };
}
function makeRes() {
    return new Promise((resolve, reject) => {
        const res = {
            statusCode: 200,
            status(code) {
                res.statusCode = code;
                return res;
            },
            json(payload) {
                resolve({ statusCode: res.statusCode, payload });
            },
            send(payload) {
                resolve({ statusCode: res.statusCode, payload });
            },
        };
        // in case handler throws synchronously
        res._reject = reject;
    });
}
async function main() {
    const app = createServerApp(dummyRunSync);
    const reqBody = {
        itemId: "item6",
        payload: {
            requestId: "smoke_006",
            candidates: [
                { id: "c1", text: "조건부�?가?�하�??�외가 ?�습?�다. 근거???�션 1??참고." },
                { id: "c2", text: "조건부�?가?�하�??�외가 ?�습?�다. ?�션 1 근거�?참고?�세??" }
            ],
            uncertainty: { overallTier: "LOW" }
        }
    };
    const req = { body: reqBody };
    const result = await new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(payload) {
                resolve({ statusCode: this.statusCode, payload });
            },
            send(payload) {
                resolve({ statusCode: this.statusCode, payload });
            },
        };
        void app.runItem(req, res);
    });
    console.log(JSON.stringify(result, null, 2));
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
