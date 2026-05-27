"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

type Status = "draft" | "planned" | "live" | "review" | "complete" | "archived";

const STATUS_CONFIG: Record<Status, { label: string; className: string; dot: string }> = {
  draft:    { label: "Draft",    className: "tag",           dot: "bg-[rgba(173,252,249,0.25)]" },
  planned:  { label: "Planned",  className: "tag tag-teal",  dot: "bg-teal"                     },
  live:     { label: "Live",     className: "tag tag-forest",dot: "bg-forest animate-pulse-teal" },
  review:   { label: "Review",   className: "tag tag-wine",  dot: "bg-[#c4a8a8]"                },
  complete: { label: "Complete", className: "tag tag-sage",  dot: "bg-sage"                     },
  archived: { label: "Archived", className: "tag",           dot: "bg-[rgba(173,252,249,0.15)]" },
};

interface CampaignCardProps {
  campaign: Campaign;
  index?: number;
}

function progressFromDates(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const status  = (campaign.status as Status) ?? "draft";
  const config  = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const progress = progressFromDates(campaign.start_date, campaign.end_date);
  const tags    = Array.isArray(campaign.tags) ? (campaign.tags as string[]) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1], delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/campaigns/${campaign.id}`}
        className={cn(
          "card-elevated group flex flex-col gap-3 p-4 block",
          "no-underline text-inherit"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h3 className="font-display font-bold text-[14px] text-[var(--text-primary)] leading-tight truncate">
              {campaign.name}
            </h3>

            {/* Status pill */}
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
              <span className={cn("tag", config.className)}>{config.label}</span>
            </div>
          </div>

          <i
            className="ti ti-chevron-right text-[16px] text-[rgba(173,252,249,0.20)] group-hover:text-teal transition-colors duration-150 shrink-0 mt-0.5"
            aria-hidden="true"
          />
        </div>

        {/* Progress bar */}
        {(status === "live" || status === "review" || status === "complete") && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--text-muted)] uppercase">Progress</span>
              <span className="font-mono text-[8px] text-teal">{progress}%</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: index * 0.05 + 0.1 }}
              />
            </div>
          </div>
        )}

        {/* Date range */}
        {(campaign.start_date || campaign.end_date) && (
          <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
            <i className="ti ti-calendar text-[12px]" aria-hidden="true" />
            <span className="font-mono text-[9px] tracking-[0.06em]">
              {campaign.start_date
                ? new Date(campaign.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                : "—"}
              {" → "}
              {campaign.end_date
                ? new Date(campaign.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                : "—"}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-[rgba(173,252,249,0.05)]">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
            {tags.length > 3 && <span className="tag">+{tags.length - 3}</span>}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
