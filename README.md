# Creative Ops — AI-Powered Creative Operations Platform

> SaaS for creative strategists and AI interns.
> Built with Next.js 15 · Tailwind · Framer Motion · shadcn/ui · Supabase · Recharts.

---

## What's included

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | KPI cards, activity feed, sparkline output chart |
| Prompt Library | `/prompts` | Search, filter, version, clone, test live with AI |
| Campaign Tracker | `/campaigns` | Kanban + list view, brief editor, Gantt timeline |
| Iterations | `/iterations` | Version tree, side-by-side diff viewer, feedback & scoring |
| Swipe Vault | `/swipe` | Masonry inspiration grid, collections, lightbox |
| Analytics | `/analytics` | 8 Recharts — area, bar, radar, donut, heatmap, funnel |
| AI Tools DB | `/ai-tools` | Searchable tool directory with ratings and API badges |
| Workflows | `/workflows` | SOP / template / runbook builder with step editor |
| Settings | `/settings` | Profile, team, integrations, danger zone |
| Auth | `/auth/login` · `/auth/signup` | Password + magic link + Google OAuth, 3-step signup |

---

## Quick start (automated)

```bash
# 1. Clone or unzip the project
cd creative-ops

# 2. Run the setup script (handles dirs, env, deps, type-check)
chmod +x setup.sh
./setup.sh

# 3. Fill in environment variables
nano .env.local

# 4. Run database migrations (see Database Setup below)

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Manual setup (step by step)

### Step 1 — Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | ≥ 18.x | `node -v` |
| npm / pnpm / bun | latest | `npm -v` |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |

### Step 2 — Rename route group directories

The zip preserves route group folder names without parentheses to avoid shell issues.
Rename them before running:

```bash
mv app/auth-pages      "app/(auth)"
mv app/dashboard-app   "app/(dashboard)"
```

### Step 3 — Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase — get from: supabase.com → Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here   # never expose to client

# Anthropic — get from: console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-...

# App URL (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side code
> (`lib/supabase/server.ts`) and bypasses Row Level Security. Never expose it in
> client-side code or commit it to version control.

### Step 4 — Install dependencies

```bash
# npm
npm install

# pnpm (recommended)
pnpm install

# bun (fastest)
bun install
```

### Step 5 — Database setup

#### Option A — Supabase Dashboard (easiest)

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Click **New query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` → **Run**
4. Paste the contents of `supabase/migrations/002_rls_policies.sql` → **Run**

#### Option B — Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase    # macOS
npm install -g supabase               # cross-platform

# Link to your project
supabase login
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

#### Option C — Local Supabase (development)

```bash
supabase start                         # starts local Postgres + Studio
supabase db reset                      # applies all migrations from scratch
```

### Step 6 — Configure Supabase Auth

In your Supabase dashboard → **Authentication → Providers**:

**Email** (required)
- Enable email confirmations: your choice
- Enable "Link identity" for OAuth merging

