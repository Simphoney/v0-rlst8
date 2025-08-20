"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Shield, Plus, Search, Car, Clock, User } from "lucide-react"

interface VisitorLog {
  id: string
  visitor_name: string
  visitor_id_number: string
  visitor_phone: string
  visitor_company: string
  unit_to_visit: string
  host_name: string
  purpose_of_visit: string
  vehicle_registration: string
  vehicle_make_model: string
  entry_time: string
  exit_time: string | null
  status: "entered" | "exited"
  assigned_parking_slot: string
  guard_notes: string
  property_name: string
  unit_number: string
}

interface ParkingSlot {
  id: string
  slot_number: string
  slot_type: string
  is_occupied: boolean
  current_vehicle_reg: string
  property_name: string
}

export default function SecurityPage() {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([])
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showVisitorForm, setShowVisitorForm] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Visitor form state
  const [visitorForm, setVisitorForm] = useState({
    visitor_name: "",
    visitor_id_number: "",
    visitor_phone: "",
    visitor_company: "",
    unit_to_visit: "",
    host_name: "",
    purpose_of_visit: "",
    vehicle_registration: "",
    vehicle_make_model: "",
    assigned_parking_slot: "",
  })

  useEffect(() => {
    loadSecurityData()
  }, [])

  async function loadSecurityData() {
    try {
      console.log("🛡️ Loading security data...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("❌ No current user")
        return
      }

      setUser(currentUser)

      // Load visitor logs and parking data in parallel
      const [logsData, parkingData] = await Promise.all([
        loadVisitorLogs(currentUser.tenant_id),
        loadParkingSlots(currentUser.tenant_id),
      ])

      setVisitorLogs(logsData)
      setParkingSlots(parkingData)

      console.log("✅ Security data loaded successfully")
    } catch (error) {
      console.error("❌ Error loading security data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadVisitorLogs(tenantId: string) {
    const { data, error } = await supabase
      .from("visitor_logs")
      .select(`
        id,
        visitor_name,
        visitor_id_number,
        visitor_phone,
        visitor_company,
        unit_to_visit,
        host_name,
        purpose_of_visit,
        vehicle_registration,
        vehicle_make_model,
        entry_time,
        exit_time,
        status,
        assigned_parking_slot,
        guard_notes,
        properties!inner(name),
        units!inner(unit_number)
      `)
      .eq("tenant_id", tenantId)
      .order("entry_time", { ascending: false })
      .limit(50)

    if (error) throw error

    return (
      data?.map((log) => ({
        ...log,
        property_name: log.properties?.name || "Unknown Property",
        unit_number: log.units?.unit_number || "Unknown Unit",
      })) || []
    )
  }

  async function loadParkingSlots(tenantId: string) {
    const { data, error } = await supabase
      .from("parking_slots")
      .select(`
        id,
        slot_number,
        slot_type,
        is_occupied,
        current_vehicle_reg,
        properties!inner(name)
      `)
      .eq("tenant_id", tenantId)
      .order("slot_number")

    if (error) throw error

    return (
      data?.map((slot) => ({
        ...slot,
        property_name: slot.properties?.name || "Unknown Property",
      })) || []
    )
  }

  async function handleVisitorEntry(e: React.FormEvent) {
    e.preventDefault()

    try {
      console.log("👤 Registering visitor entry...")

      const { data, error } = await supabase
        .from("visitor_logs")
        .insert([
          {
            tenant_id: user.tenant_id,
            guard_id: user.id,
            ...visitorForm,
            entry_time: new Date().toISOString(),
            status: "entered",
            is_locked: true, // Immutable after creation
          },
        ])
        .select()

      if (error) throw error

      console.log("✅ Visitor registered successfully")

      // Reset form and reload data
      setVisitorForm({
        visitor_name: "",
        visitor_id_number: "",
        visitor_phone: "",
        visitor_company: "",
        unit_to_visit: "",
        host_name: "",
        purpose_of_visit: "",
        vehicle_registration: "",
        vehicle_make_model: "",
        assigned_parking_slot: "",
      })
      setShowVisitorForm(false)
      loadSecurityData()
    } catch (error) {
      console.error("❌ Error registering visitor:", error)
    }
  }

  async function handleVisitorExit(logId: string) {
    try {
      console.log("🚪 Recording visitor exit...")

      const { error } = await supabase
        .from("visitor_logs")
        .update({
          exit_time: new Date().toISOString(),
          status: "exited",
        })
        .eq("id", logId)

      if (error) throw error

      console.log("✅ Visitor exit recorded")
      loadSecurityData()
    } catch (error) {
      console.error("❌ Error recording exit:", error)
    }
  }

  const filteredLogs = visitorLogs.filter(
    (log) =>
      log.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.visitor_id_number.includes(searchTerm) ||
      log.host_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.property_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeVisitors = visitorLogs.filter((log) => log.status === "entered").length
  const totalVisitorsToday = visitorLogs.filter((log) => {
    const today = new Date().toDateString()
    return new Date(log.entry_time).toDateString() === today
  }).length
  const occupiedParkingSlots = parkingSlots.filter((slot) => slot.is_occupied).length
  const availableParkingSlots = parkingSlots.length - occupiedParkingSlots

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security & Visitor Management</h1>
            <p className="text-gray-600 mt-2">Monitor property access and manage visitor logs</p>
          </div>
          <Button onClick={() => setShowVisitorForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Register Visitor</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVisitors}</div>
              <p className="text-xs text-muted-foreground">Currently on property</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitorsToday}</div>
              <p className="text-xs text-muted-foreground">Total entries today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Parking</CardTitle>
              <Car className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedParkingSlots}</div>
              <p className="text-xs text-muted-foreground">Slots in use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Parking</CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableParkingSlots}</div>
              <p className="text-xs text-muted-foreground">Slots available</p>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Registration Form */}
        {showVisitorForm && (
          <Card>
            <CardHeader>
              <CardTitle>Register New Visitor</CardTitle>
              <CardDescription>Record visitor entry (immutable after save)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVisitorEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitor_name">Visitor Name *</Label>
                    <Input
                      id="visitor_name"
                      value={visitorForm.visitor_name}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, visitor_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitor_id_number">ID Number *</Label>
                    <Input
                      id="visitor_id_number"
                      value={visitorForm.visitor_id_number}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, visitor_id_number: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitor_phone">Phone Number</Label>
                    <Input
                      id="visitor_phone"
                      value={visitorForm.visitor_phone}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, visitor_phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitor_company">Company/Organization</Label>
                    <Input
                      id="visitor_company"
                      value={visitorForm.visitor_company}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, visitor_company: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="host_name">Host Name</Label>
                    <Input
                      id="host_name"
                      value={visitorForm.host_name}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, host_name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose_of_visit">Purpose of Visit</Label>
                    <Input
                      id="purpose_of_visit"
                      value={visitorForm.purpose_of_visit}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, purpose_of_visit: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle_registration">Vehicle Registration</Label>
                    <Input
                      id="vehicle_registration"
                      value={visitorForm.vehicle_registration}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, vehicle_registration: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle_make_model">Vehicle Make/Model</Label>
                    <Input
                      id="vehicle_make_model"
                      value={visitorForm.vehicle_make_model}
                      onChange={(e) => setVisitorForm((prev) => ({ ...prev, vehicle_make_model: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_parking_slot">Parking Slot</Label>
                    <Select
                      value={visitorForm.assigned_parking_slot}
                      onValueChange={(value) => setVisitorForm((prev) => ({ ...prev, assigned_parking_slot: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parking slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingSlots
                          .filter((slot) => !slot.is_occupied)
                          .map((slot) => (
                            <SelectItem key={slot.id} value={slot.slot_number}>
                              {slot.slot_number} - {slot.property_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowVisitorForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Visitor</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search visitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Visitor Logs */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading visitor logs...</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Visitor Logs Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No visitors match your search." : "No visitors have been registered yet."}
              </p>
              <Button onClick={() => setShowVisitorForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register First Visitor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Visitor Logs</CardTitle>
              <CardDescription>Recent visitor entries and exits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{log.visitor_name}</div>
                        <div className="text-sm text-gray-600">ID: {log.visitor_id_number}</div>
                        <div className="text-sm text-gray-600">
                          Visiting: {log.host_name} - {log.property_name} {log.unit_number}
                        </div>
                        {log.vehicle_registration && (
                          <div className="text-sm text-gray-600">
                            Vehicle: {log.vehicle_registration} ({log.vehicle_make_model})
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          className={
                            log.status === "entered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {log.status === "entered" ? "On Property" : "Exited"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">Entry: {new Date(log.entry_time).toLocaleString()}</div>
                      {log.exit_time && (
                        <div className="text-sm text-gray-600">Exit: {new Date(log.exit_time).toLocaleString()}</div>
                      )}
                      {log.assigned_parking_slot && (
                        <div className="text-sm text-gray-600">Parking: {log.assigned_parking_slot}</div>
                      )}
                      {log.status === "entered" && (
                        <Button size="sm" variant="outline" onClick={() => handleVisitorExit(log.id)} className="mt-2">
                          Record Exit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parking Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Parking Management</CardTitle>
            <CardDescription>Current parking slot status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {parkingSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 border rounded-lg text-center ${
                    slot.is_occupied ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="font-medium">{slot.slot_number}</div>
                  <div className="text-xs text-gray-600 mb-1">{slot.property_name}</div>
                  <Badge className={slot.is_occupied ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {slot.is_occupied ? "Occupied" : "Available"}
                  </Badge>
                  {slot.current_vehicle_reg && (
                    <div className="text-xs text-gray-600 mt-1">{slot.current_vehicle_reg}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
