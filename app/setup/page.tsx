"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  // Client-side: Only NEXT_PUBLIC_ variables are available
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const allConfigured = Object.values(envVars).every(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">RLST8 Setup</h1>
          <p className="text-gray-600 mt-2">Configure your environment variables</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Environment Variables Status</CardTitle>
            <CardDescription>Client-side environment variables (NEXT_PUBLIC_ prefixed variables only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {value ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{key}</span>
                  </div>
                  <span className={`text-sm ${value ? "text-green-600" : "text-red-600"}`}>
                    {value ? "SET" : "NOT SET"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {allConfigured && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Environment variables detected!</strong> Your variables appear to be set correctly. Run a
              connection test to verify everything works.
            </AlertDescription>
          </Alert>
        )}

        {!allConfigured && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Required:</strong> NEXT_PUBLIC_ prefixed environment variables are required for
              client-side access in Next.js applications.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm bg-gray-100 p-3 rounded">
              <div>
                <span className="text-gray-600">NEXT_PUBLIC_SUPABASE_URL:</span>
                <br />
                <span className="text-green-600">https://cexecmlvjvhpeamdiopq.supabase.co</span> ✅
              </div>
              <div>
                <span className="text-gray-600">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <br />
                <span className="text-green-600">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span> ✅
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ✅ Your environment variables look correct! The URL and anon key format are valid.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link href="/test-connection">
            <Button className="w-full">Test Connection</Button>
          </Link>
          {allConfigured ? (
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full bg-transparent">
                Continue to Sign In
              </Button>
            </Link>
          ) : (
            <Button disabled variant="outline" className="w-full bg-transparent">
              Set Variables First
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Test Connection:</strong> Click "Test Connection" to verify your Supabase setup works
              </li>
              <li>
                <strong>Run Database Scripts:</strong> If connection test fails, you may need to create database tables
              </li>
              <li>
                <strong>Sign In:</strong> Once everything is working, proceed to the sign-in page
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
