import { createClient } from "@supabase/supabase-js"

// Next.js Environment Variable Rules:
// - Client-side: Only NEXT_PUBLIC_ prefixed variables are available
// - Server-side: All variables are available
// - process.env is NOT available in client-side code at runtime

// For client-side usage, we must use NEXT_PUBLIC_ variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. This must be set in your Vercel project settings or .env.local file.",
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. This must be set in your Vercel project settings or .env.local file.",
  )
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Admin client for server-side operations only
export const createAdminClient = () => {
  // This function should only be called server-side
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
