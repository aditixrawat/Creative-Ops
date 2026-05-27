import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * For use in:
 * - Server Components  (app/*)
 * - Route Handlers     (app/api/*)
 * - Server Actions
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:    ()     => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies are read-only, ignore
          }
        },
      },
    }
  );
}

/**
 * Service-role client — server-only, bypasses RLS.
 * Only use in trusted server contexts (cron, admin routes).
 */
export async function getSupabaseAdmin() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll:  ()     => cookieStore.getAll(),
        setAll: () => {},        // admin client never writes cookies
      },
    }
  );
}
