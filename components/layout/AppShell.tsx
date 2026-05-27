"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils/cn";

// Mobile bottom nav items (5 max)
const MOBILE_NAV = [
  { href: "/dashboard",  icon: "ti-layout-dashboard", label: "Home"      },
  { href: "/campaigns",  icon: "ti-target",           label: "Campaigns" },
  { href: "/prompts",    icon: "ti-bulb",             label: "Prompts"   },
  { href: "/swipe",      icon: "ti-sparkles",         label: "Swipe"     },
  { href: "/analytics",  icon: "ti-chart-bar",        label: "Analytics" },
] as const;

interface Props {
  children: React.ReactNode;
  /** Page title shown in the topbar */
  title?: string;
  /** Optional right-side topbar actions */
  actions?: React.ReactNode;
}

export function AppShell({ children, title, actions }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-base text-[var(--text-primary)]">
      {/* ── Sidebar (desktop) ── */}
      <AppSidebar expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className={cn(
          "shrink-0 flex items-center justify-between gap-4",
          "h-12 px-5 border-b border-[rgba(173,252,249,0.07)]",
          "bg-[rgba(173,252,249,0.02)] z-topbar"
        )}>
          {/* Title */}
          <h1 className="font-display font-bold text-[15px] text-[var(--text-primary)] tracking-tight truncate">
            {title ?? "Creative Ops"}
          </h1>

          {/* Right slot */}
          <div className="flex items-center gap-2 shrink-0">
            {actions}

            {/* Global search trigger */}
            <button
              className="btn-icon btn w-8 h-8"
              aria-label="Search (⌘K)"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                document.dispatchEvent(e);
              }}
            >
              <i className="ti ti-search text-[15px]" aria-hidden="true" />
            </button>

            {/* Notifications */}
            <button className="btn-icon btn w-8 h-8 relative" aria-label="Notifications">
              <i className="ti ti-bell text-[15px]" aria-hidden="true" />
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal animate-pulse-teal" />
            </button>

            {/* Avatar */}
            <div
              aria-label="Account menu"
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                "bg-[rgba(173,252,249,0.10)] border border-[rgba(173,252,249,0.20)]",
                "font-mono text-[10px] font-bold text-teal cursor-pointer",
                "hover:border-[rgba(173,252,249,0.40)] transition-colors duration-150"
              )}
            >
              AK
            </div>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Inner wrapper — consistent gutter + max-width */}
          <div className="content-grid py-6">
            {children}
          </div>
        </motion.main>
      </div>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center gap-1 pt-2 pb-1 min-w-[44px]",
                active ? "text-teal" : "text-[rgba(173,252,249,0.35)]",
                "transition-colors duration-150"
              )}
            >
              <i className={cn("ti text-[20px]", item.icon)} aria-hidden="true" />
              <span className="font-mono text-[7px] tracking-[0.1em] uppercase">{item.label}</span>
              {active && (
                <motion.span
                  layoutId="mobile-active"
                  className="w-4 h-0.5 rounded-full bg-teal"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
