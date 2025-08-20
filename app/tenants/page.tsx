"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Users, Plus, Search, Phone, Mail, Calendar } from "lucide-react"

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: string
  lease_start: string
  lease_end: string
  monthly_rent: number
  security_deposit: number
  property_name: string
  unit_number: string
  created_at: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    try {
      console.log("👥 Loading tenants...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("❌ No current user")
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("tenancies")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          status,
          lease_start,
          lease_end,
          monthly_rent,
          security_deposit,
          created_at,
          properties!inner(name),
          units!inner(unit_number)
        `)
        .eq("tenant_id", currentUser.tenant_id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error loading tenants:", error)
        return
      }

      console.log("✅ Tenants loaded:", data?.length || 0)

      const formattedTenants =
        data?.map((tenant) => ({
          ...tenant,
          property_name: tenant.properties?.name || "Unknown Property",
          unit_number: tenant.units?.unit_number || "Unknown Unit",
        })) || []

      setTenants(formattedTenants)
    } catch (error) {
      console.error("❌ Error loading tenants:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(
    (tenant) =>
      `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeTenantsCount = tenants.filter((t) => t.status === "active").length
  const totalRent = tenants.reduce((sum, tenant) => sum + (tenant.monthly_rent || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "terminated":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <p className="text-gray-600 mt-2">Manage your tenant relationships and leases</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">All tenant records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenantsCount}</div>
              <p className="text-xs text-muted-foreground">Currently active leases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total monthly rent</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tenants List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tenants...</p>
            </div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No tenants match your search." : "Get started by adding your first tenant."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">
                      {tenant.first_name} {tenant.last_name}
                    </span>
                    <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {tenant.property_name} - Unit {tenant.unit_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{tenant.email}</span>
                    </div>
                    {tenant.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(tenant.lease_start).toLocaleDateString()} -{" "}
                        {new Date(tenant.lease_end).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monthly Rent:</span>
                        <span className="font-medium">${tenant.monthly_rent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Security Deposit:</span>
                        <span className="font-medium">${tenant.security_deposit?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
