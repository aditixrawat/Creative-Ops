import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { staggerDelay } from "@/lib/design-tokens";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  icon?: string;
  /** Index in a staggered list — adds animation delay */
  index?: number;
  className?: string;
}

export function KPICard({
  label,
  value,
  delta,
  deltaUp = true,
  icon,
  index = 0,
  className,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1], delay: staggerDelay(index) }}
      className={cn(
        "card-glass p-4 flex flex-col gap-1",
        "border-t-2 border-t-[rgba(173,252,249,0.20)]",
        "hover:border-t-teal hover:shadow-teal-ring transition-all duration-200",
        className
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-[var(--text-tertiary)]">
          {label}
        </span>
        {icon && (
          <i className={cn("ti text-[15px] text-[rgba(173,252,249,0.30)]", icon)} aria-hidden="true" />
        )}
      </div>

      {/* Value */}
      <p className="metric-val text-[28px]">{value}</p>

      {/* Delta */}
      {delta && (
        <p className={cn("metric-delta text-[10px]", !deltaUp && "down")}>
          {deltaUp ? "↑" : "↓"} {delta}
        </p>
      )}
    </motion.div>
  );
}
