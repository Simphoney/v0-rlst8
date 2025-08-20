"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Wrench, Plus, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: string
  status: string
  requested_date: string
  completed_date: string | null
  estimated_cost: number
  actual_cost: number | null
  tenant_name: string
  property_name: string
  unit_number: string
  created_at: string
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadMaintenanceRequests()
  }, [])

  async function loadMaintenanceRequests() {
    try {
      console.log("🔧 Loading maintenance requests...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("❌ No current user")
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(`
          id,
          title,
          description,
          priority,
          status,
          requested_date,
          completed_date,
          estimated_cost,
          actual_cost,
          created_at,
          tenancies!inner(
            first_name,
            last_name,
            properties!inner(name),
            units!inner(unit_number)
          )
        `)
        .eq("tenant_id", currentUser.tenant_id)
        .order("requested_date", { ascending: false })

      if (error) {
        console.error("❌ Error loading maintenance requests:", error)
        return
      }

      console.log("✅ Maintenance requests loaded:", data?.length || 0)

      const formattedRequests =
        data?.map((request) => ({
          ...request,
          tenant_name: `${request.tenancies?.first_name || ""} ${request.tenancies?.last_name || ""}`.trim(),
          property_name: request.tenancies?.properties?.name || "Unknown Property",
          unit_number: request.tenancies?.units?.unit_number || "Unknown Unit",
        })) || []

      setRequests(formattedRequests)
    } catch (error) {
      console.error("❌ Error loading maintenance requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(
    (request) =>
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const openRequests = requests.filter((r) => r.status === "open").length
  const inProgressRequests = requests.filter((r) => r.status === "in_progress").length
  const completedRequests = requests.filter((r) => r.status === "completed").length
  const totalCost = requests.reduce((sum, request) => sum + (request.actual_cost || request.estimated_cost || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4" />
      case "in_progress":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-2">Manage property maintenance requests and work orders</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressRequests}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedRequests}</div>
              <p className="text-xs text-muted-foreground">Finished this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <Wrench className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Maintenance expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search maintenance requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Maintenance Requests List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading maintenance requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No requests match your search." : "No maintenance requests have been submitted yet."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span>{request.title}</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(request.priority)}>{request.priority} priority</Badge>
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {request.property_name} - Unit {request.unit_number} • Requested by {request.tenant_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{request.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <div className="font-medium">{new Date(request.requested_date).toLocaleDateString()}</div>
                      </div>
                      {request.completed_date && (
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="font-medium">{new Date(request.completed_date).toLocaleDateString()}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Estimated Cost:</span>
                        <div className="font-medium">${request.estimated_cost?.toLocaleString() || 0}</div>
                      </div>
                      {request.actual_cost && (
                        <div>
                          <span className="text-gray-600">Actual Cost:</span>
                          <div className="font-medium">${request.actual_cost.toLocaleString()}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Update Status
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact Tenant
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
