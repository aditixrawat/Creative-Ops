"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { motionVariants } from "@/lib/design-tokens";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div variants={motionVariants.scaleIn} initial="hidden" animate="visible"
        className="card-glass max-w-sm w-full p-8 text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(52,28,28,0.5)] border border-[rgba(52,28,28,0.8)] flex items-center justify-center">
          <i className="ti ti-alert-triangle text-[#f09595] text-[24px]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display font-bold text-[18px] text-[var(--text-primary)]">Something went wrong</h2>
          <p className="font-mono text-[10px] text-[var(--text-muted)] mt-2 break-all">{error.message}</p>
        </div>
        <button onClick={reset} className="btn btn-primary w-full justify-center">Try again</button>
      </motion.div>
    </div>
  );
}
