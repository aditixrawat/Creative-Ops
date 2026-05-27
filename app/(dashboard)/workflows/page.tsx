"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { WorkflowRow } from "@/lib/supabase/types";

type WFType = "sop" | "template" | "runbook" | "checklist";
const TYPE_CONFIG: Record<WFType, { label:string; icon:string; color:string }> = {
  sop:       { label:"SOP",       icon:"ti-list-check",    color:"text-teal"   },
  template:  { label:"Template",  icon:"ti-template",      color:"text-sage"   },
  runbook:   { label:"Runbook",   icon:"ti-book",          color:"text-[#c4a8a8]" },
  checklist: { label:"Checklist", icon:"ti-checkbox",      color:"text-forest" },
};

type Step = { order: number; title: string; description: string };

function StepEditor({ steps, onChange }: { steps: Step[]; onChange: (s: Step[]) => void }) {
  const add = () => onChange([...steps, { order: steps.length + 1, title: "", description: "" }]);
  const update = (i: number, field: keyof Step, val: string) => {
    const next = [...steps];
    (next[i] as Record<string, string | number>)[field] = field === "order" ? Number(val) : val;
    onChange(next);
  };
  const remove = (i: number) => onChange(steps.filter((_,idx) => idx !== i).map((s,idx) => ({ ...s, order: idx + 1 })));

  return (
    <div className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-2 items-start p-3 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.08)] rounded-lg">
          <div className="w-6 h-6 rounded-full bg-teal-dim flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-mono text-[9px] text-teal font-bold">{s.order}</span>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <input value={s.title} onChange={e => update(i, "title", e.target.value)}
              placeholder="Step title…"
              className="input text-[12px] py-1.5" />
            <textarea value={s.description} onChange={e => update(i, "description", e.target.value)}
              placeholder="Description (optional)…" rows={2}
              className="input text-[11px] py-1.5 resize-none leading-relaxed" />
          </div>
          <button onClick={() => remove(i)} aria-label="Remove step"
            className="btn-icon btn w-6 h-6 shrink-0 mt-0.5">
            <i className="ti ti-x text-[11px] text-[#f09595]" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[rgba(173,252,249,0.15)] text-[var(--text-muted)] hover:border-[rgba(173,252,249,0.3)] hover:text-sage transition-all duration-150 text-left">
        <i className="ti ti-plus text-[13px]" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-[0.08em]">Add step</span>
      </button>
    </div>
  );
}

