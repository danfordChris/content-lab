import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { DB } from "./types";
import { adminConfigured, adminDb } from "./firebase/admin";
import { requireUid } from "./auth";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const EMPTY: DB = { ideas: [], drafts: [], calendar: [] };
const COLLECTION = "contentlab";

// ── Local JSON store (used when Firebase is not configured) ──────────────────
async function ensureLocal() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(EMPTY, null, 2));
  }
}

async function readLocal(): Promise<DB> {
  await ensureLocal();
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(DB_FILE, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

async function writeLocal(db: DB): Promise<void> {
  await ensureLocal();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// ── Public API (dispatches to Firestore or local) ────────────────────────────
export async function readDB(): Promise<DB> {
  if (!adminConfigured) return readLocal();
  const uid = await requireUid();
  const snap = await adminDb().collection(COLLECTION).doc(uid).get();
  return snap.exists ? { ...EMPTY, ...(snap.data() as DB) } : structuredClone(EMPTY);
}

export async function writeDB(db: DB): Promise<void> {
  if (!adminConfigured) return writeLocal(db);
  const uid = await requireUid();
  await adminDb().collection(COLLECTION).doc(uid).set(db);
}

/** Read-modify-write helper. */
export async function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const db = await readDB();
  const result = await fn(db);
  await writeDB(db);
  return result;
}

export function uid(): string {
  return (globalThis.crypto ?? require("crypto")).randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
