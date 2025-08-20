"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Building, Plus, Search, MapPin, Users } from "lucide-react"

interface Property {
  id: string
  name: string
  address: string
  property_type: string
  total_units: number
  occupied_units: number
  monthly_rent: number
  is_active: boolean
  created_at: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    try {
      console.log("🏢 Loading properties...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("❌ No current user")
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("properties")
        .select(`
          id,
          name,
          address,
          property_type,
          total_units,
          occupied_units,
          monthly_rent,
          is_active,
          created_at
        `)
        .eq("tenant_id", currentUser.tenant_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error loading properties:", error)
        return
      }

      console.log("✅ Properties loaded:", data?.length || 0)
      setProperties(data || [])
    } catch (error) {
      console.error("❌ Error loading properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalProperties = properties.length
  const totalUnits = properties.reduce((sum, prop) => sum + prop.total_units, 0)
  const occupiedUnits = properties.reduce((sum, prop) => sum + prop.occupied_units, 0)
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600 mt-2">Manage your rental properties and units</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
              <p className="text-xs text-muted-foreground">Rental units</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedUnits}</div>
              <p className="text-xs text-muted-foreground">Currently rented</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Building className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Overall occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Properties List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No properties match your search." : "Get started by adding your first property."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{property.name}</span>
                    <span className="text-sm font-normal text-gray-500 capitalize">{property.property_type}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Units:</span>
                      <span className="font-medium">
                        {property.occupied_units}/{property.total_units}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-medium">${property.monthly_rent?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Occupancy:</span>
                      <span className="font-medium">
                        {property.total_units > 0
                          ? ((property.occupied_units / property.total_units) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Edit
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
