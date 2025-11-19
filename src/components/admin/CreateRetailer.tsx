import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { jwtDecode } from "jwt-decode"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const retailerSchema = z.object({
  master_distributor_id: z.string().min(1, "Please select a master distributor"),
  distributor_id: z.string().min(1, "Please select a distributor"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  phone: z.string().regex(/^[1-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  aadhar: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
  pan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN number")
    .transform((val) => val.toUpperCase()),
  dob: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date")
    .refine(
      (val) => new Date(val) <= new Date(),
      "Date of birth cannot be in the future"
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Please select a gender",
  }),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  business_name: z.string().min(2, "Business name must be at least 2 characters").max(255),
  business_type: z.string().min(1, "Business type is required"),
  gst_number: z.string().optional().refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), "Enter a valid GST number"),
})

type RetailerFormData = z.infer<typeof retailerSchema>

interface DecodedToken {
  data: {
    master_distributor_id?: string
    admin_id?: string
  }
  exp: number
}

interface MasterDistributor {
  master_distributor_id: string
  master_distributor_name: string
  master_distributor_email?: string
  [key: string]: any
}

interface Distributor {
  distributor_id: string
  distributor_name: string
  distributor_email?: string
  [key: string]: any
}

const CreateRetailerPage = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const role = localStorage.getItem("userRole") || "distributor"
  const token = localStorage.getItem("authToken")

  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([])
  const [selectedMasterDistributorId, setSelectedMasterDistributorId] = useState<string>("")
  const [loadingMasterDistributors, setLoadingMasterDistributors] = useState(false)
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loadingDistributors, setLoadingDistributors] = useState(false)

  // Password strength helper
  const getPasswordStrength = (pwd: string): { label: "Weak" | "Medium" | "Strong"; score: 0 | 1 | 2 | 3 } => {
    if (!pwd) return { label: "Weak", score: 0 }
    const hasLower = /[a-z]/.test(pwd)
    const hasUpper = /[A-Z]/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const longEnough = pwd.length >= 8

    const met = [hasLower, hasUpper, hasSpecial].filter(Boolean).length

    if (met <= 1 || pwd.length < 6) return { label: "Weak", score: 1 }
    if (met === 2 || (met === 3 && !longEnough)) return { label: "Medium", score: 2 }
    return { label: "Strong", score: 3 }
  }

  // Redirect if no token
  useEffect(() => {
    if (!token) navigate("/login")
  }, [token, navigate])

  // Decode token and get IDs
  const { adminId } = useMemo(() => {
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token)
        return {
          adminId: decoded?.data?.admin_id || "",
        }
      } catch (err) {
        console.error("Token decode error:", err)
        return { adminId: "" }
      }
    }
    return { adminId: "" }
  }, [token])

  // Fetch master distributors
  useEffect(() => {
    if (!adminId || !token) return

    const fetchMasterDistributors = async () => {
      setLoadingMasterDistributors(true)
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get/md/${adminId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (res.data.status === "success" && res.data.data) {
          const distributors = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data.master_distributors || res.data.data || []

          const normalized = distributors.map((md: any) => ({
            master_distributor_id: md.master_distributor_id,
            master_distributor_unique_id: md.master_distributor_unique_id,
            master_distributor_name: md.master_distributor_name,
            master_distributor_email: md.master_distributor_email,
            ...md,
          }))

          const filtered = normalized.filter((md: any) => md.master_distributor_id)
          setMasterDistributors(filtered)

          // Auto-select if only one master distributor
          if (filtered.length === 1) {
            setSelectedMasterDistributorId(filtered[0].master_distributor_id)
          }
        }
      } catch (err: any) {
        console.error("Error fetching master distributors:", err)
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load master distributors",
          variant: "destructive",
        })
      } finally {
        setLoadingMasterDistributors(false)
      }
    }

    fetchMasterDistributors()
  }, [adminId, token, toast])

  // Fetch distributors when master distributor is selected
  useEffect(() => {
    if (!token || !selectedMasterDistributorId) {
      setDistributors([])
      return
    }

    const fetchDistributors = async () => {
      setLoadingDistributors(true)
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get/distributors/${selectedMasterDistributorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        const result = res.data
        if (result.status === "success" && Array.isArray(result.data)) {
          const normalized = result.data.map((d: any) => ({
            distributor_id: d.distributor_id,
            distributor_unique_id: d.distributor_unique_id,
            distributor_name: d.distributor_name,
            distributor_email: d.distributor_email,
            ...d,
          }))
          setDistributors(normalized)
        } else {
          setDistributors([])
        }
      } catch (err: any) {
        console.error("Fetch distributors error:", err)
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load distributors",
          variant: "destructive",
        })
        setDistributors([])
      } finally {
        setLoadingDistributors(false)
      }
    }

    fetchDistributors()
  }, [token, selectedMasterDistributorId, toast])

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RetailerFormData>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      master_distributor_id: "",
      distributor_id: "",
    },
  })

  const selectedDistributorId = watch("distributor_id")
  const genderValue = watch("gender")

  // Reset distributor selection when master distributor changes
  useEffect(() => {
    if (selectedMasterDistributorId) {
      setValue("master_distributor_id", selectedMasterDistributorId)
      setValue("distributor_id", "")
    }
  }, [selectedMasterDistributorId, setValue])

  const onSubmit = async (data: RetailerFormData) => {
    console.log("Form submitted with data:", data)
    console.log("Selected master distributor ID:", selectedMasterDistributorId)
    
    if (!adminId) {
      toast({
        title: "Session Error",
        description: "Invalid session data. Please log in again.",
        variant: "destructive",
      })
      navigate("/login")
      return
    }

    if (!selectedMasterDistributorId) {
      toast({
        title: "Selection Required",
        description: "Please select a master distributor.",
        variant: "destructive",
      })
      return
    }

    if (!data.distributor_id || data.distributor_id === "") {
      toast({
        title: "Selection Required",
        description: "Please select a distributor.",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        admin_id: adminId,
        master_distributor_id: selectedMasterDistributorId,
        distributor_id: data.distributor_id,
        user_name: data.name,
        user_email: data.email,
        user_password: data.password,
        user_phone: data.phone,
        user_aadhar_number: data.aadhar,
        user_pan_number: data.pan,
        user_date_of_birth: data.dob,
        user_gender: data.gender,
        user_city: data.city,
        user_state: data.state,
        user_address: data.address,
        user_pincode: data.pincode,
        business_name: data.business_name,
        business_type: data.business_type,
        gst_number: data.gst_number || "",
      }

      console.log("Creating retailer with payload:", payload)
      console.log("API URL:", `${import.meta.env.VITE_API_BASE_URL}/admin/create/user`)

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/create/user`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      console.log("API Response:", res.data)

      if (res.data.status === "success") {
        toast({
          title: "Retailer Created",
          description: res.data.message || `${data.name} added successfully.`,
        })
        reset()
        setValue("distributor_id", "")
        setValue("master_distributor_id", "")
        setSelectedMasterDistributorId("")
      } else {
        console.error("API Error Response:", res.data)
        toast({
          title: "Creation Failed",
          description: res.data.message || res.data.msg || "Something went wrong.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Create Retailer Error:", error)
      console.error("Error response data:", error.response?.data)
      console.error("Error response status:", error.response?.status)
      console.error("Error response headers:", error.response?.headers)
      
      // Extract error message from various possible locations
      const errorData = error.response?.data
      const errorMessage = errorData?.message || 
                          errorData?.msg || 
                          errorData?.error ||
                          (errorData?.status === "failed" ? "Invalid response from database. Please check your data and try again." : null) ||
                          error.message || 
                          "Please try again later."
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
      <div className="flex flex-col max-w-2xl mx-auto">
        <Card>
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-2xl">Create New Retailer</CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-1">
                  Add a new retailer to your network.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Master Distributor selection */}
              <div className="space-y-2">
                <Label htmlFor="master_distributor_id">Master Distributor</Label>
                {loadingMasterDistributors ? (
                  <div className="flex items-center gap-2 h-11 px-3 border border-input rounded-md bg-background">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading master distributors...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedMasterDistributorId}
                    onValueChange={(value) => {
                      setSelectedMasterDistributorId(value)
                      setValue("master_distributor_id", value)
                      setValue("distributor_id", "") // Reset distributor when master changes
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a master distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterDistributors.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No master distributors found
                        </div>
                      ) : (
                        masterDistributors.map((md) => (
                          <SelectItem
                            key={md.master_distributor_id}
                            value={md.master_distributor_id}
                          >
                            {md.master_distributor_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {!selectedMasterDistributorId && !loadingMasterDistributors && (
                  <p className="text-sm text-destructive">
                    Please select a master distributor first
                  </p>
                )}
              </div>

              {/* Distributor selection */}
              <div className="space-y-2">
                <Label htmlFor="distributor_id">Distributor</Label>
                {!selectedMasterDistributorId ? (
                  <Select disabled>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select master distributor first" />
                    </SelectTrigger>
                  </Select>
                ) : loadingDistributors ? (
                  <div className="flex items-center gap-2 h-11 px-3 border border-input rounded-md bg-background">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading distributors...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedDistributorId || ""}
                    onValueChange={(value) => {
                      setValue("distributor_id", value)
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No distributors found for this master distributor
                        </div>
                      ) : (
                        distributors.map((d) => (
                          <SelectItem
                            key={d.distributor_id}
                            value={d.distributor_id}
                          >
                            {d.distributor_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.distributor_id && (
                  <p className="text-sm text-destructive">
                    {errors.distributor_id.message}
                  </p>
                )}
                {errors.master_distributor_id && (
                  <p className="text-sm text-destructive">
                    {errors.master_distributor_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Paybazzar"
                  {...register("name")}
                  className="h-11"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="paybazzar@gmail.com"
                  {...register("email")}
                  className="h-11"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...register("password")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      register("password").onChange(e)
                    }}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          getPasswordStrength(password).score === 1
                            ? "w-1/3 bg-destructive"
                            : getPasswordStrength(password).score === 2
                            ? "w-2/3 bg-orange-500"
                            : getPasswordStrength(password).score === 3
                            ? "w-full bg-emerald-500"
                            : "w-0"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength:{" "}
                      <span
                        className={`font-medium ${
                          getPasswordStrength(password).label === "Weak"
                            ? "text-destructive"
                            : getPasswordStrength(password).label === "Medium"
                            ? "text-orange-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {getPasswordStrength(password).label}
                      </span>
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    {...register("phone")}
                    className="h-11"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number</Label>
                  <Input
                    id="aadhar"
                    placeholder="123456789012"
                    {...register("aadhar")}
                    className="h-11"
                  />
                  {errors.aadhar && (
                    <p className="text-sm text-destructive">{errors.aadhar.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    placeholder="ABCDE1234F"
                    {...register("pan")}
                    className="h-11 uppercase"
                  />
                  {errors.pan && (
                    <p className="text-sm text-destructive">{errors.pan.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} className="h-11" />
                  {errors.dob && (
                    <p className="text-sm text-destructive">{errors.dob.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={genderValue || ""}
                  onValueChange={(value) => setValue("gender", value as RetailerFormData["gender"])}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Hyderabad" {...register("city")} className="h-11" />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Telangana" {...register("state")} className="h-11" />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Madhapur, Hyderabad"
                  {...register("address")}
                  className="min-h-[100px]"
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="500081"
                  {...register("pincode")}
                  className="h-11"
                />
                {errors.pincode && (
                  <p className="text-sm text-destructive">{errors.pincode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  placeholder="Enter business name"
                  {...register("business_name")}
                  className="h-11"
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Input
                  id="business_type"
                  placeholder="Enter business type"
                  {...register("business_type")}
                  className="h-11"
                />
                {errors.business_type && (
                  <p className="text-sm text-destructive">{errors.business_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number (Optional)</Label>
                <Input
                  id="gst_number"
                  placeholder="22AAAAA0000A1Z5"
                  {...register("gst_number")}
                  className="h-11 uppercase"
                />
                {errors.gst_number && (
                  <p className="text-sm text-destructive">{errors.gst_number.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Retailer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Toaster />
      </div>
  )
}

export default CreateRetailerPage
