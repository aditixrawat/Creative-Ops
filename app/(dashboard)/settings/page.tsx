"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { motionVariants } from "@/lib/design-tokens";
import type { UserRole, UserRow } from "@/lib/supabase/types";

type SettingsTab = "profile" | "team" | "integrations" | "danger";
const TABS: { key: SettingsTab; label: string; icon: string }[] = [
  { key:"profile",      label:"Profile",      icon:"ti-user"        },
  { key:"team",         label:"Team",         icon:"ti-users"       },
  { key:"integrations", label:"Integrations", icon:"ti-plug"        },
  { key:"danger",       label:"Danger zone",  icon:"ti-alert-circle"},
];

const ROLE_CONFIG: Record<UserRole, { label:string; desc:string }> = {
  strategist: { label:"Strategist",  desc:"Manage campaigns, prompts & analytics" },
  ai_intern:  { label:"AI Intern",   desc:"Create & test prompts, view campaigns" },
  admin:      { label:"Admin",       desc:"Full access + team & billing"          },
};

function Field({ label, hint, children }: { label:string; hint?:string; children:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</label>
      {children}
      {hint && <p className="font-mono text-[9px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div className="card-elevated p-5 flex flex-col gap-5">
      <p className="font-display font-bold text-[14px] text-[var(--text-primary)] border-b border-[rgba(173,252,249,0.07)] pb-3">{title}</p>
      {children}
    </div>
  );
}

function SaveBtn({ loading, dirty }: { loading:boolean; dirty:boolean }) {
  return (
    <button type="submit" disabled={!dirty || loading}
      className="btn btn-primary btn-sm self-start flex items-center gap-1.5">
      {loading
        ? <><i className="ti ti-loader-2 animate-spin-slow text-[12px]" aria-hidden="true" />Saving…</>
        : <><i className="ti ti-device-floppy text-[12px]" aria-hidden="true" />Save changes</>}
    </button>
  );
}

const INTEGRATIONS = [
  { id:"notion",  name:"Notion",       icon:"ti-brand-notion",  desc:"Sync campaign briefs and docs",   connected:false },
  { id:"gdrive",  name:"Google Drive", icon:"ti-brand-google",  desc:"Attach assets from Drive",        connected:true  },
  { id:"slack",   name:"Slack",        icon:"ti-brand-slack",   desc:"Get notified on campaign updates",connected:false },
  { id:"figma",   name:"Figma",        icon:"ti-brand-figma",   desc:"Link design files to campaigns",  connected:false },
];

export default function SettingsPage() {
  const router  = useRouter();
  const sb      = getSupabaseBrowser();
  const [tab,   setTab]   = useState<SettingsTab>("profile");
  const [user,  setUser]  = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState<UserRole>("strategist");
  const dirty = user ? (fullName !== user.full_name || role !== user.role) : false;

  useEffect(() => {
    sb.auth.getUser().then(async ({ data }: any) => {
      if (!data.user) return;
      const { data: profile } = await sb.from("users").select("*").eq("id", data.user.id).single();
      if (profile) {
        setUser(profile as UserRow);
        setFullName(profile.full_name ?? "");
        setEmail(data.user.email ?? "");
        setRole(profile.role as UserRole);
      }
    });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await sb.from("users").update({ full_name: fullName, role }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await sb.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    await sb.auth.admin?.deleteUser(user.id).catch(() => {});
    await sb.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <motion.div variants={motionVariants.fadeInUp} initial="hidden" animate="visible">
        <p className="eyebrow mb-2">Configuration</p>
        <h1 className="font-display font-black text-display-lg">Settings</h1>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[rgba(173,252,249,0.07)]">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase px-3 py-2 border-b-2 -mb-px transition-all",
              tab === t.key
                ? t.key === "danger" ? "text-[#f09595] border-[#f09595]" : "text-teal border-teal"
                : "text-[var(--text-muted)] border-transparent hover:text-sage"
            )}>
            <i className={cn("ti text-[12px]", t.icon)} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} variants={motionVariants.fade} initial="hidden" animate="visible"
        className="flex flex-col gap-4">

        {/* ── Profile ── */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <SectionCard title="Personal information">
              <Field label="Full name">
                <input className="input text-[13px]" value={fullName}
                  onChange={e => setFullName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Email" hint="Email changes require verification">
                <input className="input text-[13px] opacity-60 cursor-not-allowed" value={email} readOnly />
              </Field>
            </SectionCard>

            <SectionCard title="Role">
              <div className="flex flex-col gap-2">
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => setRole(k as UserRole)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150",
                      role === k
                        ? "bg-teal-dim border-[rgba(173,252,249,0.25)] shadow-teal-ring"
                        : "bg-[rgba(173,252,249,0.02)] border-[rgba(173,252,249,0.08)] hover:border-[rgba(173,252,249,0.16)]"
                    )}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0", role === k ? "bg-teal" : "bg-[rgba(173,252,249,0.2)]")} />
                    <div className="flex-1">
                      <p className={cn("font-body font-medium text-[13px]", role === k ? "text-teal" : "text-[var(--text-primary)]")}>{v.label}</p>
                      <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-0.5">{v.desc}</p>
                    </div>
                    {role === k && <i className="ti ti-circle-check text-teal text-[15px]" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </SectionCard>

            <div className="flex items-center gap-3">
              <SaveBtn loading={saving} dirty={dirty} />
              {saved && (
                <motion.span initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }}
                  className="font-mono text-[10px] text-forest flex items-center gap-1">
                  <i className="ti ti-circle-check text-[12px]" aria-hidden="true" />Saved
                </motion.span>
              )}
            </div>
          </form>
        )}

        {/* ── Team ── */}
        {tab === "team" && (
          <SectionCard title="Team members">
            <p className="font-body text-[13px] text-[var(--text-tertiary)]">
              Team management is available on the Team and Enterprise plans.
            </p>
            <div className="card-glass p-8 flex flex-col items-center gap-3 text-center">
              <i className="ti ti-users text-[32px] text-[rgba(173,252,249,0.15)]" aria-hidden="true" />
              <p className="font-display font-bold text-[15px] text-[var(--text-primary)]">Invite your team</p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)] max-w-xs">
                Add strategists, AI interns, and admins to collaborate on campaigns and prompts.
              </p>
              <button className="btn btn-primary btn-sm flex items-center gap-1.5">
                <i className="ti ti-user-plus text-[12px]" aria-hidden="true" />Invite member
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── Integrations ── */}
        {tab === "integrations" && (
          <SectionCard title="Connected integrations">
            <div className="flex flex-col gap-3">
              {INTEGRATIONS.map(intg => (
                <div key={intg.id}
                  className="flex items-center justify-between gap-4 p-3 bg-[rgba(173,252,249,0.03)] border border-[rgba(173,252,249,0.08)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(173,252,249,0.06)] border border-[rgba(173,252,249,0.1)] flex items-center justify-center">
                      <i className={cn("ti text-[20px]", intg.icon, intg.connected ? "text-teal" : "text-[var(--text-muted)]")} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-body font-medium text-[13px] text-[var(--text-primary)]">{intg.name}</p>
                      <p className="font-body text-[11px] text-[var(--text-tertiary)]">{intg.desc}</p>
                    </div>
                  </div>
                  <button className={cn("btn btn-sm shrink-0",
                    intg.connected ? "btn-ghost text-[#f09595]" : "btn-secondary")}>
                    {intg.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Danger zone ── */}
        {tab === "danger" && (
          <div className="flex flex-col gap-4">
            <SectionCard title="Sign out">
              <p className="font-body text-[13px] text-[var(--text-tertiary)]">Sign out of your account on this device.</p>
              <button onClick={handleSignOut} className="btn btn-wine self-start flex items-center gap-1.5">
                <i className="ti ti-logout text-[13px]" aria-hidden="true" />Sign out
              </button>
            </SectionCard>

            <div className="card-elevated border border-[rgba(52,28,28,0.6)] p-5 flex flex-col gap-4">
              <p className="font-display font-bold text-[14px] text-[#f09595] border-b border-[rgba(52,28,28,0.5)] pb-3">
                Delete account
              </p>
              <p className="font-body text-[13px] text-[var(--text-tertiary)]">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <Field label={`Type DELETE to confirm`}>
                <input className="input text-[13px] border-[rgba(52,28,28,0.6)] focus:border-[rgba(240,149,149,0.4)]"
                  value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE" />
              </Field>
              <button
                disabled={deleteConfirm !== "DELETE"}
                onClick={handleDeleteAccount}
                className="btn btn-danger self-start flex items-center gap-1.5">
                <i className="ti ti-trash text-[13px]" aria-hidden="true" />Delete account forever
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
