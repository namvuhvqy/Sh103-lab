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

  const { data: { user } } = await supabase.auth.getUser();
  const access = routeAccessLevel(request.nextUrl.pathname);
  if (access === "public") {
    if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));

  const { data: profile } = await supabase.from("profiles").select("active,is_admin").eq("user_id", user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=inactive", request.url));
  }
  if (access === "admin" && !profile.is_admin) return NextResponse.redirect(new URL("/?error=forbidden", request.url));
  return response;
}
