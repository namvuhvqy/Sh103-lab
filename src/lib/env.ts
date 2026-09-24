export interface EnvConfig {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

export function validateEnv(env: Record<string, string | undefined>): EnvConfig {
  const appName = env.NEXT_PUBLIC_APP_NAME || "SH103 Lab";
  const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (env.NEXT_PUBLIC_APP_NAME !== undefined && env.NEXT_PUBLIC_APP_NAME.trim() === "") {
    throw new Error("NEXT_PUBLIC_APP_NAME cannot be empty string");
  }

  return {
    NEXT_PUBLIC_APP_NAME: appName,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export const env = validateEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
