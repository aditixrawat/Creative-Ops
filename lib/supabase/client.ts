import { createBrowserClient } from "@supabase/ssr";

let client: any = null;

/** Singleton browser client — safe to call anywhere in client components */
export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
