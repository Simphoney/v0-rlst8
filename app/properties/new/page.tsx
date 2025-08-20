"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"
import { PageNavigation } from "@/components/ui/page-navigation"

interface County {
  id: number
  name: string
}

interface Subcounty {
  id: number
  name: string
  county_id: number
}

interface User {
  id: string
  full_name: string
  role: string
}

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "bungalow", label: "Bungalow" },
  { value: "commercial_building", label: "Commercial Building" },
  { value: "duplex", label: "Duplex" },
  { value: "hostel", label: "Hostel" },
  { value: "maisonette", label: "Maisonette" },
  { value: "mixed_use_building", label: "Mixed Use Building" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "studio", label: "Studio" },
  { value: "townhouse", label: "Townhouse" },
  { value: "warehouse", label: "Warehouse" },
]

const currencies = [
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "USD", label: "USD - US Dollar" },
]

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [counties, setCounties] = useState<County[]>([])
  const [subcounties, setSubcounties] = useState<Subcounty[]>([])
  const [landlords, setLandlords] = useState<User[]>([])
  const [user, setUser] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    property_type: "",
    registration_number: "",
    county_id: "",
    subcounty_id: "",
    region_area: "",
    landmark: "",
    google_pin_url: "",
    full_address: "",
    currency: "KES",
    rent_due_day: "1",
    mpesa_paybill: "",
    mpesa_till: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_name: "",
    description: "",
    landlord_id: "",
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/auth/signin")
        return
      }
      setUser(currentUser)

      // Load counties
      const { data: countiesData, error: countiesError } = await supabase
        .from("counties")
        .select("id, name")
        .order("sort_order")

      if (countiesError) throw countiesError
      setCounties(countiesData || [])

      // Load subcounties
      const { data: subcountiesData, error: subcountiesError } = await supabase
        .from("subcounties")
        .select("id, name, county_id")
        .order("name")

      if (subcountiesError) throw subcountiesError
      setSubcounties(subcountiesData || [])

      // Load landlords (users with landlord role)
      const { data: landlordsData, error: landlordsError } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("tenant_id", currentUser.tenant_id)
        .eq("role", "landlord")
        .eq("is_active", true)
        .order("full_name")

      if (landlordsError) throw landlordsError
      setLandlords(landlordsData || [])
    } catch (error) {
      console.error("Error loading initial data:", error)
      setError("Failed to load form data")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const getFilteredSubcounties = () => {
    if (!formData.county_id) return []
    return subcounties.filter((sub) => sub.county_id === Number.parseInt(formData.county_id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!user) throw new Error("User not authenticated")

      const propertyData = {
        ...formData,
        tenant_id: user.tenant_id,
        county_id: formData.county_id ? Number.parseInt(formData.county_id) : null,
        subcounty_id: formData.subcounty_id ? Number.parseInt(formData.subcounty_id) : null,
        rent_due_day: Number.parseInt(formData.rent_due_day),
        landlord_id: formData.landlord_id || null,
      }

      const { data, error } = await supabase.from("properties").insert([propertyData]).select().single()

      if (error) throw error

      router.push(`/properties/${data.id}`)
    } catch (error: any) {
      console.error("Error creating property:", error)
      setError(error.message || "Failed to create property")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        router.push("/properties")
      }
    } else {
      router.push("/properties")
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600 mt-2">Create a new property in your portfolio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Essential property details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Sunset Apartments"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type *</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => handleInputChange("property_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => handleInputChange("registration_number", e.target.value)}
                    placeholder="Property registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landlord_id">Landlord</Label>
                  <Select
                    value={formData.landlord_id}
                    onValueChange={(value) => handleInputChange("landlord_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select landlord" />
                    </SelectTrigger>
                    <SelectContent>
                      {landlords.map((landlord) => (
                        <SelectItem key={landlord.id} value={landlord.id}>
                          {landlord.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Property address and location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="county_id">County *</Label>
                  <Select value={formData.county_id} onValueChange={(value) => handleInputChange("county_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id.toString()}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcounty_id">Subcounty</Label>
                  <Select
                    value={formData.subcounty_id}
                    onValueChange={(value) => handleInputChange("subcounty_id", value)}
                    disabled={!formData.county_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcounty" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredSubcounties().map((subcounty) => (
                        <SelectItem key={subcounty.id} value={subcounty.id.toString()}>
                          {subcounty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region_area">Region/Area</Label>
                  <Input
                    id="region_area"
                    value={formData.region_area}
                    onChange={(e) => handleInputChange("region_area", e.target.value)}
                    placeholder="e.g., Kilimani, Westlands"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={formData.landmark}
                    onChange={(e) => handleInputChange("landmark", e.target.value)}
                    placeholder="Nearby landmark"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_address">Full Address *</Label>
                <Textarea
                  id="full_address"
                  value={formData.full_address}
                  onChange={(e) => handleInputChange("full_address", e.target.value)}
                  placeholder="Complete property address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_pin_url">Google Maps Pin URL</Label>
                <Input
                  id="google_pin_url"
                  value={formData.google_pin_url}
                  onChange={(e) => handleInputChange("google_pin_url", e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>Payment and banking information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent_due_day">Rent Due Day</Label>
                  <Select
                    value={formData.rent_due_day}
                    onValueChange={(value) => handleInputChange("rent_due_day", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mpesa_paybill">M-Pesa Paybill</Label>
                  <Input
                    id="mpesa_paybill"
                    value={formData.mpesa_paybill}
                    onChange={(e) => handleInputChange("mpesa_paybill", e.target.value)}
                    placeholder="Paybill number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa_till">M-Pesa Till</Label>
                  <Input
                    id="mpesa_till"
                    value={formData.mpesa_till}
                    onChange={(e) => handleInputChange("mpesa_till", e.target.value)}
                    placeholder="Till number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange("bank_name", e.target.value)}
                    placeholder="Bank name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) => handleInputChange("bank_account_number", e.target.value)}
                    placeholder="Bank account number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => handleInputChange("bank_account_name", e.target.value)}
                  placeholder="Bank account name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Optional property description</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Property description, amenities, special features..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <PageNavigation
            onSave={handleSubmit}
            onCancel={handleCancel}
            backUrl="/properties"
            showSave={true}
            showCancel={true}
            saveLabel="Create Property"
            isLoading={loading}
          />
        </form>
      </div>
    </DashboardLayout>
  )
}
