"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { motionVariants } from "@/lib/design-tokens";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="text-center flex flex-col items-center gap-6">
        <p className="font-display font-black text-[80px] leading-none text-teal opacity-20">404</p>
        <div>
          <h1 className="font-display font-black text-[28px] text-[var(--text-primary)]">Page not found</h1>
          <p className="font-body text-[14px] text-[var(--text-tertiary)] mt-2">
            This page doesn't exist or has moved.
          </p>
        </div>
        <Link href="/dashboard" className="btn btn-primary flex items-center gap-1.5">
          <i className="ti ti-arrow-left text-[13px]" aria-hidden="true" />
          Back to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
