import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Private keys are stored with literal "\n" in env; convert back to real newlines.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// Two ways to provide server credentials:
//  1) inline service account → FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//  2) ADC (FlutterFire/gcloud style) → GOOGLE_APPLICATION_CREDENTIALS=path/to.json
const hasInline = Boolean(projectId && clientEmail && privateKey);
const hasAdc = Boolean(projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS);

/** True only when the server can talk to Firebase (otherwise local mode). */
export const adminConfigured = hasInline || hasAdc;

function getAdminApp(): App {
  if (!adminConfigured) throw new Error("Firebase Admin is not configured");
  if (getApps().length) return getApps()[0]!;
  const credential = hasInline
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();
  return initializeApp({ credential, projectId });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

// Cache on globalThis so the instance survives dev hot-reloads (otherwise a new
// module copy would call settings() again on the same Firestore → throw).
const globalForDb = globalThis as unknown as { __contentlabDb?: Firestore };

export function adminDb(): Firestore {
  if (globalForDb.__contentlabDb) return globalForDb.__contentlabDb;
  const db = getFirestore(getAdminApp());
  try {
    // Idea/Draft objects carry optional (undefined) fields — Firestore rejects
    // undefined by default, so allow it. settings() may only be called once;
    // on hot-reload the underlying Firestore may already be configured.
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    /* already configured — safe to ignore */
  }
  globalForDb.__contentlabDb = db;
  return db;
}
