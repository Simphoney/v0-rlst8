"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { User } from "@/lib/auth"
import { LayoutSystem } from "@/components/ui/layout-system"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        console.log("🔄 DashboardLayout: Loading user...")
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          console.log("❌ DashboardLayout: No user found, redirecting to signin")
          router.push("/auth/signin")
          return
        }
        console.log("✅ DashboardLayout: User loaded:", currentUser.email)
        setUser(currentUser)
      } catch (error) {
        console.error("❌ DashboardLayout: Error loading user:", error)
        router.push("/auth/signin")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleSignOut = async () => {
    console.log("🔄 DashboardLayout: Signing out...")
    await signOut()
    router.push("/auth/signin")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <LayoutSystem user={user} onSignOut={handleSignOut}>
      {children}
    </LayoutSystem>
  )
}
