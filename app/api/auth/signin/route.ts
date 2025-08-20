import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("🔐 API: Attempting to sign in user:", email)

    const supabase = createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("❌ API: Auth error:", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!authData.user) {
      console.error("❌ API: No user returned from auth")
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    console.log("✅ API: Auth successful for:", authData.user.email)

    // Get user record from our users table
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

    if (userError) {
      console.error("❌ API: User lookup error:", userError.message)
      return NextResponse.json({ error: "User record not found" }, { status: 404 })
    }

    console.log("✅ API: User record found:", userData.email, userData.role)

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.first_name,
        lastName: userData.last_name,
      },
    })
  } catch (error) {
    console.error("❌ API: Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
