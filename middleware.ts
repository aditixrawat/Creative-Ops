import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/signup", "/auth/callback"];

/** Routes that require admin role */
const ADMIN_ROUTES  = ["/analytics", "/settings/billing", "/settings/team"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/public")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  ()      => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — required on every request for SSR auth
  const { data: { user } } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // ── Unauthenticated → redirect to login ──
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated + visiting auth pages → redirect to dashboard ──
  if (user && isPublicRoute) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(dashUrl);
  }

  // ── Admin-only routes → check role ──
  if (user && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
