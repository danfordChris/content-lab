#!/usr/bin/env node
/**
 * FlutterFire-style Firebase configure for <danfordchris/> Content Lab.
 *
 * Interactively pick (or create) a Firebase project, then auto-write the
 * NEXT_PUBLIC_FIREBASE_* web config into .env.local — the web equivalent of
 * `flutterfire configure`.
 *
 * Usage:
 *   npm run firebase:configure                 # interactive picker
 *   npm run firebase:configure -- <projectId>  # skip the picker
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const FB = "npx -y firebase-tools@latest";
const ENV = ".env.local";

const capture = (cmd) => execSync(cmd, { stdio: ["inherit", "pipe", "inherit"] }).toString();
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const safe = (fn) => {
  try {
    return fn();
  } catch {
    return "";
  }
};
const asJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), resolve(a))));
}

function upsertEnv(vars) {
  let body = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
  for (const [k, v] of Object.entries(vars)) {
    if (v == null || v === "") continue;
    const line = `${k}=${v}`;
    const re = new RegExp(`^${k}=.*$`, "m");
    if (re.test(body)) body = body.replace(re, line);
    else body += (body === "" || body.endsWith("\n") ? "" : "\n") + line + "\n";
  }
  writeFileSync(ENV, body);
}

async function pickOrCreateProject() {
  const out = asJson(safe(() => capture(`${FB} projects:list --json`)));
  const projects = (out?.result ?? []).filter((p) => p?.projectId);

  console.log("\nYour Firebase projects:");
  projects.forEach((p, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. ${p.projectId}${p.displayName ? `  (${p.displayName})` : ""}`)
  );
  console.log("   n. ➕ create a NEW project");
  console.log("   q. quit\n");

  const ans = (await ask("Select a number, 'n' to create, or paste a project id: ")).trim();

  if (ans.toLowerCase() === "q" || ans === "") {
    console.log("Cancelled.");
    process.exit(0);
  }
  if (ans.toLowerCase() === "n") return createProject();

  const idx = Number.parseInt(ans, 10) - 1;
  if (Number.isInteger(idx) && projects[idx]) return projects[idx].projectId;

  // Treat free text as a project id (existing or to select).
  return ans;
}

async function createProject() {
  const suggested = "danfordchris-content-lab";
  let id = (await ask(`New project id [lowercase 6-30 chars] (${suggested}): `)).trim() || suggested;
  const name = (await ask("Display name [Content Lab]: ")).trim() || "Content Lab";
  console.log(`\n→ Creating project "${id}"...`);
  try {
    run(`${FB} projects:create ${id} --display-name "${name}"`);
  } catch {
    console.error(
      `\n❌ Could not create "${id}". The id may be taken or invalid.\n` +
        "   Try again with a different id, or create it in the console and pass it:\n" +
        "   npm run firebase:configure -- <projectId>\n"
    );
    process.exit(1);
  }
  return id;
}

async function maybeCreateFirestore(projectId) {
  const yes = (await ask("\nCreate the Firestore database now? [y/N]: ")).trim().toLowerCase();
  if (yes !== "y" && yes !== "yes") return;
  const loc = (await ask("Location [nam5 = US multi-region; e.g. eur3, europe-west1]: ")).trim() || "nam5";
  console.log(`→ Creating Firestore database in ${loc}...`);
  try {
    run(`${FB} firestore:databases:create "(default)" --project ${projectId} --location ${loc}`);
  } catch {
    console.log("   (Skipped — it may already exist, or create it in the console.)");
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log("🔥 Firebase configure (FlutterFire-style) — Content Lab\n");

// 1) Ensure logged in (projects:list fails if not authenticated).
try {
  capture(`${FB} projects:list`);
} catch {
  console.log("→ Opening Firebase login...");
  run(`${FB} login`);
}

// 2) Resolve project: arg → .firebaserc default → interactive picker.
let projectId = process.argv[2];
if (!projectId && existsSync(".firebaserc")) {
  projectId = asJson(readFileSync(".firebaserc", "utf8"))?.projects?.default;
}
if (!projectId) projectId = await pickOrCreateProject();

run(`${FB} use ${projectId}`);

// 3) Find or create a Web app and grab its appId.
function findWebAppId() {
  const out = asJson(safe(() => capture(`${FB} apps:list WEB --json`)));
  const list = out?.result ?? (Array.isArray(out) ? out : []);
  return Array.isArray(list) ? list[0]?.appId : undefined;
}
let appId = findWebAppId();
if (!appId) {
  console.log('→ No web app found — creating "Content Lab"...');
  const created = asJson(safe(() => capture(`${FB} apps:create WEB "Content Lab" --json`)));
  appId = created?.result?.appId ?? created?.appId;
}
if (!appId) {
  console.error("❌ Could not find or create a web app for this project.");
  process.exit(1);
}

// 4) Pull the SDK config for that app.
const cfgOut = asJson(safe(() => capture(`${FB} apps:sdkconfig WEB ${appId} --json`)));
const sdk = cfgOut?.result?.sdkConfig ?? cfgOut?.sdkConfig ?? cfgOut?.result ?? {};
if (!sdk.apiKey) {
  console.error("❌ Could not read SDK config. Raw:", JSON.stringify(cfgOut)?.slice(0, 300));
  process.exit(1);
}

// 5) Write web config to .env.local (the FlutterFire-style payoff).
upsertEnv({
  NEXT_PUBLIC_FIREBASE_API_KEY: sdk.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: sdk.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: sdk.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: sdk.appId,
  FIREBASE_PROJECT_ID: sdk.projectId,
});
console.log(`\n✅ Wrote web config for "${sdk.projectId}" to ${ENV}`);

// 6) Optionally create the Firestore database.
await maybeCreateFirestore(sdk.projectId);

console.log("\n── One-time manual steps ─────────────────────────────────────");
console.log("1) Enable login:  Console → Authentication → Sign-in method → Google");
console.log("2) Server key:    Console → Project settings → Service accounts →");
console.log("   Generate new private key, then either put in .env.local:");
console.log("      FIREBASE_CLIENT_EMAIL=...   FIREBASE_PRIVATE_KEY=...");
console.log("   or set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json");
console.log("3) Push rules:    npm run firebase:rules");
console.log("\nThen:  npm run dev\n");
