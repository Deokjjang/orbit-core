# OrbitJob DB Schema v0.1 (SSOT)

## Collection / Table
- jobs

## Primary Key
- jobId (string)

## Indexes
- by_status_createdAt: (status, createdAt ASC)
- by_idempotencyKey: (idempotencyKey UNIQUE, nullable)

## Fields
- jobId: string
- requestId: string
- itemId: "item1" | "item2" | "item4"
- preset: "FREE" | "PLUS" | "PRO" | "ENTERPRISE_ANALYTICAL"
- status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED"

- envelope:
  - seed: number
  - init: any
  - constraints: any
  - input?: any

- idempotencyKey?: string

- createdAt: ISO string
- updatedAt: ISO string
- startedAt?: ISO string
- finishedAt?: ISO string

- attempts: number
- maxAttempts: number
- leaseUntil?: ISO string

- result?:
  - okEnvelope?: any
  - errEnvelope?: any

## Invariants
- status transition is monotonic
- leaseUntil used for RUNNING only
- terminal states keep result immutable
