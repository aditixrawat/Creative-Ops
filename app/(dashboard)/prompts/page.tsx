"use client";

import { useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { PromptCard }   from "@/components/molecules/PromptCard";
import { PromptBuilder } from "@/components/organisms/PromptBuilder";
import {
  usePrompts, useClonePrompt, useDeletePrompt,
  type PromptFilter,
} from "@/hooks/usePrompts";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";

// ── Constants ─────────────────────────────────────────────────────
const CATEGORIES = ["All", "Copywriting", "Strategy", "Visual", "Email", "Social", "SEO", "Research", "Other"];
const MODELS     = [
  { value: "",                 label: "All models"       },
  { value: "claude-sonnet-4-6",label: "Claude Sonnet 4.6"},
  { value: "claude-opus-4-6",  label: "Claude Opus 4.6"  },
  { value: "gpt-4o",           label: "GPT-4o"           },
  { value: "gemini-1.5-pro",   label: "Gemini 1.5 Pro"   },
];
const VIEWS = ["grid", "list"] as const;
type View = typeof VIEWS[number];

// ── Toolbar button helper ─────────────────────────────────────────
function ToolBtn({ active, icon, label, onClick }: {
  active?: boolean; icon: string; label: string; onClick: () => void;
}) {
  return (
    <button
      aria-label={label} title={label} onClick={onClick}
      className={cn(
        "btn-icon btn w-8 h-8 transition-all",
        active && "bg-teal-dim border-[rgba(173,252,249,0.3)] text-teal"
      )}
    >
      <i className={cn("ti text-[14px]", icon)} aria-hidden="true" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function PromptsPage() {
  const router  = useRouter();
  const [view,        setView]        = useState<View>("grid");
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [model,       setModel]       = useState("");
  const [isPublic,    setIsPublic]    = useState<boolean | undefined>();
  const [showBuilder, setShowBuilder] = useState(false);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);

  const dSearch = useDeferredValue(search);

  const filter: PromptFilter = {
    ...(dSearch             && { search: dSearch }),
    ...(category !== "All"  && { category }),
    ...(model               && { model_target: model }),
    ...(isPublic != null    && { is_public: isPublic }),
    limit: 60,
  };

  const { data: prompts = [], isLoading, isFetching } = usePrompts(filter);
  const clonePrompt  = useClonePrompt();
  const deletePrompt = useDeletePrompt();

  // Get current user id for new prompts
  const [authorId, setAuthorId] = useState("");
  if (!authorId) {
    getSupabaseBrowser().auth.getUser().then(({ data }) => {
      if (data.user) setAuthorId(data.user.id);
    });
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    await deletePrompt.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ── */}
      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Library</p>
          <h1 className="font-display font-black text-display-lg text-[var(--text-primary)]">
            Prompt <em className="text-teal not-italic">Library</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${prompts.length} prompts`}
            {isFetching && !isLoading && (
              <i className="ti ti-loader-2 text-[11px] ml-2 animate-spin-slow text-[var(--text-muted)]" aria-hidden="true" />
            )}
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-1.5 shrink-0"
          onClick={() => setShowBuilder(true)}
        >
          <i className="ti ti-plus text-[14px]" aria-hidden="true" />
          New Prompt
        </button>
      </motion.div>

      {/* ── Inline builder ── */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          >
            <PromptBuilder
              authorId={authorId}
              onSuccess={() => setShowBuilder(false)}
              onCancel={() => setShowBuilder(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters bar ── */}
      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]" aria-hidden="true" />
          <input
            className="input pl-9 w-full text-[13px]"
            placeholder="Search prompts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search prompts"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal"
              aria-label="Clear search"
            >
              <i className="ti ti-x text-[12px]" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Model filter */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="input input-mono text-[11px] py-2 w-full sm:w-44"
          aria-label="Filter by model"
        >
          {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Visibility filter */}
        <select
          value={isPublic == null ? "" : String(isPublic)}
          onChange={(e) => setIsPublic(e.target.value === "" ? undefined : e.target.value === "true")}
          className="input input-mono text-[11px] py-2 w-full sm:w-36"
          aria-label="Filter by visibility"
        >
          <option value="">All visibility</option>
          <option value="true">Public</option>
          <option value="false">Private</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1">
          <ToolBtn active={view === "grid"} icon="ti-layout-grid"    label="Grid view" onClick={() => setView("grid")} />
          <ToolBtn active={view === "list"} icon="ti-layout-list"    label="List view" onClick={() => setView("list")} />
        </div>
      </motion.div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "tag transition-all duration-150 cursor-pointer",
              category === cat
                ? "tag-teal font-bold"
                : "hover:border-[rgba(173,252,249,0.25)] hover:text-[var(--text-secondary)]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {/* Loading skeletons */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn(
              "grid gap-3",
              view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && prompts.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card-glass flex flex-col items-center justify-center gap-4 py-20 text-center"
          >
            <i className="ti ti-bulb text-[40px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
            <div>
              <p className="font-display font-bold text-[16px] text-[var(--text-primary)]">No prompts found</p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)] mt-1">
                {search || category !== "All" ? "Try adjusting your filters" : "Add your first prompt to get started"}
              </p>
            </div>
            {(!search && category === "All") && (
              <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>
                <i className="ti ti-plus" aria-hidden="true" /> New Prompt
              </button>
            )}
          </motion.div>
        )}

        {/* Grid / list */}
        {!isLoading && prompts.length > 0 && (
          <motion.div
            key={`${view}-content`}
            variants={motionVariants.staggerContainer}
            initial="hidden" animate="visible"
            className={cn(
              "grid gap-3",
              view === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {prompts.map((p, i) => (
              <motion.div key={p.id} variants={motionVariants.staggerItem}>
                <PromptCard
                  prompt={p}
                  index={i}
                  onClone={(id) => {
                    const src = prompts.find((x) => x.id === id);
                    if (src) clonePrompt.mutate(src);
                  }}
                  onFavourite={() => {}}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-glass flex items-center justify-center z-modal p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              variants={motionVariants.scaleIn} initial="hidden" animate="visible"
              onClick={(e) => e.stopPropagation()}
              className="card-elevated p-6 max-w-sm w-full flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(52,28,28,0.5)] border border-[rgba(52,28,28,0.8)] flex items-center justify-center">
                  <i className="ti ti-trash text-[#f09595] text-[18px]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display font-bold text-[15px] text-[var(--text-primary)]">Delete prompt?</p>
                  <p className="font-body text-[12px] text-[var(--text-tertiary)]">This cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteId(null)} className="btn btn-ghost btn-sm">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deletePrompt.isPending}
                  className="btn btn-danger btn-sm"
                >
                  {deletePrompt.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
