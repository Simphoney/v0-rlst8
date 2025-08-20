"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Building2, Upload } from "lucide-react"
import { ENTITY_TYPES, LEGAL_ENTITY_TYPES } from "@/lib/constants/dropdowns"

interface EntityRegistrationProps {
  userType: "agent" | "landlord" | "tenant" | "maintenance_provider" | "security_guard" | "caretaker"
  onSubmit: (data: any) => void
  loading?: boolean
}

export function EntityRegistration({ userType, onSubmit, loading = false }: EntityRegistrationProps) {
  const [entityType, setEntityType] = useState<"natural_person" | "legal_entity">("natural_person")
  const [formData, setFormData] = useState<any>({
    entity_type: "natural_person",
    role: userType,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleEntityTypeChange = (type: "natural_person" | "legal_entity") => {
    setEntityType(type)
    setFormData((prev: any) => ({
      ...prev,
      entity_type: type,
      // Clear fields that don't apply to the new entity type
      ...(type === "natural_person"
        ? {
            legal_entity_type: "",
            registered_name: "",
            business_registration_number: "",
            incorporation_date: "",
          }
        : {
            first_name: "",
            last_name: "",
            national_id: "",
            passport_number: "",
            date_of_birth: "",
            occupation: "",
          }),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Common validations
    if (!formData.phone) newErrors.phone = "Phone number is required"
    if (!formData.email) newErrors.email = "Email is required"

    if (entityType === "natural_person") {
      if (!formData.full_name) newErrors.full_name = "Full name is required"
      if (!formData.national_id && !formData.passport_number) {
        newErrors.national_id = "National ID or Passport is required"
      }
    } else {
      if (!formData.registered_name) newErrors.registered_name = "Registered name is required"
      if (!formData.legal_entity_type) newErrors.legal_entity_type = "Legal entity type is required"
      if (!formData.contact_person_name) newErrors.contact_person_name = "Contact person is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const getTitle = () => {
    const titles = {
      agent: "Agent Registration",
      landlord: "Landlord Registration",
      tenant: "Tenant Registration",
      maintenance_provider: "Maintenance Provider Registration",
      security_guard: "Security Guard Registration",
      caretaker: "Caretaker Registration",
    }
    return titles[userType]
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {entityType === "natural_person" ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          <span>{getTitle()}</span>
        </CardTitle>
        <CardDescription>Complete KYC registration as required by Kenyan law</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entity Type Selection */}
          <div className="space-y-2">
            <Label>Entity Type *</Label>
            <Select value={entityType} onValueChange={handleEntityTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Natural Person Fields */}
          {entityType === "natural_person" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ""}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter full legal name"
                  />
                  {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ""}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id || ""}
                    onChange={(e) => handleInputChange("national_id", e.target.value)}
                    placeholder="National ID number"
                  />
                  {errors.national_id && <p className="text-sm text-red-600">{errors.national_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport_number">Passport Number (Alternative)</Label>
                  <Input
                    id="passport_number"
                    value={formData.passport_number || ""}
                    onChange={(e) => handleInputChange("passport_number", e.target.value)}
                    placeholder="Passport number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation || ""}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    placeholder="Current occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kra_pin">KRA PIN</Label>
                  <Input
                    id="kra_pin"
                    value={formData.kra_pin || ""}
                    onChange={(e) => handleInputChange("kra_pin", e.target.value)}
                    placeholder="KRA PIN number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Legal Entity Fields */}
          {entityType === "legal_entity" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registered_name">Registered Name *</Label>
                  <Input
                    id="registered_name"
                    value={formData.registered_name || ""}
                    onChange={(e) => handleInputChange("registered_name", e.target.value)}
                    placeholder="Legal registered name"
                  />
                  {errors.registered_name && <p className="text-sm text-red-600">{errors.registered_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_entity_type">Legal Entity Type *</Label>
                  <Select
                    value={formData.legal_entity_type || ""}
                    onValueChange={(value) => handleInputChange("legal_entity_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.legal_entity_type && <p className="text-sm text-red-600">{errors.legal_entity_type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_registration_number">Registration Number</Label>
                  <Input
                    id="business_registration_number"
                    value={formData.business_registration_number || ""}
                    onChange={(e) => handleInputChange("business_registration_number", e.target.value)}
                    placeholder="Business registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incorporation_date">Date of Incorporation</Label>
                  <Input
                    id="incorporation_date"
                    type="date"
                    value={formData.incorporation_date || ""}
                    onChange={(e) => handleInputChange("incorporation_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person_name">Contact Person *</Label>
                  <Input
                    id="contact_person_name"
                    value={formData.contact_person_name || ""}
                    onChange={(e) => handleInputChange("contact_person_name", e.target.value)}
                    placeholder="Primary contact person"
                  />
                  {errors.contact_person_name && <p className="text-sm text-red-600">{errors.contact_person_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kra_pin">KRA PIN</Label>
                  <Input
                    id="kra_pin"
                    value={formData.kra_pin || ""}
                    onChange={(e) => handleInputChange("kra_pin", e.target.value)}
                    placeholder="KRA PIN number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Common Contact Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+254700000000"
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residential_address">Physical Address</Label>
              <Textarea
                id="residential_address"
                value={formData.residential_address || ""}
                onChange={(e) => handleInputChange("residential_address", e.target.value)}
                placeholder="Complete physical address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_address">Postal Address</Label>
              <Input
                id="postal_address"
                value={formData.postal_address || ""}
                onChange={(e) => handleInputChange("postal_address", e.target.value)}
                placeholder="P.O. Box address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name || ""}
                  onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                  placeholder="Emergency contact person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone || ""}
                  onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                  placeholder="+254700000000"
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Required Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entityType === "natural_person" ? (
                <>
                  <div className="space-y-2">
                    <Label>National ID / Passport Copy</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Upload ID document</p>
                      <Input type="file" className="mt-2" accept="image/*,.pdf" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Passport Photo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Upload passport photo</p>
                      <Input type="file" className="mt-2" accept="image/*" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Certificate of Incorporation</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Upload certificate</p>
                      <Input type="file" className="mt-2" accept="image/*,.pdf" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Documents</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Upload supporting documents</p>
                      <Input type="file" className="mt-2" accept="image/*,.pdf" multiple />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
