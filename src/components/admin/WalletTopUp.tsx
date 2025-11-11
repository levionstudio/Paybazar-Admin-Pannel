import { useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface TokenData {
  data: {
    admin_id: string
  }
  exp: number
}

const WalletTopUp = () => {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    amount: "",
    remarks: "",
  })

  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showContent, setShowContent] = useState(false)

  // Decode admin token
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to continue.",
          variant: "destructive",
        })
        window.location.href = "/login"
        return
      }

      try {
        const decoded: TokenData = jwtDecode(token)

        if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("authToken")
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          })
          window.location.href = "/login"
          return
        }

        if (!decoded.data.admin_id) {
          toast({
            title: "Invalid Token",
            description: "Admin ID missing. Please login again.",
            variant: "destructive",
          })
          localStorage.removeItem("authToken")
          window.location.href = "/login"
          return
        }

        setTokenData(decoded)
      } catch (err) {
        localStorage.removeItem("authToken")
        toast({
          title: "Invalid Token",
          description: "Please log in again.",
          variant: "destructive",
        })
        window.location.href = "/login"
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [toast])

  // Fade-in content
  useEffect(() => {
    if (!isCheckingAuth) {
      const timer = setTimeout(() => setShowContent(true), 100)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isCheckingAuth])

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tokenData) {
      toast({
        title: "Authentication Error",
        description: "User data missing. Please login again.",
        variant: "destructive",
      })
      window.location.href = "/login"
      return
    }

    const token = localStorage.getItem("authToken")
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Token missing. Please login again.",
        variant: "destructive",
      })
      window.location.href = "/login"
      return
    }

    const payload = {
      admin_id: tokenData.data.admin_id,
      amount: formData.amount,
      remarks: formData.remarks,
    }

    try {
      setLoading(true)
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/wallet/topup`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      toast({
        title: "Wallet Top-Up Successful",
        description: data.message || "Funds added successfully.",
      })

      setTimeout(() => (window.location.href = "/admin/logs"), 1000)
    } catch (err: any) {
      console.error("Wallet top-up error:", err)
      toast({
        title: "Top-Up Failed",
        description:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      <Card className="shadow-md border border-border rounded-xl overflow-hidden">
        <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
          <CardTitle className="text-2xl">Admin Wallet Top-Up</CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-1">
            Add funds to the admin wallet.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 bg-card min-h-[300px] flex justify-center items-center">
          {isCheckingAuth ? (
            <div className="text-muted-foreground text-lg">Loading...</div>
          ) : (
            <div
              style={{
                opacity: showContent ? 1 : 0,
                transition: "opacity 0.5s ease-in-out",
                width: "100%",
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Field */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-medium">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    className="h-11"
                    required
                  />
                </div>

                {/* Remarks Field */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="font-medium">
                    Remarks
                  </Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="h-24"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => (window.location.href = "/admin")}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    className="flex-1 gradient-primary hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Top-Up Wallet"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WalletTopUp
