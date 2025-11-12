import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import payBazaarLogo from "@/assets/paybazaar-logo.png";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const { toast } = useToast();
  // Add this helper (above the return)
function getPasswordStrength(pwd: string): { label: "Weak" | "Medium" | "Strong"; score: 0 | 1 | 2 | 3 } {
  if (!pwd) return { label: "Weak", score: 0 };
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const longEnough = pwd.length >= 8;

  const met = [hasLower, hasUpper, hasSpecial].filter(Boolean).length;

  if (met <= 1 || pwd.length < 6) return { label: "Weak", score: 1 };
  if (met === 2 || (met === 3 && !longEnough)) return { label: "Medium", score: 2 };
  return { label: "Strong", score: 3 };
}

// Inside the component, after your state declarations:
const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_email: email,
          admin_password: password,
        }),
      });

      const data = await response.json();


      if (response.ok && data.status === "success") {
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard",
        });

        localStorage.setItem("authToken", data.data.token);
        navigate("/admin/funds/request");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-card p-3 rounded-2xl shadow-elevated">
              <img
                src={payBazaarLogo}
                alt="PayBazaar"
                className="h-12 w-auto"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-poppins text-primary-foreground mb-2">
            PayBazaar Admin 
          </h1>
          <p className="text-primary-foreground/80">
            Secure access to your admin dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-poppins flex items-center justify-center">
              <Shield className="mr-2 h-5 w-5 text-primary" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className=" pr-9"
                    required
                  />
                  <br />
                  {password && (
  <div className="space-y-1 pt-1">
    <div className="h-1.5 w-full bg-muted rounded">
      <div
        className={[
          "h-full rounded transition-all",
          strength.score === 1 ? "w-1/3 bg-destructive" :
          strength.score === 2 ? "w-2/3 bg-orange-500" :
          strength.score === 3 ? "w-full bg-emerald-500" : "w-0"
        ].join(" ")}
      />
    </div>
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Password strength:{" "}
        <span className={[
          "font-medium",
          strength.label === "Weak" ? "text-destructive" :
          strength.label === "Medium" ? "text-orange-500" : "text-emerald-600"
        ].join(" ")}>
          {strength.label}
        </span>
      </p>
      {(strength.label !== "Strong") && (
        <p className="text-[10px] text-muted-foreground">
          Use uppercase, lowercase, and a special character
        </p>
      )}
    </div>
  </div>
)}
                  <div
                    className="absolute right-5 top-5 -translate-y-1/2 cursor-pointer text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-primary-foreground/60">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
