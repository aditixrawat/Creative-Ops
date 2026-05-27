"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { UserRole } from "@/lib/supabase/types";

// ── Same BG decoration ────────────────────────────────────────────
function GridBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(rgba(173,252,249,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(173,252,249,0.05) 0%, transparent 70%)" }}
      />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(73,57,59,0.1) 0%, transparent 70%)" }}
      />
    </div>
  );
}

function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)]">{label}</label>
      {children}
      {hint && !error && <p className="font-mono text-[9px] text-[var(--text-muted)]">{hint}</p>}
      {error && <p className="font-mono text-[10px] text-[#f09595]"><i className="ti ti-alert-circle mr-1" aria-hidden="true" />{error}</p>}
    </div>
  );
}

const ROLES: { value: UserRole; label: string; desc: string; icon: string }[] = [
  { value: "strategist", label: "Strategist",  desc: "Full access — manage campaigns, prompts & analytics", icon: "ti-target"   },
  { value: "ai_intern",  label: "AI Intern",   desc: "Create & test prompts, view campaigns",               icon: "ti-robot"    },
  { value: "admin",      label: "Admin",        desc: "Everything + team management & billing",             icon: "ti-shield"   },
];

// ── Multi-step form ───────────────────────────────────────────────
type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const sb     = getSupabaseBrowser();

  const [step,      setStep]      = useState<Step>(1);
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [role,      setRole]      = useState<UserRole>("strategist");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [done,      setDone]      = useState(false);

  const pwdStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  const pwdColors  = ["", "#f09595", "#c4a8a8", "#adfcf9", "#4b644a"];
  const pwdLabels  = ["", "Weak", "Fair", "Good", "Strong"];

  const handleGoogleSignup = async () => {
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { setStep((s) => (s + 1) as Step); return; }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await sb.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (signUpError) throw signUpError;

      // Upsert profile row
      if (data.user) {
        await sb.from("users").upsert({
          id: data.user.id, email, full_name: fullName, role,
        });
      }

      setDone(true);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Done ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative">
        <GridBg />
        <motion.div
          variants={motionVariants.scaleIn} initial="hidden" animate="visible"
          className="card-glass max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center relative z-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-dim border border-[rgba(173,252,249,0.2)] flex items-center justify-center">
            <i className="ti ti-circle-check text-teal text-[26px]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[20px] text-[var(--text-primary)]">You're in, {fullName.split(" ")[0]}!</h2>
            <p className="font-body text-[13px] text-[var(--text-secondary)] mt-2">
              Check <strong className="text-teal">{email}</strong> to confirm your account, then sign in.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary w-full justify-center">Go to sign in</Link>
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
        {/* Logo + step indicator */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-dim border border-[rgba(173,252,249,0.2)] flex items-center justify-center">
            <i className="ti ti-sparkles text-teal text-[18px]" aria-hidden="true" />
          </div>
          <h1 className="font-display font-black text-[22px] tracking-tight text-[var(--text-primary)]">
            Join <span className="text-teal">Creative Ops</span>
          </h1>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} className={cn(
                "h-1 rounded-full transition-all duration-300",
                step === s ? "w-6 bg-teal" : step > s ? "w-3 bg-forest" : "w-3 bg-[rgba(173,252,249,0.15)]"
              )} />
            ))}
          </div>
          <p className="font-mono text-[9px] tracking-[0.15em] text-[var(--text-muted)] uppercase">
            Step {step} of 3 —{" "}
            {step === 1 ? "Account details" : step === 2 ? "Set password" : "Choose your role"}
          </p>
        </div>

        {/* Card */}
        <div className="card-glass p-6">
          {/* Google on step 1 only */}
          <AnimatePresence>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="mb-5 flex flex-col gap-4"
              >
                <button type="button" onClick={handleGoogleSignup}
                  className="btn btn-ghost w-full flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="sep flex-1" />
                  <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--text-muted)] uppercase">or</span>
                  <div className="sep flex-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <AnimatePresence mode="wait">

              {/* Step 1 — name + email */}
              {step === 1 && (
                <motion.div key="step1" variants={motionVariants.fade} initial="hidden" animate="visible"
                  className="flex flex-col gap-4">
                  <Field label="Full name">
                    <input type="text" required autoFocus
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aria Kim" className="input text-[13px]" />
                  </Field>
                  <Field label="Work email">
                    <input type="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="aria@agency.com" className="input text-[13px]" />
                  </Field>
                </motion.div>
              )}

              {/* Step 2 — password */}
              {step === 2 && (
                <motion.div key="step2" variants={motionVariants.fade} initial="hidden" animate="visible"
                  className="flex flex-col gap-4">
                  <Field
                    label="Password"
                    hint="Min 8 chars, include uppercase, number & symbol"
                    error={error ?? undefined}
                  >
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"} required autoFocus
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="input text-[13px] pr-10 w-full"
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal"
                        aria-label={showPwd ? "Hide" : "Show"}>
                        <i className={cn("ti text-[14px]", showPwd ? "ti-eye-off" : "ti-eye")} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>

                  {/* Strength meter */}
                  {password && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((n) => (
                          <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: n <= pwdStrength ? pwdColors[pwdStrength] : "rgba(173,252,249,0.08)" }}
                          />
                        ))}
                      </div>
                      <p className="font-mono text-[9px]" style={{ color: pwdColors[pwdStrength] }}>
                        {pwdLabels[pwdStrength]}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3 — role */}
              {step === 3 && (
                <motion.div key="step3" variants={motionVariants.fade} initial="hidden" animate="visible"
                  className="flex flex-col gap-3">
                  <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)]">Your role</p>
                  {ROLES.map((r) => (
                    <button
                      key={r.value} type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150",
                        role === r.value
                          ? "bg-teal-dim border-[rgba(173,252,249,0.3)] shadow-teal-ring"
                          : "bg-[rgba(173,252,249,0.02)] border-[rgba(173,252,249,0.08)] hover:border-[rgba(173,252,249,0.18)]"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                        role === r.value ? "bg-[rgba(173,252,249,0.15)]" : "bg-[rgba(173,252,249,0.06)]"
                      )}>
                        <i className={cn("ti text-[16px]", r.icon, role === r.value ? "text-teal" : "text-[var(--text-muted)]")} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={cn("font-display font-bold text-[13px]", role === r.value ? "text-teal" : "text-[var(--text-primary)]")}>
                          {r.label}
                        </p>
                        <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-snug">{r.desc}</p>
                      </div>
                      {role === r.value && (
                        <i className="ti ti-circle-check text-teal text-[16px] ml-auto shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                  {error && (
                    <p className="font-mono text-[10px] text-[#f09595]">
                      <i className="ti ti-alert-circle mr-1" aria-hidden="true" />{error}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep((s) => (s - 1) as Step)}
                  className="btn btn-ghost btn-sm flex items-center gap-1">
                  <i className="ti ti-arrow-left text-[12px]" aria-hidden="true" />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading || (step === 1 && (!fullName.trim() || !email.trim())) || (step === 2 && password.length < 6)}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><i className="ti ti-loader-2 animate-spin-slow text-[14px]" aria-hidden="true" />Creating…</>
                  : step < 3
                    ? <><span>Continue</span><i className="ti ti-arrow-right text-[13px]" aria-hidden="true" /></>
                    : "Create account"
                }
              </button>
            </div>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center font-body text-[13px] text-[var(--text-tertiary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-teal hover:text-[#c8fffe] transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
