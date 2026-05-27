import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
