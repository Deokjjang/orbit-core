// apps/shared/firebaseAdmin.ts
import admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getAdminApp() {
  if (!app) {
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    app.firestore().settings({ ignoreUndefinedProperties: true });
  }
  return app;
}

export function getFirestore() {
  return getAdminApp().firestore();
}
