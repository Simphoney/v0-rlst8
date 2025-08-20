"use client"

import { useEffect } from "react"
import { useNavigation, ROUTES } from "@/lib/navigation"

export default function HomePage() {
  const { replace } = useNavigation()

  useEffect(() => {
    console.log("🔄 MCP: Home page, redirecting to dashboard...")
    replace(ROUTES.DASHBOARD)
  }, [replace])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to RLST8...</p>
      </div>
    </div>
  )
}
