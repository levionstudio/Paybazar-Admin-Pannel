import { Bell, Search, Settings, LogOut, Menu, Wallet, PersonStanding, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { useLocation } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any };
}

export function Header({ onMenuClick }: HeaderProps) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [hideBalance, setHideBalance] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setHideBalance(location.pathname === "/admin/funds/request");
  }, [location.pathname]);
  

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token not found");
        return null;
      }
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.data.admin_id;
    } catch (error) {
      toast.error("Authentication token not found");

      return null;
    }
  };
  const admin_id = getAdminId();

  useEffect(() => {
    const fetchWalletBalance = async () => {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/admin/wallet/get/balance/${admin_id}`
      );
      setWalletBalance(response.data.data.balance);
    };
    fetchWalletBalance();
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions, users, or logs..."
              className="pl-9 bg-secondary/50 border-border focus:bg-card"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          {hideBalance ? null : (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-wallet-bg border border-wallet-border">
              <Wallet className="w-4 h-4 text-wallet-text" />
              <span className="text-sm font-semibold text-wallet-text">
                ₹{walletBalance.toLocaleString()}
              </span>
            </div>
          )}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">New KYC Pending</p>
                  <p className="text-xs text-muted-foreground">
                    John Doe submitted KYC documents for review
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">High Commission Alert</p>
                  <p className="text-xs text-muted-foreground">
                    Commission threshold exceeded for retailer RT001
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">API Error Detected</p>
                  <p className="text-xs text-muted-foreground">
                    Multiple API failures detected in DMT service
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0">
                <div className="w-8 h-8 rounded-full hover:rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-md font-medium text-primary-foreground">
                    <User />
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
