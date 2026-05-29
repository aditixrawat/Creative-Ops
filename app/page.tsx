import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function RootPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (user) redirect("/dashboard");
  redirect("/login");
}
