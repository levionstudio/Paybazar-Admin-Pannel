import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const distributorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
});

type DistributorFormData = z.infer<typeof distributorSchema>;

interface DecodedToken {
  data: {
    admin_id?: string;
    master_distributor_id?: string;
  };
  exp: number;
}

interface MasterDistributor {
  master_distributor_id: string;
  master_distributor_name: string;
  master_distributor_email?: string;
  [key: string]: any;
}

const CreateDistributorPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole") || "master";

  const token = localStorage.getItem("authToken");

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([]);
  const [selectedMasterDistributorId, setSelectedMasterDistributorId] = useState<string>("");
  const [loadingMasterDistributors, setLoadingMasterDistributors] = useState(false);

  // Decode IDs - use useMemo to make it reactive
  const { admin_id, master_distributor_id } = useMemo(() => {
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        return {
          admin_id: decoded?.data?.admin_id || "",
          master_distributor_id: decoded?.data?.master_distributor_id || "",
        };
      } catch (e) {
        console.error("Error decoding token:", e);
        return { admin_id: "", master_distributor_id: "" };
      }
    }
    return { admin_id: "", master_distributor_id: "" };
  }, [token]);

  // Fetch master distributors
  useEffect(() => {
    const fetchMasterDistributors = async () => {
      if (!admin_id || !token) {
        console.log("Missing admin_id or token:", { admin_id, hasToken: !!token });
        return;
      }

      setLoadingMasterDistributors(true);
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/get/md/${admin_id}`;
        console.log("Fetching master distributors from:", apiUrl);
        
        const res = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Master distributors response:", res.data);

        if (res.data.status === "success" && res.data.data) {
          let distributors = Array.isArray(res.data.data) 
            ? res.data.data 
            : res.data.data.master_distributors || res.data.data || [];
          
          // Normalize the data structure
          // The API provides both master_distributor_id (UUID) and master_distributor_unique_id
          // We use master_distributor_id (UUID) for API calls and master_distributor_name for display
          distributors = distributors.map((md: any) => {
            return {
              master_distributor_id: md.master_distributor_id, // UUID - use this for API calls
              master_distributor_unique_id: md.master_distributor_unique_id, // e.g., "MD0000007"
              master_distributor_name: md.master_distributor_name, // Display name
              master_distributor_email: md.master_distributor_email,
              ...md // Keep all original fields
            };
          });
          
          // Filter out items without master_distributor_id
          distributors = distributors.filter((md: any) => {
            const hasId = md.master_distributor_id;
            if (!hasId) {
              console.warn("Filtering out distributor without master_distributor_id:", md);
            }
            return hasId;
          });
          
          console.log("Processed distributors:", distributors);
          console.log("Distributor IDs:", distributors.map((md: any) => md.master_distributor_id));
          console.log("Distributor Names:", distributors.map((md: any) => md.master_distributor_name));
          
          setMasterDistributors(distributors);
          
          // Auto-select if only one master distributor
          if (distributors.length === 1) {
            setSelectedMasterDistributorId(distributors[0].master_distributor_id);
          } else {
            // Reset selection if multiple or none
            setSelectedMasterDistributorId("");
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load master distributors",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Error fetching master distributors:", err);
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load master distributors",
          variant: "destructive",
        });
      } finally {
        setLoadingMasterDistributors(false);
      }
    };

    fetchMasterDistributors();
  }, [admin_id, token]);

  // Fetch wallet balance dynamically (only if master distributor is selected)
 


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
        title: "Invalid Session",
        description: "Missing required authentication info. Please log in again.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (!selectedMasterDistributorId) {
      toast({
        title: "Selection Required",
        description: "Please select a master distributor.",
        variant: "destructive",
      });
      return;
    }

    // Get the selected master distributor to verify
    const selectedMD = masterDistributors.find(md => md.master_distributor_id === selectedMasterDistributorId);
    
    if (!selectedMD) {
      toast({
        title: "Invalid Selection",
        description: "Selected master distributor not found. Please select again.",
        variant: "destructive",
      });
      return;
    }

    // selectedMasterDistributorId contains the master_distributor_id (UUID)
    const requestPayload = {
      admin_id,
      master_distributor_id: selectedMasterDistributorId, // This is the UUID
      distributor_name: data.name,
      distributor_email: data.email,
      distributor_password: data.password,
      distributor_phone: data.phone,
    };
    
    console.log("Creating distributor with:", {
      ...requestPayload,
      master_distributor_name: selectedMD.master_distributor_name,
      master_distributor_unique_id: selectedMD.master_distributor_unique_id,
    });
    console.log("Request payload being sent:", requestPayload);
    console.log("API URL:", `${import.meta.env.VITE_API_BASE_URL}/md/create/distributor`);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/create/distributor`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const res = response.data;
      
      console.log("API Response:", res);

      if (res.status === "success") {
        toast({
          title: "Distributor Created",
          description: res.message || `${data.name} added successfully under ${selectedMD.master_distributor_name}.`,
        });
        reset();
        // Keep the master distributor selected so user can create more distributors under the same MD
        // If you want to reset it, uncomment the line below:
        // setSelectedMasterDistributorId("");
      } else {
        console.error("API Error Response:", res);
        toast({
          title: "Creation Failed",
          description: res.message || res.msg || "Something went wrong. Please check the console for details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating distributor:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.msg || 
                          error.message || 
                          "Please try again later.";
      
      toast({
        title: "Network Error",
        description: errorMessage,
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
                <CardTitle className="text-2xl">Create New Distributor</CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-1">
                  Add a new distributor to your network.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 bg-card p-8 rounded-xl shadow-md border border-border"
          >
            {/* Master Distributor Selection */}
            <div className="space-y-2">
              <Label htmlFor="masterDistributor">Master Distributor</Label>
              {loadingMasterDistributors ? (
                <div className="flex items-center gap-2 h-11 px-3 border border-input rounded-md bg-background">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading master distributors...</span>
                </div>
              ) : (
                <Select
                  value={selectedMasterDistributorId || ""}
                  onValueChange={(value) => {
                    setSelectedMasterDistributorId(value);
                    const selectedMD = masterDistributors.find(md => md.master_distributor_id === value);
                    if (selectedMD) {
                      console.log("Selected:", selectedMD.master_distributor_name, "UUID:", value);
                    }
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
                      masterDistributors.map((md, index) => {
                        // Use master_distributor_id (UUID) as the value
                        const value = md.master_distributor_id;
                        // Display master_distributor_name
                        const displayName = md.master_distributor_name || md.master_distributor_email || `MD-${index + 1}`;
                        
                        return (
                          <SelectItem
                            key={`md-${md.master_distributor_id}-${index}`}
                            value={value}
                          >
                            {displayName}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
              {!selectedMasterDistributorId && !loadingMasterDistributors && (
                <p className="text-sm text-destructive">
                  Please select a master distributor
                </p>
              )}
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            {/* Password with eye toggle */}
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password")}
                className="h-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-12 -translate-y-1/2 text-muted-foreground hover:text-primary focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
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
                {isSubmitting ? "Creating..." : "Create Distributor"}
              </Button>
            </div>
          </form>
        </Card>

        <Toaster />
      </div>
      
  );
};

export default CreateDistributorPage;
