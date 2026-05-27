#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────
# Creative Ops — Automated Setup Script
# ─────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}▸${RESET} $1"; }
ok()   { echo -e "${GREEN}✓${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $1"; }
err()  { echo -e "${RED}✕${RESET} $1"; exit 1; }
header() { echo -e "\n${BOLD}${CYAN}── $1 ──${RESET}\n"; }

# ── Check prerequisites ───────────────────────────
header "Checking prerequisites"

command -v node  >/dev/null 2>&1 || err "Node.js is required. Install from https://nodejs.org (v18+)"
command -v npm   >/dev/null 2>&1 || err "npm is required."

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[[ "$NODE_MAJOR" -ge 18 ]] || err "Node.js v18+ required. You have v${NODE_VER}"

ok "Node.js v${NODE_VER}"

# Detect package manager
PM="npm"
if command -v bun  >/dev/null 2>&1; then PM="bun";
elif command -v pnpm >/dev/null 2>&1; then PM="pnpm";
elif command -v yarn >/dev/null 2>&1; then PM="yarn"; fi
ok "Using package manager: $PM"

# ── Move files into Next.js route groups ──────────
header "Renaming route group directories"

# auth-pages -> (auth)
if [ -d "app/auth-pages" ] && [ ! -d "app/(auth)" ]; then
  mv "app/auth-pages" "app/(auth)"
  ok "Renamed app/auth-pages → app/(auth)"
fi

# dashboard-app -> (dashboard)
if [ -d "app/dashboard-app" ] && [ ! -d "app/(dashboard)" ]; then
  mv "app/dashboard-app" "app/(dashboard)"
  ok "Renamed app/dashboard-app → app/(dashboard)"
fi

# Create layout files for route groups
if [ ! -f "app/(auth)/layout.tsx" ]; then
  cat > "app/(auth)/layout.tsx" << 'LAYOUT'
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
LAYOUT
  ok "Created app/(auth)/layout.tsx"
fi

if [ ! -f "app/(dashboard)/layout.tsx" ]; then
  cat > "app/(dashboard)/layout.tsx" << 'LAYOUT'
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");
  return <AppShell>{children}</AppShell>;
}
LAYOUT
  ok "Created app/(dashboard)/layout.tsx"
fi

# ── Environment setup ─────────────────────────────
header "Environment configuration"

if [ ! -f ".env.local" ]; then
  cp .env.local.example .env.local
  warn ".env.local created from template — fill in your Supabase & Anthropic keys before running dev"
  echo ""
  echo -e "  ${YELLOW}Required variables:${RESET}"
  echo -e "  ${CYAN}NEXT_PUBLIC_SUPABASE_URL${RESET}        → Your Supabase project URL"
  echo -e "  ${CYAN}NEXT_PUBLIC_SUPABASE_ANON_KEY${RESET}   → Supabase anon/public key"
  echo -e "  ${CYAN}SUPABASE_SERVICE_ROLE_KEY${RESET}       → Supabase service role key (server only)"
  echo -e "  ${CYAN}ANTHROPIC_API_KEY${RESET}               → Anthropic API key (for prompt testing)"
  echo ""
else
  ok ".env.local already exists"
fi

# ── Install dependencies ───────────────────────────
header "Installing dependencies"

case "$PM" in
  bun)  bun install ;;
  pnpm) pnpm install ;;
  yarn) yarn install ;;
  *)    npm install ;;
esac

ok "Dependencies installed"

# ── Type check ────────────────────────────────────
header "Running type check"
if $PM run type-check 2>/dev/null; then
  ok "TypeScript check passed"
else
  warn "Type errors found — check tsconfig and imports. This won't block dev server."
fi

# ── Supabase migration hint ───────────────────────
header "Database setup"
echo -e "Run the SQL migrations in ${CYAN}supabase/migrations/${RESET} against your Supabase project:"
echo ""
echo -e "  ${YELLOW}Option A:${RESET} Supabase Dashboard → SQL Editor → paste contents of each .sql file"
echo -e "  ${YELLOW}Option B:${RESET} supabase db push  (if Supabase CLI installed)"
echo ""

# ── Done ──────────────────────────────────────────
header "Setup complete"
echo -e "${GREEN}${BOLD}Creative Ops is ready!${RESET}"
echo ""
echo -e "  1. Fill in ${CYAN}.env.local${RESET} with your keys"
echo -e "  2. Run Supabase migrations (see ${CYAN}supabase/migrations/${RESET})"
echo -e "  3. Start the dev server:"
echo ""
echo -e "     ${BOLD}${CYAN}$PM run dev${RESET}"
echo ""
echo -e "  Then open ${CYAN}http://localhost:3000${RESET}"
echo ""
