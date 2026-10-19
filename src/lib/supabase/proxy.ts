import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routeAccessLevel } from "@/lib/auth/access";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.redirect(new URL("/login?error=config", request.url));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let user = null;
  let authError: any = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
    authError = res.error;
  } catch (err: any) {
    authError = err;
  }

  // Handle invalid/deleted refresh token gracefully: clear cookies and redirect to login
  const hasSbCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  const isInvalidRefreshToken = hasSbCookies && authError && (
    typeof authError.message === "string" && (
      authError.message.includes("Refresh Token Not Found") ||
      authError.message.includes("Invalid Refresh Token") ||
      authError.message.includes("refresh_token_not_found")
    )
  );

  if (isInvalidRefreshToken && request.nextUrl.pathname !== "/login") {
    const redirectResponse = NextResponse.redirect(new URL("/login?error=session_expired", request.url));
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });
    return redirectResponse;
  }

  const access = routeAccessLevel(request.nextUrl.pathname);
  if (access === "public") {
    if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  // API endpoints should never be redirected to HTML /login page (avoids HTTP 405 on POST)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));

  // Fast path for standard authenticated routes: session is valid, defer granular profile to getCurrentAccess()
  // Only query profiles in middleware for admin routes to guard /admin/*
  if (access === "admin") {
    const { data: profile } = await supabase.from("profiles").select("active,is_admin").eq("user_id", user.id).maybeSingle();
    if (!profile?.active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=inactive", request.url));
    }
    if (!profile.is_admin) return NextResponse.redirect(new URL("/?error=forbidden", request.url));
  }

  return response;
}
