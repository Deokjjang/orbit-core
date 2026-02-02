import { createServerApp } from "./main";

const dummyRunSync = async (_itemId: string, _payload: unknown) => {
  throw new Error("dummyRunSync: not implemented for smoke");
};

function makeReq(body: any) {
  return { body } as any;
}

function makeRes() {
  return new Promise<any>((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(payload: any) {
        resolve({ statusCode: res.statusCode, payload });
      },
      send(payload: any) {
        resolve({ statusCode: res.statusCode, payload });
      },
    } as any;
    // in case handler throws synchronously
    (res as any)._reject = reject;
  });
}

async function main() {
    const app = createServerApp(dummyRunSync);

  const reqBody = {
  itemId: "item6",
  payload: {
    requestId: "smoke_006",
    candidates: [
      { id: "c1", text: "ì¡°ê±´ë¶€ë¡?ê°€?¥í•˜ë©??ˆì™¸ê°€ ?ˆìŠµ?ˆë‹¤. ê·¼ê±°???¹ì…˜ 1??ì°¸ê³ ." },
      { id: "c2", text: "ì¡°ê±´ë¶€ë¡?ê°€?¥í•˜ë©??ˆì™¸ê°€ ?ˆìŠµ?ˆë‹¤. ?¹ì…˜ 1 ê·¼ê±°ë¥?ì°¸ê³ ?˜ì„¸??" }
    ],
    uncertainty: { overallTier: "LOW" }
  }
};

  const req = { body: reqBody } as any;

  const result = await new Promise<{ statusCode: number; payload: any }>((resolve) => {
    const res = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        resolve({ statusCode: this.statusCode, payload });
      },
      send(payload: any) {
        resolve({ statusCode: this.statusCode, payload });
      },
    } as any;

    void app.runItem(req, res);
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
