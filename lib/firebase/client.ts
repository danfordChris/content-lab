"use client";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cachedAuth: Auth | null = null;

/** Lazily initialize Firebase on the client. Never called during SSR/prerender,
 *  so an empty local-mode config can't break the build. */
export function getClientAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(config);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
