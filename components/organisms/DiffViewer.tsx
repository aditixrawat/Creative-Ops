"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type DiffOp = { type: "eq" | "add" | "del"; text: string };
type LineDiff = { old: string | null; new: string | null; status: "eq" | "changed" | "add" | "del" };

function wordDiff(a: string, b: string): DiffOp[] {
  const aw = a.split(/(\s+)/), bw = b.split(/(\s+)/);
  const m = aw.length, n = bw.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = aw[i] === bw[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const ops: DiffOp[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && aw[i] === bw[j])                                   { ops.push({ type: "eq",  text: aw[i] }); i++; j++; }
    else if (j < n && (i >= m || dp[i][j+1] >= dp[i+1][j]))                  { ops.push({ type: "add", text: bw[j] }); j++; }
    else                                                                       { ops.push({ type: "del", text: aw[i] }); i++; }
  }
  return ops;
}

function lineDiff(a: string, b: string): LineDiff[] {
  const al = a.split("\n"), bl = b.split("\n");
  const m = al.length, n = bl.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = al[i] === bl[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const result: LineDiff[] = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    if      (i < m && j < n && al[i] === bl[j])                              { result.push({ old: al[i], new: bl[j], status: "eq" }); i++; j++; }
    else if (j < n && (i >= m || dp[i][j+1] >= dp[i+1][j]))                  { result.push({ old: null,  new: bl[j], status: "add" }); j++; }
    else if (i < m && (j >= n || dp[i+1][j] >  dp[i][j+1]))                  { result.push({ old: al[i], new: null,  status: "del" }); i++; }
    else                                                                       { result.push({ old: al[i], new: bl[j], status: "changed" }); i++; j++; }
  }
  return result;
}

function InlineDiff({ a, b }: { a: string; b: string }) {
  const ops = useMemo(() => wordDiff(a, b), [a, b]);
  return (
    <span>
      {ops.map((op, i) => (
        <span key={i} className={cn(
          op.type === "add" && "bg-[rgba(75,100,74,0.35)] text-teal rounded-sm px-0.5",
          op.type === "del" && "bg-[rgba(52,28,28,0.4)] text-[#f09595] line-through rounded-sm px-0.5 opacity-70",
        )}>{op.text}</span>
      ))}
    </span>
  );
}

function DiffStats({ lines }: { lines: LineDiff[] }) {
  const add = lines.filter(l => l.status === "add"     || l.status === "changed").length;
  const del = lines.filter(l => l.status === "del"     || l.status === "changed").length;
  const eq  = lines.filter(l => l.status === "eq").length;
  const t   = lines.length || 1;
  return (
    <div className="flex items-center gap-3 flex-wrap flex-1">
      <div className="flex h-1.5 flex-1 min-w-[80px] rounded-full overflow-hidden bg-[rgba(173,252,249,0.06)]">
        <div className="h-full bg-[rgba(75,100,74,0.7)]"   style={{ width: `${(add/t)*100}%` }} />
        <div className="h-full bg-[rgba(173,252,249,0.15)]" style={{ width: `${(eq /t)*100}%` }} />
        <div className="h-full bg-[rgba(240,149,149,0.5)]" style={{ width: `${(del/t)*100}%` }} />
      </div>
      <span className="font-mono text-[9px] text-[#89a894]">+{add}</span>
      <span className="font-mono text-[9px] text-[rgba(173,252,249,0.3)]">{eq} same</span>
      <span className="font-mono text-[9px] text-[#f09595]">-{del}</span>
    </div>
  );
}

