import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  tenant_id: string
  role: string
  full_name: string
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔍 Getting current user...")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("Auth user check:", user ? "User found" : "No user")

    if (!user || !user.email) {
      console.log("❌ No authenticated user or email")
      return null
    }

    console.log("🔍 Fetching user data from database...")
    const { data: userData, error } = await supabase.from("users").select("*").eq("auth_user_id", user.id).single()

    console.log("User data fetch:", {
      userData: userData ? "Found" : "Not found",
      error: error ? error.message : "No error",
    })

    if (error || !userData) {
      console.error("Error fetching user data:", error)
      return null
    }

    // Ensure all required fields are present
    if (!userData.email || !userData.tenant_id || !userData.role || !userData.full_name) {
      console.error("❌ User data incomplete:", userData)
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      tenant_id: userData.tenant_id,
      role: userData.role,
      full_name: userData.full_name,
    }
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  console.log("🔐 Auth.signIn called with:", { email, passwordLength: password.length })

  if (!email || !password) {
    return { data: null, error: { message: "Email and password are required" } }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  console.log("Auth response:", {
    user: data.user ? "User received" : "No user",
    session: data.session ? "Session received" : "No session",
    error: error ? error.message : "No error",
  })

  return { data, error }
}

export async function signOut() {
  console.log("🚪 Signing out...")
  const { error } = await supabase.auth.signOut()
  console.log("Sign out result:", error ? error.message : "Success")
  return { error }
}
