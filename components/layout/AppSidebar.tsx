"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";

const NAV = [
  {
    section: "Main",
    items: [
      { href: "/dashboard",   icon: "ti-layout-dashboard", label: "Dashboard"  },
      { href: "/campaigns",   icon: "ti-target",           label: "Campaigns"  },
      { href: "/prompts",     icon: "ti-bulb",             label: "Prompts"    },
      { href: "/portfolio",   icon: "ti-photo",            label: "Portfolio"  },
    ],
  },
  {
    section: "Workflow",
    items: [
      { href: "/iterations",  icon: "ti-git-branch",       label: "Iterations" },
      { href: "/workflows",   icon: "ti-list-check",       label: "Workflows"  },
    ],
  },
  {
    section: "Discover",
    items: [
      { href: "/swipe",       icon: "ti-sparkles",         label: "Swipe File" },
      { href: "/ai-tools",    icon: "ti-robot",            label: "AI Tools"   },
    ],
  },
  {
    section: "Reports",
    items: [
      { href: "/analytics",   icon: "ti-chart-bar",        label: "Analytics"  },
    ],
  },
] as const;

interface Props {
  expanded: boolean;
  onToggle: () => void;
}

export function AppSidebar({ expanded, onToggle }: Props) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: expanded ? 220 : 52 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "app-sidebar-desktop relative flex flex-col h-screen",
        "bg-bg-layer1 border-r border-[rgba(173,252,249,0.07)]",
        "overflow-hidden shrink-0 z-sidebar"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-12 px-3 border-b border-[rgba(173,252,249,0.07)] shrink-0">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="btn-icon btn w-8 h-8 shrink-0"
        >
          <i className="ti ti-menu-2 text-[16px]" aria-hidden="true" />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.span
              variants={motionVariants.fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="ml-3 font-display font-black text-sm tracking-tight text-teal whitespace-nowrap"
            >
              CREATIVE OPS
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav sections */}
      <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-3 gap-1">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[8px] tracking-[0.18em] uppercase text-[rgba(173,252,249,0.25)] px-4 py-2 mt-1"
                >
                  {section}
                </motion.p>
              )}
            </AnimatePresence>

            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={!expanded ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 mx-2 px-2 py-2 rounded-md",
                    "transition-colors duration-150 group",
                    active
                      ? "bg-[rgba(173,252,249,0.08)] text-teal"
                      : "text-[rgba(137,168,148,0.7)] hover:text-[#b0c8b8] hover:bg-[rgba(173,252,249,0.04)]"
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-teal rounded-r-full"
                    />
                  )}

                  <i
                    className={cn("ti shrink-0 text-[18px]", item.icon)}
                    aria-hidden="true"
                  />

                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="font-body text-[13px] font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip when collapsed */}
                  {!expanded && (
                    <span className={cn(
                      "pointer-events-none absolute left-full ml-2 px-2 py-1",
                      "bg-bg-layer2 border border-[rgba(173,252,249,0.12)] rounded-md",
                      "font-mono text-[10px] text-teal whitespace-nowrap",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                      "shadow-dark-md z-tooltip"
                    )}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[rgba(173,252,249,0.07)] p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-md",
            "text-[rgba(137,168,148,0.6)] hover:text-sage hover:bg-[rgba(173,252,249,0.04)]",
            "transition-colors duration-150"
          )}
        >
          <i className="ti ti-settings text-[18px] shrink-0" aria-hidden="true" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-body text-[13px] font-medium whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  );
}
