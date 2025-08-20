import { type NextRequest, NextResponse } from "next/server"
import { createServerAdminClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, userData, tenantData } = body

    // Use server-side admin client
    const supabase = createServerAdminClient()

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase.from("tenants").insert(tenantData).select().single()

    if (tenantError) {
      // Cleanup auth user if tenant creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: tenantError.message }, { status: 400 })
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        ...userData,
        auth_user_id: authUser.user.id,
        tenant_id: tenant.id,
        email,
      })
      .select()
      .single()

    if (userError) {
      // Cleanup auth user and tenant if user creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from("tenants").delete().eq("id", tenant.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({
      message: "User and tenant created successfully",
      user,
      tenant,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
