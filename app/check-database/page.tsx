"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Users, Database, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DatabaseStatus {
  tenants: any[]
  users: any[]
  properties: any[]
  authUsers: any[]
}

export default function CheckDatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus>({
    tenants: [],
    users: [],
    properties: [],
    authUsers: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      setLoading(true)
      setError("")

      // Check tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, email, created_at")

      // Check users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, role, created_at")

      // Check properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, created_at")

      if (tenantsError) console.error("Tenants error:", tenantsError)
      if (usersError) console.error("Users error:", usersError)
      if (propertiesError) console.error("Properties error:", propertiesError)

      setStatus({
        tenants: tenants || [],
        users: users || [],
        properties: properties || [],
        authUsers: [], // Can't easily query auth.users from client
      })
    } catch (error) {
      console.error("Database check error:", error)
      setError(`Failed to check database: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const clearDatabase = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will delete ALL data including tenants, users, and properties. This cannot be undone. Are you absolutely sure?",
      )
    ) {
      return
    }

    if (!confirm("This is your final warning. All data will be permanently deleted. Continue?")) {
      return
    }

    try {
      setClearing(true)
      setError("")

      // Delete in correct order (respecting foreign keys)
      await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("maintenance_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("tenancies").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("units").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("unit_types").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      alert("✅ Database cleared successfully! You can now run fresh setup.")
      checkDatabase() // Refresh the status
    } catch (error) {
      console.error("Clear database error:", error)
      setError(`Failed to clear database: ${error}`)
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Checking database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Database Status</h1>
          <p className="text-gray-600 mt-2">Check what's currently in your RLST8 database</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">{status.tenants.length}</div>
              <p className="text-sm text-gray-600">Company records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">{status.users.length}</div>
              <p className="text-sm text-gray-600">User accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">{status.properties.length}</div>
              <p className="text-sm text-gray-600">Property records</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tenants ({status.tenants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {status.tenants.length === 0 ? (
                <p className="text-gray-500 text-sm">No tenants found</p>
              ) : (
                <div className="space-y-2">
                  {status.tenants.map((tenant) => (
                    <div key={tenant.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-gray-600">{tenant.email}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(tenant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users ({status.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {status.users.length === 0 ? (
                <p className="text-gray-500 text-sm">No users found</p>
              ) : (
                <div className="space-y-2">
                  {status.users.map((user) => (
                    <div key={user.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Role: {user.role} | Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Database Actions</CardTitle>
            <CardDescription>Manage your database state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button onClick={checkDatabase} variant="outline">
                Refresh Status
              </Button>

              <Link href="/setup-admin">
                <Button className="w-full">Go to Setup</Button>
              </Link>

              <Link href="/auth/signin">
                <Button variant="outline" className="w-full bg-transparent">
                  Try Sign In
                </Button>
              </Link>

              <Button variant="destructive" onClick={clearDatabase} disabled={clearing} className="flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                {clearing ? "Clearing..." : "Clear All Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What Should I Do?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {status.tenants.length === 0 && status.users.length === 0 && (
                <Alert>
                  <AlertDescription>
                    ✅ <strong>Database is clean.</strong> Go to setup to create your first account.
                  </AlertDescription>
                </Alert>
              )}

              {status.tenants.length > 0 && status.users.length === 0 && (
                <Alert>
                  <AlertDescription>
                    ⚠️ <strong>Tenants exist but no users.</strong> You can proceed with setup to create admin user.
                  </AlertDescription>
                </Alert>
              )}

              {status.tenants.length > 0 && status.users.length > 0 && (
                <Alert>
                  <AlertDescription>
                    ℹ️ <strong>Setup appears complete.</strong> Try signing in with existing credentials, or clear data
                    to start fresh.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