function WorkflowCard({ wf, onDelete, onSelect, selected }: {
  wf: WorkflowRow; onDelete: (id:string) => void;
  onSelect: (wf: WorkflowRow) => void; selected: boolean;
}) {
  const cfg = TYPE_CONFIG[wf.type as WFType] ?? TYPE_CONFIG.sop;
  const steps = (wf.steps as Step[] ?? []);
  return (
    <motion.div variants={motionVariants.staggerItem}
      className={cn("card-elevated group flex flex-col gap-3 p-4 cursor-pointer transition-all duration-150",
        selected && "border-[rgba(173,252,249,0.3)] shadow-teal-ring")}
      onClick={() => onSelect(wf)} whileHover={{ y:-2 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <i className={cn("ti text-[18px]", cfg.icon, cfg.color)} aria-hidden="true" />
          <div>
            <p className="font-display font-bold text-[13px] text-[var(--text-primary)] leading-tight">{wf.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="tag">{cfg.label}</span>
              {wf.is_template && <span className="tag tag-sage">template</span>}
              <span className="tag">v{wf.version}</span>
            </div>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(wf.id); }}
          aria-label="Delete workflow"
          className="btn-icon btn w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="ti ti-trash text-[11px] text-[#f09595]" aria-hidden="true" />
        </button>
      </div>

      {steps.length > 0 && (
        <div className="flex flex-col gap-1">
          {steps.slice(0,3).map((s,i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgba(173,252,249,0.2)] shrink-0" />
              <span className="font-body text-[11px] text-[var(--text-tertiary)] truncate">{s.title || `Step ${s.order}`}</span>
            </div>
          ))}
          {steps.length > 3 && (
            <span className="font-mono text-[9px] text-[var(--text-muted)] pl-3.5">+{steps.length - 3} more steps</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function NewWorkflowForm({ onClose, authorId }: { onClose: () => void; authorId: string }) {
  const [title,      setTitle]      = useState("");
  const [type,       setType]       = useState<WFType>("sop");
  const [steps,      setSteps]      = useState<Step[]>([{ order:1, title:"", description:"" }]);
  const [isTemplate, setIsTemplate] = useState(false);
  const create = useCreateWorkflow();

  const handleSave = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({
      title: title.trim(), type, steps,
      tools_used: [], author_id: authorId,
      version: 1, is_template: isTemplate,
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }} className="card-elevated p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-[15px]">New workflow</p>
        <button onClick={onClose} className="btn-icon btn w-7 h-7" aria-label="Close">
          <i className="ti ti-x text-[13px]" aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Title</label>
          <input className="input text-[13px]" placeholder="Workflow name…"
            value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5 w-36">
          <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">Type</label>
          <select value={type} onChange={e => setType(e.target.value as WFType)}
            className="input input-mono text-[11px] py-2">
            {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] mb-2">Steps</p>
        <StepEditor steps={steps} onChange={setSteps} />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[rgba(173,252,249,0.07)]">
        <div className="flex items-center gap-2">
          <button role="switch" aria-checked={isTemplate} onClick={() => setIsTemplate(v => !v)}
            className={cn("relative w-9 h-4 rounded-full border transition-all duration-200",
              isTemplate ? "bg-teal border-teal" : "bg-[rgba(173,252,249,0.06)] border-[rgba(173,252,249,0.15)]")}>
            <span className={cn("absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200",
              isTemplate ? "left-[18px] bg-bg-base" : "left-0.5 bg-[rgba(173,252,249,0.4)]")} />
          </button>
          <span className="font-body text-[12px] text-[var(--text-secondary)]">Save as template</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim() || create.isPending}
            className="btn btn-primary btn-sm flex items-center gap-1.5">
            {create.isPending
              ? <><i className="ti ti-loader-2 animate-spin-slow text-[12px]" aria-hidden="true" />Saving…</>
              : <><i className="ti ti-device-floppy text-[12px]" aria-hidden="true" />Save</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkflowsPage() {
  const [typeFilter, setTypeFilter] = useState<WFType | "">("");
  const [showNew,    setShowNew]    = useState(false);
  const [selected,   setSelected]   = useState<WorkflowRow | null>(null);
  const [authorId]                  = useState(""); // populated from auth in real usage

  const { data: workflows = [], isLoading } = useWorkflows({ type: typeFilter || undefined });
  const deleteWorkflow = useDeleteWorkflow();

  return (
    <div className="flex flex-col gap-5">
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Operations</p>
          <h1 className="font-display font-black text-display-lg">
            Workflow <em className="text-teal not-italic">Docs</em>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-secondary)] mt-1">
            {isLoading ? "—" : `${workflows.length} workflows`}
          </p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className={cn("btn flex items-center gap-1.5 shrink-0", showNew ? "btn-primary" : "btn-secondary")}>
          <i className={cn("ti text-[14px]", showNew ? "ti-x" : "ti-plus")} aria-hidden="true" />
          {showNew ? "Cancel" : "New workflow"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showNew && <NewWorkflowForm onClose={() => setShowNew(false)} authorId={authorId} />}
      </AnimatePresence>

      {/* Type tabs */}
      <div className="flex gap-1 border-b border-[rgba(173,252,249,0.07)] pb-0">
        {([["","All","ti-layout-grid"], ...Object.entries(TYPE_CONFIG).map(([k,v]) => [k, v.label, v.icon])] as [string,string,string][]).map(([val,label,icon]) => (
          <button key={val} onClick={() => setTypeFilter(val as WFType | "")}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border-b-2 -mb-px transition-all duration-150",
              typeFilter === val ? "text-teal border-teal" : "text-[var(--text-muted)] border-transparent hover:text-sage"
            )}>
            <i className={cn("ti text-[12px]", icon)} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* 2-col layout: list + detail */}
      <div className={cn("grid gap-4", selected ? "grid-cols-1 lg:grid-cols-[1fr_340px]" : "grid-cols-1")}>
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
            </div>
          ) : workflows.length === 0 ? (
            <div className="card-glass flex flex-col items-center gap-4 py-20 text-center">
              <i className="ti ti-list-check text-[40px] text-[rgba(173,252,249,0.12)]" aria-hidden="true" />
              <p className="font-display font-bold text-[16px]">No workflows yet</p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)]">Document your creative SOPs and processes</p>
              <button onClick={() => setShowNew(true)} className="btn btn-primary">
                <i className="ti ti-plus" aria-hidden="true" /> Create first workflow
              </button>
            </div>
          ) : (
            <motion.div variants={motionVariants.staggerContainer} initial="hidden" animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workflows.map(wf => (
                <WorkflowCard key={wf.id} wf={wf}
                  selected={selected?.id === wf.id}
                  onSelect={setSelected}
                  onDelete={id => { deleteWorkflow.mutate(id); if (selected?.id === id) setSelected(null); }} />
              ))}
            </motion.div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (() => {
            const cfg = TYPE_CONFIG[selected.type as WFType] ?? TYPE_CONFIG.sop;
            const steps = (selected.steps as Step[] ?? []);
            return (
              <motion.div initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:12 }} transition={{ duration:0.18 }}
                className="card-glass p-5 flex flex-col gap-4 sticky top-20 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <i className={cn("ti text-[16px]", cfg.icon, cfg.color)} aria-hidden="true" />
                      <span className="tag">{cfg.label}</span>
                      {selected.is_template && <span className="tag tag-sage">template</span>}
                    </div>
                    <p className="font-display font-bold text-[15px] text-[var(--text-primary)]">{selected.title}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="btn-icon btn w-7 h-7" aria-label="Close">
                    <i className="ti ti-x text-[13px]" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <p className="eyebrow text-[8px] mb-3">Steps ({steps.length})</p>
                  <div className="flex flex-col gap-0 relative">
                    {/* Vertical line */}
                    {steps.length > 1 && (
                      <div className="absolute left-3 top-6 bottom-6 w-px bg-[rgba(173,252,249,0.08)]" />
                    )}
                    {steps.map((s, i) => (
                      <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                        <div className="w-6 h-6 rounded-full bg-teal-dim border border-[rgba(173,252,249,0.2)] flex items-center justify-center shrink-0 z-10">
                          <span className="font-mono text-[8px] font-bold text-teal">{s.order}</span>
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="font-body text-[13px] font-medium text-[var(--text-primary)]">
                            {s.title || `Step ${s.order}`}
                          </p>
                          {s.description && (
                            <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-1 leading-relaxed">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
