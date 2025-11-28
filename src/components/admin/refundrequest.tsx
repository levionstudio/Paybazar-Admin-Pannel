import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, RotateCcw } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface UserDetails {
  name: string;
  phone: string;
  userId: string;
  currentBalance: number;
}

interface JWTPayload {
  data: { 
    admin_id: string;
    [key: string]: any 
  };
}

export default function RefundRequest() {
  const [userType, setUserType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get admin ID from token
  const getAdminId = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return "";
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.data.admin_id || "";
    } catch (error) {
      console.error("Error decoding token:", error);
      return "";
    }
  };

  // API endpoints based on user type
  const getSearchEndpoint = (type: string, phone: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const endpoints = {
      "master-distributor": `${baseUrl}/admin/get/md/phone/${phone}`,
      distributor: `${baseUrl}/admin/get/distributor/phone/${phone}`,
      retailer: `${baseUrl}/admin/get/user/phone/${phone}`,
    };
    return endpoints[type] || "";
  };

  const getRefundEndpoint = (type: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const endpoints = {
      "master-distributor": `${baseUrl}/admin/md/wallet/refund`,
      distributor: `${baseUrl}/admin/distributor/wallet/refund`,
      retailer: `${baseUrl}/admin/user/wallet/refund`,
    };
    return endpoints[type] || "";
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    setPhoneNumber("");
    setAmount("");
    setUserDetails(null);
  };

  const handleSearchUser = async () => {
    if (!userType) {
      toast.error("Please select user type");
      return;
    }

    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSearching(true);
    try {
      const endpoint = getSearchEndpoint(userType, phoneNumber);
      const token = localStorage.getItem("authToken");

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.success)) {
        // Extract user details from response based on user type
        const userData = data.data;
        
        let name, phone, userId, balance;
        
        if (userType === "master-distributor") {
          name = userData.master_distributor_name;
          phone = userData.master_distributor_phone;
          userId = userData.master_distributor_unique_id;
          balance = userData.master_distributor_wallet_balance;
        } else if (userType === "distributor") {
          name = userData.distributor_name;
          phone = userData.distributor_phone;
          userId = userData.distributor_unique_id;
          balance = userData.distributor_wallet_balance;
        } else { // retailer
          name = userData.user_name;
          phone = userData.user_phone;
          userId = userData.user_unique_id;
          balance = userData.user_wallet_balance;
        }
        
        setUserDetails({
          name: name || "N/A",
          phone: phone || phoneNumber,
          userId: userId || "N/A",
          currentBalance: parseFloat(balance || "0"),
        });
        toast.success(data.msg || "User found successfully");
      } else {
        // Handle error responses
        if (response.status === 404) {
          const userTypeText = userType === "master-distributor" 
            ? "Master Distributor" 
            : userType === "distributor" 
            ? "Distributor" 
            : "Retailer";
          toast.error(`${userTypeText} with phone number ${phoneNumber} not found or not registered`);
        } else if (response.status === 500) {
          toast.error("Phone number not registered in the system");
        } else {
          toast.error(data.msg || data.message || "User not found");
        }
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      const userTypeText = userType === "master-distributor" 
        ? "Master Distributor" 
        : userType === "distributor" 
        ? "Distributor" 
        : "Retailer";
      toast.error(`${userTypeText} with phone number ${phoneNumber} not found or not registered`);
      setUserDetails(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefund = async () => {
    if (!userDetails) {
      toast.error("Please search for a user first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if user has sufficient balance
    const refundAmount = parseFloat(amount);
    if (refundAmount > userDetails.currentBalance) {
      const userTypeText = userType === "master-distributor" 
        ? "Master Distributor" 
        : userType === "distributor" 
        ? "Distributor" 
        : "Retailer";
      toast.error(`Insufficient balance of ${userTypeText} for refund. Current balance: ₹${userDetails.currentBalance.toFixed(2)}`);
      return;
    }

    const adminId = getAdminId();
    if (!adminId) {
      toast.error("Admin ID not found. Please login again.");
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = getRefundEndpoint(userType);
      const token = localStorage.getItem("authToken");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_id: adminId,
          phone_number: phoneNumber,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.success)) {
        toast.success(data.msg || "Refund processed successfully");
        // Reset form
        setAmount("");
        setUserDetails(null);
        setPhoneNumber("");
      } else {
        toast.error(data.msg || data.message || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUserType("");
    setPhoneNumber("");
    setAmount("");
    setUserDetails(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Revert Request</h1>
          <p className="text-muted-foreground mt-1">
            Process Revert requests for Master Distributors, Distributors, and Retailers
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Revert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="userType" className="text-sm font-medium">
              Select User Type
            </Label>
            <Select value={userType} onValueChange={handleUserTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="--Select User Type--" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="sticky top-0 bg-background p-2 border-b">
                  <Input
                    placeholder="Search user type..."
                    className="h-9"
                    type="text"
                    style={{ fontSize: "16px" }}
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const items = document.querySelectorAll('[role="option"]');
                      items.forEach((item) => {
                        const text = item.textContent?.toLowerCase() || "";
                        item.classList.toggle("hidden", !text.includes(searchTerm));
                      });
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <SelectItem value="master-distributor">
                  Master Distributor
                </SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Search */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                style={{ fontSize: "16px" }}
                disabled={!userType}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleSearchUser}
                disabled={isSearching || !userType || phoneNumber.length !== 10}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search User
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* User Details Display */}
          {userDetails && (
            <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm text-primary mb-3">
                User Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{userDetails.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{userDetails.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <p className="font-medium">{userDetails.userId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Balance:</span>
                  <p className="font-medium text-green-600">
                    ₹{userDetails.currentBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Refund Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Revert Amount
            </Label>
            <Input
              id="amount"
              type="tel"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, "");
                if (value.split(".").length <= 2) {
                  setAmount(value);
                }
              }}
              placeholder="Enter amount to revert"
              style={{ fontSize: "16px" }}
              disabled={!userDetails}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleRefund}
            disabled={isProcessing || !userDetails || !amount || parseFloat(amount) <= 0}
            className="w-full paybazaar-gradient text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Revert...
              </>
            ) : (
              "Process Refund"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}