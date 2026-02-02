/* ============================================================
 * ORBIT Chain Router — Contract v0.1 (Phase 4)
 * ============================================================
 * Purpose:
 * - Builds per-step payloads from ChainInput + prior step outputs
 * - Does NOT interpret meaning, does NOT decide, does NOT execute
 *
 * Key rule:
 * - Chain (Phase 3) = wiring + trace
 * - Router (Phase 4) = payload shaping only
 * ============================================================ */
export {};
/* =========================
 * Router SSOT rules
 * =========================
 * - item1/2/4 execution path can be "core/server" (not worker)
 * - worker steps receive minimal payloads that satisfy their schemas
 * - no numeric score exposure
 * - no approval / policy / gate meaning
 */
