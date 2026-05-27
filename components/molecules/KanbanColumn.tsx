"use client";

import { motion } from "framer-motion";
import { CampaignCard } from "./CampaignCard";
import { cn } from "@/lib/utils/cn";
import type { CampaignRow, CampaignStatus } from "@/lib/supabase/types";
import { useUpdateCampaignStatus } from "@/hooks/useCampaigns";

const CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "rgba(173,252,249,0.25)", bg: "rgba(173,252,249,0.03)" },
  planned:  { label: "Planned",  color: "#adfcf9",                bg: "rgba(173,252,249,0.05)" },
  live:     { label: "Live",     color: "#4b644a",                bg: "rgba(75,100,74,0.08)"   },
  review:   { label: "Review",   color: "#c4a8a8",                bg: "rgba(73,57,59,0.12)"    },
  complete: { label: "Complete", color: "#89a894",                bg: "rgba(137,168,148,0.06)" },
  archived: { label: "Archived", color: "rgba(173,252,249,0.15)", bg: "rgba(173,252,249,0.02)" },
};

const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft:    ["planned"],
  planned:  ["live", "draft"],
  live:     ["review", "planned"],
  review:   ["complete", "live"],
  complete: ["archived"],
  archived: [],
};

interface Props {
  status:    CampaignStatus;
  campaigns: CampaignRow[];
  onNewCampaign?: () => void;
}

export function KanbanColumn({ status, campaigns, onNewCampaign }: Props) {
  const cfg    = CONFIG[status];
  const update = useUpdateCampaignStatus();

  return (
    <div className="flex flex-col gap-2 min-w-[240px] w-[260px] shrink-0">

      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: cfg.color }}
          />
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-secondary)]">
            {cfg.label}
          </span>
          <span className="tag text-[8px] px-1.5 py-0.5">{campaigns.length}</span>
        </div>
        {status === "draft" && (
          <button
            onClick={onNewCampaign}
            className="btn-icon btn w-6 h-6"
            aria-label="New campaign"
          >
            <i className="ti ti-plus text-[12px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Cards */}
      <div
        className="flex flex-col gap-2 p-2 rounded-xl min-h-[120px]"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}
      >
        {campaigns.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="font-mono text-[9px] text-[var(--text-muted)] tracking-[0.1em]">EMPTY</p>
          </div>
        )}

        {campaigns.map((c, i) => (
          <div key={c.id} className="group/card relative">
            <CampaignCard campaign={c} index={i} />

            {/* Quick status transitions */}
            {TRANSITIONS[status].length > 0 && (
              <div className="absolute top-2 right-2 hidden group-hover/card:flex gap-1 z-10">
                {TRANSITIONS[status].map((next) => (
                  <button
                    key={next}
                    title={`Move to ${CONFIG[next].label}`}
                    onClick={(e) => { e.preventDefault(); update.mutate({ id: c.id, status: next }); }}
                    disabled={update.isPending}
                    className="btn btn-xs flex items-center gap-1 shadow-dark-md"
                    style={{ color: CONFIG[next].color, borderColor: `${CONFIG[next].color}44`, background: "var(--bg-layer-2)" }}
                  >
                    <i className="ti ti-arrow-right text-[10px]" aria-hidden="true" />
                    {CONFIG[next].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
