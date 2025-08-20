"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

interface TestResult {
  name: string
  status: "success" | "error" | "loading"
  message: string
  details?: string
}

export default function TestConnectionPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Environment Variables", status: "loading", message: "Checking..." },
    { name: "Supabase Client", status: "loading", message: "Initializing..." },
    { name: "Database Connection", status: "loading", message: "Connecting..." },
  ])

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    // Test 1: Environment Variables - READ ACTUAL VALUES
    console.log("All environment variables:", process.env)

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Environment check:", {
      NEXT_PUBLIC_SUPABASE_URL: envUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: envKey ? `${envKey.substring(0, 20)}...` : "undefined",
      allEnvKeys: Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
    })

    setTests((prev) =>
      prev.map((test, i) =>
        i === 0
          ? {
              name: "Environment Variables",
              status: envUrl && envKey ? "success" : "error",
              message:
                envUrl && envKey
                  ? `✅ Both variables found`
                  : `❌ Missing: ${!envUrl ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!envKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}`,
              details: `URL: ${envUrl || "NOT FOUND"} | Key: ${envKey ? `${envKey.substring(0, 30)}...` : "NOT FOUND"}`,
            }
          : test,
      ),
    )

    if (!envUrl || !envKey) {
      setTests((prev) =>
        prev.map((test, i) => (i > 0 ? { ...test, status: "error", message: "Skipped - env vars missing" } : test)),
      )
      return
    }

    // Test 2: Supabase Client Initialization
    try {
      const { supabase } = await import("@/lib/supabase")
      setTests((prev) =>
        prev.map((test, i) =>
          i === 1
            ? { name: "Supabase Client", status: "success", message: "✅ Client initialized successfully" }
            : test,
        ),
      )

      // Test 3: Database Connection - Try a simple query
      try {
        console.log("Testing database connection...")
        const { data, error } = await supabase.from("counties").select("id, name").limit(1)

        console.log("Database query result:", { data, error })

        setTests((prev) =>
          prev.map((test, i) =>
            i === 2
              ? {
                  name: "Database Connection",
                  status: error ? "error" : "success",
                  message: error
                    ? `❌ Database error: ${error.message}`
                    : `✅ Database connected - Found ${data?.length || 0} records`,
                  details: error
                    ? `Code: ${error.code} | Details: ${error.details}`
                    : `Sample data: ${JSON.stringify(data)}`,
                }
              : test,
          ),
        )
      } catch (dbError) {
        console.error("Database connection error:", dbError)
        setTests((prev) =>
          prev.map((test, i) =>
            i === 2
              ? {
                  name: "Database Connection",
                  status: "error",
                  message: `❌ Connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
                  details: dbError instanceof Error ? dbError.stack : "No additional details",
                }
              : test,
          ),
        )
      }
    } catch (clientError) {
      console.error("Supabase client error:", clientError)
      setTests((prev) =>
        prev.map((test, i) =>
          i === 1
            ? {
                name: "Supabase Client",
                status: "error",
                message: `❌ Client error: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
                details: clientError instanceof Error ? clientError.stack : "No additional details",
              }
            : test,
        ),
      )

      setTests((prev) =>
        prev.map((test, i) => (i === 2 ? { ...test, status: "error", message: "Skipped - client failed" } : test)),
      )
    }
  }

  const allPassed = tests.every((test) => test.status === "success")
  const anyFailed = tests.some((test) => test.status === "error")

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">RLST8 Connection Test</h1>
          <p className="text-gray-600 mt-2">Testing your ACTUAL Supabase configuration</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration Test Results</CardTitle>
            <CardDescription>Verifying ACTUAL environment variables and database connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {test.status === "loading" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                      {test.status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {test.status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">{test.details}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ACTUAL Environment Variables (Runtime)</CardTitle>
            <CardDescription>These are the values actually being read by the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-sm">
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">NEXT_PUBLIC_SUPABASE_URL:</span>
                <br />
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-600" : "text-red-600"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ NOT FOUND"}
                </span>
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <br />
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "text-green-600" : "text-red-600"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...`
                    : "❌ NOT FOUND"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {allPassed && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>All tests passed!</strong> Your RLST8 platform is properly configured and ready to use.
            </AlertDescription>
          </Alert>
        )}

        {anyFailed && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration issues detected.</strong> Check the test results above for specific problems.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-4">
          <Button onClick={runTests} variant="outline" className="flex-1 bg-transparent">
            Run Tests Again
          </Button>
          {allPassed ? (
            <Link href="/auth/signin" className="flex-1">
              <Button className="w-full">Continue to Sign In</Button>
            </Link>
          ) : (
            <Link href="/setup" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Setup
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
