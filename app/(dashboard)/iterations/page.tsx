"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIterations, useUpdateIterationFeedback } from "@/hooks/useIterations";
import { useCampaigns } from "@/hooks/useCampaigns";
import { DiffViewer } from "@/components/organisms/DiffViewer";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";

type IterWithMeta = import("@/lib/supabase/types").IterationRow & {
  campaigns?: { name: string };
  prompts?:   { title: string };
};

function ScoreStars({ score, onChange }: { score: number | null; onChange?: (s: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
          onClick={() => onChange?.(n)} aria-label={`Rate ${n}`}
          className="text-[15px] transition-colors duration-100">
          <i className={cn("ti", (hover ?? score ?? 0) >= n
            ? "ti-star-filled text-teal"
            : "ti-star text-[rgba(173,252,249,0.2)]")} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function VersionNode({ iter, selected, depth = 0, onClick }: {
  iter: IterWithMeta; selected: boolean; depth?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      style={{ paddingLeft: `${12 + depth * 18}px` }}
      className={cn(
        "flex items-center gap-2 w-full text-left py-2 pr-3 rounded-lg transition-all duration-150",
        selected ? "bg-teal-dim border border-[rgba(173,252,249,0.2)]"
                 : "hover:bg-[rgba(173,252,249,0.03)]"
      )}>
      {depth > 0 && <div className="w-3 h-px bg-[rgba(173,252,249,0.15)] shrink-0" />}
      <span className={cn("w-2 h-2 rounded-full shrink-0 transition-colors",
        selected ? "bg-teal animate-pulse-teal"
        : (iter.score ?? 0) >= 4 ? "bg-forest" : "bg-[rgba(173,252,249,0.2)]"
      )} />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className={cn("font-mono text-[10px] tracking-[0.06em] truncate",
          selected ? "text-teal" : "text-[var(--text-secondary)]")}>
          {iter.version_label || iter.id.slice(0,8)}
        </span>
        <span className="font-mono text-[8px] text-[var(--text-muted)] truncate">
          {new Date(iter.created_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short" })}
        </span>
      </div>
      {iter.score != null && (
        <span className="font-mono text-[9px] text-teal shrink-0">★{iter.score}</span>
      )}
    </button>
  );
}

function CommentBox({ iterationId }: { iterationId: string }) {
  const [text, setText] = useState("");
  const update = useUpdateIterationFeedback();
  const submit = () => {
    if (!text.trim()) return;
    update.mutate({ id: iterationId, feedback: { comments: [{ text: text.trim(), ts: new Date().toISOString() }] } });
    setText("");
  };
  return (
    <div className="flex gap-2">
      <input className="input text-[12px] flex-1" placeholder="Add feedback…"
        value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()} />
      <button onClick={submit} disabled={!text.trim() || update.isPending} className="btn btn-secondary btn-sm">
        {update.isPending ? <i className="ti ti-loader-2 animate-spin-slow text-[12px]" aria-hidden="true" /> : "Post"}
      </button>
    </div>
  );
}

export default function IterationsPage() {
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [compareId,      setCompareId]      = useState<string | null>(null);
  const [showCompare,    setShowCompare]    = useState(false);

  const { data: iterations = [], isLoading } = useIterations(campaignFilter || undefined);
  const { data: campaigns  = [] }            = useCampaigns({ limit: 50 });
  const updateFeedback = useUpdateIterationFeedback();

  const selected  = (selectedId ? iterations.find(i => i.id === selectedId) : iterations[0]) ?? null;
  const compareTo = compareId ? iterations.find(i => i.id === compareId) ?? null : null;

  const roots    = iterations.filter(i => !i.diff_from_id);
  const children = (pid: string) => iterations.filter(i => i.diff_from_id === pid);

  return (
    <div className="flex flex-col gap-5">

      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Creative tracking</p>
          <h1 className="font-display font-black text-display-lg">
            Iterations <em className="text-teal not-italic">&amp; Diffs</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${iterations.length} versions tracked`}
          </p>
        </div>
        <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
          className="input input-mono text-[11px] py-2 w-full sm:w-52">
          <option value="">All campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          <div className="flex flex-col gap-2">
            {Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
          </div>
          <div className="skeleton h-96 rounded-xl" />
        </div>
      ) : iterations.length === 0 ? (
        <div className="card-glass flex flex-col items-center gap-4 py-20 text-center">
          <i className="ti ti-git-branch text-[40px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
          <p className="font-display font-bold text-[16px]">No iterations yet</p>
          <p className="font-body text-[13px] text-[var(--text-tertiary)]">
            Iterations are created when prompts run against campaigns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">

          {/* Version tree */}
          <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
            transition={{ delay: 0.05 }}
            className="card-glass p-2 flex flex-col gap-1 max-h-[70vh] overflow-y-auto no-scrollbar">
            <p className="eyebrow text-[8px] px-2 py-1">Version tree</p>
            {roots.map(root => (
              <div key={root.id}>
                <VersionNode iter={root as IterWithMeta}
                  selected={selected?.id === root.id}
                  onClick={() => setSelectedId(root.id)} />
                {children(root.id).map(child => (
                  <VersionNode key={child.id} iter={child as IterWithMeta}
                    selected={selected?.id === child.id} depth={1}
                    onClick={() => setSelectedId(child.id)} />
                ))}
              </div>
            ))}
          </motion.div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div key={selected.id}
                initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-8 }} transition={{ duration:0.18 }}
                className="flex flex-col gap-4">

                {/* Meta header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="tag tag-teal">{selected.version_label || "Untitled"}</span>
                      {(selected as IterWithMeta).campaigns?.name && (
                        <span className="tag">{(selected as IterWithMeta).campaigns!.name}</span>
                      )}
                      {(selected as IterWithMeta).prompts?.title && (
                        <span className="tag tag-sage">{(selected as IterWithMeta).prompts!.title}</span>
                      )}
                    </div>
                    <p className="font-mono text-[9px] text-[var(--text-muted)] tracking-[0.08em]">
                      {new Date(selected.created_at).toLocaleString("en-GB",
                        { day:"2-digit", month:"short", year:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ScoreStars
                      score={selected.score}
                      onChange={s => updateFeedback.mutate({ id: selected.id, feedback: selected.feedback ?? {}, score: s })}
                    />
                    <button
                      onClick={() => { setShowCompare(v => !v); if (showCompare) setCompareId(null); }}
                      className={cn("btn btn-sm flex items-center gap-1.5",
                        showCompare ? "btn-primary" : "btn-secondary")}>
                      <i className="ti ti-git-compare text-[12px]" aria-hidden="true" />
                      {showCompare ? "Close compare" : "Compare"}
                    </button>
                  </div>
                </div>

                {/* Compare picker */}
                <AnimatePresence>
                  {showCompare && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                      exit={{ opacity:0, height:0 }} style={{ overflow:"hidden" }}>
                      <div className="flex items-center gap-2 p-3 card-glass">
                        <span className="font-mono text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.1em] shrink-0">vs</span>
                        <select value={compareId ?? ""} onChange={e => setCompareId(e.target.value)}
                          className="input input-mono text-[11px] py-1.5 flex-1">
                          <option value="">Select version…</option>
                          {iterations.filter(i => i.id !== selected.id).map(i => (
                            <option key={i.id} value={i.id}>{i.version_label || i.id.slice(0,8)}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Diff or raw */}
                {showCompare && compareTo ? (
                  <DiffViewer oldContent={compareTo.content} newContent={selected.content} />
                ) : (
                  <div className="card-elevated p-4">
                    <p className="eyebrow text-[8px] mb-3">Content</p>
                    <pre className="font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap bg-[rgba(173,252,249,0.02)] border border-[rgba(173,252,249,0.07)] rounded-lg p-4 max-h-80 overflow-auto no-scrollbar">
                      {selected.content}
                    </pre>
                  </div>
                )}

                {/* Feedback */}
                <div className="card-glass p-4 flex flex-col gap-3">
                  <p className="font-display font-bold text-[13px]">Feedback</p>
                  {(() => {
                    const fb = selected.feedback as { comments?: { text: string; ts: string }[] } | null;
                    return (fb?.comments ?? []).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {(fb!.comments!).map((c, i) => (
                          <div key={i} className="flex gap-2 p-2 bg-[rgba(173,252,249,0.03)] rounded-lg border border-[rgba(173,252,249,0.06)]">
                            <div className="w-6 h-6 rounded-full bg-teal-dim flex items-center justify-center shrink-0">
                              <i className="ti ti-user text-[10px] text-teal" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-body text-[12px] text-[var(--text-secondary)]">{c.text}</p>
                              <p className="font-mono text-[8px] text-[var(--text-muted)] mt-0.5">
                                {new Date(c.ts).toLocaleString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-[12px] text-[var(--text-muted)]">No feedback yet.</p>
                    );
                  })()}
                  <CommentBox iterationId={selected.id} />
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
