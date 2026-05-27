"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePrompt, useUpdatePrompt } from "@/hooks/usePrompts";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { PromptRow } from "@/lib/supabase/types";

// ── Constants ─────────────────────────────────────────────────────
const CATEGORIES = ["Copywriting", "Strategy", "Visual", "Email", "Social", "SEO", "Research", "Other"];
const MODELS = [
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-opus-4-6",   label: "Claude Opus 4.6"   },
  { value: "gpt-4o",            label: "GPT-4o"            },
  { value: "gemini-1.5-pro",    label: "Gemini 1.5 Pro"    },
];

type Tab = "build" | "test" | "meta";

interface Props {
  /** When editing — pass existing prompt */
  prompt?: PromptRow;
  authorId: string;
  onSuccess?: (prompt: PromptRow) => void;
  onCancel?: () => void;
}

// ── Tag input ─────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim().toLowerCase();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.09)] rounded-md min-h-[40px]">
      {tags.map((t) => (
        <span key={t} className="tag tag-teal flex items-center gap-1">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            <i className="ti ti-x text-[9px]" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={tags.length === 0 ? "Add tags…" : ""}
        className="bg-transparent outline-none font-mono text-[10px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] min-w-[80px] flex-1"
      />
    </div>
  );
}

// ── Test panel ────────────────────────────────────────────────────
function TestPanel({ body, model }: { body: string; model: string }) {
  const [output, setOutput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [vars, setVars]       = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  // Extract {{variable}} tokens from prompt body
  const tokens = [...new Set([...body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))];

  const resolved = body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

  const run = async () => {
    if (!body.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/prompt-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: resolved, model }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((p) => p + decoder.decode(value));
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") setOutput(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Variable injection */}
      {tokens.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="eyebrow text-[9px]">Variables</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tokens.map((token) => (
              <div key={token} className="flex flex-col gap-1">
                <label className="font-mono text-[9px] text-[var(--text-tertiary)] tracking-[0.08em] uppercase">
                  {token}
                </label>
                <input
                  className="input input-mono text-[12px] py-1.5"
                  placeholder={`Enter ${token}…`}
                  value={vars[token] ?? ""}
                  onChange={(e) => setVars((p) => ({ ...p, [token]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved prompt preview */}
      {tokens.length > 0 && (
        <div>
          <p className="eyebrow text-[9px] mb-2">Resolved prompt</p>
          <pre className="font-mono text-[10px] text-[var(--text-tertiary)] leading-relaxed bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.07)] rounded-md p-3 whitespace-pre-wrap">
            {resolved}
          </pre>
        </div>
      )}

      {/* Run button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={loading || !body.trim()}
          className="btn btn-primary btn-sm flex items-center gap-1.5"
        >
          {loading
            ? <><i className="ti ti-loader-2 text-[12px] animate-spin-slow" aria-hidden="true" />Running…</>
            : <><i className="ti ti-player-play text-[12px]" aria-hidden="true" />Run prompt</>
          }
        </button>
        {loading && (
          <button type="button" onClick={() => abortRef.current?.abort()} className="btn btn-ghost btn-sm">
            <i className="ti ti-square text-[12px]" aria-hidden="true" /> Stop
          </button>
        )}
        <span className="font-mono text-[9px] text-[var(--text-muted)] ml-auto uppercase tracking-[0.08em]">
          {MODELS.find((m) => m.value === model)?.label ?? model}
        </span>
      </div>

      {/* Output */}
      <AnimatePresence>
        {(output || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.07)] rounded-md p-4 relative overflow-hidden"
          >
            {loading && <div className="scan-line" />}
            <pre className="font-mono text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {output}
              {loading && <span className="cursor-blink" />}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main PromptBuilder ────────────────────────────────────────────
export function PromptBuilder({ prompt, authorId, onSuccess, onCancel }: Props) {
  const isEdit = !!prompt;

  const [tab,      setTab]      = useState<Tab>("build");
  const [title,    setTitle]    = useState(prompt?.title    ?? "");
  const [body,     setBody]     = useState(prompt?.body     ?? "");
  const [category, setCategory] = useState(prompt?.category ?? "");
  const [model,    setModel]    = useState(prompt?.model_target ?? "claude-sonnet-4-6");
  const [tags,     setTags]     = useState<string[]>((prompt?.tags as string[]) ?? []);
  const [isPublic, setIsPublic] = useState(prompt?.is_public ?? false);
  const [charCount, setCharCount] = useState(prompt?.body.length ?? 0);

  const create = useCreatePrompt();
  const update = useUpdatePrompt();
  const isSaving = create.isPending || update.isPending;

  const handleBodyChange = useCallback((val: string) => {
    setBody(val);
    setCharCount(val.length);
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;

    const payload = {
      title: title.trim(),
      body:  body.trim(),
      category: category || null,
      tags,
      model_target: model || null,
      is_public:    isPublic,
      author_id:    authorId,
      version:      prompt?.version ?? 1,
      parent_id:    prompt?.parent_id ?? null,
    };

    const result = isEdit
      ? await update.mutateAsync({ id: prompt!.id, ...payload })
      : await create.mutateAsync(payload);

    onSuccess?.(result);
  };

  const error = create.error || update.error;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "build", label: "Build",    icon: "ti-code"      },
    { key: "test",  label: "Test",     icon: "ti-player-play"},
    { key: "meta",  label: "Metadata", icon: "ti-tag"       },
  ];

  return (
    <motion.div
      variants={motionVariants.scaleIn}
      initial="hidden" animate="visible"
      className="flex flex-col gap-0 card-elevated overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(173,252,249,0.07)] bg-[rgba(173,252,249,0.02)]">
        <div className="flex items-center gap-2">
          <i className="ti ti-bulb text-teal text-[16px]" aria-hidden="true" />
          <span className="font-display font-bold text-[14px] text-[var(--text-primary)]">
            {isEdit ? "Edit Prompt" : "New Prompt"}
          </span>
          {isEdit && (
            <span className="tag tag-teal">v{prompt?.version}</span>
          )}
        </div>
        {onCancel && (
          <button onClick={onCancel} className="btn-icon btn w-7 h-7" aria-label="Close">
            <i className="ti ti-x text-[14px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Title input */}
      <div className="px-5 pt-4 pb-0">
        <input
          className="w-full bg-transparent outline-none font-display font-bold text-[20px] text-[var(--text-primary)] placeholder:text-[rgba(173,252,249,0.18)] tracking-tight"
          placeholder="Prompt title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Prompt title"
        />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-[rgba(173,252,249,0.07)] px-5 mt-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase",
              "px-3 py-2 border-b-2 -mb-px transition-all duration-150",
              tab === t.key
                ? "text-teal border-teal"
                : "text-[var(--text-muted)] border-transparent hover:text-sage"
            )}
          >
            <i className={cn("ti text-[12px]", t.icon)} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="px-5 py-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* BUILD */}
          {tab === "build" && (
            <motion.div key="build" variants={motionVariants.fade} initial="hidden" animate="visible" className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  aria-label="Prompt body"
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder={"Write your prompt here…\n\nTip: use {{variable}} for dynamic inputs."}
                  rows={12}
                  className={cn(
                    "input input-mono w-full resize-y text-[12px] leading-relaxed",
                    "placeholder:text-[rgba(173,252,249,0.15)] py-3"
                  )}
                />
                <span className="absolute bottom-2 right-3 font-mono text-[8px] text-[var(--text-muted)]">
                  {charCount.toLocaleString()} chars
                </span>
              </div>

              {/* Model selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                  <label className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--text-tertiary)]">
                    Target model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input input-mono text-[11px] py-1.5"
                  >
                    {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                  <label className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--text-tertiary)]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input input-mono text-[11px] py-1.5"
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* TEST */}
          {tab === "test" && (
            <motion.div key="test" variants={motionVariants.fade} initial="hidden" animate="visible">
              {body.trim()
                ? <TestPanel body={body} model={model} />
                : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <i className="ti ti-bulb text-[32px] text-[rgba(173,252,249,0.15)]" aria-hidden="true" />
                    <p className="font-body text-[13px] text-[var(--text-tertiary)]">Write a prompt first, then test it here.</p>
                    <button onClick={() => setTab("build")} className="btn btn-secondary btn-sm">Go to Build</button>
                  </div>
                )
              }
            </motion.div>
          )}

          {/* META */}
          {tab === "meta" && (
            <motion.div key="meta" variants={motionVariants.fade} initial="hidden" animate="visible" className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--text-tertiary)] block mb-1.5">
                  Tags
                </label>
                <TagInput tags={tags} onChange={setTags} />
                <p className="font-mono text-[8px] text-[var(--text-muted)] mt-1">Press Enter or comma to add</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.08)] rounded-lg">
                <div>
                  <p className="font-body text-[13px] text-[var(--text-primary)] font-medium">Public prompt</p>
                  <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-0.5">Visible to all team members</p>
                </div>
                <button
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((v) => !v)}
                  className={cn(
                    "relative w-10 h-5 rounded-full border transition-all duration-200",
                    isPublic
                      ? "bg-teal border-teal"
                      : "bg-[rgba(173,252,249,0.06)] border-[rgba(173,252,249,0.15)]"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200",
                    isPublic ? "left-[22px] bg-bg-base" : "left-0.5 bg-[rgba(173,252,249,0.4)]"
                  )} />
                </button>
              </div>

              {isEdit && (
                <div className="p-3 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.08)] rounded-lg">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-2">Version info</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Version",  `v${prompt?.version}`],
                      ["Author ID", prompt?.author_id?.slice(0, 8) + "…"],
                      ["Created",   new Date(prompt?.created_at ?? "").toLocaleDateString()],
                      ["Parent",    prompt?.parent_id ? prompt.parent_id.slice(0, 8) + "…" : "Root"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="font-mono text-[8px] text-[var(--text-muted)]">{k}</p>
                        <p className="font-mono text-[10px] text-[var(--text-secondary)]">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[rgba(173,252,249,0.07)] bg-[rgba(173,252,249,0.02)]">
        {error && (
          <p className="font-mono text-[10px] text-[#f09595] truncate flex-1">
            <i className="ti ti-alert-circle mr-1" aria-hidden="true" />{(error as Error).message}
          </p>
        )}
        {!error && <div className="flex-1" />}

        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !body.trim()}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            {isSaving
              ? <><i className="ti ti-loader-2 text-[12px] animate-spin-slow" aria-hidden="true" />Saving…</>
              : <><i className="ti ti-device-floppy text-[12px]" aria-hidden="true" />{isEdit ? "Update" : "Save prompt"}</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}
