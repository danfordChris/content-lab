# &lt;danfordchris/&gt; Content Lab — Product & Implementation Blueprint

> A content operating system for a developer-educator personal brand. Capture ideas → expand with AI → generate multi-platform formats → schedule → track → recycle audience questions back into ideas.

**Stack at a glance:** Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + Auth + Storage + RLS) · OpenAI / Vercel AI Gateway · Vercel.

---

## Table of contents
1. [Product overview](#1-product-overview)
2. [Core features](#2-core-features)
3. [Content strategy system](#3-content-strategy-system)
4. [User roles](#4-user-roles)
5. [User flows](#5-user-flows)
6. [UI/UX design](#6-uiux-design)
7. [Tech stack](#7-tech-stack)
8. [Database schema](#8-database-schema)
9. [AI system](#9-ai-system)
10. [MVP build plan](#10-mvp-build-plan)
11. [API design](#11-api-design)
12. [Example code](#12-example-code)
13. [Monetization](#13-monetization)
14. [Final deliverables](#14-final-deliverables)

---

## 1. Product overview

### What the platform does
Content Lab is a **single-operator content engine**. It removes the three failure points that kill consistent creators:

1. **Idea loss** — ideas arrive in the shower, mid-build, mid-commit, and evaporate. The Idea Vault makes capture friction near-zero (hotkey, mobile share, paste-a-link).
2. **Blank-page paralysis** — a raw idea ("RAG is just search with extra steps") is turned by AI into an angle, an outline, hooks, and ready-to-edit drafts per platform.
3. **The content treadmill** — instead of inventing fresh ideas daily, the system *recycles*: one idea becomes 5 formats, and audience comments/questions become new ideas. The well never runs dry.

### Who it is for
- **Primary (v1):** *you* — a developer building in public across software + AI, who ships fast and wants a private cockpit for the whole pipeline.
- **Secondary (later):** other technical creators, dev advocates, DevRel teams, and tech founders who need to produce credible technical content consistently.

### Main value proposition
> **"Never run out of content again."** Capture once, multiply everywhere, recycle forever — with an AI co-writer that already knows the &lt;danfordchris/&gt; voice.

Three pillars: **Capture · Multiply · Recycle.**

### Core user journey
```
Spark → Capture (Idea Vault) → Expand (AI angle + outline)
   → Generate (LinkedIn / X / Short / blog / carousel)
   → Edit (Draft Editor) → Schedule (Calendar)
   → Publish → Track (Engagement) → Recycle (comment → new idea)
```
The loop is the product. The last arrow feeds the first.

### MVP scope (Phase 1 — ship in ~3–4 weeks part-time)
- Auth (single user / solo creator).
- Idea Vault: capture, list, tag, search, status (`spark → developing → ready → used → archived`).
- Idea detail page with notes.
- AI idea expansion (angle, outline, 3 hooks) — one button.
- AI content generator for **2 formats first**: LinkedIn post + X thread.
- Draft editor with autosave + status.
- Simple calendar (assign a draft to a date; manual "mark as posted").
- Brand-voice system prompt baked in.

**Explicitly out of MVP:** auto-posting to platforms, real-time analytics ingestion, collaboration, billing. These come in later phases.

### Future advanced features
- Native scheduling + auto-publish via platform APIs (LinkedIn, X) and Buffer/Typefully fallback.
- Real engagement ingestion + analytics dashboard.
- Comment→content inbox with auto-clustering of recurring questions.
- "Series brain" — AI tracks ongoing series and suggests the next episode.
- Voice/transcript capture (talk an idea, get a draft).
- Multi-tenant SaaS + team workflows.
- Public creator profile / portfolio of shipped content.

---

## 2. Core features

Each spec: **Purpose · Inputs · Behavior · Data touched · Acceptance criteria.**

### 2.1 Idea Vault
- **Purpose:** the single home for every spark, never lost.
- **Behavior:** infinite list / board, filter by tag/status/pillar/search; sort by recency, "ready" first, or "stale" (oldest sparks needing love). Bulk-tag and bulk-archive.
- **Data:** `ideas`, `tags`, `idea_tags`.
- **Acceptance:** create→appears instantly (optimistic); search returns in <200ms for 1k ideas; status filter persists in URL.

### 2.2 Quick idea capture
- **Purpose:** capture in <3 seconds, anywhere.
- **Inputs:** title (required), optional body, optional source URL, optional pillar.
- **Surfaces:** global `Cmd/Ctrl+K` → "New idea"; a persistent omnibox on the dashboard; mobile PWA share-target (share a tweet/article → pre-filled idea); paste a URL → auto-fetch title/description.
- **Behavior:** smart defaults (status `spark`, pillar inferred by AI on save if blank). Never blocks on AI — saves first, enriches async.
- **Acceptance:** Enter saves and clears; offline → queued and synced.

### 2.3 Tags and categories
- **Purpose:** structure without bureaucracy.
- **Model:** free-form **tags** (many-to-many) + a fixed enum of **pillars** (categories) for strategy. Tags get a color; typeahead suggests existing tags to prevent dupes.
- **Data:** `tags`, `idea_tags`, `ideas.pillar`.
- **Acceptance:** creating a tag inline from the idea page; tag rename cascades.

### 2.4 AI-powered idea expansion
- **Purpose:** turn a one-liner into a working brief.
- **Output (structured JSON):** `angle`, `target_audience`, `why_now`, `outline[]`, `hooks[3]`, `suggested_pillar`, `suggested_formats[]`, `key_examples[]`.
- **Behavior:** streamed into the idea detail page; user can "Accept" sections into the idea's notes, or regenerate one section.
- **Data:** writes `ai_generations` (audit), updates `ideas.expanded_brief` (jsonb).
- **Acceptance:** returns valid structured output; one-section regen costs one call; full token/cost logged.

### 2.5 Content format generator
- **Purpose:** one idea → many platform-native drafts.
- **Formats:** LinkedIn post, X/Twitter thread, YouTube Short script, blog post (markdown), carousel (slide-by-slide).
- **Behavior:** pick formats (multi-select) → generate in parallel → each lands as a `draft` row in `status=draft`, tied back to the idea. Per-format constraints enforced in the prompt (X = 280-char tweets; Short = ~45s spoken; carousel = ≤8 slides).
- **Data:** `drafts`, `ai_generations`, `content_templates`.
- **Acceptance:** generating 3 formats creates 3 drafts; each respects its length rules; failure of one format doesn't block others.

### 2.6 Content calendar
- **Purpose:** see and plan the publishing rhythm.
- **Views:** month, week, and a "this week" planner list. Drag a draft onto a day/time → creates a `content_calendar` slot. Color by platform; ghost slots for the recommended weekly structure (§3.3).
- **Data:** `content_calendar`, `drafts`, `platforms`.
- **Acceptance:** drag-drop persists; conflicts (2 posts same slot) flagged; past unposted slots surface as "overdue."

### 2.7 Draft editor
- **Purpose:** the writing surface.
- **Components:** title, platform badge, body editor (markdown for blog; thread editor with per-tweet cards for X; slide cards for carousel), live char/tweet counter, "AI assist" side panel (rewrite, shorten, punch up hook, fix tone), status selector, schedule button.
- **Behavior:** debounced autosave (every ~1.5s + on blur); version snapshot on each AI rewrite so you can revert.
- **Data:** `drafts` (+ optional `draft_versions`).
- **Acceptance:** no data loss on refresh; counter accurate per platform; AI assist edits are undoable.

### 2.8 Post status tracker
- **Purpose:** know where everything stands.
- **States:** `idea → draft → ready → scheduled → posted → archived` (+ `needs_edit`).
- **Surface:** a kanban board + filterable table. Each card shows platform, scheduled time, and quick actions.
- **Data:** `drafts.status`, `content_calendar`, `posts`.
- **Acceptance:** moving a card updates status + timestamps; "posted" requires a posted-at date (manual in MVP, automatic later).

### 2.9 Engagement tracker
- **Purpose:** close the loop with performance.
- **MVP:** manual entry / paste — after posting, log likes, comments, reposts, impressions per `post`. 
- **Later:** ingest via platform APIs / webhooks on a cron.
- **Data:** `posts`, `analytics`.
- **Acceptance:** per-post metrics editable; rolls up to the analytics dashboard.

### 2.10 Comment/question-to-content converter
- **Purpose:** the recycling engine — your best content ideas come from your audience.
- **Behavior:** paste or import a comment/DM/question → it becomes an `engagement_item`. One click "Turn into idea" runs an AI prompt that reframes the question into a content angle and creates an `idea` (linked back to the source). Recurring/similar questions are clustered so you see "asked 6 times → make this."
- **Data:** `engagement_items`, `ideas` (with `source_engagement_id`).
- **Acceptance:** question → idea in one click; cluster count visible; converted items marked.

### 2.11 Weekly content planner
- **Purpose:** turn the backlog into a concrete week.
- **Behavior:** a guided flow — "Plan next week." It proposes a slate based on your weekly structure (§3.3), pulls `ready` ideas/drafts, fills gaps with AI suggestions from your pillars, and lets you confirm → auto-creates calendar slots.
- **Data:** `ideas`, `drafts`, `content_calendar`.
- **Acceptance:** produces a full week in <2 min of clicking; respects pillar balance.

### 2.12 Analytics dashboard
- **Purpose:** learn what works, feed strategy.
- **Metrics:** posts/week (consistency), engagement rate by platform, by pillar, by format, top performers, "idea→posted" conversion, backlog health (ideas by status). 
- **Data:** `analytics`, `posts`, `drafts`, `ideas`.
- **Acceptance:** date-range filter; "what's working" auto-insight (AI summary of top performers monthly).

### 2.13 AI content assistant
- **Purpose:** an always-available co-writer that knows your voice.
- **Surfaces:** a command palette + an inline side panel in the editor + a chat on the idea page. Skills: expand, outline, draft, rewrite, shorten/lengthen, generate hooks, generate CTAs, repurpose to another format, critique ("is this on-brand?").
- **Data:** `ai_generations` (every call logged with prompt, model, tokens, cost, latency).
- **Acceptance:** every assistant action is one logged generation; brand voice applied automatically; streaming responses.

---

## 3. Content strategy system

### 3.1 Content pillars (5)
1. **Code Craft** — practical software dev: patterns, tooling, debugging, "I shipped X, here's how."
2. **AI in Practice** — LLMs, RAG, agents, prompts — applied, not hype.
3. **Code × AI** — the intersection: AI-assisted dev, codegen, AI features inside real apps.
4. **Simulations & Experiments** — building simulations with software + AI; "what if I model X."
5. **Build in Public** — the journey: shipping logs, metrics, lessons, failures, behind-the-scenes.

(Optional 6th rotating: **Dev Education** — explainers/tutorials, can be tagged across the above.)

### 3.2 Content series names
- **`/build-log`** — weekly build-in-public diary.
- **`/explain-like-i-ship`** — fast technical explainers grounded in real code.
- **`AI, Actually`** — debunking/grounding an AI concept with a working example.
- **`Sim Saturday`** — a small simulation built and explained.
- **`Commit Lessons`** — one lesson learned from a real commit/bug this week.
- **`Stack Decisions`** — why I chose X over Y, with trade-offs.
- **`Reader Asked`** — answering an audience question (powered by the recycler).

### 3.3 Weekly posting structure (sustainable, ~1 long + dailies)
| Day | Platform(s) | Series / format | Pillar |
|-----|-------------|-----------------|--------|
| Mon | LinkedIn + X | `Stack Decisions` (post + thread) | Code Craft / Code×AI |
| Tue | X | `AI, Actually` (thread) | AI in Practice |
| Wed | YouTube Short + X | `explain-like-i-ship` (short + recap) | Dev Education |
| Thu | LinkedIn + carousel | `build-log` (weekly progress carousel) | Build in Public |
| Fri | X | `Reader Asked` (recycled question) | rotating |
| Sat | Blog + X | `Sim Saturday` (blog deep-dive + thread) | Simulations |
| Sun | — | Plan next week (planner flow) | — |

That's ~6 posting days, anchored by 1 blog/week and 1 short/week, the rest short-form. Adjust intensity with one toggle (Lite = 3 days).

### 3.4 30-day content calendar (sample, slot → idea)
Week 1
1. Stack Decisions: "Why I picked Supabase over Firebase for Content Lab"
2. AI, Actually: "RAG is just search with a reranker — a 30-line demo"
3. explain-like-i-ship: Short — "What a vector embedding *actually* is"
4. build-log #1: "I'm building Content Lab in public — week 0"
5. Reader Asked: "How do you not run out of content ideas?" (meta!)
6. Sim Saturday: "Simulating a queue: why your API gets slow under load"

Week 2
7. Stack Decisions: "Server Actions vs API routes — when each wins"
8. AI, Actually: "Prompt injection, shown with a real broken app"
9. Short: "useEffect is not a lifecycle — 40 seconds"
10. build-log #2: "Shipped the Idea Vault — what broke"
11. Reader Asked: "Should I learn AI or get better at fundamentals?"
12. Sim Saturday: "Modeling a pandemic with 50 lines of JS"

Week 3
13. Stack Decisions: "Postgres vs the urge to add Redis"
14. AI, Actually: "Function calling, explained by building a weather agent"
15. Short: "The git command that saved my week"
16. build-log #3: "Adding the AI content generator"
17. Reader Asked: "How do you test AI features that aren't deterministic?"
18. Sim Saturday: "Boids: flocking behavior from 3 rules"

Week 4
19. Stack Decisions: "Why I don't use a state library (yet)"
20. AI, Actually: "Embeddings + pgvector: semantic search in Postgres"
21. Short: "Stop console.logging — try this"
22. build-log #4: "Content Lab now schedules posts"
23. Reader Asked: "Best way to learn by building?"
24. Sim Saturday: "A traffic-jam simulation and what it taught me about backpressure"

Days 25–30: buffer/overflow + 1 monthly recap carousel ("Month 1 of building in public: the numbers") + repurposed top performers.

### 3.5 Formats & length rules
- **LinkedIn post:** 120–200 words, 1 hook line + whitespace + 1 takeaway + soft CTA. No links in body (first comment).
- **X/Twitter thread:** 5–9 tweets, ≤280 chars each, tweet 1 = hook, last = CTA/recap.
- **YouTube Short:** 30–50s spoken script (~90–130 words) with on-screen text cues + B-roll notes.
- **Blog post:** 800–1500 words, markdown, code blocks, intro hook, TL;DR box, headers, conclusion + CTA.
- **Carousel:** 6–8 slides — cover (hook), 4–6 value slides (one idea each), CTA slide.

### 3.6 Templates (one per type — stored in `content_templates`)
**LinkedIn**
```
{HOOK_LINE}

Most devs {COMMON_BELIEF}.
Here's what actually happens: {INSIGHT}

{2-4 short lines of explanation, one idea per line}

The takeaway: {ONE_SENTENCE}

{SOFT_CTA — question to audience}
```
**X thread**
```
1/ {HOOK — bold claim or surprising result}
2/ {context / why it matters}
3–7/ {one point per tweet, concrete + example/code}
8/ {recap in one line}
9/ {CTA: follow / reply / link in next tweet}
```
**YouTube Short**
```
[0-3s HOOK on screen + spoken]: {pattern interrupt}
[3-30s]: {1 concept, 1 example, show don't tell}
[30-45s]: {payoff / result}
[45-50s CTA]: {follow for more / link}
On-screen text: [...]  B-roll: [...]
```
**Blog**
```
# {Title}
> TL;DR: {2 lines}
{Hook intro — a real problem}
## The problem
## The approach (with code)
## What I'd do differently
## Takeaways
{CTA}
```
**Carousel**
```
Slide 1 (cover): {HOOK}
Slide 2: {the problem}
Slide 3-6: {one insight each, big text}
Slide 7: {summary}
Slide 8 (CTA): {follow / save / comment}
```

### 3.7 Hook formulas
- **Contrarian:** "Everyone says X. They're wrong. Here's why."
- **Result-first:** "I cut our build time by 70%. Three changes."
- **Mistake:** "I shipped a bug that cost me a weekend. Don't do what I did."
- **Curiosity gap:** "Most devs misunderstand `useEffect`. Including me, until this."
- **Number:** "5 Postgres features that replace half your backend."
- **Question:** "What if your tests could write themselves?"
- **Story:** "2am. Prod is down. The logs say nothing."

### 3.8 CTA formulas
- Engagement: "What's your take — {A or B}?"
- Follow: "I build in public daily. Follow along →"
- Save: "Save this for your next {task}."
- Lead: "Full walkthrough on the blog (link in comments)."
- Reply-bait: "Reply 'send' and I'll DM you the repo."

### 3.9 Repurposing system
**One source → a cascade.** Default flow when a blog/long-form is created:
```
Blog post (source)
 ├─ X thread (TL;DR as tweets)
 ├─ LinkedIn post (the single biggest takeaway)
 ├─ Carousel (the headers become slides)
 ├─ Short script (the one surprising moment)
 └─ 3 standalone "atomic" tweets (each subheading)
```
Rules: never publish the same format twice the same day; space repurposes 2–5 days apart; always re-hook (don't reuse the same opening line). The generator's "Repurpose" action takes any draft + a target format and rewrites natively, not copy-pasted.

---

## 4. User roles

| Role | Can do | Cannot |
|------|--------|--------|
| **Solo creator (Owner)** | Everything: ideas, drafts, schedule, AI, analytics, settings, billing | — |
| **Admin** | All content + user management + workspace settings | billing (unless also owner) |
| **Collaborator / Editor** | Create/edit ideas & drafts, generate AI content, comment, schedule (if granted) | delete workspace, manage users, billing, change brand voice |
| **Viewer** | Read ideas, drafts, calendar, analytics; comment | create/edit/generate/schedule |

Implemented as a `role` enum on a `workspace_members` join (workspace-scoped), enforced in Postgres via **Row Level Security** + checked in server actions. MVP ships **Owner only**; the schema supports the rest from day one so later phases need no migration of core tables.

---

## 5. User flows

### 5.1 Capture a raw idea
```
Cmd+K (or omnibox / mobile share) → type title → Enter
 → idea saved (status=spark) instantly (optimistic UI)
 → async: AI infers pillar + suggests tags → user can accept later
```

### 5.2 Turn an idea into a post
```
Open idea → "Expand with AI" → review angle/outline/hooks
 → pick a format (e.g. LinkedIn) → "Generate"
 → draft created → opens in editor → edit → status=ready
```

### 5.3 Generate multiple formats from one idea
```
Idea detail → "Generate content" → multi-select [LinkedIn, X, Short, Carousel]
 → parallel generation (streamed) → N drafts created, each linked to idea
 → review grid → tweak each → mark ready
```

### 5.4 Schedule a post
```
Draft (status=ready) → "Schedule" → pick platform + date/time
 (or drag onto calendar) → content_calendar slot created, status=scheduled
 → on date: notification/reminder → user posts → "Mark posted" → status=posted
 (Phase 3: auto-publish via API)
```

### 5.5 Track performance
```
Posted item → "Add metrics" → enter likes/comments/reposts/impressions
 → analytics roll-up updates → dashboard shows by pillar/format/platform
 (Phase 3: cron pulls metrics automatically)
```

### 5.6 Turn comments into new ideas
```
Engagement inbox → paste/import comment → engagement_item created
 → "Turn into idea" → AI reframes into an angle → new idea (status=spark,
   source_engagement_id set) → appears in Vault, ready to expand
 → recurring questions clustered → "asked 6×" badge
```

### 5.7 Weekly planning workflow
```
Sunday → "Plan next week" → planner proposes slate from weekly structure
 → pulls ready ideas/drafts, AI fills gaps by pillar balance
 → user confirms/swaps → calendar slots auto-created for the week
 → dashboard shows the week ahead
```

---

## 6. UI/UX design

Design language: **dark-first developer aesthetic**, monospace accents for the `<danfordchris/>` mark, generous whitespace, keyboard-first (`Cmd+K` everywhere), motion kept subtle. Built with Tailwind + shadcn/ui. Layout: left icon-rail nav + main content + contextual right panel (AI assistant).

### 6.1 Dashboard
- **Purpose:** mission control — what to do today, backlog health, the week ahead.
- **Components:** omnibox quick-capture (top); "Today" card (what's scheduled); backlog health widget (ideas by status); this-week calendar strip; "Stale sparks" nudge; recent AI generations; quick stats (posts this week, streak).
- **Actions:** New idea · Plan week · Jump to calendar · Generate from a ready idea.
- **Empty state:** "Drop your first idea — it all starts with a spark." + big capture box + 3 example prompts.
- **Mobile:** omnibox + Today + backlog as stacked cards; FAB for capture.

### 6.2 Idea Vault
- **Purpose:** browse/search/triage all ideas.
- **Components:** search bar; filter chips (status, pillar, tag); toggle list/board; idea cards (title, pillar color, tags, status, age, "expanded ✓" badge); bulk-select toolbar.
- **Actions:** New idea · filter/sort · bulk tag/archive · open idea.
- **Empty state:** illustration + "No ideas yet" + capture box + "Import from a tweet" tip.
- **Mobile:** single-column list, sticky search, swipe to archive, FAB.

### 6.3 Idea detail page
- **Purpose:** develop one idea fully.
- **Components:** editable title/body; pillar + tags; source link (if from engagement); **AI Expansion panel** (angle, outline, hooks, examples — each section acceptable/regenerable); "Generate content" format picker; list of linked drafts; activity/notes; right-side AI chat.
- **Actions:** Expand with AI · Generate content · add tag · change status · delete.
- **Empty state (pre-expansion):** "This is a raw spark. Expand it →" CTA.
- **Mobile:** stacked; AI panel as a bottom sheet.

### 6.4 Content generator page
- **Purpose:** produce platform-native drafts from an idea/brief.
- **Components:** source idea summary; format multi-select with per-format options (tone, length, include code?); template picker; "Generate" → streamed results in a responsive grid of draft cards; per-card actions (open, regenerate, discard).
- **Actions:** select formats · pick template/tone · Generate · Generate all · open in editor.
- **Empty state:** "Pick at least one format to generate."
- **Mobile:** format chips, results as full-width stacked cards.

### 6.5 Calendar page
- **Purpose:** plan and visualize the schedule.
- **Components:** month/week toggle; draggable draft sidebar ("ready to schedule"); day cells with platform-colored chips; ghost slots from weekly structure; overdue banner.
- **Actions:** drag draft→slot · click slot to schedule/edit · "Plan next week" · reschedule (drag) · mark posted.
- **Empty state:** "Nothing scheduled. Plan your week →" + the weekly-structure template preview.
- **Mobile:** week agenda list (not a grid); tap a day to add; long-press to move.

### 6.6 Draft editor
- **Purpose:** write and polish.
- **Components:** title; platform badge + live counter; format-specific editor (markdown / thread cards / slide cards); **AI assist panel** (rewrite, shorten, punch hook, fix tone, repurpose); status selector; schedule button; version history.
- **Actions:** autosave · AI assist actions · change status · schedule · revert version · copy to clipboard.
- **Empty state:** template skeleton pre-filled for the chosen format.
- **Mobile:** full-screen editor; AI assist as bottom sheet; sticky counter + save indicator.

### 6.7 Engagement inbox
- **Purpose:** capture audience input and recycle it.
- **Components:** list of engagement items (source platform, snippet, date, cluster badge); "Turn into idea" button; cluster groups ("asked 6×"); filter by handled/unhandled.
- **Actions:** add/paste item · turn into idea · dismiss · open linked idea.
- **Empty state:** "Paste a comment or question your audience asked — turn it into your next post."
- **Mobile:** list + quick "→ idea" swipe action.

### 6.8 Analytics page
- **Purpose:** learn what works.
- **Components:** date-range picker; KPI row (posts, avg engagement rate, streak, idea→posted %); charts (engagement by pillar / format / platform; posts over time); top-performers table; AI "what's working" insight card.
- **Actions:** change range · drill into a post · export CSV · generate monthly insight.
- **Empty state:** "No data yet — publish and log a few posts to see trends."
- **Mobile:** KPIs as a 2-col grid, charts swipeable, table → cards.

### 6.9 Settings page
- **Purpose:** identity, voice, integrations, workspace.
- **Sections:** Profile; **Brand voice** (tone sliders + custom rules + example posts the AI learns from); Pillars & series (edit list); Templates; Platforms/integrations (connect LinkedIn/X — Phase 3); AI (model, default temperature, monthly budget cap); Members & roles (Phase 4); Billing (Phase 5).
- **Actions:** save voice · edit pillars/templates · connect platform · set budget · invite member.
- **Empty state:** guided "Set your brand voice in 3 steps" wizard on first run.
- **Mobile:** sectioned accordion.

---

## 7. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js 15 (App Router, RSC) + TypeScript | One framework, server + client, great DX, Vercel-native |
| **UI** | Tailwind CSS + shadcn/ui + lucide icons | Fast, consistent, ownable components |
| **State/data** | Server Components + Server Actions; TanStack Query for client caches; `nuqs` for URL state | Minimal client state; mutations via actions |
| **Backend** | Next.js Server Actions + Route Handlers (`app/api`) on Vercel Fluid Compute | Co-located, typed, no separate server |
| **Database** | Supabase **Postgres** (+ `pgvector` for semantic idea/question clustering) | Relational fits the schema; pgvector enables recycling |
| **Auth** | Supabase Auth (email magic link + GitHub OAuth) | Built-in, integrates with RLS |
| **AI** | OpenAI via **Vercel AI SDK** (`ai`), routed through **Vercel AI Gateway** | Streaming, structured output, provider fallback, cost observability |
| **Storage** | Supabase Storage (carousel images, avatars) / Vercel Blob | Cheap, RLS-aware |
| **Deployment** | Vercel | Zero-config Next.js, cron jobs, preview deploys |
| **Analytics (product)** | Vercel Analytics + PostHog (optional) | Usage + funnels |
| **Background jobs** | Vercel Cron (metric pulls, weekly planner reminders) | Native, simple |
| **Validation** | Zod (shared client/server schemas) | Type-safe inputs + AI structured output |

**Why Supabase over raw Postgres + custom auth:** RLS gives you per-workspace security in the DB itself (critical once multi-tenant), Auth + Storage are included, and you keep plain SQL/Postgres so there's no lock-in on the data model.

**AI routing note:** prefer plain `"openai/gpt-..."` model strings through the AI Gateway (provider-agnostic, gives fallback + cost tracking) rather than wiring a provider SDK directly.

---

## 8. Database schema

Full runnable SQL lives in [`db/schema.sql`](db/schema.sql). Summary below.

Conventions: `uuid` PKs (`gen_random_uuid()`), `created_at`/`updated_at timestamptz default now()`, soft-delete via `archived_at` where useful, everything workspace-scoped for future multi-tenancy.

### users (mirrors `auth.users`)
| field | type | notes |
|-------|------|-------|
| id | uuid PK | = `auth.users.id` |
| email | text | |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### workspaces & workspace_members (roles)
- `workspaces(id, owner_id→users, name, slug, brand_voice jsonb, created_at)`
- `workspace_members(workspace_id, user_id, role enum[owner|admin|editor|viewer], created_at)` — PK `(workspace_id, user_id)`.

### platforms
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| key | text unique | `linkedin`,`x`,`youtube_short`,`blog`,`carousel` |
| name | text | |
| char_limit | int null | platform constraint |
| color | text | UI |

(Seeded reference table; could be an enum, but a table allows per-user custom platforms later.)

### ideas
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK→workspaces | |
| author_id | uuid FK→users | |
| title | text not null | |
| body | text | |
| status | enum `idea_status` | spark/developing/ready/used/archived |
| pillar | enum `pillar` | code_craft/ai_practice/code_x_ai/simulations/build_in_public/dev_education |
| source_url | text | |
| source_engagement_id | uuid FK→engagement_items null | recycling link |
| expanded_brief | jsonb | AI expansion output |
| embedding | vector(1536) | pgvector — dedupe/cluster |
| created_at / updated_at / archived_at | timestamptz | |

Indexes: `(workspace_id, status)`, `(workspace_id, pillar)`, GIN on `to_tsvector(title||body)` for search, `ivfflat` on `embedding`.

### tags & idea_tags
- `tags(id, workspace_id, name, color, created_at)` — unique `(workspace_id, lower(name))`.
- `idea_tags(idea_id, tag_id)` — PK both; FKs `on delete cascade`. Index `(tag_id)`.

### drafts
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| idea_id | uuid FK→ideas null | source idea |
| platform_id | uuid FK→platforms | |
| title | text | |
| content | text | body (markdown / serialized thread / slides) |
| format_meta | jsonb | e.g. tweets[], slides[] |
| status | enum `draft_status` | draft/ready/needs_edit/scheduled/posted/archived |
| created_by | uuid FK→users | |
| created_at / updated_at | timestamptz | |

Indexes: `(workspace_id, status)`, `(idea_id)`, `(platform_id)`.

### draft_versions (for editor undo / AI revert)
`(id, draft_id FK, content, format_meta jsonb, created_by, created_at)` — index `(draft_id, created_at desc)`.

### content_calendar
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| draft_id | uuid FK→drafts null | |
| platform_id | uuid FK→platforms | |
| scheduled_at | timestamptz not null | |
| status | enum | scheduled/posted/skipped/overdue |
| posted_at | timestamptz null | |
| created_at | timestamptz | |

Indexes: `(workspace_id, scheduled_at)`, `(draft_id)`. Unique `(workspace_id, platform_id, scheduled_at)` to prevent double-booking a slot.

### posts (published record + engagement target)
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| draft_id | uuid FK→drafts | |
| platform_id | uuid FK→platforms | |
| external_url | text | live post URL |
| external_id | text | platform post id (for API metric pulls) |
| posted_at | timestamptz | |
| created_at | timestamptz | |

Index `(workspace_id, posted_at)`, `(platform_id, external_id)`.

### engagement_items (comments/questions in)
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| post_id | uuid FK→posts null | which post it came from |
| platform_id | uuid FK→platforms null | |
| author_handle | text | |
| content | text not null | the comment/question |
| type | enum | comment/question/dm/mention |
| embedding | vector(1536) | clustering recurring questions |
| cluster_id | uuid null | grouped questions |
| converted_idea_id | uuid FK→ideas null | recycling link |
| handled | bool default false | |
| created_at | timestamptz | |

Indexes: `(workspace_id, handled)`, `ivfflat(embedding)`.

### analytics (metrics per post over time)
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| post_id | uuid FK→posts | |
| captured_at | timestamptz | snapshot time |
| impressions | int | |
| likes | int | |
| comments | int | |
| reposts | int | |
| clicks | int | |
| engagement_rate | numeric generated | (likes+comments+reposts)/impressions |

Index `(post_id, captured_at desc)`, `(workspace_id, captured_at)`. Time-series rows allow trend tracking, latest snapshot = current.

### content_templates
`(id, workspace_id null=global, platform_id FK, name, structure text, variables jsonb, is_default bool, created_at)`. Index `(workspace_id, platform_id)`.

### ai_generations (audit + cost)
| field | type | notes |
|-------|------|-------|
| id | uuid PK | |
| workspace_id | uuid FK | |
| user_id | uuid FK | |
| kind | enum | expand/generate/rewrite/hooks/cta/repurpose/comment_to_idea/critique |
| target_type | text | idea/draft/engagement |
| target_id | uuid | |
| model | text | |
| system_prompt | text | |
| user_prompt | text | |
| output | jsonb | |
| prompt_tokens / completion_tokens | int | |
| cost_usd | numeric | |
| latency_ms | int | |
| created_at | timestamptz | |

Index `(workspace_id, created_at desc)`, `(kind)`. Powers the budget cap + analytics on AI usage.

**RLS:** every workspace-scoped table gets a policy `using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()))`, with write policies further gated by role.

---

## 9. AI system

### 9.1 Architecture
```
UI action ─▶ Server Action ─▶ buildPrompt(kind, context, brandVoice)
   ─▶ AI SDK (generateObject / streamText via AI Gateway)
   ─▶ validate with Zod schema ─▶ persist (draft/idea/...) + log ai_generations
   ─▶ stream/return to UI
```
- **Structured tasks** (expand, hooks, generate) use `generateObject` with a Zod schema → guaranteed shape.
- **Free-form tasks** (rewrite, chat) use `streamText`.
- **Brand voice** is injected into every system prompt from `workspaces.brand_voice`.
- Every call is wrapped by `logGeneration()` (tokens, cost, latency) and checked against the monthly budget cap before running.

### 9.2 System prompt (base — prepended to all)
```
You are the content co-writer for the personal brand <danfordchris/>.
The brand is a developer-educator covering software development, AI, the
intersection of code and AI, simulations, developer education, and building
in public.

Voice rules (always obey):
- Practical and developer-friendly. Talk to a smart engineer, not a beginner.
- Clear and concise. Short sentences. No corporate fluff, no hype words
  ("revolutionary", "game-changer", "unleash"), no emoji spam.
- Curious and slightly playful, never cringe. Confident, not arrogant.
- Technical but simple: explain hard things with concrete, real-world examples
  and, when relevant, small code snippets.
- Always ground claims in something real: a project, a bug, a benchmark, a line
  of code. Show, don't just tell.
- Naturally weave in the <danfordchris/> identity; never force it.
- Build-in-public tone: honest about trade-offs and failures.

Output rules:
- Match the requested platform's format and length exactly.
- Never invent fake metrics, fake quotes, or features that don't exist.
- If you lack a real example, ask for one rather than fabricating.
```

### 9.3 User prompt templates (per task)

**Idea expansion** (`generateObject`, schema = angle/outline/hooks/...):
```
Expand this raw idea into a content brief.
IDEA: "{title}"
NOTES: "{body}"
Return: a sharp angle, the target audience, why it matters now, a 4-6 point
outline, exactly 3 scroll-stopping hooks, the most likely content pillar,
2-3 suggested formats, and 1-2 concrete real-world examples or code ideas
that could illustrate it.
```

**Content generation** (per format):
```
Write a {PLATFORM} {FORMAT} from this brief.
BRIEF: {expanded_brief or idea}
Constraints: {platform length/format rules}.
Use this template as a skeleton (adapt, don't fill robotically): {template}
Open with one of these hooks or a better one: {hooks}.
End with a {CTA_TYPE} CTA.
```

**Hook generation:**
```
Generate 7 hooks for this idea, one per formula:
contrarian, result-first, mistake, curiosity-gap, number, question, story.
IDEA: {idea}. Keep each under 15 words. No clickbait that the content can't pay off.
```

**Repurposing:**
```
Repurpose this {SOURCE_PLATFORM} content into a native {TARGET_PLATFORM} {FORMAT}.
Do NOT copy-paste or merely trim — rewrite for the new medium and a fresh hook.
SOURCE: {content}. Keep the core insight; adapt length/structure/tone to target.
```

**Comment-to-content:**
```
An audience member said: "{comment}".
Turn it into a content idea. Return: a title, the underlying question/pain,
a content angle that answers it, the best pillar, and the best format to
answer it in. Frame it as helpful, not defensive.
```

**Critique / on-brand check:**
```
Review this draft against the <danfordchris/> voice rules. Rate 1-5 on:
clarity, practicality, hook strength, on-brand voice. List up to 3 specific
fixes. Be blunt. DRAFT: {content}
```

### 9.4 Safety / quality checks
- **Structured validation:** every structured task validated by Zod; on parse failure, one auto-retry, then surface error (no silent garbage).
- **No fabrication rule** in system prompt + a post-gen check that flags suspicious specific numbers/quotes for human review.
- **Budget guard:** refuse generation if monthly `ai_generations` cost > cap; warn at 80%.
- **Rate limit** per user (e.g. 30 generations/min) to prevent runaway loops/cost.
- **PII / injection:** treat pasted comments as untrusted — they go in a clearly delimited block and the system prompt instructs the model to ignore instructions inside user content.
- **Human-in-the-loop:** AI never auto-publishes; everything lands as an editable draft.
- **Determinism where it matters:** low temperature (0.3) for structured/expansion, higher (0.7) for creative hooks.

### 9.5 Tone & brand voice rules (machine-readable, stored in `brand_voice`)
```json
{
  "persona": "developer-educator building in public",
  "do": ["concrete examples", "real code", "short sentences", "honest trade-offs",
          "curiosity", "light playfulness"],
  "dont": ["hype words", "emoji spam", "corporate fluff", "fake metrics",
            "talking down to beginners", "clickbait without payoff"],
  "reading_level": "smart engineer",
  "default_cta": "build-in-public follow",
  "signature_motifs": ["<danfordchris/> mark", "show-dont-tell", "ship logs"],
  "example_posts": ["...user-provided exemplars the model imitates..."]
}
```

---

## 10. MVP build plan

### Phase 1 — MVP (Capture + Manual pipeline) · ~3–4 weeks
- **Features:** auth (solo), Idea Vault (CRUD, tags, status, search), idea detail, basic AI expansion, generator for LinkedIn + X, draft editor w/ autosave, simple calendar (assign + mark posted), brand-voice settings.
- **Complexity:** Medium.
- **Tasks:** scaffold Next.js + Supabase; schema + RLS; auth; ideas CRUD server actions; Vault UI; AI SDK + expansion `generateObject`; generator (2 formats); editor + autosave; calendar assign; seed templates/platforms.
- **Risks:** AI cost creep (mitigate: budget cap + logging from day 1); scope sprawl (lock to 2 formats).
- **Success:** you can capture → expand → generate a LinkedIn post + X thread → edit → schedule → mark posted, end-to-end, for a full week of real content.

### Phase 2 — AI assistant (deepen) · ~2 weeks
- **Features:** full assistant (rewrite/shorten/hooks/CTA/critique), all 5 formats, repurposing engine, idea embeddings + dedupe, "what to write" suggestions.
- **Complexity:** Medium.
- **Tasks:** assistant side panel + streaming; per-format generators; repurpose action; pgvector embeddings on ideas; suggestion endpoint.
- **Risks:** prompt quality/consistency (mitigate: golden-set eval of a few prompts); structured-output drift.
- **Success:** one idea reliably yields 5 native drafts; rewrites feel on-brand; you stop writing first drafts by hand.

### Phase 3 — Scheduling & analytics · ~3 weeks
- **Features:** real scheduling (Vercel Cron reminders, optional auto-publish via Typefully/Buffer or platform APIs), engagement tracking, analytics dashboard, monthly AI insight.
- **Complexity:** Medium-High (3rd-party APIs).
- **Tasks:** calendar drag-drop; cron jobs; platform OAuth + publish adapters; metrics ingestion; analytics queries + charts.
- **Risks:** platform API limits/approval (X/LinkedIn are strict) — mitigate with a scheduler integration (Typefully API) as fallback and manual logging always available.
- **Success:** posts publish/remind on schedule; you see engagement by pillar/format and act on it.

### Phase 4 — Collaboration · ~2–3 weeks
- **Features:** workspaces, invite members, roles (admin/editor/viewer), comments/approvals, activity feed.
- **Complexity:** Medium.
- **Tasks:** workspace_members UI; role-gated RLS + server-action guards; invitations; review/approve flow.
- **Risks:** RLS correctness (mitigate: policy tests).
- **Success:** a collaborator can draft, an owner can approve, viewers can read — securely.

### Phase 5 — Public creator platform (SaaS) · ~4+ weeks
- **Features:** multi-tenant onboarding, billing (Stripe) + tiers, usage metering on AI, public profile/portfolio, templates marketplace.
- **Complexity:** High.
- **Tasks:** Stripe + plan gating; per-workspace AI quotas; marketing site; onboarding; public pages.
- **Risks:** cost-of-goods (AI) vs pricing — mitigate with metered tiers + caps.
- **Success:** external creators sign up, pay, and produce content; unit economics positive.

---

## 11. API design

Mutations are **Server Actions**; reads are RSC queries; a few **Route Handlers** exist for streaming AI and cron/webhooks. All inputs Zod-validated, all workspace-scoped, all role-checked.

### Server Actions (`app/_actions/*`)
```
ideas
  createIdea(input: {title, body?, pillar?, sourceUrl?, tags?})      → Idea
  updateIdea(id, patch)                                              → Idea
  setIdeaStatus(id, status)                                          → Idea
  archiveIdea(id)                                                    → void
  addTagToIdea(ideaId, tagName)                                      → Tag

ai
  expandIdea(ideaId)                          → ExpandedBrief (streamed)
  generateContent(ideaId, formats[], opts)    → Draft[]   (streamed/parallel)
  rewriteDraft(draftId, instruction)          → Draft
  generateHooks(ideaId)                        → Hook[]
  generateCTAs(ideaId, type)                   → string[]
  repurposeDraft(draftId, targetFormat)        → Draft
  commentToIdea(engagementId)                  → Idea
  critiqueDraft(draftId)                       → Critique

drafts
  saveDraft(id, {content, formatMeta})        → Draft   (autosave)
  setDraftStatus(id, status)                  → Draft
  createDraftVersion(draftId)                 → DraftVersion

calendar
  schedulePost(draftId, {platformId, scheduledAt}) → CalendarSlot
  reschedule(slotId, scheduledAt)                  → CalendarSlot
  markPosted(slotId, {externalUrl?})               → Post

engagement
  addEngagementItem(input)                    → EngagementItem
  convertToIdea(engagementId)                 → Idea   (alias of ai.commentToIdea)

analytics
  recordMetrics(postId, metrics)              → Analytics
```

### Route Handlers (`app/api/*`)
```
POST /api/ai/stream        → streaming AI responses (assistant chat/rewrite)
GET  /api/analytics/summary?from&to&groupBy   → rollups for dashboard
POST /api/webhooks/platform/:key              → inbound metrics/comments (Phase 3)
GET  /api/cron/pull-metrics                   → Vercel Cron (Phase 3)
GET  /api/cron/weekly-planner-reminder        → Vercel Cron
POST /api/ideas/quick-capture                 → PWA share-target endpoint
```

### Representative REST mapping (if/when a public API is exposed in Phase 5)
```
POST   /api/v1/ideas
GET    /api/v1/ideas?status=&pillar=&q=
PATCH  /api/v1/ideas/:id
POST   /api/v1/ideas/:id/expand
POST   /api/v1/ideas/:id/generate         { formats: [...] }
PUT    /api/v1/drafts/:id
POST   /api/v1/drafts/:id/schedule        { platformId, scheduledAt }
POST   /api/v1/posts/:id/metrics
GET    /api/v1/analytics/summary
```

---

## 12. Example code

> Full files are scaffolded in this repo: [`db/schema.sql`](db/schema.sql), [`examples/`](examples/). Key snippets below.

### 12.1 Project structure
```
content-lab/
├─ app/
│  ├─ (app)/
│  │  ├─ dashboard/page.tsx
│  │  ├─ ideas/page.tsx
│  │  ├─ ideas/[id]/page.tsx
│  │  ├─ generate/[ideaId]/page.tsx
│  │  ├─ calendar/page.tsx
│  │  ├─ drafts/[id]/page.tsx
│  │  ├─ inbox/page.tsx
│  │  ├─ analytics/page.tsx
│  │  └─ settings/page.tsx
│  ├─ _actions/{ideas,ai,drafts,calendar,engagement}.ts
│  ├─ api/ai/stream/route.ts
│  └─ api/cron/pull-metrics/route.ts
├─ components/   (shadcn + app components)
├─ lib/
│  ├─ supabase/{server,client}.ts
│  ├─ ai/{prompts.ts,brandVoice.ts,schemas.ts,generate.ts}
│  └─ validators.ts            (Zod)
├─ db/schema.sql
└─ examples/                   (the starter files below)
```

### 12.2 Idea creation Server Action + Zod
```ts
// lib/validators.ts
import { z } from "zod";
export const createIdeaSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().max(5000).optional(),
  pillar: z.enum(["code_craft","ai_practice","code_x_ai",
                  "simulations","build_in_public","dev_education"]).optional(),
  sourceUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

// app/_actions/ideas.ts
"use server";
import { createIdeaSchema } from "@/lib/validators";
import { getServerSupabase, requireWorkspace } from "@/lib/supabase/server";

export async function createIdea(raw: unknown) {
  const input = createIdeaSchema.parse(raw);
  const supabase = await getServerSupabase();
  const { user, workspaceId } = await requireWorkspace();

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      workspace_id: workspaceId,
      author_id: user.id,
      title: input.title,
      body: input.body ?? null,
      pillar: input.pillar ?? null,
      source_url: input.sourceUrl ?? null,
      status: "spark",
    })
    .select()
    .single();
  if (error) throw error;

  if (input.tags?.length) await attachTags(supabase, workspaceId, data.id, input.tags);
  return data;
}
```

### 12.3 AI content generation (structured + logged)
```ts
// lib/ai/generate.ts
import { generateObject } from "ai";
import { z } from "zod";
import { brandSystemPrompt } from "./brandVoice";
import { logGeneration } from "./log";

const draftSchema = z.object({
  title: z.string(),
  content: z.string(),
  formatMeta: z.record(z.any()).optional(),
});

export async function generateDraft(opts: {
  workspaceId: string; userId: string;
  platformKey: string; brief: string; template: string; hooks: string[];
}) {
  const system = brandSystemPrompt(opts.workspaceId); // injects brand_voice
  const prompt = `Write a ${opts.platformKey} post from this brief.
BRIEF: ${opts.brief}
Skeleton (adapt, don't fill robotically): ${opts.template}
Open with one of these hooks or a better one: ${opts.hooks.join(" | ")}`;

  const t0 = Date.now();
  const { object, usage } = await generateObject({
    model: "openai/gpt-5-mini",            // via Vercel AI Gateway
    schema: draftSchema,
    system: await system,
    prompt,
    temperature: 0.6,
  });

  await logGeneration({
    workspaceId: opts.workspaceId, userId: opts.userId,
    kind: "generate", model: "openai/gpt-5-mini",
    systemPrompt: await system, userPrompt: prompt, output: object,
    promptTokens: usage.inputTokens, completionTokens: usage.outputTokens,
    latencyMs: Date.now() - t0,
  });
  return object;
}
```

### 12.4 Draft autosave logic
```ts
// app/_actions/drafts.ts
"use server";
import { getServerSupabase, requireWorkspace } from "@/lib/supabase/server";

export async function saveDraft(id: string, patch: { content: string; formatMeta?: any }) {
  const supabase = await getServerSupabase();
  await requireWorkspace();
  const { data, error } = await supabase
    .from("drafts")
    .update({ content: patch.content, format_meta: patch.formatMeta ?? {}, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```
```tsx
// components/use-autosave.ts (client) — debounced
import { useEffect, useRef } from "react";
import { saveDraft } from "@/app/_actions/drafts";
export function useAutosave(id: string, content: string, formatMeta?: any) {
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => { saveDraft(id, { content, formatMeta }); }, 1500);
    return () => clearTimeout(t.current);
  }, [id, content, formatMeta]);
}
```

### 12.5 Calendar data model (TS types mirroring schema)
```ts
export type Platform = { id: string; key: "linkedin"|"x"|"youtube_short"|"blog"|"carousel"; name: string; color: string };
export type CalendarSlot = {
  id: string; workspaceId: string; draftId: string | null;
  platformId: string; scheduledAt: string; // ISO
  status: "scheduled"|"posted"|"skipped"|"overdue"; postedAt: string | null;
};
export type WeekPlan = { weekStart: string; slots: CalendarSlot[] };
```

---

## 13. Monetization

| Direction | Who pays | What they get |
|-----------|----------|---------------|
| **SaaS for creators** | Solo technical creators | The full pipeline + AI co-writer tuned for dev content |
| **Developer content assistant** | DevRel / dev advocates | On-brand technical drafts at speed, with code-aware AI |
| **Team content workflow** | Small startups / agencies | Workspaces, roles, approvals, shared calendar |
| **AI content lab for tech founders** | Founders building in public | "Founder voice" presets, investor-update + launch templates |
| **Templates / prompt marketplace** | Creators | Sell/share pillar+template packs |

**Subscription tiers**
- **Free / Solo** — 1 workspace, capped AI generations/mo, 2 formats, manual scheduling. (Your own use lives here.)
- **Pro ($15–25/mo)** — all 5 formats, full AI assistant + repurposing, scheduling + analytics, higher AI quota.
- **Team ($49–99/mo)** — workspaces, roles, approvals, shared calendar, seat-based.
- **Lab / Founder ($199+/mo)** — custom brand-voice training, priority models, API access, white-glove onboarding.

Cost control: AI metered per tier with hard caps + the budget guard already in the schema (`ai_generations.cost_usd`), so COGS never outruns revenue.

---

## 14. Final deliverables

### MVP feature list
- Auth (solo creator).
- Idea Vault: capture (Cmd+K/omnibox), list/board, tags, pillars, status, search.
- Idea detail + AI expansion (angle/outline/3 hooks).
- Content generator: **LinkedIn post + X thread**.
- Draft editor with autosave + status.
- Simple calendar: assign draft to date, mark posted.
- Brand-voice settings powering all AI.
- AI usage logging + budget cap.

### Recommended first version (the smallest thing worth using daily)
Capture → expand → generate LinkedIn + X → edit → schedule → mark posted, for **one real week of your own content**. Ship that loop before anything else. Everything else is additive.

### Database tables
`users · workspaces · workspace_members · platforms · ideas · tags · idea_tags · drafts · draft_versions · content_calendar · posts · engagement_items · analytics · content_templates · ai_generations`

### Main pages
`Dashboard · Idea Vault · Idea detail · Content generator · Calendar · Draft editor · Engagement inbox · Analytics · Settings`

### AI prompts needed
`base system (brand voice) · idea expansion · content generation (per format) · hook generation · CTA generation · repurposing · comment-to-content · critique/on-brand check`

### First 10 development tasks
1. Scaffold Next.js 15 + TS + Tailwind + shadcn; init Supabase project.
2. Apply `db/schema.sql` (tables, enums, RLS, seed platforms + templates).
3. Supabase Auth (magic link + GitHub) + `requireWorkspace()` helper + auto-create a workspace on signup.
4. Ideas server actions (`createIdea/updateIdea/setStatus/archive`) + Zod validators.
5. Idea Vault page: list/board, filters (URL state via `nuqs`), search, Cmd+K quick capture.
6. Idea detail page (edit, tags, status).
7. AI plumbing: AI SDK + Gateway, `brandVoice` system prompt, `logGeneration`, budget guard.
8. `expandIdea` (`generateObject`) wired into idea detail with streaming.
9. `generateContent` for LinkedIn + X → creates drafts; generator page.
10. Draft editor with debounced autosave + status; simple calendar assign + "mark posted".

### First 30 content ideas for &lt;danfordchris/&gt;
1. Why I picked Supabase over Firebase for Content Lab
2. RAG is just search with a reranker — a 30-line demo
3. What a vector embedding *actually* is (Short)
4. Building Content Lab in public — week 0
5. How I stopped running out of content ideas (this app's origin story)
6. Simulating a queue: why your API gets slow under load
7. Server Actions vs API routes — when each wins
8. Prompt injection, shown with a real broken app
9. `useEffect` is not a lifecycle method (Short)
10. Shipped the Idea Vault — what broke and why
11. Should you learn AI or master fundamentals? (a take)
12. Modeling a pandemic with 50 lines of JS
13. Postgres vs the urge to reach for Redis
14. Function calling explained by building a weather agent
15. The one git command that saved my week (Short)
16. Adding an AI content generator — the prompt design
17. How to test AI features that aren't deterministic
18. Boids: flocking behavior from 3 simple rules
19. Why I don't use a state-management library (yet)
20. pgvector: semantic search inside plain Postgres
21. Stop console.logging — do this instead (Short)
22. Content Lab now schedules posts — the architecture
23. The best way to learn is to build — here's my system
24. A traffic-jam simulation taught me about backpressure
25. Reading code is a skill — how I got better at it
26. Cost-controlling an AI app before it bankrupts you
27. Zod + structured AI output = no more JSON parsing pain
28. What "build in public" actually did for my reach (with numbers)
29. From audience question to published post in 60 seconds (demo)
30. Month 1 of building Content Lab: the numbers (carousel)

---

*Generated as an implementation-ready blueprint. Start with `db/schema.sql` and the first 10 tasks.*
