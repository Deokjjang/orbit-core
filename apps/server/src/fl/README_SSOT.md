# FL (Gate) Server Integration — SSOT (DO NOT BREAK)

## Folder casing (HARD RULE)
- Path MUST be: `apps/server/src/fl/*`
- `FL/` directory is forbidden. (Windows+TS casing collision)

## Files (current SSOT)
- `gateEnvelope.ts` : transport envelope (no interpretation)
- `runGate.ts` : server wiring + EXECUTE idempotency + rollback
- `gateCaller.ts` : runtime kernel resolver (thin)
- `approveGate.ts` : approval wiring (thin)
- `getGateStatus.ts` : read-only status query
- `gateEventLog.ts` : idempotent event log helper

## Boundaries
- ORBIT: signals only, no execution/policy.
- Chain: wiring/trace only.
- FL Gate: verdict/approval/execution/evidence only.
- Server: transport + idempotency guard only. No policy logic.

## Commands
- Typecheck:
  - `npx tsc -p apps/tsconfig.json --noEmit`
