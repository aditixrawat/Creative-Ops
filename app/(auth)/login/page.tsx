"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";

type Mode = "password" | "magic";

// ── Background grid decoration ────────────────────────────────────
function GridBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* dot grid */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(173,252,249,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* top-left glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(173,252,249,0.06) 0%, transparent 70%)" }}
      />
      {/* bottom-right glow */}
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(75,100,74,0.08) 0%, transparent 70%)" }}
      />
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)]">
        {label}
      </label>
      {children}
      {error && (
        <p className="font-mono text-[10px] text-[#f09595]">
          <i className="ti ti-alert-circle mr-1" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const sb     = getSupabaseBrowser();

  const [mode,     setMode]     = useState<Mode>("password");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [magicSent,setMagicSent]= useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "magic") {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMagicSent(true);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    await sb.auth.signInWithOAuth({
      provider: "google",
      options:  { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  // ── Magic link sent state ─────────────────────────────────────
  if (magicSent) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative">
        <GridBg />
        <motion.div
          variants={motionVariants.scaleIn} initial="hidden" animate="visible"
          className="card-glass max-w-sm w-full p-8 flex flex-col items-center gap-4 text-center relative z-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-dim border border-[rgba(173,252,249,0.2)] flex items-center justify-center">
            <i className="ti ti-mail-opened text-teal text-[24px]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[18px] text-[var(--text-primary)]">Check your email</h2>
            <p className="font-body text-[13px] text-[var(--text-secondary)] mt-2">
              We sent a sign-in link to <strong className="text-teal">{email}</strong>
            </p>
          </div>
          <button
            onClick={() => { setMagicSent(false); setEmail(""); }}
            className="btn btn-ghost btn-sm"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative">
      <GridBg />

      <motion.div
        variants={motionVariants.fadeInUp} initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-sm flex flex-col gap-6"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-dim border border-[rgba(173,252,249,0.2)] flex items-center justify-center">
            <i className="ti ti-sparkles text-teal text-[18px]" aria-hidden="true" />
          </div>
          <h1 className="font-display font-black text-[24px] tracking-tight text-[var(--text-primary)]">
            CREATIVE <span className="text-teal">OPS</span>
          </h1>
          <p className="font-body text-[13px] text-[var(--text-tertiary)]">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="card-glass p-6 flex flex-col gap-5">

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            className="btn btn-ghost w-full flex items-center justify-center gap-2"
          >
            {/* Google icon SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="sep flex-1" />
            <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--text-muted)] uppercase">or</span>
            <div className="sep flex-1" />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg p-0.5 bg-[rgba(173,252,249,0.04)] border border-[rgba(173,252,249,0.08)]">
            {(["password", "magic"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={cn(
                  "flex-1 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase rounded-md transition-all duration-150",
                  mode === m
                    ? "bg-[rgba(173,252,249,0.1)] text-teal border border-[rgba(173,252,249,0.15)]"
                    : "text-[var(--text-muted)] hover:text-sage"
                )}
              >
                {m === "password" ? "Password" : "Magic Link"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Email" error={error && mode === "magic" ? error : undefined}>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                className="input text-[13px]"
              />
            </Field>

            <AnimatePresence>
              {mode === "password" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                  style={{ overflow: "hidden" }}
                >
                  <Field label="Password" error={error ?? undefined}>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        required autoComplete="current-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input text-[13px] pr-10 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        <i className={cn("ti text-[14px]", showPwd ? "ti-eye-off" : "ti-eye")} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <><i className="ti ti-loader-2 animate-spin-slow text-[14px]" aria-hidden="true" />Signing in…</>
                : mode === "magic" ? "Send magic link" : "Sign in"
              }
            </button>
          </form>

          {/* Forgot password */}
          {mode === "password" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="font-mono text-[10px] text-[var(--text-muted)] hover:text-teal transition-colors tracking-[0.08em]"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Sign up link */}
        <p className="text-center font-body text-[13px] text-[var(--text-tertiary)]">
          No account?{" "}
          <Link href="/signup" className="text-teal hover:text-[#c8fffe] transition-colors">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
