# &lt;danfordchris/&gt; Content Lab

A working content operating system for a developer-educator brand.
**Capture → Multiply → Recycle.** Never run out of content again.

This is a **runnable Next.js app**, not just a plan. It works out of the box with
zero external services (local file storage + a built-in content generator), and
upgrades to live AI by adding one API key.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

> Note: this folder's name contains a `:`, which breaks the normal `next` PATH
> lookup, so the npm scripts call Next.js by its explicit path. `npm run dev`
> just works.

## Turn on live AI — for FREE (text + images)

Copy `.env.example` to `.env.local`. The recommended zero-cost setup uses
**Google Gemini** for text and **Pollinations** for images:

```
# Text — free Gemini key from https://aistudio.google.com/apikey
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_API_KEY=<your-free-gemini-key>
OPENAI_MODEL=gemini-2.5-flash

# Images — free via Cloudflare Workers AI (no card, no deposit)
IMAGE_PROVIDER=auto
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<workers-ai-token>
```

- **Text** (idea expansion, posts, threads, video scripts, carousels,
  comment→idea) runs on Gemini's free tier. The app speaks any
  OpenAI-compatible endpoint, so swapping providers is just these env vars.
- **Images** (carousel slides + cover art) use a multi-provider layer with
  automatic fallback (`cloudflare → together → openai → pollinations`).
  Recommended free + no-card: **Cloudflare Workers AI** (`flux-1-schnell`) — set
  `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`. (Together now needs a deposit;
  Pollinations is keyless but heavily rate-limited behind shared IPs — a free
  `POLLINATIONS_TOKEN` helps.) Generated files land in `public/generated/`. Any
  image failure falls back to a branded placeholder with the reason, so nothing
  ever breaks.

Prefer paid OpenAI instead? Set `OPENAI_BASE_URL=https://api.openai.com/v1`,
`OPENAI_MODEL=gpt-4o-mini`, `IMAGE_PROVIDER=openai`, and
`OPENAI_IMAGE_MODEL=gpt-image-1` (or `dall-e-3` if your org isn't verified).

With **no keys at all**, everything still works: text uses the built-in on-brand
generator and images still generate via free Pollinations.

## Cloud data + login (Firebase — free, optional)

By default the app stores data in a local `.data/db.json` file with no login —
perfect for local use, but it won't persist once deployed. Add **Firebase**
(free Spark tier) to switch on **Firestore** (per-user cloud storage) and
**Firebase Auth** (Google login). The app auto-detects: blank Firebase env =
local mode; filled = cloud mode. No code changes needed.

### Quick setup (FlutterFire-style, one command)

Like `flutterfire configure`, this auto-writes your web config into `.env.local`:

```bash
# 1. Create a project at https://console.firebase.google.com, then:
npm run firebase:configure -- <your-project-id>
```

That logs you into Firebase (browser), finds/creates a Web app, and writes the
four `NEXT_PUBLIC_FIREBASE_*` values + `FIREBASE_PROJECT_ID` for you.

Then two one-time manual bits the CLI can't do for you:
1. **Enable Google login**: Console → Authentication → Sign-in method → Google.
2. **Server credential**: Console → Project settings → Service accounts →
   Generate new private key. Either put `FIREBASE_CLIENT_EMAIL` +
   `FIREBASE_PRIVATE_KEY` in `.env.local`, **or** save the JSON and set
   `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json` (gcloud style).
3. Also create the Firestore DB (Console → Firestore → Create) and optionally
   push rules: `npm run firebase:rules`.

Restart `npm run dev` → you get a login screen, and ideas/drafts live in
Firestore (`contentlab/{uid}`, one document per user).

**Other commands:** `npm run firebase:login`, `npm run firebase:emulators`
(local Auth+Firestore emulators), `npm run firebase:rules` (deploy rules).

**Sharing with a Flutter app:** point `flutterfire configure` at the *same*
Firebase project. The Firestore security rules (`firestore.rules`) lock
`contentlab/{uid}` to its owner, so a FlutterFire client and this web app can
safely share one backend and the same users.

> Images stay on **Cloudflare Workers AI** and text on **Gemini** — Firebase is
> only data + auth here (Firebase image gen / Imagen needs a paid plan).

## What works right now

| Page | What you can do |
|------|-----------------|
| **Dashboard** (`/`) | Quick-capture ideas, see vault/draft/posted stats |
| **Idea Vault** (`/ideas`) | Search/filter ideas, capture new ones |
| **Idea detail** (`/ideas/[id]`) | Edit, set pillar/status, **expand with AI**, **generate multi-format drafts** |
| **Drafts** (`/drafts`) | Browse all generated drafts |
| **Draft editor** (`/drafts/[id]`) | Edit with autosave, char counter, **generate cover image**, **per-slide carousel editor with AI images**, copy, **schedule** |
| **Calendar** (`/calendar`) | See the schedule, mark posts as posted |
| **Inbox** (`/inbox`) | Paste an audience comment → **turn it into a new idea** |

**Content formats it generates** from one idea:
- **LinkedIn post**, **X/Twitter thread**, **YouTube Short script**
- **Video script** (2–4 min, with hook / sections / b-roll cues / outro CTA)
- **Blog post** (markdown with code blocks)
- **Carousel** — structured slides, each editable, each with an **AI-generated image**
- **Cover/visual images** for any post

The full loop: capture → expand → generate any format → add AI images →
edit → schedule → mark posted → recycle a comment into a new idea.

## How it's built

- **Next.js 15** App Router + **TypeScript**, **Tailwind v4** dark UI.
- **Server Actions** for all mutations (`app/actions.ts`).
- **Local JSON store** at `.data/db.json` (`lib/store.ts`) — swap for Supabase/Postgres
  using the schema in `db/schema.sql` when you go to production.
- **AI layer** (`lib/ai.ts`) — OpenAI-compatible, with a full offline fallback.

## Going to production

The full architecture, database schema (`db/schema.sql`), AI prompt system,
roadmap, and monetization plan are in **[BLUEPRINT.md](BLUEPRINT.md)**. The
production swap is: replace `lib/store.ts` with Supabase calls (schema is ready),
add auth, and deploy to Vercel.
```
content-lab/
├─ app/
│  ├─ page.tsx            # Dashboard
│  ├─ actions.ts          # Server Actions (ideas, drafts, calendar, recycle)
│  ├─ ideas/              # Vault + detail
│  ├─ drafts/             # List + editor
│  ├─ calendar/           # Schedule
│  └─ inbox/              # Comment → idea recycler
├─ components/            # Client components (capture, editor, workspace…)
├─ lib/{types,store,ai}.ts
├─ db/schema.sql          # Production Postgres/Supabase schema
└─ BLUEPRINT.md           # Full product + implementation plan
```
# content-lab
