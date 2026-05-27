"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/supabase/types";

type Prompt = Database["public"]["Tables"]["prompts"]["Row"];

interface PromptCardProps {
  prompt: Prompt;
  onClone?: (id: string) => void;
  onFavourite?: (id: string) => void;
  index?: number;
}

const MODEL_LABEL: Record<string, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-6":   "Opus 4.6",
  "gpt-4o":            "GPT-4o",
  "gemini-1.5-pro":    "Gemini 1.5",
};

export function PromptCard({ prompt, onClone, onFavourite, index = 0 }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const modelLabel = MODEL_LABEL[prompt.model_target ?? ""] ?? prompt.model_target ?? "—";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1], delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      className={cn(
        "card-elevated group flex flex-col gap-3 p-4",
        "cursor-pointer focus-within:shadow-teal-ring"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display font-bold text-[14px] text-[var(--text-primary)] leading-tight truncate-1">
            {prompt.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {prompt.category && (
              <span className="tag tag-teal">{prompt.category}</span>
            )}
            <span className="tag">{modelLabel}</span>
            <span className="tag">v{prompt.version}</span>
            {prompt.is_public && <span className="tag tag-sage">public</span>}
          </div>
        </div>

        {/* Favourite */}
        <button
          aria-label="Favourite prompt"
          onClick={(e) => { e.stopPropagation(); onFavourite?.(prompt.id); }}
          className="btn-icon btn w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <i className="ti ti-star text-[14px]" aria-hidden="true" />
        </button>
      </div>

      {/* Body preview */}
      <p className="font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)] truncate-3 bg-[rgba(173,252,249,0.03)] rounded-md px-3 py-2 border border-[rgba(173,252,249,0.06)]">
        {prompt.body}
      </p>

      {/* Tags */}
      {Array.isArray(prompt.tags) && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(prompt.tags as string[]).slice(0, 4).map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
          {(prompt.tags as string[]).length > 4 && (
            <span className="tag">+{(prompt.tags as string[]).length - 4}</span>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(173,252,249,0.06)]">
        <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--text-muted)] uppercase">
          {new Date(prompt.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            aria-label="Copy prompt"
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="btn btn-sm flex items-center gap-1"
          >
            <i className={cn("ti text-[12px]", copied ? "ti-check text-forest" : "ti-copy")} aria-hidden="true" />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            aria-label="Clone prompt"
            onClick={(e) => { e.stopPropagation(); onClone?.(prompt.id); }}
            className="btn btn-sm flex items-center gap-1"
          >
            <i className="ti ti-git-fork text-[12px]" aria-hidden="true" />
            Clone
          </button>
        </div>
      </div>
    </motion.article>
  );
}
