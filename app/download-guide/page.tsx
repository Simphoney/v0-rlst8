"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Building2, Download, Upload, ExternalLink, CheckCircle } from "lucide-react"

export default function DownloadGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">RLST8 Deployment Guide</h1>
          <p className="text-gray-600 mt-2">Deploy without console access</p>
        </div>

        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No Console Required!</strong> Vercel will automatically build your project during deployment. You
            just need to upload the source code.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Step 1: Download Code
              </CardTitle>
              <CardDescription>Get your RLST8 project files</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Look for "Download Code" button (top right of v0)</li>
                <li>Click to download ZIP file</li>
                <li>Extract the ZIP to a folder on your computer</li>
                <li>You should see files like package.json, app/, components/, etc.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Step 2: Deploy to Vercel
              </CardTitle>
              <CardDescription>Upload and deploy automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
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
                <li>Drag your extracted folder to the upload area</li>
                <li>Vercel detects Next.js automatically</li>
                <li>Click "Deploy" - Vercel builds everything for you!</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 3: Add Supabase Integration</CardTitle>
            <CardDescription>Connect your database automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>After deployment, go to your Vercel project dashboard</li>
                <li>
                  Click the <strong>"Integrations"</strong> tab
                </li>
                <li>
                  Search for <strong>"Supabase"</strong> and click "Add"
                </li>
                <li>
                  Connect your existing Supabase project:{" "}
                  <code className="bg-gray-100 px-1 rounded text-xs">cexecmlvjvhpeamdiopq</code>
                </li>
                <li>Grant the requested permissions</li>
              </ol>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This automatically adds all required environment variables including NEXT_PUBLIC_SUPABASE_URL and
                  NEXT_PUBLIC_SUPABASE_ANON_KEY.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 4: Verify Everything Works</CardTitle>
            <CardDescription>Test your deployed application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>After deployment and integration, visit these pages on your deployed URL:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code>/deploy-status</code> - Check deployment status
                </li>
                <li>
                  <code>/debug-env</code> - Verify environment variables are injected
                </li>
                <li>
                  <code>/test-connection</code> - Test database connection
                </li>
                <li>
                  <code>/auth/signin</code> - Test authentication flow
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Deploy to Vercel Now
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Create GitHub Repo (Alternative)
            </a>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What Vercel Does Automatically</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✅ Vercel Handles:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Installing npm dependencies</li>
                  <li>Running the build process</li>
                  <li>Optimizing for production</li>
                  <li>Setting up CDN and hosting</li>
                  <li>SSL certificates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">❌ You Don't Need:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Terminal or console access</li>
                  <li>To run npm commands</li>
                  <li>To build the project locally</li>
                  <li>To install dependencies</li>
                  <li>To configure servers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
