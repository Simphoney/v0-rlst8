"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { CreditCard, Plus, Search, Calendar, DollarSign, TrendingUp } from "lucide-react"

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  description: string
  tenant_name: string
  property_name: string
  unit_number: string
  created_at: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      console.log("💳 Loading payments...")

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.error("❌ No current user")
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          status,
          description,
          created_at,
          tenancies!inner(
            first_name,
            last_name,
            properties!inner(name),
            units!inner(unit_number)
          )
        `)
        .eq("tenant_id", currentUser.tenant_id)
        .order("payment_date", { ascending: false })

      if (error) {
        console.error("❌ Error loading payments:", error)
        return
      }

      console.log("✅ Payments loaded:", data?.length || 0)

      const formattedPayments =
        data?.map((payment) => ({
          ...payment,
          tenant_name: `${payment.tenancies?.first_name || ""} ${payment.tenancies?.last_name || ""}`.trim(),
          property_name: payment.tenancies?.properties?.name || "Unknown Property",
          unit_number: payment.tenancies?.units?.unit_number || "Unknown Unit",
        })) || []

      setPayments(formattedPayments)
    } catch (error) {
      console.error("❌ Error loading payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const thisMonthPayments = payments
    .filter((payment) => {
      const paymentDate = new Date(payment.payment_date)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  const pendingPayments = payments.filter((p) => p.status === "pending").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "credit_card":
        return "bg-purple-100 text-purple-800"
      case "bank_transfer":
        return "bg-blue-100 text-blue-800"
      case "cash":
        return "bg-green-100 text-green-800"
      case "check":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-2">Track rent payments and financial transactions</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${thisMonthPayments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Current month revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${payments.length > 0 ? (totalPayments / payments.length).toLocaleString() : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "No payments match your search." : "Get started by recording your first payment."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{payment.tenant_name}</div>
                        <div className="text-sm text-gray-600">
                          {payment.property_name} - Unit {payment.unit_number}
                        </div>
                        <div className="text-sm text-gray-500">{payment.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${payment.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</div>
                      <div className="flex space-x-2 mt-1">
                        <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        <Badge className={getPaymentMethodColor(payment.payment_method)}>
                          {payment.payment_method.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
