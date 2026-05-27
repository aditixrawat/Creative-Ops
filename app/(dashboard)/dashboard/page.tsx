"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { KPICard }      from "@/components/molecules/KPICard";
import { CampaignCard } from "@/components/molecules/CampaignCard";
import { PromptCard }   from "@/components/molecules/PromptCard";
import { useCampaigns } from "@/hooks/useCampaigns";
import { usePrompts, useClonePrompt } from "@/hooks/usePrompts";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";

// ── Mini sparkline (no dep) ───────────────────────────────────────
const SPARK = [38, 55, 42, 80, 65, 95, 70];

function Sparkline() {
  const max = Math.max(...SPARK);
  return (
    <div className="flex items-end gap-1 h-10">
      {SPARK.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm rounded-b-none transition-opacity"
          style={{
            height: `${(v / max) * 100}%`,
            background: i === SPARK.length - 1
              ? "var(--teal)"
              : `rgba(173,252,249,${0.15 + (i / SPARK.length) * 0.35})`,
          }}
        />
      ))}
    </div>
  );
}

// ── Activity feed item ────────────────────────────────────────────
const ACTIVITY = [
  { icon: "ti-bulb",       text: "New prompt added: 'Brand voice v3'",   time: "2m ago",  accent: "text-teal"   },
  { icon: "ti-target",     text: "Campaign 'Q3 Brand Refresh' went Live", time: "18m ago", accent: "text-forest" },
  { icon: "ti-git-branch", text: "Iteration 2.4 approved by Maya R.",    time: "1h ago",  accent: "text-sage"   },
  { icon: "ti-sparkles",   text: "Swipe file updated: 22 new refs",      time: "3h ago",  accent: "text-teal"   },
  { icon: "ti-chart-bar",  text: "Analytics report generated for Aug",   time: "5h ago",  accent: "text-sage"   },
];

// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router  = useRouter();
  const [tab, setTab] = useState<"campaigns" | "prompts">("campaigns");

  const { data: campaigns = [], isLoading: campsLoading } =
    useCampaigns({ limit: 6 });

  const { data: prompts = [], isLoading: promptsLoading } =
    usePrompts({ limit: 6 });

  const { data: liveCount = [] } = useCampaigns({ status: "live" });

  const clonePrompt = useClonePrompt();

  const kpis = [
    { label: "Active Campaigns", value: campaigns.length,        delta: "+3 this week", icon: "ti-target"     },
    { label: "Prompt Library",   value: prompts.length || "247", delta: "+18 new",      icon: "ti-bulb"       },
    { label: "Live Now",         value: liveCount.length,        delta: "campaigns",    icon: "ti-player-play" },
    { label: "AI Tools Tracked", value: 64,                      delta: "+2 this month",icon: "ti-robot"      },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Greeting ── */}
      <motion.div
        variants={motionVariants.fadeInUp}
        initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Creative Ops</p>
          <h1 className="font-display font-black text-display-lg text-[var(--text-primary)]">
            Good morning<span className="text-teal"> ☀</span>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => router.push("/prompts/new")}
          >
            <i className="ti ti-plus text-[12px]" aria-hidden="true" />
            New Prompt
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => router.push("/campaigns/new")}
          >
            <i className="ti ti-plus text-[12px]" aria-hidden="true" />
            Campaign
          </button>
        </div>
      </motion.div>

      {/* ── KPI row ── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <KPICard key={k.label} {...k} index={i} />
          ))}
        </div>
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: campaigns + prompts tabs */}
        <section className="lg:col-span-2 flex flex-col gap-3" aria-label="Recent work">

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-[rgba(173,252,249,0.07)] pb-0">
            {(["campaigns", "prompts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "font-mono text-[10px] tracking-[0.12em] uppercase px-4 py-2",
                  "border-b-2 -mb-px transition-colors duration-150",
                  tab === t
                    ? "text-teal border-teal"
                    : "text-[var(--text-tertiary)] border-transparent hover:text-sage"
                )}
              >
                {t}
              </button>
            ))}

            <div className="ml-auto">
              <button
                onClick={() => router.push(`/${tab}`)}
                className="font-mono text-[9px] tracking-[0.1em] text-[var(--text-muted)] hover:text-teal transition-colors uppercase flex items-center gap-1 pb-2"
              >
                View all <i className="ti ti-arrow-right text-[11px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Content */}
          {tab === "campaigns" && (
            <motion.div
              key="campaigns"
              variants={motionVariants.staggerContainer}
              initial="hidden" animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {campsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-xl" />
                  ))
                : campaigns.slice(0, 6).map((c, i) => (
                    <CampaignCard key={c.id} campaign={c} index={i} />
                  ))
              }
              {!campsLoading && campaigns.length === 0 && (
                <EmptyState icon="ti-target" label="No campaigns yet" cta="Create one" href="/campaigns/new" />
              )}
            </motion.div>
          )}

          {tab === "prompts" && (
            <motion.div
              key="prompts"
              variants={motionVariants.staggerContainer}
              initial="hidden" animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {promptsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-xl" />
                  ))
                : prompts.slice(0, 6).map((p, i) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      index={i}
                      onClone={(id) => {
                        const src = prompts.find((x) => x.id === id);
                        if (src) clonePrompt.mutate(src);
                      }}
                    />
                  ))
              }
              {!promptsLoading && prompts.length === 0 && (
                <EmptyState icon="ti-bulb" label="No prompts yet" cta="Add one" href="/prompts/new" />
              )}
            </motion.div>
          )}
        </section>

        {/* Right: output chart + activity feed */}
        <aside className="flex flex-col gap-4">

          {/* Weekly output */}
          <motion.div
            variants={motionVariants.fadeInUp}
            initial="hidden" animate="visible"
            className="card-glass p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-[13px] text-[var(--text-primary)]">Weekly output</p>
              <span className="tag tag-teal">This week</span>
            </div>
            <Sparkline />
            <div className="flex justify-between">
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <span key={i} className="font-mono text-[8px] text-[var(--text-muted)]">{d}</span>
              ))}
            </div>
            <div className="sep" />
            <div>
              <p className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.1em]">Top tool</p>
              <p className="font-display font-bold text-[13px] text-[var(--text-primary)] mt-1">
                Claude Sonnet 4.6
                <span className="text-teal ml-2 font-mono text-[10px]">68%</span>
              </p>
              <div className="progress-track mt-2">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Activity feed */}
          <motion.div
            variants={motionVariants.fadeInUp}
            initial="hidden" animate="visible"
            transition={{ delay: 0.1 }}
            className="card-glass p-4 flex flex-col gap-3 flex-1"
          >
            <p className="font-display font-bold text-[13px] text-[var(--text-primary)]">Activity</p>
            <ul className="flex flex-col gap-0">
              {ACTIVITY.map((a, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.15, duration: 0.2 }}
                  className="flex items-start gap-2.5 py-2.5 border-b border-[rgba(173,252,249,0.05)] last:border-0"
                >
                  <div className="w-6 h-6 rounded-md bg-[rgba(173,252,249,0.06)] border border-[rgba(173,252,249,0.09)] flex items-center justify-center shrink-0 mt-0.5">
                    <i className={cn("ti text-[12px]", a.icon, a.accent)} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="font-body text-[11px] text-[var(--text-secondary)] leading-snug truncate-2">{a.text}</p>
                    <p className="font-mono text-[8px] text-[var(--text-muted)] tracking-[0.06em]">{a.time}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

// ── Internal empty state ──────────────────────────────────────────
function EmptyState({ icon, label, cta, href }: { icon: string; label: string; cta: string; href: string }) {
  return (
    <div className="col-span-full card-glass flex flex-col items-center justify-center gap-3 py-12 text-center">
      <i className={cn("ti text-[28px] text-[rgba(173,252,249,0.2)]", icon)} aria-hidden="true" />
      <p className="font-body text-[13px] text-[var(--text-tertiary)]">{label}</p>
      <a href={href} className="btn btn-secondary btn-sm">{cta}</a>
    </div>
  );
}