**Google OAuth** (optional but recommended)
1. Authentication → Providers → Google → Enable
2. Add your Google OAuth credentials from [console.cloud.google.com](https://console.cloud.google.com)
3. Add redirect URL: `https://your-project-id.supabase.co/auth/v1/callback`

**Site URL** → Authentication → URL Configuration:
```
Site URL:          http://localhost:3000
Redirect URLs:     http://localhost:3000/**
```

### Step 7 — Run the app

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Project structure

```
creative-ops/
├── app/
│   ├── (auth)/                    # Auth route group (no shell)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/               # Dashboard route group (with AppShell)
│   │   ├── layout.tsx             # Auth guard + AppShell wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── prompts/page.tsx
│   │   ├── iterations/page.tsx
│   │   ├── swipe/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── ai-tools/page.tsx
│   │   ├── workflows/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   └── prompt-test/route.ts   # Streaming Anthropic API (Edge runtime)
│   ├── auth/callback/route.ts     # Supabase OAuth callback
│   ├── layout.tsx                 # Root layout — fonts, metadata, Providers
│   ├── page.tsx                   # Redirects → /dashboard
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx           # Full app shell — topbar + sidebar + mobile nav
│   │   └── AppSidebar.tsx         # Collapsible sidebar with active indicator
│   ├── molecules/
│   │   ├── KPICard.tsx            # Metric + delta card
│   │   ├── PromptCard.tsx         # Prompt with copy/clone/tag display
│   │   ├── CampaignCard.tsx       # Campaign with status + progress bar
│   │   └── KanbanColumn.tsx       # Kanban column with quick-move buttons
│   ├── organisms/
│   │   ├── PromptBuilder.tsx      # 3-tab builder: write / test / metadata
│   │   └── DiffViewer.tsx         # Side-by-side + unified diff (pure JS LCS)
│   └── providers/
│       └── Providers.tsx          # TanStack Query + Sonner toaster
│
├── hooks/
│   ├── usePrompts.ts              # CRUD + clone + version tree
│   ├── useCampaigns.ts            # CRUD + status update
│   ├── useIterations.ts           # Fetch + feedback mutation
│   ├── useSwipe.ts                # Items + collections CRUD
│   ├── useAITools.ts              # Tool directory queries
│   └── useWorkflows.ts            # Workflow CRUD
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Singleton browser client
│   │   ├── server.ts              # Server client + admin client
│   │   └── types.ts               # Full typed Database interface
│   ├── utils/cn.ts                # clsx + tailwind-merge
│   └── design-tokens.ts           # Colors, easing, Framer Motion variants, Recharts theme
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql     # All tables + triggers + auto-profile creation
│   └── 002_rls_policies.sql       # Row Level Security for all tables
│
├── app/globals.css                # Design system — CSS tokens, component layer, utilities
├── tailwind.config.ts             # Full token extension — colors, fonts, shadows, animations
├── middleware.ts                  # Session refresh + route protection + role guard
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local.example
```

---

## Design system

The design system lives in three files that work together:

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind token extensions — all colors, fonts, spacing, shadows, keyframes |
| `app/globals.css` | CSS custom properties + component layer (`.card-glass`, `.btn-primary`, `.tag`, etc.) |
| `lib/design-tokens.ts` | JS constants for Framer Motion variants, Recharts theme, easing functions |

### Color palette

| Token | Hex | Use |
|-------|-----|-----|
| `teal` | `#adfcf9` | Primary actions, highlights, active states |
| `sage` | `#89a894` | Secondary text, hover states |
| `forest` | `#4b644a` | Positive deltas, success, live status |
| `wine` | `#49393b` | Warning surfaces, review state |
| `deep` | `#341c1c` | Danger, error, critical |

### Font stack

| Role | Font | Usage |
|------|------|-------|
| Display | Syne 800 | Headings, hero text, brutal editorial moments |
| Body | Space Grotesk | All UI text, labels, descriptions |
| Mono | Space Mono | Data, metadata, tags, code, version labels |

### Key CSS classes

```css
/* Cards */
.card-glass        /* glassmorphism — backdrop blur + teal border */
.card-elevated     /* standard elevated card with hover lift */
.card-brutal       /* brutalist — hard border + offset shadow */
.card-wine         /* warning surface */
.card-stat         /* left accent edge metric card */

/* Buttons */
.btn .btn-primary  /* teal fill */
.btn .btn-secondary /* teal outline */
.btn .btn-ghost    /* sage outline */
.btn .btn-brutal   /* mono uppercase, no radius */
.btn .btn-danger   /* deep red */
.btn .btn-ai       /* gradient — for AI actions */
.btn-xl / .btn-sm / .btn-xs / .btn-icon

/* Typography */
.eyebrow           /* MONO UPPERCASE with left accent line */
.metric-val        /* large teal display number */
.metric-label      /* mono uppercase label */
.metric-delta      /* forest green / red delta text */

/* Utilities */
.skeleton          /* animated loading shimmer */
.progress-track    /* progress bar track */
.progress-fill     /* progress fill (add .sage or .forest for variants) */
.input             /* styled form input */
.input-mono        /* monospace input variant */
.tag               /* chip tag */
.tag-teal / .tag-sage / .tag-forest / .tag-wine
.no-scrollbar      /* hide scrollbar */
.truncate-1/2/3    /* line clamp utilities */
.backdrop-glass    /* blur(12px) */
.text-glow         /* teal text shadow */
```

---

## Key architectural decisions

### Authentication flow

```
User visits any /dashboard/* route
↓
middleware.ts → getUser() refreshes session cookie
↓
No user → redirect /auth/login?redirectTo=<original>
↓
Login → Supabase sets session cookie
↓
/auth/callback route exchanges PKCE code for session
↓
Redirect back to /dashboard
```

### Data fetching

All data fetching uses **TanStack Query** with:
- Structured query key factories (`promptKeys.list(filters)`) for targeted invalidation
- `staleTime: 30_000` to reduce refetches
- Optimistic `setQueryData` on mutations for instant UI feedback
- No global state — everything lives in query cache

### Streaming AI responses

`/api/prompt-test` uses the **Edge runtime** with Anthropic's SDK streaming:

```
Client fetch() → Edge Route Handler
↓
anthropic.messages.stream() → AsyncIterable<chunks>
↓
ReadableStream → streamed to client
↓
Client reads via reader.read() loop → appends to textarea
```

### Diff algorithm

`DiffViewer.tsx` implements a pure-JS **LCS (Longest Common Subsequence)** diff at both line and word level — no external deps. Word-level diffs are rendered inline within changed lines.

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard or:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
```

Update Supabase → Authentication → URL Configuration:
```
Site URL:      https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
```

### Other platforms

The app uses the **Node.js runtime** by default (`/api/prompt-test` uses `runtime = "edge"`).
Any platform supporting Next.js 15 will work: Railway, Render, Fly.io, AWS Amplify.

---

## Adding new pages

1. Create `app/(dashboard)/your-page/page.tsx`
2. Add a nav entry in `components/layout/AppSidebar.tsx` → `NAV` array
3. Add a mobile nav entry in `components/layout/AppShell.tsx` → `MOBILE_NAV` (max 5)
4. Create a hook in `hooks/useYourData.ts` following the existing pattern
5. Export from `hooks/index.ts`

---

## Common issues

**`Error: Cannot find module '@/lib/supabase/client'`**
→ Check `tsconfig.json` has `"paths": { "@/*": ["./*"] }`

**Blank page after login**
→ Route group directories may not be renamed. Run `setup.sh` or rename manually:
```bash
mv app/auth-pages "app/(auth)"
mv app/dashboard-app "app/(dashboard)"
```

**`supabase: command not found`**
→ Install CLI: `npm install -g supabase` or `brew install supabase/tap/supabase`

**Google OAuth not working**
→ Check redirect URL in Supabase dashboard matches your domain exactly.

**Prompt test panel returns 401**
→ User not signed in. The `/api/prompt-test` route requires an authenticated session.

**TypeScript errors on `Database` types**
→ Regenerate types from your live schema:
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

---

## Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 15 | App Router, Server Components, Edge runtime |
| React | 19 | UI |
| TypeScript | 5.6 | Type safety |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 11 | Animations |
| Recharts | 2.12 | Data visualisation |
| Supabase | 2.45 | Auth, database, storage |
| TanStack Query | 5 | Server state management |
| Anthropic SDK | 0.32 | AI streaming |
| Sonner | 1.5 | Toast notifications |
| Space Grotesk | — | Body font |
| Syne | — | Display font |
| Space Mono | — | Monospace font |

---

## License

MIT — use freely for commercial and personal projects.

---
*Built with Claude — Creative Ops SaaS, 2025*
