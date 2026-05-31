import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

/** Routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/signup", "/auth/callback"];

/** Routes that require admin role */
const ADMIN_ROUTES = ["/analytics", "/settings/billing", "/settings/team"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Pass through public assets immediately
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/public")
  ) {
    return NextResponse.next();
  }

  // 2. Cookie check bypass for performance
  // If there are no Supabase cookies, the user is guaranteed to be logged out.
  // We can skip the expensive network call to Supabase.
  const hasAuthCookie = request.cookies.getAll().some((cookie) => 
    cookie.name.startsWith("sb-") || cookie.name.includes("auth-token")
  );

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // If no auth cookie and it is a public route, just proceed instantly.
  if (!hasAuthCookie && isPublicRoute) {
    return NextResponse.next();
  }

  // If no auth cookie and trying to access protected route, redirect to login instantly.
  if (!hasAuthCookie && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Initialize Supabase Server Client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          toSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 4. Securely fetch user (getUser does server-side JWT verification, getSession does not)
  let user = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch (err) {
    console.error("Supabase auth check failed in middleware (network offline?):", err);
  }

  // 5. Unauthenticated → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Authenticated + visiting auth pages → redirect to dashboard
  if (user && isPublicRoute) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(dashUrl);
  }

  // 7. Admin-only routes → check role
  if (user && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    try {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      const profile = data as any;

      if (profile?.role !== "admin") {
        const dashUrl = request.nextUrl.clone();
        dashUrl.pathname = "/dashboard";
        return NextResponse.redirect(dashUrl);
      }
    } catch (err) {
      console.error("Admin role check failed in middleware:", err);
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashUrl);
    }
  }

  return response;
}

export const config = {
  // Enhanced matcher to exclude all static assets like images, SVGs, css, fonts, etc.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)).*)",
  ],
};
