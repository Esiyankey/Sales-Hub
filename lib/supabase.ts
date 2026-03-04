// lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

/**
 * IMPORTANT: Before using this file, you MUST set up environment variables:
 *
 * Create a .env.local file in the root of your project with:
 *
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 * SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for server-side operations)
 *
 * Get these from your Supabase project dashboard:
 * 1. Go to Settings > API
 * 2. Copy the Project URL and Public Anon Key
 * 3. Keep the service role key safe and secret
 */

// Browser Client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
}
