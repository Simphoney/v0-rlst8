import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Server-side Supabase client - can access all environment variables
export const createClient = () => {
  // Server-side: Can access both server and public variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL environment variable")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing Supabase anon key environment variable")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Server-side Supabase client - can access all environment variables
export const createServerSupabaseClient = () => {
  return createClient()
}

// Admin client for server-side operations
export const createServerAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL environment variable")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
