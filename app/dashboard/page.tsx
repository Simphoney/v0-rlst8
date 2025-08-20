"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import {
  Building,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Force dynamic rendering to avoid build-time errors
export const dynamic = "force-dynamic"

interface DashboardStats {
  properties: {
    total: number
    occupied: number
    vacant: number
    occupancyRate: number
  }
  tenants: {
    total: number
    active: number
    onNotice: number
  }
  payments: {
    thisMonth: number
    pending: number
    overdue: number
    totalRevenue: number
  }
  maintenance: {
    open: number
    inProgress: number
    completed: number
    totalCost: number
  }
}

interface User {
  id: string
  email: string
  tenant_id: string
  role: string
  full_name: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      console.log("📊 Loading dashboard data...")

      const currentUser = await getCurrentUser()
      if (!currentUser || !currentUser.email) {
        console.error("❌ No current user or email")
        router.push("/auth/signin")
        return
      }

      setUser(currentUser)

      // Load all dashboard statistics in parallel
      const [propertiesData, tenantsData, paymentsData, maintenanceData] = await Promise.all([
        loadPropertiesStats(currentUser.tenant_id),
        loadTenantsStats(currentUser.tenant_id),
        loadPaymentsStats(currentUser.tenant_id),
        loadMaintenanceStats(currentUser.tenant_id),
      ])

      setStats({
        properties: propertiesData,
        tenants: tenantsData,
        payments: paymentsData,
        maintenance: maintenanceData,
      })

      console.log("✅ Dashboard data loaded successfully")
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  async function loadPropertiesStats(tenantId: string) {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, total_units, occupied_units")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)

      if (error) throw error

      const total = properties?.length || 0
      const totalUnits = properties?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0
      const occupiedUnits = properties?.reduce((sum, p) => sum + (p.occupied_units || 0), 0) || 0
      const vacant = totalUnits - occupiedUnits
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

      return {
        total,
        occupied: occupiedUnits,
        vacant,
        occupancyRate,
      }
    } catch (error) {
      console.error("Error loading properties stats:", error)
      return { total: 0, occupied: 0, vacant: 0, occupancyRate: 0 }
    }
  }

  async function loadTenantsStats(tenantId: string) {
    try {
      const { data: tenancies, error } = await supabase.from("tenancies").select("id, status").eq("tenant_id", tenantId)

      if (error) throw error

      const total = tenancies?.length || 0
      const active = tenancies?.filter((t) => t.status === "active").length || 0
      const onNotice = tenancies?.filter((t) => t.status === "on_notice").length || 0

      return {
        total,
        active,
        onNotice,
      }
    } catch (error) {
      console.error("Error loading tenants stats:", error)
      return { total: 0, active: 0, onNotice: 0 }
    }
  }

  async function loadPaymentsStats(tenantId: string) {
    try {
      const currentMonth = new Date()
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, payment_date, status, due_date")
        .eq("tenant_id", tenantId)

      if (error) throw error

      const thisMonth =
        payments
          ?.filter((p) => new Date(p.payment_date) >= firstDayOfMonth && p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0) || 0

      const pending = payments?.filter((p) => p.status === "pending").length || 0

      const overdue = payments?.filter((p) => p.status === "pending" && new Date(p.due_date) < new Date()).length || 0

      const totalRevenue = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0

      return {
        thisMonth,
        pending,
        overdue,
        totalRevenue,
      }
    } catch (error) {
      console.error("Error loading payments stats:", error)
      return { thisMonth: 0, pending: 0, overdue: 0, totalRevenue: 0 }
    }
  }

  async function loadMaintenanceStats(tenantId: string) {
    try {
      const { data: requests, error } = await supabase
        .from("maintenance_requests")
        .select("status, estimated_cost, actual_cost")
        .eq("tenant_id", tenantId)

      if (error) throw error

      const open = requests?.filter((r) => r.status === "pending").length || 0
      const inProgress = requests?.filter((r) => r.status === "in_progress").length || 0
      const completed = requests?.filter((r) => r.status === "completed").length || 0

      const totalCost = requests?.reduce((sum, r) => sum + (r.actual_cost || r.estimated_cost || 0), 0) || 0

      return {
        open,
        inProgress,
        completed,
        totalCost,
      }
    } catch (error) {
      console.error("Error loading maintenance stats:", error)
      return { open: 0, inProgress: 0, completed: 0, totalCost: 0 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Error Loading Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RLST8</h1>
                <p className="text-sm text-gray-600">Real Estate Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.full_name}</span>
              <Button variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">Overview of your real estate portfolio</p>
          </div>

          {/* Properties Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.properties.total || 0}</div>
                <p className="text-xs text-muted-foreground">Active properties</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.properties.occupied || 0}</div>
                <p className="text-xs text-muted-foreground">Currently rented</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
                <Building className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.properties.vacant || 0}</div>
                <p className="text-xs text-muted-foreground">Available for rent</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.properties.occupancyRate.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">Overall occupancy</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {stats?.payments.thisMonth.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {stats?.payments.totalRevenue.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.payments.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.payments.overdue || 0}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.maintenance.open || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting assignment</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.maintenance.inProgress || 0}</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.maintenance.completed || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
                <Wrench className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {stats?.maintenance.totalCost.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Total expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/properties/new">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left w-full">
                    <Building className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="font-medium">Add Property</div>
                    <div className="text-sm text-gray-600">Register new property</div>
                  </button>
                </Link>

                <Link href="/tenants/new">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left w-full">
                    <Users className="h-6 w-6 text-green-600 mb-2" />
                    <div className="font-medium">Add Tenant</div>
                    <div className="text-sm text-gray-600">Register new tenant</div>
                  </button>
                </Link>

                <Link href="/payments/new">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left w-full">
                    <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="font-medium">Record Payment</div>
                    <div className="text-sm text-gray-600">Log rent payment</div>
                  </button>
                </Link>

                <Link href="/maintenance/new">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left w-full">
                    <Wrench className="h-6 w-6 text-orange-600 mb-2" />
                    <div className="font-medium">Maintenance</div>
                    <div className="text-sm text-gray-600">Create work order</div>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
