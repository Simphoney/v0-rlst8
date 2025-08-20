"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Building2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function DebugEnvPage() {
  // Client-side environment variable check
  const clientEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  // Get all environment variables that contain "SUPABASE"
  const allSupabaseEnvs = Object.keys(process.env)
    .filter((key) => key.includes("SUPABASE"))
    .reduce(
      (obj, key) => {
        obj[key] = process.env[key as keyof typeof process.env]
        return obj
      },
      {} as Record<string, string | undefined>,
    )

  const hasRequiredVars = clientEnvVars.NEXT_PUBLIC_SUPABASE_URL && clientEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Environment Variables Debug</h1>
          <p className="text-gray-600 mt-2">Comprehensive environment variable analysis</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client-Side Environment Variables Status</CardTitle>
            <CardDescription>These are the variables available in the browser (NEXT_PUBLIC_ only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(clientEnvVars).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {value ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{key}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${value ? "text-green-600" : "text-red-600"}`}>
                      {value ? "✅ FOUND" : "❌ NOT FOUND"}
                    </span>
                    {value && (
                      <div className="text-xs text-gray-500 mt-1">
                        {key.includes("URL") ? value : `${value.substring(0, 20)}...`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Supabase-Related Environment Variables</CardTitle>
            <CardDescription>All environment variables containing "SUPABASE" found in process.env</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(allSupabaseEnvs).length === 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No Supabase environment variables found!</strong> This means the variables are not being
                  injected into the application.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {Object.entries(allSupabaseEnvs).map(([key, value]) => (
                  <div key={key} className="p-2 bg-gray-100 rounded font-mono text-sm">
                    <span className="text-blue-600">{key}:</span>{" "}
                    <span className="text-gray-700">
                      {value ? (key.includes("URL") ? value : `${value.substring(0, 30)}...`) : "undefined"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Runtime Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Environment:</strong> {process.env.NODE_ENV || "unknown"}
              </div>
              <div>
                <strong>Platform:</strong> {typeof window !== "undefined" ? "Client" : "Server"}
              </div>
              <div>
                <strong>Total Env Vars:</strong> {Object.keys(process.env).length}
              </div>
              <div>
                <strong>NEXT_PUBLIC_ Vars:</strong>{" "}
                {Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_")).length}
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasRequiredVars && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Environment Variables Not Found!</strong> The required NEXT_PUBLIC_ variables are not available in
              the client-side code.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Where to Set Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <h4 className="font-semibold text-blue-900">Option 1: Vercel Dashboard (Recommended)</h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
                  <li>Go to your Vercel project dashboard</li>
                  <li>Click "Settings" → "Environment Variables"</li>
                  <li>Add these variables:</li>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>
                      <code>NEXT_PUBLIC_SUPABASE_URL</code> = <code>https://cexecmlvjvhpeamdiopq.supabase.co</code>
                    </li>
                    <li>
                      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> = <code>your_anon_key</code>
                    </li>
                  </ul>
                  <li>Redeploy your application</li>
                </ol>
              </div>

              <div className="p-4 border-l-4 border-green-500 bg-green-50">
                <h4 className="font-semibold text-green-900">Option 2: Local Development (.env.local)</h4>
                <p className="text-sm text-green-800 mt-2">
                  Create a <code>.env.local</code> file in your project root:
                </p>
                <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 text-xs overflow-x-auto">
                  {`NEXT_PUBLIC_SUPABASE_URL=https://cexecmlvjvhpeamdiopq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}
                </pre>
              </div>

              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                <h4 className="font-semibold text-yellow-900">Important Notes</h4>
                <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  <li>
                    Variables MUST start with <code>NEXT_PUBLIC_</code> for client-side access
                  </li>
                  <li>After setting variables in Vercel, you must redeploy</li>
                  <li>
                    Local <code>.env.local</code> file should NOT be committed to git
                  </li>
                  <li>Restart your development server after adding local env vars</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={() => window.location.reload()} className="flex-1">
            Refresh Page
          </Button>
          <Link href="/test-connection" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Test Connection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
