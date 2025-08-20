"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, User, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

const entityTypes = [
  { value: "natural_person", label: "Individual/Natural Person" },
  { value: "legal_entity", label: "Company/Legal Entity" },
]

const legalEntityTypes = [
  { value: "company_private_limited", label: "Private Limited Company" },
  { value: "company_public_limited", label: "Public Limited Company" },
  { value: "cooperative_society", label: "Cooperative Society" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "non_governmental_organization", label: "NGO" },
  { value: "trust", label: "Trust" },
]

export default function SetupAdminPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Check if setup is needed
  const [setupNeeded, setSetupNeeded] = useState(true)

  const [tenantData, setTenantData] = useState({
    name: "",
    entity_type: "legal_entity",
    legal_entity_type: "company_private_limited",
    registration_number: "",
    kra_pin: "",
    contact_person_name: "",
    contact_person_id: "",
    phone: "",
    email: "",
    physical_address: "",
  })

  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    national_id: "",
    entity_type: "natural_person",
    role: "company_admin",
  })

  useEffect(() => {
    checkIfSetupNeeded()
  }, [])

  const checkIfSetupNeeded = async () => {
    try {
      // Check if environment variables are configured first
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!hasSupabaseUrl || !hasSupabaseKey) {
        setError("Environment variables not configured")
        return
      }

      // Check if any tenants exist
      const { data: tenants, error: tenantsError } = await supabase.from("tenants").select("id, name, email").limit(5)

      if (tenantsError) {
        console.error("Error checking tenants:", tenantsError)
        setError(`Database error: ${tenantsError.message}`)
        return
      }

      console.log("Existing tenants found:", tenants)

      // Check if any users exist
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("role", "company_admin")
        .limit(5)

      if (usersError) {
        console.error("Error checking users:", usersError)
        setError(`Database error: ${usersError.message}`)
        return
      }

      console.log("Existing admin users found:", users)

      // Only block setup if we have both tenants AND admin users
      if (tenants && tenants.length > 0 && users && users.length > 0) {
        setSetupNeeded(false)
        setError(`Setup already completed. Found ${tenants.length} tenant(s) and ${users.length} admin user(s).`)
      } else {
        setSetupNeeded(true)
        if (tenants && tenants.length > 0) {
          setError(`Found ${tenants.length} tenant(s) but no admin users. You can proceed with setup.`)
          setError("") // Clear error to allow setup
        }
      }
    } catch (error) {
      console.error("Setup check error:", error)
      setError(`Setup check failed: ${error}`)
    }
  }

  const handleResetSetup = async () => {
    if (confirm("This will clear all existing data and allow fresh setup. Are you sure?")) {
      try {
        setLoading(true)

        // Clear existing data (be careful - this deletes everything!)
        await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000")

        setSetupNeeded(true)
        setError("")
        setSuccess("Database cleared. You can now proceed with setup.")
      } catch (error) {
        console.error("Reset error:", error)
        setError("Failed to reset setup")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTenantInputChange = (field: string, value: string) => {
    setTenantData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUserInputChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!tenantData.name || !tenantData.phone || !tenantData.email) {
      setError("Please fill in all required fields")
      return false
    }
    if (tenantData.entity_type === "legal_entity" && !tenantData.legal_entity_type) {
      setError("Please select a legal entity type")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!userData.full_name || !userData.email || !userData.password || !userData.phone) {
      setError("Please fill in all required fields")
      return false
    }
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    return true
  }

  const handleStep1Submit = () => {
    setError("")
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleFinalSubmit = async () => {
    setError("")
    setSuccess("")

    if (!validateStep2()) return

    setLoading(true)

    try {
      // Call the registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          userData: {
            entity_type: userData.entity_type,
            full_name: userData.full_name,
            phone: userData.phone,
            national_id: userData.national_id,
            role: userData.role,
          },
          tenantData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Registration failed")
      }

      setSuccess("Account created successfully! You can now sign in.")
      setTimeout(() => {
        router.push("/auth/signin")
      }, 2000)
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  if (!setupNeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Setup Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div>
                <p className="text-gray-600 mb-2">RLST8 appears to be already set up.</p>
                {error && (
                  <Alert variant="destructive" className="mb-4 text-left">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Button onClick={() => router.push("/auth/signin")} className="w-full">
                  Go to Sign In
                </Button>

                <Button variant="outline" onClick={() => setSetupNeeded(true)} className="w-full">
                  Force Setup Anyway
                </Button>

                <Button variant="destructive" onClick={handleResetSetup} disabled={loading} className="w-full">
                  {loading ? "Resetting..." : "Reset & Start Over"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                <p>If you're having trouble signing in, you can force setup or reset the database.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome to RLST8</h1>
          <p className="text-gray-600 mt-2">Set up your real estate management platform</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              1
            </div>
            <span className="ml-2 text-sm">Company Info</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              2
            </div>
            <span className="ml-2 text-sm">Admin Account</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Tell us about your real estate business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={tenantData.name}
                    onChange={(e) => handleTenantInputChange("name", e.target.value)}
                    placeholder="Your company name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_type">Entity Type *</Label>
                  <Select
                    value={tenantData.entity_type}
                    onValueChange={(value) => handleTenantInputChange("entity_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {tenantData.entity_type === "legal_entity" && (
                  <div className="space-y-2">
                    <Label htmlFor="legal_entity_type">Legal Entity Type *</Label>
                    <Select
                      value={tenantData.legal_entity_type}
                      onValueChange={(value) => handleTenantInputChange("legal_entity_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {legalEntityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    value={tenantData.registration_number}
                    onChange={(e) => handleTenantInputChange("registration_number", e.target.value)}
                    placeholder="Company registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kra_pin">KRA PIN</Label>
                  <Input
                    id="kra_pin"
                    value={tenantData.kra_pin}
                    onChange={(e) => handleTenantInputChange("kra_pin", e.target.value)}
                    placeholder="KRA PIN number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={tenantData.contact_person_name}
                    onChange={(e) => handleTenantInputChange("contact_person_name", e.target.value)}
                    placeholder="Primary contact person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={tenantData.phone}
                    onChange={(e) => handleTenantInputChange("phone", e.target.value)}
                    placeholder="+254700000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tenantData.email}
                    onChange={(e) => handleTenantInputChange("email", e.target.value)}
                    placeholder="company@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input
                  id="address"
                  value={tenantData.physical_address}
                  onChange={(e) => handleTenantInputChange("physical_address", e.target.value)}
                  placeholder="Company physical address"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleStep1Submit}>Next: Create Admin Account</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Admin Account
              </CardTitle>
              <CardDescription>Create your administrator account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={userData.full_name}
                    onChange={(e) => handleUserInputChange("full_name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_email">Email Address *</Label>
                  <Input
                    id="user_email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleUserInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userData.password}
                    onChange={(e) => handleUserInputChange("password", e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={userData.confirmPassword}
                    onChange={(e) => handleUserInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_phone">Phone Number *</Label>
                  <Input
                    id="user_phone"
                    value={userData.phone}
                    onChange={(e) => handleUserInputChange("phone", e.target.value)}
                    placeholder="+254700000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={userData.national_id}
                    onChange={(e) => handleUserInputChange("national_id", e.target.value)}
                    placeholder="National ID number"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleFinalSubmit} disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
