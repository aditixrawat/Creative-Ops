"use client";

import { useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { CampaignCard }  from "@/components/molecules/CampaignCard";
import { KanbanColumn }  from "@/components/molecules/KanbanColumn";
import { useCampaigns }  from "@/hooks/useCampaigns";
import { cn }            from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { CampaignStatus } from "@/lib/supabase/types";

type View = "kanban" | "list";

const STATUSES: CampaignStatus[] = ["draft", "planned", "live", "review", "complete", "archived"];

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft", planned: "Planned", live: "Live",
  review: "Review", complete: "Complete", archived: "Archived",
};

// ── Stat bar ──────────────────────────────────────────────────────
function StatBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[rgba(173,252,249,0.05)] last:border-0">
      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--text-muted)] w-20 shrink-0">{label}</span>
      <div className="progress-track flex-1">
        <motion.div
          className="progress-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="font-mono text-[10px] text-[var(--text-secondary)] w-6 text-right">{count}</span>
    </div>
  );
}

const STAT_COLORS: Record<CampaignStatus, string> = {
  draft: "rgba(173,252,249,0.25)", planned: "#adfcf9",
  live: "#4b644a", review: "#c4a8a8",
  complete: "#89a894", archived: "rgba(173,252,249,0.15)",
};

// ─────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const router  = useRouter();
  const [view,    setView]    = useState<View>("kanban");
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState<CampaignStatus | "">("");
  const dSearch = useDeferredValue(search);

  const { data: all = [], isLoading } = useCampaigns({ limit: 100 });

  const filtered = all.filter((c) => {
    const matchSearch = !dSearch || c.name.toLowerCase().includes(dSearch.toLowerCase());
    const matchStatus = !status  || c.status === status;
    return matchSearch && matchStatus;
  });

  // Group for kanban
  const grouped = STATUSES.reduce<Record<CampaignStatus, typeof all>>((acc, s) => {
    acc[s] = filtered.filter((c) => c.status === s);
    return acc;
  }, {} as Record<CampaignStatus, typeof all>);

  const liveCount    = all.filter((c) => c.status === "live").length;
  const reviewCount  = all.filter((c) => c.status === "review").length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Operations</p>
          <h1 className="font-display font-black text-display-lg text-[var(--text-primary)]">
            Campaign <em className="text-teal not-italic">Tracker</em>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="font-body text-[13px] text-[var(--text-secondary)]">
              {isLoading ? "—" : `${all.length} total`}
            </p>
            {liveCount > 0 && (
              <span className="tag tag-forest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse-teal" />
                {liveCount} live
              </span>
            )}
            {reviewCount > 0 && (
              <span className="tag tag-wine">{reviewCount} in review</span>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/campaigns/new")}
          className="btn btn-primary flex items-center gap-1.5 shrink-0"
        >
          <i className="ti ti-plus text-[14px]" aria-hidden="true" />
          New Campaign
        </button>
      </motion.div>

      {/* ── Stats strip ── */}
      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay: 0.05 }}
        className="card-glass p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6"
      >
        {STATUSES.filter(s => s !== "archived").map((s) => (
          <StatBar
            key={s}
            label={STATUS_LABEL[s]}
            count={grouped[s].length}
            total={all.length}
            color={STAT_COLORS[s]}
          />
        ))}
      </motion.div>

      {/* ── Controls ── */}
      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay: 0.08 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]" aria-hidden="true" />
          <input
            className="input pl-9 w-full text-[13px]"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal" aria-label="Clear">
              <i className="ti ti-x text-[12px]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Status filter (list view only) */}
        {view === "list" && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus | "")}
            className="input input-mono text-[11px] py-2 w-full sm:w-40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1">
          {(["kanban", "list"] as View[]).map((v) => (
            <button
              key={v}
              aria-label={`${v} view`}
              onClick={() => setView(v)}
              className={cn(
                "btn-icon btn w-8 h-8",
                view === v && "bg-teal-dim border-[rgba(173,252,249,0.3)] text-teal"
              )}
            >
              <i className={cn("ti text-[14px]",
                v === "kanban" ? "ti-columns" : "ti-layout-list"
              )} aria-hidden="true" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
      )}

      {/* ── Kanban ── */}
      <AnimatePresence mode="wait">
        {!isLoading && view === "kanban" && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4"
          >
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s}
                status={s}
                campaigns={grouped[s]}
                onNewCampaign={() => router.push("/campaigns/new")}
              />
            ))}
          </motion.div>
        )}

        {/* ── List view ── */}
        {!isLoading && view === "list" && (
          <motion.div
            key="list"
            variants={motionVariants.staggerContainer}
            initial="hidden" animate="visible"
          >
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_110px_160px_90px] gap-4 px-4 py-2 border-b border-[rgba(173,252,249,0.07)]">
              {["Campaign", "Status", "Timeline", "Progress"].map((h) => (
                <span key={h} className="font-mono text-[9px] tracking-[0.12em] uppercase text-[var(--text-muted)]">{h}</span>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {filtered.length === 0 ? (
                <div className="card-glass flex flex-col items-center gap-3 py-16 text-center">
                  <i className="ti ti-target text-[36px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
                  <p className="font-display font-bold text-[15px] text-[var(--text-primary)]">No campaigns</p>
                  <p className="font-body text-[13px] text-[var(--text-tertiary)]">
                    {search || status ? "Adjust filters" : "Create your first campaign"}
                  </p>
                </div>
              ) : (
                filtered.map((c, i) => (
                  <motion.div key={c.id} variants={motionVariants.staggerItem}>
                    <CampaignCard campaign={c} index={i} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
