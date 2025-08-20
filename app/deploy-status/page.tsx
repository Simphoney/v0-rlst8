"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Building2, Rocket, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function DeployStatusPage() {
  const isDeployed = typeof window !== "undefined" && window.location.hostname !== "localhost"
  const hasVercelEnv = !!process.env.VERCEL
  const hasSupabaseIntegration = !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">RLST8 Deployment Status</h1>
          <p className="text-gray-600 mt-2">Check your deployment and integration status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                {isDeployed ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <CardTitle className="text-lg">Deployment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">{isDeployed ? "✅ Deployed to Vercel" : "⚠️ Running locally"}</p>
              <p className="text-xs text-gray-500 mt-1">{isDeployed ? window.location.hostname : "localhost"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                {hasVercelEnv ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <CardTitle className="text-lg">Vercel Environment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">{hasVercelEnv ? "✅ Vercel detected" : "❌ Not on Vercel"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                {hasSupabaseIntegration ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <CardTitle className="text-lg">Supabase Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                {hasSupabaseIntegration ? "✅ Integration active" : "❌ Not connected"}
              </p>
            </CardContent>
          </Card>
        </div>

        {!isDeployed && (
          <Alert className="mb-6">
            <Rocket className="h-4 w-4" />
            <AlertDescription>
              <strong>Deployment Required:</strong> You're running locally. Deploy to Vercel to access integrated
              environment variables and full functionality.
            </AlertDescription>
          </Alert>
        )}

        {isDeployed && !hasSupabaseIntegration && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supabase Integration Missing:</strong> Add the Supabase integration in your Vercel dashboard to
              automatically inject environment variables.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Deployment Guide</CardTitle>
            <CardDescription>Deploy RLST8 to Vercel without Git</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Method 1: Vercel CLI (Recommended)</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-100 p-2 rounded font-mono">npm i -g vercel</div>
                  <div className="bg-gray-100 p-2 rounded font-mono">vercel login</div>
                  <div className="bg-gray-100 p-2 rounded font-mono">vercel</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Method 2: Drag & Drop</h4>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>
                    Run <code className="bg-gray-100 px-1 rounded">npm run build</code>
                  </li>
                  <li>
                    Go to{" "}
                    <a
                      href="https://vercel.com/new"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      vercel.com/new
                    </a>
                  </li>
                  <li>Drag and drop your project folder</li>
                  <li>Deploy</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>After Deployment: Add Supabase Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your Vercel project dashboard</li>
              <li>
                Click <strong>"Integrations"</strong> tab
              </li>
              <li>
                Search for <strong>"Supabase"</strong>
              </li>
              <li>
                Click <strong>"Add Integration"</strong>
              </li>
              <li>
                Connect your existing project: <code className="bg-gray-100 px-1 rounded">cexecmlvjvhpeamdiopq</code>
              </li>
              <li>Grant permissions</li>
            </ol>
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This will automatically inject all required environment variables including NEXT_PUBLIC_ variants.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isDeployed ? (
            <>
              <Button asChild className="w-full">
                <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Deploy to Vercel
                </a>
              </Button>
              <Link href="/debug-env">
                <Button variant="outline" className="w-full bg-transparent">
                  Check Local Environment
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/test-connection">
                <Button className="w-full">Test Connection</Button>
              </Link>
              <Link href="/debug-env">
                <Button variant="outline" className="w-full bg-transparent">
                  Debug Environment
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
