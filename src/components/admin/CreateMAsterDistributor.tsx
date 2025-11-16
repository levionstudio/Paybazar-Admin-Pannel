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

const distributorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  phone: z.string().regex(/^\d{10,14}$/, "Invalid phone number"),
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
  } = useForm<DistributorFormData>({
    resolver: zodResolver(distributorSchema),
  });

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
