-- ──────────────────────────────────────────────────
-- Creative Ops — Row Level Security Policies
-- ──────────────────────────────────────────────────

alter table public.users          enable row level security;
alter table public.prompts        enable row level security;
alter table public.campaigns      enable row level security;
alter table public.iterations     enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.swipe_items    enable row level security;
alter table public.swipe_collections enable row level security;
alter table public.ai_tools       enable row level security;
alter table public.workflows      enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ── Users ─────────────────────────────────────────
create policy "Users can view all profiles"    on public.users for select using (true);
create policy "Users can update own profile"   on public.users for update using (auth.uid() = id);
create policy "Admins can manage all users"    on public.users for all using (is_admin());

-- ── Prompts ───────────────────────────────────────
create policy "View public or own prompts"     on public.prompts for select
  using (is_public = true or author_id = auth.uid());
create policy "Create own prompts"             on public.prompts for insert
  with check (author_id = auth.uid());
create policy "Update own prompts"             on public.prompts for update
  using (author_id = auth.uid());
create policy "Delete own prompts"             on public.prompts for delete
  using (author_id = auth.uid());

-- ── Campaigns ─────────────────────────────────────
create policy "View all campaigns (auth)"      on public.campaigns for select
  using (auth.uid() is not null);
create policy "Create campaigns"               on public.campaigns for insert
  with check (owner_id = auth.uid());
create policy "Update own campaigns"           on public.campaigns for update
  using (owner_id = auth.uid() or is_admin());
create policy "Delete own campaigns"           on public.campaigns for delete
  using (owner_id = auth.uid() or is_admin());

-- ── Iterations ────────────────────────────────────
create policy "View iterations (auth)"         on public.iterations for select
  using (auth.uid() is not null);
create policy "Create iterations"              on public.iterations for insert
  with check (created_by = auth.uid());
create policy "Update own iterations"          on public.iterations for update
  using (created_by = auth.uid());

-- ── Portfolio ─────────────────────────────────────
create policy "View all portfolio"             on public.portfolio_items for select using (true);
create policy "Manage portfolio (admin)"       on public.portfolio_items for all using (is_admin());

-- ── Swipe items ───────────────────────────────────
create policy "View own swipe items"           on public.swipe_items for select
  using (saved_by = auth.uid());
create policy "Create swipe items"             on public.swipe_items for insert
  with check (saved_by = auth.uid());
create policy "Delete own swipe items"         on public.swipe_items for delete
  using (saved_by = auth.uid());

-- ── Swipe collections ─────────────────────────────
create policy "View own or shared collections" on public.swipe_collections for select
  using (owner_id = auth.uid() or is_shared = true);
create policy "Create own collections"         on public.swipe_collections for insert
  with check (owner_id = auth.uid());

-- ── AI Tools ──────────────────────────────────────
create policy "View all AI tools"              on public.ai_tools for select using (true);
create policy "Manage AI tools (admin)"        on public.ai_tools for all using (is_admin());

-- ── Workflows ─────────────────────────────────────
create policy "View templates or own workflows" on public.workflows for select
  using (is_template = true or author_id = auth.uid());
create policy "Create own workflows"           on public.workflows for insert
  with check (author_id = auth.uid());
create policy "Update own workflows"           on public.workflows for update
  using (author_id = auth.uid());
create policy "Delete own workflows"           on public.workflows for delete
  using (author_id = auth.uid());
