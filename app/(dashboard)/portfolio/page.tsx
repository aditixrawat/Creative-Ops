"use client";

import { useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolioItems, useSavePortfolioItem, useDeletePortfolioItem } from "@/hooks/usePortfolio";
import { useCampaigns } from "@/hooks/useCampaigns";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { PortfolioItemRow } from "@/lib/supabase/types";

// ── Showcase Card ───────────────────────────────────────────────────
function PortfolioCard({
  item,
  campaignName,
  onDelete,
}: {
  item: PortfolioItemRow;
  campaignName?: string;
  onDelete: (id: string) => void;
}) {
  const mediaUrl = Array.isArray(item.media_urls)
    ? (item.media_urls as string[])[0]
    : typeof item.media_urls === "string"
    ? JSON.parse(item.media_urls)[0]
    : undefined;

  const resultsList = (Array.isArray(item.results)
    ? item.results
    : []) as { metric: string; value: string }[];

  return (
    <motion.article
      variants={motionVariants.staggerItem}
      className={cn(
        "card-elevated group relative flex flex-col overflow-hidden rounded-xl border border-[rgba(173,252,249,0.08)] hover:border-[rgba(173,252,249,0.25)] transition-all duration-200"
      )}
    >
      {/* Thumbnail */}
      {mediaUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[rgba(173,252,249,0.02)]">
          <img
            src={mediaUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {item.is_featured && (
            <span className="absolute top-2 left-2 tag tag-teal font-bold shadow-md">
              <i className="ti ti-star mr-1" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
      ) : (
        <div className="relative aspect-[16/10] w-full flex items-center justify-center bg-[rgba(173,252,249,0.04)]">
          <i className="ti ti-photo text-[36px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
          {item.is_featured && (
            <span className="absolute top-2 left-2 tag tag-teal font-bold shadow-md">
              <i className="ti ti-star mr-1" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display font-bold text-[15px] text-[var(--text-primary)] leading-tight truncate">
            {item.title}
          </h3>
          <p className="font-mono text-[9px] text-[var(--text-muted)] tracking-wider">
            slug: {item.slug}
          </p>
        </div>

        {item.summary && (
          <p className="font-body text-[12px] text-[var(--text-tertiary)] leading-relaxed line-clamp-3">
            {item.summary}
          </p>
        )}

        {/* Campaign association */}
        {campaignName && (
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-body text-[11px]">
            <i className="ti ti-target text-[12px] text-teal" aria-hidden="true" />
            <span>Campaign: <strong className="text-[var(--text-secondary)]">{campaignName}</strong></span>
          </div>
        )}

        {/* Results metrics */}
        {resultsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {resultsList.map((r, i) => (
              <span key={i} className="tag tag-teal text-[10px] py-0.5 px-2 font-mono">
                {r.metric}: <strong className="text-[var(--text-primary)]">{r.value}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Divider & Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(173,252,249,0.06)]">
          <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--text-muted)] uppercase">
            {new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
          </span>
          <button
            onClick={() => onDelete(item.id)}
            className="btn-icon btn w-7 h-7 text-[#f09595] hover:bg-[rgba(240,149,149,0.08)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete showcase item"
          >
            <i className="ti ti-trash text-[13px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ── Add Item Drawer ─────────────────────────────────────────────────
function AddShowcaseDrawer({
  onClose,
  campaigns,
}: {
  onClose: () => void;
  campaigns: { id: string; name: string }[];
}) {
  const save = useSavePortfolioItem();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Result metrics state
  const [metrics, setMetrics] = useState<{ metric: string; value: string }[]>([
    { metric: "ROAS", value: "" },
  ]);

  const handleAddMetric = () => {
    setMetrics([...metrics, { metric: "", value: "" }]);
  };

  const handleRemoveMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleMetricChange = (index: number, field: "metric" | "value", val: string) => {
    const updated = [...metrics];
    updated[index][field] = val;
    setMetrics(updated);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const filteredMetrics = metrics.filter((m) => m.metric.trim() && m.value.trim());

    await save.mutateAsync({
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || null,
      campaign_id: campaignId || null,
      media_urls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
      results: filteredMetrics,
      is_featured: isFeatured,
    });

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="card-elevated p-5 flex flex-col gap-4 border border-[rgba(173,252,249,0.15)] bg-bg-layer2"
    >
      <div className="flex items-center justify-between border-b border-[rgba(173,252,249,0.06)] pb-3">
        <p className="font-display font-bold text-[14px]">New Portfolio Showcase</p>
        <button onClick={onClose} className="btn-icon btn w-7 h-7" aria-label="Close">
          <i className="ti ti-x text-[13px]" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Showcase Title *
            </label>
            <input
              required
              className="input text-[13px]"
              placeholder="e.g. Neon Autumn Capsule Launch"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Slug (URL Identifier) *
            </label>
            <input
              required
              className="input input-mono text-[12px]"
              placeholder="neon-autumn-launch"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Summary Description
          </label>
          <textarea
            className="input text-[13px] h-20 resize-none py-2"
            placeholder="Summarize the creative direction, visual assets, and metrics accomplished..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Associated Campaign
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="input input-mono text-[11px] py-2"
            >
              <option value="">None / Independent</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Media Image URL
            </label>
            <input
              className="input text-[13px]"
              placeholder="https://images.unsplash.com/photo-..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Results metrics */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
              Key Results & Metrics
            </label>
            <button
              type="button"
              onClick={handleAddMetric}
              className="btn btn-secondary btn-xs font-mono py-0.5 px-2"
            >
              + Add Metric
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
            {metrics.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  required
                  className="input input-mono text-[11px] flex-1 py-1"
                  placeholder="Metric (e.g. ROAS)"
                  value={m.metric}
                  onChange={(e) => handleMetricChange(i, "metric", e.target.value)}
                />
                <input
                  required
                  className="input input-mono text-[11px] flex-1 py-1"
                  placeholder="Value (e.g. 4.2x)"
                  value={m.value}
                  onChange={(e) => handleMetricChange(i, "value", e.target.value)}
                />
                {metrics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMetric(i)}
                    className="btn btn-ghost btn-xs text-[#f09595]"
                  >
                    <i className="ti ti-minus" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Featured switch */}
        <div className="flex items-center justify-between p-3 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.08)] rounded-lg mt-1">
          <div>
            <p className="font-body text-[13px] text-[var(--text-primary)] font-medium">Featured Showcase</p>
            <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Highlight this item in your creative vault
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isFeatured}
            onClick={() => setIsFeatured((v) => !v)}
            className={cn(
              "relative w-10 h-5 rounded-full border transition-all duration-200",
              isFeatured
                ? "bg-teal border-teal"
                : "bg-[rgba(173,252,249,0.06)] border-[rgba(173,252,249,0.15)]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200",
                isFeatured ? "left-[22px] bg-bg-base" : "left-0.5 bg-[rgba(173,252,249,0.4)]"
              )}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || save.isPending}
          className="btn btn-primary w-full justify-center flex items-center gap-2 mt-2"
        >
          {save.isPending ? (
            <>
              <i className="ti ti-loader-2 animate-spin-slow text-[13px]" aria-hidden="true" />
              Saving Showcase…
            </>
          ) : (
            <>
              <i className="ti ti-device-floppy text-[13px]" aria-hidden="true" />
              Save to Portfolio
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const dSearch = useDeferredValue(search);

  // Queries
  const { data: items = [], isLoading } = usePortfolioItems(dSearch || undefined);
  const { data: campaigns = [] } = useCampaigns({ limit: 100 });
  const deleteItem = useDeletePortfolioItem();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div
        variants={motionVariants.fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Showcase</p>
          <h1 className="font-display font-black text-display-lg text-[var(--text-primary)]">
            Creative <em className="text-teal not-italic">Portfolio</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${items.length} works accomplished`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className={cn(
            "btn flex items-center gap-1.5 shrink-0",
            showAdd ? "btn-secondary" : "btn-primary"
          )}
        >
          <i className={cn("ti text-[14px]", showAdd ? "ti-x" : "ti-plus")} aria-hidden="true" />
          {showAdd ? "Cancel" : "New Showcase"}
        </button>
      </motion.div>

      {/* Add Drawer */}
      <AnimatePresence>
        {showAdd && (
          <AddShowcaseDrawer
            onClose={() => setShowAdd(false)}
            campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
          />
        )}
      </AnimatePresence>

      {/* Search Filter */}
      <motion.div
        variants={motionVariants.fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]" aria-hidden="true" />
        <input
          className="input pl-9 w-full text-[13px]"
          placeholder="Search portfolio items by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal"
            aria-label="Clear"
          >
            <i className="ti ti-x text-[12px]" aria-hidden="true" />
          </button>
        )}
      </motion.div>

      {/* Grid Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton rounded-xl"
                style={{ height: "300px", animationDelay: `${i * 65}ms` }}
              />
            ))}
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-glass flex flex-col items-center gap-4 py-20 text-center"
          >
            <i className="ti ti-photo text-[42px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
            <div>
              <p className="font-display font-bold text-[16px] text-[var(--text-primary)]">
                Portfolio is empty
              </p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)] mt-1">
                {search ? "No matches — try adjusting search" : "Create your first showcase item"}
              </p>
            </div>
            {!search && (
              <button onClick={() => setShowAdd(true)} className="btn btn-primary">
                <i className="ti ti-plus" aria-hidden="true" /> New Showcase
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={motionVariants.staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((item) => (
              <PortfolioCard
                key={item.id}
                item={item}
                campaignName={campaigns.find((c) => c.id === item.campaign_id)?.name}
                onDelete={(id) => deleteItem.mutate(id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
