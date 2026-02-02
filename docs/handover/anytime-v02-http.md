# ORBIT v0.2 Anytime — External HTTP Wiring (SSOT)

## FACT
- tsc/vitest all pass
- /anytime/v02/run Deep OFF/ON e2e OK
- BAD_JSON -> 400
- /wrap-v01 -> 501 V01_WRAP_DISABLED (정상)

## Public Surface
- src/public/anytimeV02.ts
- apps/server/src/public/anytimeV02.ts

## Routes/Handlers
- POST /anytime/v02/run -> handleAnytimeV02(req.body ?? {})
- POST /anytime/v02/wrap-v01 -> 501 (disabled)

## Dev Smoke
- apps/server/src/dev/anytimeV02SmokeServer.ts
- express.json + BAD_JSON 400

## Payloads
- apps/dev/payloads/anytimeV02/deepOff.json
- apps/dev/payloads/anytimeV02/deepOn.json
- apps/dev/payloads/anytimeV02/wrapV01.json

## Scripts
- anytime:v02:serve
- anytime:v02:off
- anytime:v02:on
- anytime:v02:wrap-v01:status (prints status=501)

## Rules
- core에 Express import 금지
- payload는 file-based only (--data-binary)
