// apps/server/src/fl/authorizeGate.ts
// Phase 13 Step 1: Gate authorization (role-based, HARD)

import { getFirestore } from "firebase-admin/firestore";

export async function assertGateAuthorization(args: {
  wsId: string;
  uid: string;
  action: "EXECUTE" | "APPROVE";
}) {
  if (!args.wsId || !args.uid) throw new Error("auth_missing_params");

  const db = getFirestore();
  const snap = await db
    .doc(`workspaces/${args.wsId}/members/${args.uid}`)
    .get();

  if (!snap.exists) throw new Error("auth_not_member");

  const data = snap.data() as any;
  const roles: string[] = Array.isArray(data?.roles) ? data.roles : [];

  // 정책: EXECUTE/APPROVE는 관리자만
  if (!roles.includes("admin")) {
    throw new Error("auth_insufficient_role");
  }
}
