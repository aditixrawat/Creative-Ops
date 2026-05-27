"use client";

import { useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAITools }    from "@/hooks/useAITools";
import { cn }            from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { AIToolRow } from "@/lib/supabase/types";

const CATEGORIES   = ["All","Text","Image","Video","Audio","Code","Research","Other"];
const PRICING      = ["All","free","freemium","paid","enterprise","open_source"];
const PRICING_LABEL: Record<string, string> = {
  free:"Free", freemium:"Freemium", paid:"Paid", enterprise:"Enterprise", open_source:"Open Source",
};
const CATEGORY_ICON: Record<string, string> = {
  Text:"ti-text-size", Image:"ti-photo", Video:"ti-video", Audio:"ti-music",
  Code:"ti-code", Research:"ti-microscope", Other:"ti-sparkles",
};

function RatingBar({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="font-mono text-[9px] text-[var(--text-muted)]">No rating</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <i key={n} className={cn("ti text-[11px]",
            rating >= n ? "ti-star-filled text-teal" : "ti-star text-[rgba(173,252,249,0.15)]"
          )} aria-hidden="true" />
        ))}
      </div>
      <span className="font-mono text-[9px] text-[var(--text-tertiary)]">{rating.toFixed(1)}</span>
    </div>
  );
}

function ToolCard({ tool, onSelect }: { tool: AIToolRow; onSelect: (t: AIToolRow) => void }) {
  return (
    <motion.button
      variants={motionVariants.staggerItem}
      onClick={() => onSelect(tool)}
      className="card-elevated group text-left flex flex-col gap-3 p-4 hover:shadow-card-hover transition-all duration-200 w-full"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[rgba(173,252,249,0.06)] border border-[rgba(173,252,249,0.1)] flex items-center justify-center shrink-0">
            <i className={cn("ti text-[18px] text-teal", CATEGORY_ICON[tool.category] ?? "ti-sparkles")} aria-hidden="true" />
          </div>
          <div>
            <p className="font-display font-bold text-[14px] text-[var(--text-primary)] leading-tight">{tool.name}</p>
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-[0.1em]">{tool.category}</p>
          </div>
        </div>
        {tool.api_available && (
          <span className="tag tag-forest shrink-0 flex items-center gap-1">
            <i className="ti ti-api text-[9px]" aria-hidden="true" />API
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {(tool.use_cases as string[] ?? []).slice(0,3).map(u => (
          <span key={u} className="tag">{u}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[rgba(173,252,249,0.06)]">
        <RatingBar rating={tool.rating} />
        <span className={cn("tag",
          tool.pricing_model === "free"       ? "tag-forest" :
          tool.pricing_model === "open_source"? "tag-sage"   :
          tool.pricing_model === "freemium"   ? "tag-teal"   : ""
        )}>{PRICING_LABEL[tool.pricing_model] ?? tool.pricing_model}</span>
      </div>
    </motion.button>
  );
}

function ToolDetailPanel({ tool, onClose }: { tool: AIToolRow; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:16 }} transition={{ duration: 0.2 }}
      className="card-elevated flex flex-col gap-5 p-5 sticky top-20 max-h-[80vh] overflow-y-auto no-scrollbar"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[rgba(173,252,249,0.06)] border border-[rgba(173,252,249,0.12)] flex items-center justify-center">
            <i className={cn("ti text-[22px] text-teal", CATEGORY_ICON[tool.category] ?? "ti-sparkles")} aria-hidden="true" />
          </div>
          <div>
            <p className="font-display font-bold text-[16px] text-[var(--text-primary)]">{tool.name}</p>
            <p className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-[0.1em]">{tool.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon btn w-7 h-7 shrink-0" aria-label="Close">
          <i className="ti ti-x text-[13px]" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Pricing",      value: PRICING_LABEL[tool.pricing_model] ?? tool.pricing_model },
          { label:"API",          value: tool.api_available ? "Available" : "No API" },
          { label:"Rating",       value: tool.rating != null ? `${tool.rating}/5` : "Unrated" },
          { label:"Last reviewed",value: tool.last_reviewed ? new Date(tool.last_reviewed).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[rgba(173,252,249,0.03)] rounded-lg border border-[rgba(173,252,249,0.07)] p-3">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
            <p className="font-body text-[13px] text-[var(--text-primary)] font-medium mt-1">{value}</p>
          </div>
        ))}
      </div>

      {(tool.use_cases as string[] ?? []).length > 0 && (
        <div>
          <p className="eyebrow text-[8px] mb-2">Use cases</p>
          <div className="flex flex-wrap gap-1.5">
            {(tool.use_cases as string[]).map(u => (
              <span key={u} className="tag tag-teal">{u}</span>
            ))}
          </div>
        </div>
      )}

      {tool.website_url && (
        <a href={tool.website_url} target="_blank" rel="noopener noreferrer"
          className="btn btn-secondary w-full justify-center flex items-center gap-1.5">
          <i className="ti ti-external-link text-[13px]" aria-hidden="true" />
          Visit website
        </a>
      )}

      <div>
        <p className="eyebrow text-[8px] mb-2">Rating</p>
        <RatingBar rating={tool.rating} />
      </div>
    </motion.div>
  );
}

export default function AIToolsPage() {
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [pricing,   setPricing]   = useState("All");
  const [apiOnly,   setApiOnly]   = useState(false);
  const [selected,  setSelected]  = useState<AIToolRow | null>(null);
  const dSearch = useDeferredValue(search);

  const { data: tools = [], isLoading } = useAITools({
    search:        dSearch || undefined,
    category:      category !== "All" ? category : undefined,
    pricing_model: pricing  !== "All" ? pricing  : undefined,
    api_available: apiOnly  ? true    : undefined,
  });

  return (
    <div className="flex flex-col gap-5">

      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Discover</p>
          <h1 className="font-display font-black text-display-lg">
            AI <em className="text-teal not-italic">Tools</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${tools.length} tools tracked`}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay:0.05 }} className="flex flex-col gap-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]" aria-hidden="true" />
            <input className="input pl-9 w-full text-[13px]" placeholder="Search tools…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={pricing} onChange={e => setPricing(e.target.value)}
            className="input input-mono text-[11px] py-2 w-36">
            {PRICING.map(p => <option key={p} value={p}>{p === "All" ? "All pricing" : PRICING_LABEL[p]}</option>)}
          </select>
          <button onClick={() => setApiOnly(v => !v)}
            className={cn("btn btn-sm flex items-center gap-1.5",
              apiOnly ? "btn-primary" : "btn-ghost")}>
            <i className="ti ti-api text-[12px]" aria-hidden="true" />
            API only
          </button>
        </div>
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn("tag cursor-pointer transition-all",
                category === cat ? "tag-teal font-bold" : "hover:border-[rgba(173,252,249,0.2)]")}>
              {cat !== "All" && <i className={cn("ti text-[9px]", CATEGORY_ICON[cat])} aria-hidden="true" />}
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content + detail panel */}
      <div className={cn("grid gap-4", selected ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({length:9}).map((_,i) => (
                <div key={i} className="skeleton h-36 rounded-xl" style={{ animationDelay:`${i*60}ms` }} />
              ))}
            </div>
          ) : tools.length === 0 ? (
            <div className="card-glass flex flex-col items-center gap-4 py-20 text-center">
              <i className="ti ti-robot text-[40px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
              <p className="font-display font-bold text-[16px]">No tools found</p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)]">Try adjusting your filters</p>
            </div>
          ) : (
            <motion.div
              variants={motionVariants.staggerContainer} initial="hidden" animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map(t => (
                <ToolCard key={t.id} tool={t} onSelect={setSelected} />
              ))}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <ToolDetailPanel tool={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
