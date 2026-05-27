"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { useCampaigns }     from "@/hooks/useCampaigns";
import { usePrompts }       from "@/hooks/usePrompts";
import { useIterations }    from "@/hooks/useIterations";
import { KPICard }          from "@/components/molecules/KPICard";
import { rechartsTheme, colors } from "@/lib/design-tokens";
import { cn }               from "@/lib/utils/cn";
import { motionVariants }   from "@/lib/design-tokens";

// ── Mock time-series data (replace with real aggregation query) ───
function genWeekly(base: number, variance: number, weeks = 8) {
  const labels = ["W1","W2","W3","W4","W5","W6","W7","W8"].slice(0, weeks);
  return labels.map((week, i) => ({
    week,
    value: Math.max(0, Math.round(base + (Math.sin(i) * variance) + (i * base * 0.08))),
  }));
}

const campaignOutput  = genWeekly(12, 4);
const iterationVel    = genWeekly(8,  3);
const promptUsage     = genWeekly(30, 10);

const toolAdoption = [
  { name: "Claude Sonnet",  value: 68, fill: colors.teal    },
  { name: "Midjourney",     value: 44, fill: colors.sage    },
  { name: "Sora",           value: 28, fill: colors.forest  },
  { name: "ElevenLabs",     value: 18, fill: colors.wine    },
  { name: "Other",          value: 12, fill: "rgba(173,252,249,0.15)" },
];

const qualityRadar = [
  { subject: "Clarity",    A: 85, fullMark: 100 },
  { subject: "Creative",   A: 72, fullMark: 100 },
  { subject: "Output",     A: 91, fullMark: 100 },
  { subject: "Speed",      A: 68, fullMark: 100 },
  { subject: "Accuracy",   A: 79, fullMark: 100 },
  { subject: "Reuse",      A: 64, fullMark: 100 },
];

const statusBreakdown = [
  { status: "Live",     count: 4, fill: colors.forest  },
  { status: "Review",   count: 3, fill: colors.wine     },
  { status: "Planned",  count: 5, fill: colors.teal     },
  { status: "Draft",    count: 6, fill: "rgba(173,252,249,0.2)" },
  { status: "Complete", count: 8, fill: colors.sage     },
];

// Heatmap data (7 days × 4 weeks)
const heatData = Array.from({ length: 28 }, (_, i) => ({
  day: i % 7,
  week: Math.floor(i / 7),
  value: Math.random(),
}));
const DAY_LABELS = ["M","T","W","T","F","S","S"];
const WEEK_LABELS = ["W1","W2","W3","W4"];

