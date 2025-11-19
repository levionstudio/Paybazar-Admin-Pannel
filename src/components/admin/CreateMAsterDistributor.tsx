import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const distributorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  phone: z
    .string()
    .regex(/^[1-9]\d{9}$/, "Phone must be a 10-digit number"),
  aadhar: z
    .string()
    .regex(/^\d{12}$/, "Aadhar must be a 12-digit number"),
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
});

type DistributorFormData = z.infer<typeof distributorSchema>;

interface DecodedAdminToken {
  data: {
    admin_id?: string;
    [key: string]: any;
  };
  exp?: number;
  iat?: number;
}

const CreateMasterDistributorPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  let admin_id = "";
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const decoded = jwtDecode<DecodedAdminToken>(token);
      console.log(decoded.data.admin_id)
      admin_id = decoded?.data?.admin_id || "";

    } catch (err) {
      console.error("Invalid admin token:", err);
    }
  }

  // Password strength helper
  const getPasswordStrength = (pwd: string): { label: "Weak" | "Medium" | "Strong"; score: 0 | 1 | 2 | 3 } => {
    if (!pwd) return { label: "Weak", score: 0 };
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const longEnough = pwd.length >= 8;

    const met = [hasLower, hasUpper, hasSpecial].filter(Boolean).length;

    if (met <= 1 || pwd.length < 6) return { label: "Weak", score: 1 };
    if (met === 2 || (met === 3 && !longEnough)) return { label: "Medium", score: 2 };
    return { label: "Strong", score: 3 };
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<DistributorFormData>({
    resolver: zodResolver(distributorSchema),
  });

  const genderValue = watch("gender");

  const onSubmit = async (data: DistributorFormData) => {
    if (!admin_id) {
      toast({
        title: "Authentication Error",
        description: "Admin ID not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/create/md`,
        {
          admin_id,
          master_distributor_name: data.name,
          master_distributor_email: data.email,
          master_distributor_password: data.password,
          master_distributor_phone: data.phone,
          master_distributor_aadhar_number: data.aadhar,
          master_distributor_pan_number: data.pan,
          master_distributor_date_of_birth: data.dob,
          master_distributor_gender: data.gender,
          master_distributor_city: data.city,
          master_distributor_state: data.state,
          master_distributor_address: data.address,
          master_distributor_pincode: data.pincode,
          business_name: data.business_name,
          business_type: data.business_type,
          gst_number: data.gst_number || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const res = response.data;

      if (res.status === "success") {
        toast({
          title: "Master Distributor Created",
          description: res.message || `${data.name} added successfully.`,
        });
        reset();
      } else {
        toast({
          title: "Creation Failed",
          description: res.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Network Error",
        description: error.response?.data?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      <Card>
        <CardHeader className="gradient-primary text-primary-foreground rounded-t-xl">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-2xl">
                Create Master Distributor
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-1">
                Add a new master distributor to your network.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 bg-card p-8 rounded-xl shadow-md border border-border"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Paybazaar"
              {...register("name")}
              className="h-11"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="paybazaar@example.com"
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
                placeholder="••••••••"
                {...register("password")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  register("password").onChange(e);
                }}
                className="h-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
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
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
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
              onValueChange={(value) => setValue("gender", value as DistributorFormData["gender"])}
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
              <Input id="city" placeholder="Mumbai" {...register("city")} className="h-11" />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Maharashtra"
                {...register("state")}
                className="h-11"
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Sector 21, Navi Mumbai"
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
              placeholder="400703"
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
              {isSubmitting ? "Creating..." : "Create Master Distributor"}
            </Button>
          </div>
        </form>
      </Card>

      <Toaster />
    </div>
  );
};

export default CreateMasterDistributorPage;
