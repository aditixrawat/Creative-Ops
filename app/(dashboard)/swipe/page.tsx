"use client";

import { useState, useDeferredValue, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeItems, useSwipeCollections, useSaveSwipeItem, useDeleteSwipeItem } from "@/hooks/useSwipe";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { SwipeItemRow } from "@/lib/supabase/types";

const ALL_TAGS = ["branding","editorial","typography","dark","minimal","cyberpunk","brutalist","motion","web","print","ai-gen"];

// ── Masonry grid via CSS columns ───────────────────────────────────
function MasonryGrid({ items, onDelete }: { items: SwipeItemRow[]; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Distribute items across 3 columns
  const cols: SwipeItemRow[][] = [[], [], []];
  items.forEach((item, i) => cols[i % 3].push(item));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            variants={motionVariants.staggerItem}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-[rgba(173,252,249,0.08)] hover:border-[rgba(173,252,249,0.25)] transition-all duration-200"
            style={{ breakInside: "avoid" }}
            onClick={() => setExpanded(item.id)}
          >
            {/* Thumbnail */}
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.title ?? "Swipe item"}
                className="w-full object-cover block"
                style={{ aspectRatio: i % 5 === 0 ? "1/1.4" : i % 3 === 0 ? "4/3" : "16/9" }}
                loading="lazy"
              />
            ) : (
              <div
                className="w-full flex items-center justify-center bg-[rgba(173,252,249,0.04)]"
                style={{ aspectRatio: i % 4 === 0 ? "1/1.2" : "16/9" }}
              >
                <i className="ti ti-photo text-[28px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,15,14,0.9)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 gap-2">
              {item.title && (
                <p className="font-body text-[11px] font-medium text-[var(--text-primary)] leading-snug truncate-2">
                  {item.title}
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {(item.tags as string[] ?? []).slice(0,2).map(t => (
                    <span key={t} className="tag text-[7px] px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(item.id); }}
                  className="btn-icon btn w-6 h-6 shrink-0" aria-label="Delete">
                  <i className="ti ti-trash text-[11px] text-[#f09595]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {expanded && (() => {
          const item = items.find(i => i.id === expanded);
          if (!item) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-modal bg-black/80 backdrop-glass flex items-center justify-center p-4"
              onClick={() => setExpanded(null)}
            >
              <motion.div
                variants={motionVariants.scaleIn} initial="hidden" animate="visible"
                onClick={e => e.stopPropagation()}
                className="card-elevated max-w-2xl w-full max-h-[90vh] overflow-auto flex flex-col gap-4 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold text-[16px] text-[var(--text-primary)]">
                      {item.title ?? "Untitled"}
                    </p>
                    {item.source && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[10px] text-teal hover:underline mt-0.5 block">
                        {item.source} ↗
                      </a>
                    )}
                  </div>
                  <button onClick={() => setExpanded(null)} className="btn-icon btn w-8 h-8" aria-label="Close">
                    <i className="ti ti-x text-[15px]" aria-hidden="true" />
                  </button>
                </div>

                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt={item.title ?? ""} className="w-full rounded-lg object-cover max-h-96" />
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(item.tags as string[] ?? []).map(t => (
                    <span key={t} className="tag tag-teal">{t}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 flex-1 justify-center">
                    <i className="ti ti-external-link text-[12px]" aria-hidden="true" />
                    Open source
                  </a>
                  <button onClick={() => { onDelete(item.id); setExpanded(null); }}
                    className="btn btn-danger btn-sm flex items-center gap-1.5">
                    <i className="ti ti-trash text-[12px]" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}

// ── Add item drawer ────────────────────────────────────────────────
function AddDrawer({ onClose }: { onClose: () => void }) {
  const [url,   setUrl]   = useState("");
  const [title, setTitle] = useState("");
  const [tags,  setTags]  = useState<string[]>([]);
  const [tagIn, setTagIn] = useState("");
  const save = useSaveSwipeItem();
  const [authorId, setAuthorId] = useState("");

  if (!authorId) {
    getSupabaseBrowser().auth.getUser().then(({ data }) => {
      if (data.user) setAuthorId(data.user.id);
    });
  }

  const addTag = () => {
    const v = tagIn.trim().toLowerCase();
    if (v && !tags.includes(v)) setTags(t => [...t, v]);
    setTagIn("");
  };

  const handleSave = async () => {
    if (!url.trim() || !authorId) return;
    await save.mutateAsync({
      url: url.trim(),
      title: title.trim() || null,
      thumbnail_url: null,
      tags,
      collection_id: null,
      source: new URL(url.trim()).hostname,
      saved_by: authorId,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:16 }} transition={{ duration:0.2 }}
      className="card-elevated p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-[14px]">Save to vault</p>
        <button onClick={onClose} className="btn-icon btn w-7 h-7" aria-label="Close">
          <i className="ti ti-x text-[13px]" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">URL *</label>
          <input className="input text-[13px]" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Title</label>
          <input className="input text-[13px]" placeholder="Optional label" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Tags</label>
          <div className="flex flex-wrap gap-1.5 p-2 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.09)] rounded-md min-h-[36px]">
            {tags.map(t => (
              <span key={t} className="tag tag-teal flex items-center gap-1">{t}
                <button type="button" onClick={() => setTags(ts => ts.filter(x => x !== t))} aria-label={`Remove ${t}`}>
                  <i className="ti ti-x text-[8px]" aria-hidden="true" />
                </button>
              </span>
            ))}
            <input value={tagIn} onChange={e => setTagIn(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              onBlur={addTag}
              placeholder={tags.length === 0 ? "Add tags…" : ""}
              className="bg-transparent outline-none font-mono text-[10px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] min-w-[80px] flex-1" />
          </div>
          {/* Quick tag chips */}
          <div className="flex flex-wrap gap-1 mt-1">
            {ALL_TAGS.filter(t => !tags.includes(t)).slice(0,6).map(t => (
              <button key={t} type="button" onClick={() => setTags(ts => [...ts, t])}
                className="tag hover:tag-teal transition-all cursor-pointer">{t}</button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={!url.trim() || save.isPending}
        className="btn btn-primary w-full justify-center flex items-center gap-2">
        {save.isPending
          ? <><i className="ti ti-loader-2 animate-spin-slow text-[13px]" aria-hidden="true" />Saving…</>
          : <><i className="ti ti-bookmark text-[13px]" aria-hidden="true" />Save to vault</>
        }
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function SwipePage() {
  const [search,       setSearch]       = useState("");
  const [activeTag,    setActiveTag]    = useState("");
  const [collection,   setCollection]   = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const dSearch = useDeferredValue(search);

  const { data: items       = [], isLoading }  = useSwipeItems({ search: dSearch, tag: activeTag || undefined, collection_id: collection || undefined });
  const { data: collections = [] }             = useSwipeCollections();
  const deleteItem = useDeleteSwipeItem();

  // Extract all used tags from items
  const allUsedTags = [...new Set(items.flatMap(i => (i.tags as string[] ?? [])))].slice(0, 16);

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Inspiration</p>
          <h1 className="font-display font-black text-display-lg">
            Swipe <em className="text-teal not-italic">Vault</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${items.length} references`}
          </p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className={cn("btn flex items-center gap-1.5 shrink-0", showAdd ? "btn-primary" : "btn-secondary")}>
          <i className={cn("ti text-[14px]", showAdd ? "ti-x" : "ti-plus")} aria-hidden="true" />
          {showAdd ? "Cancel" : "Save reference"}
        </button>
      </motion.div>

      {/* Add drawer */}
      <AnimatePresence>
        {showAdd && <AddDrawer onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      {/* Filters */}
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay: 0.05 }} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]" aria-hidden="true" />
            <input className="input pl-9 w-full text-[13px]" placeholder="Search vault…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {collections.length > 0 && (
            <select value={collection} onChange={e => setCollection(e.target.value)}
              className="input input-mono text-[11px] py-2 w-44">
              <option value="">All collections</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Tag filter chips */}
        {allUsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTag("")}
              className={cn("tag transition-all cursor-pointer", !activeTag ? "tag-teal font-bold" : "hover:border-[rgba(173,252,249,0.2)]")}>
              All
            </button>
            {allUsedTags.map(t => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? "" : t)}
                className={cn("tag transition-all cursor-pointer",
                  activeTag === t ? "tag-teal font-bold" : "hover:border-[rgba(173,252,249,0.2)]")}>
                {t}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({length:12}).map((_,i) => (
              <div key={i} className="skeleton rounded-xl"
                style={{ height: `${140 + (i % 4) * 40}px`, animationDelay: `${i*60}ms` }} />
            ))}
          </motion.div>
        ) : items.length === 0 ? (
          <motion.div key="empty" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="card-glass flex flex-col items-center gap-4 py-20 text-center">
            <i className="ti ti-sparkles text-[40px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
            <div>
              <p className="font-display font-bold text-[16px]">Vault is empty</p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)] mt-1">
                {search || activeTag ? "No matches — try different filters" : "Save your first inspiration reference"}
              </p>
            </div>
            {!search && !activeTag && (
              <button onClick={() => setShowAdd(true)} className="btn btn-primary">
                <i className="ti ti-plus" aria-hidden="true" /> Add reference
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="grid"
            variants={motionVariants.staggerContainer} initial="hidden" animate="visible">
            <MasonryGrid items={items} onDelete={id => deleteItem.mutate(id)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
