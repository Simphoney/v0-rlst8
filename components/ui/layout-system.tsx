"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, Building, Users, CreditCard, Wrench, Search, Menu, X, LogOut, User } from "lucide-react"
import { useNavigation, ROUTES } from "@/lib/navigation"
import type { User as UserType } from "@/lib/auth"

interface LayoutSystemProps {
  children: React.ReactNode
  user: UserType
  onSignOut: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  roles?: string[]
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: Home },
  { name: "Properties", href: ROUTES.PROPERTIES, icon: Building },
  { name: "Tenants", href: ROUTES.TENANTS, icon: Users },
  { name: "Payments", href: ROUTES.PAYMENTS, icon: CreditCard },
  { name: "Maintenance", href: ROUTES.MAINTENANCE, icon: Wrench },
]

export function LayoutSystem({ children, user, onSignOut }: LayoutSystemProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const nav = useNavigation()

  const handleNavigation = (href: string) => {
    console.log(`🔄 LayoutSystem: Navigating to ${href}`)
    nav.navigate(href)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">RLST8</h1>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut} className="w-full justify-start bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="lg:hidden mr-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">Real Estate Management</h2>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