function SideBySide({ lines }: { lines: LineDiff[] }) {
  const bg: Record<LineDiff["status"], string> = { eq: "transparent", add: "rgba(75,100,74,0.12)", del: "rgba(52,28,28,0.22)", changed: "rgba(173,252,249,0.03)" };
  const bl: Record<LineDiff["status"], string> = { eq: "transparent", add: "rgba(75,100,74,0.5)",  del: "rgba(240,149,149,0.35)", changed: "rgba(173,252,249,0.12)" };
  const Row = ({ content, side, status, lineNum }: { content: string | null; side: "old"|"new"; status: LineDiff["status"]; lineNum: number; otherContent?: string | null }) => {
    const active = side === "old" ? (status === "del" || status === "changed") : (status === "add" || status === "changed");
    return (
      <div className="flex items-start gap-2 px-3 py-0.5 min-h-[22px]"
        style={{ background: active ? bg[status] : "transparent", borderLeft: `2px solid ${active ? bl[status] : "transparent"}` }}>
        <span className="font-mono text-[8px] text-[var(--text-muted)] w-5 text-right shrink-0 select-none leading-relaxed pt-0.5">{lineNum + 1}</span>
        <pre className="font-mono text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words min-w-0 flex-1">
          {content ?? ""}
        </pre>
      </div>
    );
  };
  return (
    <div className="grid grid-cols-2 divide-x divide-[rgba(173,252,249,0.06)]">
      <div>
        <div className="sticky top-0 px-3 py-1 bg-bg-layer2 border-b border-[rgba(173,252,249,0.07)]">
          <span className="font-mono text-[8px] tracking-[0.14em] text-[rgba(240,149,149,0.55)] uppercase">Before</span>
        </div>
        {lines.map((l, i) => <Row key={i} content={l.old} side="old" status={l.status} lineNum={i} />)}
      </div>
      <div>
        <div className="sticky top-0 px-3 py-1 bg-bg-layer2 border-b border-[rgba(173,252,249,0.07)]">
          <span className="font-mono text-[8px] tracking-[0.14em] text-[rgba(173,252,249,0.55)] uppercase">After</span>
        </div>
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-0.5 min-h-[22px]"
            style={{ background: (l.status==="add"||l.status==="changed") ? bg[l.status] : "transparent", borderLeft: `2px solid ${(l.status==="add"||l.status==="changed") ? bl[l.status] : "transparent"}` }}>
            <span className="font-mono text-[8px] text-[var(--text-muted)] w-5 text-right shrink-0 select-none leading-relaxed pt-0.5">{i+1}</span>
            <pre className="font-mono text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words min-w-0 flex-1">
              {l.status === "changed" && l.old && l.new ? <InlineDiff a={l.old} b={l.new} /> : (l.new ?? "")}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function Unified({ lines }: { lines: LineDiff[] }) {
  return (
    <div>
      {lines.map((l, i) => {
        if (l.status === "eq") return (
          <div key={i} className="flex gap-2 px-3 py-0.5">
            <span className="font-mono text-[8px] text-[var(--text-muted)] w-4 shrink-0 select-none pt-0.5"> </span>
            <pre className="font-mono text-[10px] text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap break-words flex-1">{l.old}</pre>
          </div>
        );
        if (l.status === "del") return (
          <div key={i} className="flex gap-2 px-3 py-0.5 bg-[rgba(52,28,28,0.22)] border-l-2 border-[rgba(240,149,149,0.4)]">
            <span className="font-mono text-[8px] text-[rgba(240,149,149,0.5)] w-4 shrink-0 select-none pt-0.5">-</span>
            <pre className="font-mono text-[10px] text-[#f09595] leading-relaxed whitespace-pre-wrap break-words flex-1 line-through opacity-70">{l.old}</pre>
          </div>
        );
        if (l.status === "add") return (
          <div key={i} className="flex gap-2 px-3 py-0.5 bg-[rgba(75,100,74,0.12)] border-l-2 border-[rgba(75,100,74,0.5)]">
            <span className="font-mono text-[8px] text-[rgba(173,252,249,0.5)] w-4 shrink-0 select-none pt-0.5">+</span>
            <pre className="font-mono text-[10px] text-teal leading-relaxed whitespace-pre-wrap break-words flex-1">{l.new}</pre>
          </div>
        );
        return (
          <div key={i}>
            <div className="flex gap-2 px-3 py-0.5 bg-[rgba(52,28,28,0.18)] border-l-2 border-[rgba(240,149,149,0.3)]">
              <span className="font-mono text-[8px] text-[rgba(240,149,149,0.5)] w-4 shrink-0 pt-0.5">-</span>
              <pre className="font-mono text-[10px] text-[#f09595] leading-relaxed whitespace-pre-wrap break-words flex-1 line-through opacity-70">{l.old}</pre>
            </div>
            <div className="flex gap-2 px-3 py-0.5 bg-[rgba(75,100,74,0.10)] border-l-2 border-[rgba(75,100,74,0.4)]">
              <span className="font-mono text-[8px] text-[rgba(173,252,249,0.5)] w-4 shrink-0 pt-0.5">+</span>
              <pre className="font-mono text-[10px] text-teal leading-relaxed whitespace-pre-wrap break-words flex-1">
                {l.old && l.new ? <InlineDiff a={l.old} b={l.new} /> : l.new}
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type DiffMode = "side" | "unified";
interface Props { oldContent: string; newContent: string; defaultMode?: DiffMode; maxHeight?: string; }

export function DiffViewer({ oldContent, newContent, defaultMode = "side", maxHeight = "480px" }: Props) {
  const [mode, setMode] = useState<DiffMode>(defaultMode);
  const lines = useMemo(() => lineDiff(oldContent, newContent), [oldContent, newContent]);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card-elevated flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[rgba(173,252,249,0.07)] bg-[rgba(173,252,249,0.02)] shrink-0">
        <DiffStats lines={lines} />
        <div className="flex items-center gap-1 shrink-0">
          {(["side","unified"] as DiffMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} className={cn(
              "font-mono text-[9px] tracking-[0.08em] uppercase px-2.5 py-1 rounded transition-all",
              mode === m ? "bg-teal-dim text-teal border border-[rgba(173,252,249,0.2)]" : "text-[var(--text-muted)] hover:text-sage"
            )}>{m === "side" ? "Side by side" : "Unified"}</button>
          ))}
        </div>
      </div>
      <div className="overflow-auto text-[var(--text-secondary)]" style={{ maxHeight }}>
        {mode === "side" ? <SideBySide lines={lines} /> : <Unified lines={lines} />}
      </div>
    </motion.div>
  );
}
