import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Thiếu cấu hình Supabase public");
  return { url, anonKey };
}

export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside request scope (scripts, tests)
  }
  const { url, anonKey } = publicSupabaseConfig();
  const key = !cookieStore && process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY : anonKey;
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore?.getAll() ?? [],
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore?.set(name, value, options));
        } catch {
          // Server Components cannot mutate cookies. proxy.ts refreshes sessions.
        }
      },
    },
  });
}