// ── Custom tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip px-3 py-2 flex flex-col gap-1">
      {label && <p className="font-mono text-[9px] tracking-[0.1em] text-[var(--text-muted)] uppercase">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[11px] text-teal">{p.name && `${p.name}: `}{p.value}</p>
      ))}
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────
function ChartCard({ title, sub, children, className }: {
  title: string; sub?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div variants={motionVariants.staggerItem}
      className={cn("card-elevated p-5 flex flex-col gap-3", className)}>
      <div>
        <p className="font-display font-bold text-[13px] text-[var(--text-primary)]">{title}</p>
        {sub && <p className="font-mono text-[9px] tracking-[0.1em] text-[var(--text-muted)] uppercase mt-0.5">{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ── Date range pill ───────────────────────────────────────────────
const RANGES = ["7d","30d","90d","All"] as const;
type Range = typeof RANGES[number];

// ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");

  const { data: campaigns  = [] } = useCampaigns({ limit: 200 });
  const { data: prompts    = [] } = usePrompts({ limit: 200 });
  const { data: iterations = [] } = useIterations();

  const liveCount     = campaigns.filter(c => c.status === "live").length;
  const completeCount = campaigns.filter(c => c.status === "complete").length;
  const avgScore      = iterations.length
    ? (iterations.reduce((s, i) => s + (i.score ?? 0), 0) / iterations.length).toFixed(1)
    : "—";

  const kpis = [
    { label: "Total Campaigns",  value: campaigns.length,  delta: `${liveCount} live`,          icon: "ti-target",    index: 0 },
    { label: "Prompt Library",   value: prompts.length,    delta: "across all categories",      icon: "ti-bulb",      index: 1 },
    { label: "Iterations",       value: iterations.length, delta: "version tracked",            icon: "ti-git-branch",index: 2 },
    { label: "Avg Quality Score",value: avgScore,          delta: `out of 5 — ${completeCount} complete`, icon: "ti-star", index: 3 },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Insights</p>
          <h1 className="font-display font-black text-display-lg">
            Analytics <em className="text-teal not-italic">Dashboard</em>
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-[rgba(173,252,249,0.04)] border border-[rgba(173,252,249,0.09)] rounded-lg p-0.5">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn(
                "font-mono text-[10px] tracking-[0.08em] px-3 py-1.5 rounded-md transition-all duration-150",
                range === r ? "bg-teal-dim text-teal border border-[rgba(173,252,249,0.2)]"
                            : "text-[var(--text-muted)] hover:text-sage"
              )}>{r}</button>
          ))}
        </div>
      </motion.div>

      {/* KPI row */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => <KPICard key={k.label} {...k} />)}
        </div>
      </section>

      {/* Charts grid */}
      <motion.div
        variants={motionVariants.staggerContainer} initial="hidden" animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {/* 1. Campaign output — area */}
        <ChartCard title="Campaign Output" sub={`Weekly · ${range}`} className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={campaignOutput} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={colors.teal} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.teal} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid {...rechartsTheme.grid} />
              <XAxis dataKey="week" {...rechartsTheme.axis} />
              <YAxis {...rechartsTheme.axis} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" name="Campaigns"
                stroke={colors.teal} strokeWidth={2}
                fill="url(#tealGrad)" dot={{ r: 3, fill: colors.teal, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: colors.teal, stroke: "rgba(173,252,249,0.3)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Campaign status — donut */}
        <ChartCard title="Campaign Status" sub="Current distribution">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="count" nameKey="status"
                cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                paddingAngle={3} strokeWidth={0}>
                {statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5">
            {statusBreakdown.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.fill }} />
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">{s.status}</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">{s.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 3. Iteration velocity — bar */}
        <ChartCard title="Iteration Velocity" sub="Versions per week">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={iterationVel} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barSize={16}>
              <CartesianGrid {...rechartsTheme.grid} vertical={false} />
              <XAxis dataKey="week" {...rechartsTheme.axis} />
              <YAxis {...rechartsTheme.axis} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Iterations" radius={[3, 3, 0, 0]}>
                {iterationVel.map((_, i) => (
                  <Cell key={i} fill={
                    i === iterationVel.length - 1 ? colors.teal : `rgba(173,252,249,${0.15 + (i/iterationVel.length)*0.3})`
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. AI tool adoption — horizontal bars */}
        <ChartCard title="AI Tool Adoption" sub="% of total usage">
          <div className="flex flex-col gap-3">
            {toolAdoption.map(t => (
              <div key={t.name}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-[12px] text-[var(--text-secondary)]">{t.name}</span>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">{t.value}%</span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    style={{ background: t.fill }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.value}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* 5. Prompt usage trend — line */}
        <ChartCard title="Prompt Usage" sub={`Weekly runs · ${range}`}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={promptUsage} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid {...rechartsTheme.grid} />
              <XAxis dataKey="week" {...rechartsTheme.axis} />
              <YAxis {...rechartsTheme.axis} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" name="Runs"
                stroke={colors.sage} strokeWidth={2}
                dot={{ r: 3, fill: colors.sage, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: colors.sage }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Prompt quality radar */}
        <ChartCard title="Prompt Quality" sub="Average across 6 dimensions">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={qualityRadar} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
              <PolarGrid stroke={rechartsTheme.grid.stroke} />
              <PolarAngleAxis dataKey="subject"
                tick={{ fill: colors.text.muted, fontSize: 9, fontFamily: "'Space Mono', monospace" }} />
              <Radar name="Quality" dataKey="A" stroke={colors.teal} strokeWidth={1.5}
                fill={colors.teal} fillOpacity={0.12} />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Activity heatmap */}
        <ChartCard title="Output Heatmap" sub="Daily activity intensity" className="xl:col-span-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              {/* Week labels */}
              <div className="flex flex-col gap-1 pt-5">
                {DAY_LABELS.map(d => (
                  <span key={d} className="font-mono text-[8px] text-[var(--text-muted)] h-5 flex items-center">{d}</span>
                ))}
              </div>
              {/* Grid */}
              <div className="flex-1">
                <div className="flex gap-1 mb-1">
                  {WEEK_LABELS.map(w => (
                    <span key={w} className="font-mono text-[8px] text-[var(--text-muted)] flex-1 text-center">{w}</span>
                  ))}
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(4, 1fr)` }}>
                  {WEEK_LABELS.map((_, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {DAY_LABELS.map((_, di) => {
                        const cell = heatData.find(h => h.week === wi && h.day === di);
                        const v = cell?.value ?? 0;
                        return (
                          <motion.div
                            key={di}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: (wi * 7 + di) * 0.012 }}
                            title={`${WEEK_LABELS[wi]} ${DAY_LABELS[di]}: ${Math.round(v * 10)} activities`}
                            className="h-5 rounded-sm cursor-default transition-opacity hover:opacity-70"
                            style={{ background: `rgba(75,100,74,${v < 0.1 ? 0.07 : v * 0.9 + 0.1})` }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[8px] text-[var(--text-muted)]">Less</span>
              {[0.1,0.3,0.5,0.7,1].map(v => (
                <div key={v} className="w-4 h-4 rounded-sm" style={{ background: `rgba(75,100,74,${v})` }} />
              ))}
              <span className="font-mono text-[8px] text-[var(--text-muted)]">More</span>
            </div>
          </div>
        </ChartCard>

        {/* 8. Status trend — stacked bar */}
        <ChartCard title="Weekly Campaign Changes" sub="Status transitions over time">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={[
                { week:"W5", draft:2, live:1, complete:0 },
                { week:"W6", draft:1, live:2, complete:1 },
                { week:"W7", draft:3, live:1, complete:2 },
                { week:"W8", draft:1, live:3, complete:1 },
              ]}
              margin={{ top:4, right:0, left:-28, bottom:0 }} barSize={14}
            >
              <CartesianGrid {...rechartsTheme.grid} vertical={false} />
              <XAxis dataKey="week" {...rechartsTheme.axis} />
              <YAxis {...rechartsTheme.axis} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={rechartsTheme.legend.wrapperStyle} />
              <Bar dataKey="draft"    name="Draft"    stackId="a" fill="rgba(173,252,249,0.2)"  radius={0} />
              <Bar dataKey="live"     name="Live"     stackId="a" fill={colors.forest}           radius={0} />
              <Bar dataKey="complete" name="Complete" stackId="a" fill={colors.sage}             radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Export strip */}
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        transition={{ delay: 0.3 }}
        className="card-glass p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display font-bold text-[13px]">Export report</p>
          <p className="font-body text-[12px] text-[var(--text-tertiary)] mt-0.5">
            Download your analytics as CSV or schedule a weekly email digest.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <i className="ti ti-file-type-csv text-[13px]" aria-hidden="true" />
            CSV
          </button>
          <button className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <i className="ti ti-file-type-pdf text-[13px]" aria-hidden="true" />
            PDF
          </button>
          <button className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <i className="ti ti-mail text-[13px]" aria-hidden="true" />
            Schedule digest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
