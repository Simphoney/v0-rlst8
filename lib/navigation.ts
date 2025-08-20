"use client"

import { useRouter } from "next/navigation"

export interface NavigationOptions {
  replace?: boolean
  scroll?: boolean
}

export class NavigationSystem {
  private router: any

  constructor(router: any) {
    this.router = router
  }

  async navigate(path: string, options: NavigationOptions = {}) {
    console.log(`🔄 MCP Navigation: Attempting to navigate to ${path}`)

    try {
      // Method 1: Next.js router
      if (options.replace) {
        console.log(`🔄 MCP Replace: ${path}`)
        this.router.replace(path)
      } else {
        console.log(`🔄 MCP Push: ${path}`)
        this.router.push(path)
      }

      // Method 2: Fallback with window.location (after a delay)
      setTimeout(() => {
        if (window.location.pathname !== path) {
          console.log(`🔄 MCP Fallback: Using window.location for ${path}`)
          if (options.replace) {
            window.location.replace(path)
          } else {
            window.location.href = path
          }
        }
      }, 1000)

      // Method 3: Force reload fallback (after longer delay)
      setTimeout(() => {
        if (window.location.pathname !== path) {
          console.log(`🔄 MCP Force: Force navigating to ${path}`)
          window.location.href = path
        }
      }, 3000)
    } catch (error) {
      console.error(`❌ MCP Navigation Error:`, error)
      // Emergency fallback
      window.location.href = path
    }
  }

  back() {
    console.log("🔄 MCP: Going back")
    this.router.back()
  }

  reload() {
    console.log("🔄 MCP: Reloading page")
    window.location.reload()
  }
}

export function useNavigation() {
  const router = useRouter()
  return new NavigationSystem(router)
}

// Route constants
export const ROUTES = {
  HOME: "/",
  SIGNIN: "/auth/signin",
  DASHBOARD: "/dashboard",
  PROPERTIES: "/properties",
  TENANTS: "/tenants",
  PAYMENTS: "/payments",
  MAINTENANCE: "/maintenance",
  SETUP_ADMIN: "/setup-admin",
} as const
