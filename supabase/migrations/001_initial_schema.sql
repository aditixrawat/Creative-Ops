-- ──────────────────────────────────────────────────
-- Creative Ops — Initial Schema
-- Run in Supabase SQL Editor or via: supabase db push
-- ──────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────
create type user_role as enum ('strategist', 'ai_intern', 'admin');
create type campaign_status as enum ('draft', 'planned', 'live', 'review', 'complete', 'archived');
create type workflow_type as enum ('sop', 'template', 'runbook', 'checklist');
create type pricing_model as enum ('free', 'freemium', 'paid', 'enterprise', 'open_source');

-- ── Users (extends Supabase auth.users) ─────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        user_role not null default 'strategist',
  avatar_url  text,
  team_id     uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Prompts ──────────────────────────────────────
create table if not exists public.prompts (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  body         text not null,
  category     text,
  tags         jsonb not null default '[]',
  version      integer not null default 1,
  parent_id    uuid references public.prompts(id) on delete set null,
  author_id    uuid not null references public.users(id) on delete cascade,
  is_public    boolean not null default false,
  model_target text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Campaigns ────────────────────────────────────
create table if not exists public.campaigns (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  brief      jsonb not null default '{}',
  status     campaign_status not null default 'draft',
  start_date date,
  end_date   date,
  owner_id   uuid not null references public.users(id) on delete cascade,
  tags       jsonb not null default '[]',
  metrics    jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Iterations ───────────────────────────────────
create table if not exists public.iterations (
  id            uuid primary key default uuid_generate_v4(),
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  prompt_id     uuid references public.prompts(id) on delete set null,
  version_label text not null default '',
  content       text not null,
  diff_from_id  uuid references public.iterations(id) on delete set null,
  feedback      jsonb not null default '{}',
  score         float,
  created_by    uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- ── Portfolio items ───────────────────────────────
create table if not exists public.portfolio_items (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  title       text not null,
  summary     text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  media_urls  jsonb not null default '[]',
  results     jsonb not null default '[]',
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Swipe collections ─────────────────────────────
create table if not exists public.swipe_collections (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  owner_id   uuid not null references public.users(id) on delete cascade,
  is_shared  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Swipe items ───────────────────────────────────
create table if not exists public.swipe_items (
  id            uuid primary key default uuid_generate_v4(),
  url           text not null,
  thumbnail_url text,
  title         text,
  tags          jsonb not null default '[]',
  collection_id uuid references public.swipe_collections(id) on delete set null,
  source        text,
  saved_by      uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- ── AI Tools ─────────────────────────────────────
create table if not exists public.ai_tools (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  category      text not null,
  use_cases     jsonb not null default '[]',
  pricing_model pricing_model not null default 'free',
  rating        float,
  api_available boolean not null default false,
  website_url   text,
  last_reviewed date,
  created_at    timestamptz not null default now()
);

-- ── Workflows ─────────────────────────────────────
create table if not exists public.workflows (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  type        workflow_type not null default 'sop',
  steps       jsonb not null default '[]',
  tools_used  jsonb not null default '[]',
  author_id   uuid not null references public.users(id) on delete cascade,
  version     integer not null default 1,
  is_template boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────
create index if not exists idx_prompts_author      on public.prompts(author_id);
create index if not exists idx_prompts_parent      on public.prompts(parent_id);
create index if not exists idx_campaigns_owner     on public.campaigns(owner_id);
create index if not exists idx_campaigns_status    on public.campaigns(status);
create index if not exists idx_iterations_campaign on public.iterations(campaign_id);
create index if not exists idx_swipe_saved_by      on public.swipe_items(saved_by);
create index if not exists idx_workflows_author    on public.workflows(author_id);

-- ── Updated_at triggers ───────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_updated_at_users      before update on public.users      for each row execute function handle_updated_at();
create trigger set_updated_at_prompts    before update on public.prompts    for each row execute function handle_updated_at();
create trigger set_updated_at_campaigns  before update on public.campaigns  for each row execute function handle_updated_at();
create trigger set_updated_at_portfolio  before update on public.portfolio_items for each row execute function handle_updated_at();
create trigger set_updated_at_workflows  before update on public.workflows  for each row execute function handle_updated_at();

-- ── Auto-create user profile on signup ───────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'strategist'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
