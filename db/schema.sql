-- <danfordchris/> Content Lab — Postgres / Supabase schema
-- Run in Supabase SQL editor. Idempotent-ish: uses IF NOT EXISTS where possible.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";     -- pgvector (embeddings)

-- ─── Enums ───────────────────────────────────────────────────────────────────
do $$ begin
  create type idea_status   as enum ('spark','developing','ready','used','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type pillar        as enum ('code_craft','ai_practice','code_x_ai','simulations','build_in_public','dev_education');
exception when duplicate_object then null; end $$;
do $$ begin
  create type draft_status  as enum ('draft','ready','needs_edit','scheduled','posted','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type slot_status    as enum ('scheduled','posted','skipped','overdue');
exception when duplicate_object then null; end $$;
do $$ begin
  create type member_role   as enum ('owner','admin','editor','viewer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type engagement_type as enum ('comment','question','dm','mention');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ai_kind       as enum ('expand','generate','rewrite','hooks','cta','repurpose','comment_to_idea','critique');
exception when duplicate_object then null; end $$;

-- ─── Users (mirror of auth.users) ────────────────────────────────────────────
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ─── Workspaces & members (roles / multi-tenancy ready) ──────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete cascade,
  name        text not null,
  slug        text unique,
  brand_voice jsonb not null default '{}'::jsonb,
  ai_budget_usd numeric(10,2) not null default 25.00,
  created_at  timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         member_role not null default 'owner',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ─── Platforms (reference) ───────────────────────────────────────────────────
create table if not exists platforms (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  name       text not null,
  char_limit int,
  color      text
);

-- ─── Tags ────────────────────────────────────────────────────────────────────
create table if not exists tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  color        text,
  created_at   timestamptz not null default now()
);
create unique index if not exists tags_ws_name_uq on tags (workspace_id, lower(name));

-- ─── Engagement items (declared before ideas for the FK) ─────────────────────
create table if not exists engagement_items (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  post_id          uuid,                       -- FK added after posts exists
  platform_id      uuid references platforms(id),
  author_handle    text,
  content          text not null,
  type             engagement_type not null default 'comment',
  embedding        vector(1536),
  cluster_id       uuid,
  converted_idea_id uuid,                       -- FK added after ideas exists
  handled          boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ─── Ideas ───────────────────────────────────────────────────────────────────
create table if not exists ideas (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  author_id           uuid not null references users(id) on delete cascade,
  title               text not null,
  body                text,
  status              idea_status not null default 'spark',
  pillar              pillar,
  source_url          text,
  source_engagement_id uuid references engagement_items(id) on delete set null,
  expanded_brief      jsonb,
  embedding           vector(1536),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz
);
create index if not exists ideas_ws_status_idx on ideas (workspace_id, status);
create index if not exists ideas_ws_pillar_idx on ideas (workspace_id, pillar);
create index if not exists ideas_search_idx on ideas
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')));
create index if not exists ideas_embedding_idx on ideas
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- now that ideas exists, close the engagement_items FK
alter table engagement_items
  add constraint engagement_converted_idea_fk
  foreign key (converted_idea_id) references ideas(id) on delete set null;

-- ─── Idea <-> Tags ───────────────────────────────────────────────────────────
create table if not exists idea_tags (
  idea_id uuid not null references ideas(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (idea_id, tag_id)
);
create index if not exists idea_tags_tag_idx on idea_tags (tag_id);

-- ─── Drafts ──────────────────────────────────────────────────────────────────
create table if not exists drafts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  idea_id      uuid references ideas(id) on delete set null,
  platform_id  uuid not null references platforms(id),
  title        text,
  content      text,
  format_meta  jsonb not null default '{}'::jsonb,
  status       draft_status not null default 'draft',
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists drafts_ws_status_idx on drafts (workspace_id, status);
create index if not exists drafts_idea_idx on drafts (idea_id);
create index if not exists drafts_platform_idx on drafts (platform_id);

create table if not exists draft_versions (
  id          uuid primary key default gen_random_uuid(),
  draft_id    uuid not null references drafts(id) on delete cascade,
  content     text,
  format_meta jsonb,
  created_by  uuid references users(id),
  created_at  timestamptz not null default now()
);
create index if not exists draft_versions_idx on draft_versions (draft_id, created_at desc);

-- ─── Posts (published) ───────────────────────────────────────────────────────
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  draft_id     uuid references drafts(id) on delete set null,
  platform_id  uuid not null references platforms(id),
  external_url text,
  external_id  text,
  posted_at    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists posts_ws_posted_idx on posts (workspace_id, posted_at);
create index if not exists posts_external_idx on posts (platform_id, external_id);

-- close the engagement_items.post_id FK now that posts exists
alter table engagement_items
  add constraint engagement_post_fk
  foreign key (post_id) references posts(id) on delete set null;
create index if not exists engagement_ws_handled_idx on engagement_items (workspace_id, handled);
create index if not exists engagement_embedding_idx on engagement_items
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ─── Content calendar ────────────────────────────────────────────────────────
create table if not exists content_calendar (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  draft_id     uuid references drafts(id) on delete set null,
  platform_id  uuid not null references platforms(id),
  scheduled_at timestamptz not null,
  status       slot_status not null default 'scheduled',
  posted_at    timestamptz,
  created_at   timestamptz not null default now(),
  unique (workspace_id, platform_id, scheduled_at)
);
create index if not exists calendar_ws_time_idx on content_calendar (workspace_id, scheduled_at);
create index if not exists calendar_draft_idx on content_calendar (draft_id);

-- ─── Analytics (time-series per post) ────────────────────────────────────────
create table if not exists analytics (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  post_id         uuid not null references posts(id) on delete cascade,
  captured_at     timestamptz not null default now(),
  impressions     int not null default 0,
  likes           int not null default 0,
  comments        int not null default 0,
  reposts         int not null default 0,
  clicks          int not null default 0,
  engagement_rate numeric generated always as (
    case when impressions > 0
      then round((likes + comments + reposts)::numeric / impressions, 4)
      else 0 end
  ) stored
);
create index if not exists analytics_post_idx on analytics (post_id, captured_at desc);
create index if not exists analytics_ws_time_idx on analytics (workspace_id, captured_at);

-- ─── Content templates ───────────────────────────────────────────────────────
create table if not exists content_templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,  -- null = global
  platform_id  uuid references platforms(id),
  name         text not null,
  structure    text not null,
  variables    jsonb not null default '[]'::jsonb,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists templates_ws_platform_idx on content_templates (workspace_id, platform_id);

-- ─── AI generations (audit + cost) ───────────────────────────────────────────
create table if not exists ai_generations (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  user_id           uuid references users(id),
  kind              ai_kind not null,
  target_type       text,
  target_id         uuid,
  model             text,
  system_prompt     text,
  user_prompt       text,
  output            jsonb,
  prompt_tokens     int,
  completion_tokens int,
  cost_usd          numeric(10,5),
  latency_ms        int,
  created_at        timestamptz not null default now()
);
create index if not exists ai_gen_ws_time_idx on ai_generations (workspace_id, created_at desc);
create index if not exists ai_gen_kind_idx on ai_generations (kind);

-- ─── Seed: platforms ─────────────────────────────────────────────────────────
insert into platforms (key, name, char_limit, color) values
  ('linkedin','LinkedIn',3000,'#0A66C2'),
  ('x','X / Twitter',280,'#000000'),
  ('youtube_short','YouTube Short',null,'#FF0000'),
  ('blog','Blog',null,'#10B981'),
  ('carousel','Carousel',null,'#8B5CF6')
on conflict (key) do nothing;

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Helper: workspaces the current user belongs to.
create or replace function my_workspaces() returns setof uuid
  language sql security definer stable as $$
    select workspace_id from workspace_members where user_id = auth.uid()
$$;

-- Enable RLS + base policies on workspace-scoped tables.
do $$
declare t text;
begin
  foreach t in array array[
    'ideas','tags','idea_tags','drafts','draft_versions','content_calendar',
    'posts','engagement_items','analytics','content_templates','ai_generations',
    'workspaces','workspace_members'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Example policies (idea_tags & content_templates handled separately for nuance).
create policy ideas_rw         on ideas         using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy tags_rw          on tags          using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy drafts_rw        on drafts        using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy draftver_rw      on draft_versions using (draft_id in (select id from drafts where workspace_id in (select my_workspaces())));
create policy calendar_rw      on content_calendar using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy posts_rw         on posts         using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy engagement_rw    on engagement_items using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy analytics_rw     on analytics     using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy templates_rw     on content_templates using (workspace_id is null or workspace_id in (select my_workspaces()));
create policy aigen_rw         on ai_generations using (workspace_id in (select my_workspaces())) with check (workspace_id in (select my_workspaces()));
create policy idea_tags_rw     on idea_tags     using (idea_id in (select id from ideas where workspace_id in (select my_workspaces())));
create policy workspaces_rw    on workspaces    using (id in (select my_workspaces()));
create policy members_r        on workspace_members using (workspace_id in (select my_workspaces()));

-- updated_at trigger
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger ideas_touch  before update on ideas  for each row execute function touch_updated_at();
create trigger drafts_touch before update on drafts for each row execute function touch_updated_at();
