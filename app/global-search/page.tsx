"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Building2, Users, CreditCard, Wrench } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { PageNavigation } from "@/components/ui/page-navigation"
import Link from "next/link"

interface SearchResults {
  properties: any[]
  tenants: any[]
  payments: any[]
  maintenance: any[]
}

export default function GlobalSearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults>({
    properties: [],
    tenants: [],
    payments: [],
    maintenance: [],
  })
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    }
  }, [searchQuery])

  const loadUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  const performSearch = async (query: string) => {
    if (!user || !query.trim()) return

    setLoading(true)
    try {
      const searchTerm = `%${query.toLowerCase()}%`

      // Search properties
      const { data: properties } = await supabase
        .from("properties")
        .select(`
          id, name, property_type, full_address,
          county:counties(name),
          subcounty:subcounties(name)
        `)
        .eq("tenant_id", user.tenant_id)
        .or(`name.ilike.${searchTerm},full_address.ilike.${searchTerm}`)
        .limit(10)

      // Search tenants
      const { data: tenants } = await supabase
        .from("users")
        .select(`
          id, full_name, email, phone,
          tenancy:tenancies!tenant_user_id(
            unit:units(unit_number, property:properties(name))
          )
        `)
        .eq("tenant_id", user.tenant_id)
        .eq("role", "tenant")
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
        .limit(10)

      // Search payments
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          id, amount, payment_type, transaction_reference, payment_date,
          tenancy:tenancies(
            tenant_user:users(full_name),
            unit:units(unit_number, property:properties(name))
          )
        `)
        .eq("tenant_id", user.tenant_id)
        .or(`transaction_reference.ilike.${searchTerm},mpesa_receipt_number.ilike.${searchTerm}`)
        .limit(10)

      // Search maintenance requests
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .select(`
          id, title, description, category, status,
          unit:units(unit_number, property:properties(name))
        `)
        .eq("tenant_id", user.tenant_id)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10)

      setResults({
        properties: properties || [],
        tenants: tenants || [],
        payments: payments || [],
        maintenance: maintenance || [],
      })
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalResults = () => {
    return results.properties.length + results.tenants.length + results.payments.length + results.maintenance.length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Search</h1>
          <p className="text-gray-600 mt-2">Search across all your RLST8 data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Everything</CardTitle>
            <CardDescription>Find properties, tenants, payments, and maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search properties, tenants, payments, maintenance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                {loading ? "Searching..." : `Found ${getTotalResults()} results for "${searchQuery}"`}
              </p>
            )}
          </CardContent>
        </Card>

        {searchQuery && (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Results ({getTotalResults()})</TabsTrigger>
              <TabsTrigger value="properties">Properties ({results.properties.length})</TabsTrigger>
              <TabsTrigger value="tenants">Tenants ({results.tenants.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({results.payments.length})</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({results.maintenance.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {/* Properties */}
              {results.properties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Properties ({results.properties.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.properties.map((property) => (
                        <Link key={property.id} href={`/properties/${property.id}`}>
                          <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{property.name}</p>
                                <p className="text-sm text-gray-600">{property.full_address}</p>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {property.property_type.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tenants */}
              {results.tenants.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Tenants ({results.tenants.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.tenants.map((tenant) => (
                        <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
                          <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{tenant.full_name}</p>
                                <p className="text-sm text-gray-600">
                                  {tenant.email} • {tenant.phone}
                                </p>
                              </div>
                              {tenant.tenancy?.[0] && (
                                <Badge variant="outline">
                                  {tenant.tenancy[0].unit.property.name} - Unit {tenant.tenancy[0].unit.unit_number}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payments */}
              {results.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Payments ({results.payments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.payments.map((payment) => (
                        <div key={payment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {new Intl.NumberFormat("en-KE", {
                                  style: "currency",
                                  currency: "KES",
                                }).format(payment.amount)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {payment.tenancy?.tenant_user?.full_name} • {payment.transaction_reference}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="capitalize">
                                {payment.payment_type}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance */}
              {results.maintenance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wrench className="mr-2 h-5 w-5" />
                      Maintenance ({results.maintenance.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.maintenance.map((request) => (
                        <Link key={request.id} href={`/maintenance/${request.id}`}>
                          <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{request.title}</p>
                                <p className="text-sm text-gray-600 line-clamp-1">{request.description}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="capitalize">
                                  {request.status.replace("_", " ")}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1 capitalize">
                                  {request.category.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {getTotalResults() === 0 && !loading && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or check spelling.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Individual tabs would show filtered results */}
            <TabsContent value="properties">{/* Properties only */}</TabsContent>
            <TabsContent value="tenants">{/* Tenants only */}</TabsContent>
            <TabsContent value="payments">{/* Payments only */}</TabsContent>
            <TabsContent value="maintenance">{/* Maintenance only */}</TabsContent>
          </Tabs>
        )}

        <PageNavigation backUrl="/dashboard" />
      </div>
    </DashboardLayout>
  )
}
