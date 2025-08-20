"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, AlertTriangle, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering to avoid build-time errors
export const dynamic = "force-dynamic"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [configError, setConfigError] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      console.log("🔍 Checking configuration...")

      // Check if environment variables are configured
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("Environment check:", {
        hasSupabaseUrl,
        hasSupabaseKey,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
      })

      if (!hasSupabaseUrl || !hasSupabaseKey) {
        setConfigError(true)
        setDebugInfo("Missing environment variables")
        return
      }

      // Test database connection
      console.log("🔍 Testing database connection...")
      const { data: testData, error: testError } = await supabase.from("tenants").select("id").limit(1)

      if (testError) {
        console.error("Database connection error:", testError)
        setConfigError(true)
        setDebugInfo(`Database error: ${testError.message}`)
        return
      }

      console.log("✅ Database connection successful")

      // Check if any tenants exist (setup needed)
      const { data: tenants, error } = await supabase.from("tenants").select("id").limit(1)

      if (error) {
        console.error("Error checking setup:", error)
        setDebugInfo(`Setup check error: ${error.message}`)
        return
      }

      if (!tenants || tenants.length === 0) {
        console.log("⚠️ No tenants found - setup needed")
        setNeedsSetup(true)
      } else {
        console.log("✅ Setup appears complete")
        setDebugInfo("Configuration looks good")
      }
    } catch (err) {
      console.error("Configuration check error:", err)
      setConfigError(true)
      setDebugInfo(`Configuration error: ${err}`)
    }
  }

  const handleRedirect = () => {
    console.log("🔄 Attempting redirect to dashboard...")
    setRedirecting(true)
    setDebugInfo("Redirecting to dashboard...")

    try {
      // Try multiple redirect methods
      console.log("Method 1: router.push")
      router.push("/dashboard")

      // Fallback method after short delay
      setTimeout(() => {
        console.log("Method 2: router.replace")
        router.replace("/dashboard")
      }, 1000)

      // Final fallback
      setTimeout(() => {
        console.log("Method 3: window.location")
        window.location.href = "/dashboard"
      }, 3000)
    } catch (redirectError) {
      console.error("Redirect error:", redirectError)
      setError("Redirect failed. Please click the dashboard link below.")
      setRedirecting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("🚀 Starting sign-in process...")
    console.log("Form data:", { email, passwordLength: password.length })

    if (configError) {
      setError("Please configure your environment variables first")
      return
    }

    if (needsSetup) {
      setError("Please complete the initial setup first")
      return
    }

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)
    setError("")
    setDebugInfo("Attempting sign-in...")

    try {
      console.log("🔐 Calling Supabase auth.signInWithPassword...")

      // Direct Supabase auth call with detailed logging
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log("Auth response:", {
        user: data.user ? "User object received" : "No user",
        session: data.session ? "Session received" : "No session",
        error: error ? error.message : "No error",
      })

      if (error) {
        console.error("❌ Authentication error:", error)
        setError(`Authentication failed: ${error.message}`)
        setDebugInfo(`Auth error: ${error.message}`)
        return
      }

      if (!data.user) {
        console.error("❌ No user returned from auth")
        setError("Authentication failed: No user data returned")
        setDebugInfo("No user data in response")
        return
      }

      console.log("✅ Authentication successful, checking user record...")
      setDebugInfo("Auth successful, checking user record...")

      // Check if user record exists in our users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .single()

      console.log("User record check:", {
        userData: userData ? "User record found" : "No user record",
        userError: userError ? userError.message : "No error",
      })

      if (userError || !userData) {
        console.error("❌ User record not found:", userError)
        setError("User account not properly set up. Please contact administrator.")
        setDebugInfo(`User record error: ${userError?.message || "Not found"}`)
        return
      }

      console.log("✅ User record found:", userData.full_name, userData.role)
      setDebugInfo("Success! Preparing redirect...")

      // Success - now redirect
      handleRedirect()
    } catch (err: any) {
      console.error("❌ Unexpected sign-in error:", err)
      setError(`Unexpected error: ${err.message || "Unknown error"}`)
      setDebugInfo(`Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Configuration Required</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Configuration Issue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{debugInfo || "RLST8 configuration issue detected."}</AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Link href="/setup">
                  <Button className="w-full">Go to Setup Guide</Button>
                </Link>

                <Link href="/check-database">
                  <Button variant="outline" className="w-full bg-transparent">
                    Check Database
                  </Button>
                </Link>

                <div className="text-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Refresh after configuration
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to RLST8</h2>
            <p className="mt-2 text-sm text-gray-600">First-time setup required</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Initial Setup Required</CardTitle>
              <CardDescription>Create your company and admin account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No accounts found. Please complete the initial setup to create your first admin account.
                  </AlertDescription>
                </Alert>

                <Link href="/setup-admin">
                  <Button className="w-full">Start Initial Setup</Button>
                </Link>

                <Link href="/check-database">
                  <Button variant="outline" className="w-full bg-transparent">
                    Check Database Status
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show success state while redirecting
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign-in Successful!</h2>
              <p className="text-gray-600 mb-6">Redirecting to your dashboard...</p>

              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>

                <div className="text-sm text-gray-500">
                  <p>If you're not redirected automatically:</p>
                </div>

                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard Manually</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to RLST8</h2>
          <p className="mt-2 text-sm text-gray-600">Access your real estate management platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {debugInfo && (
                <Alert>
                  <AlertDescription className="text-sm">{debugInfo}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <div className="text-sm text-gray-600">Need help? Contact your system administrator</div>

              <div className="flex justify-center space-x-4 text-sm">
                <Link href="/setup-admin" className="text-blue-600 hover:text-blue-500">
                  Initial Setup
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/check-database" className="text-blue-600 hover:text-blue-500">
                  Check Status
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
