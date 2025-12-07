import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  UserCheck,
  Settings,
  HelpCircle,
  Activity,
  Bell,
  Menu,
  X,
  CreditCard,
  BarChart3,
  Shield,
  Wallet,
  ChevronDown,
  ChevronRight,
  History,
  Send,
  ArrowLeftRight,
  RotateCcw,
  Edit,
  Undo,
  MapPin,
  Info,
  Ticket,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import payBazaarLogo from "@/assets/paybazaar-logo.png";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  data: { 
    admin_id: string; 
    admin_unique_id?: string;
    admin_name?: string;
    [key: string]: any 
  };
}


const navigation = [
 { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
];

const transactionLogsSubMenu = [
  { name: "Admin Transaction", href: "/admin/logs", icon: FileText },
  { name: "Payout Transaction", href: "/admin/logs/payout", icon: FileText },
  // { name: "Revert History", href: "/admin/logs/revert-history", icon: History },
  // { name: "Refund History", href: "/admin/logs/refund-history", icon: RefreshCcw },
];

const navigations = [
  { name: "Wallet Top Up", href: "/admin/wallet", icon: Wallet },
  { name: "Tickets", href: "/admin/tickets", icon: Ticket },
];

const create = [
  { name: "MD", href: "/admin/create/md", icon: UserCheck },
  { name: "Distributor", href: "/admin/create/distributor", icon: UserCheck },
  { name: "User", href: "/admin/create/user", icon: UserCheck },
]

const info = [
  { name: "MD", href: "/admin/info/md", icon: UserCheck },
  { name: "Distributor", href: "/admin/info/distributor", icon: UserCheck },
  { name: "User", href: "/admin/info/user", icon: UserCheck },
]

const fundsSubMenu = [
  { name: "Fund Request", href: "/admin/funds/request", icon: Send },
  { name: "Revert Request", href: "/admin/funds/revert", icon: RotateCcw },
  // { name: "Refund", href: "/admin/funds/refund", icon: RefreshCcw },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [adminDetails, setAdminDetails] = useState<any>({});
  const location = useLocation();
  const [fundsExpanded, setFundsExpanded] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [transactionLogsExpanded, setTransactionLogsExpanded] = useState(false);


  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const getAdminDetails = async () => {
    const token = localStorage.getItem("authToken");
    const decoded = jwtDecode<JWTPayload>(token);
    setAdminDetails(decoded.data);
  };

  useEffect(() => {
    getAdminDetails();
  }, []);

  const isFundsActive = location.pathname.startsWith("/admin/funds");
  const isCreateActive = location.pathname.startsWith("/admin/create");
  const isInfoActive = location.pathname.startsWith("/admin/info");
  const isTransactionLogsActive = location.pathname.startsWith("/admin/logs");

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col bg-card shadow-elevated border-r border-border">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <img src={payBazaarLogo} alt="PayBazaar" className="h-8 w-auto" />
              <div>
                <h1 className="font-poppins font-semibold text-lg text-primary">
                  PayBazaar
                </h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive(item.href)
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive(item.href)
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-secondary-foreground"
                    )}
                  />
                  {item.name}
                </NavLink>
              );
            })}

            {/* Funds Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setFundsExpanded(!fundsExpanded)}
                className={cn(
                  "group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isFundsActive
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <Wallet
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isFundsActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-secondary-foreground"
                    )}
                  />
                  Funds
                </div>
                {fundsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Funds Submenu (includes Fund Request, Revert Request, and Refund) */}
              {fundsExpanded && (
                <div className="ml-6 space-y-1">
                  {fundsSubMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-secondary-foreground"
                          )}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Transaction Logs Dropdown */}
              <button
                onClick={() => setTransactionLogsExpanded(!transactionLogsExpanded)}
                className={cn(
                  "group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isTransactionLogsActive
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <FileText
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isTransactionLogsActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-secondary-foreground"
                    )}
                  />
                  Transaction Logs
                </div>
                {transactionLogsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Transaction Logs Submenu */}
              {transactionLogsExpanded && (
                <div className="ml-6 space-y-1">
                  {transactionLogsSubMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-secondary-foreground"
                          )}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
             
              {navigations.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive(item.href)
                        ? "gradient-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                        isActive(item.href)
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-secondary-foreground"
                      )}
                    />
                    {item.name} 
                  </NavLink>
                );
              })}

              {/* Create Dropdown */}
              <button
                onClick={() => setCreateExpanded(!createExpanded)}
                className={cn(
                  "group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isCreateActive
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <UserCheck
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isCreateActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-secondary-foreground"
                    )}
                  />
                  Create
                </div>
                {createExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Create Submenu */}
              {createExpanded && (
                <div className="ml-6 space-y-1">
                  {create.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-secondary-foreground"
                          )}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Info Dropdown */}
              <button
                onClick={() => setInfoExpanded(!infoExpanded)}
                className={cn(
                  "group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isInfoActive
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <Info
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isInfoActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-secondary-foreground"
                    )}
                  />
                  Info
                </div>
                {infoExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Info Submenu */}
              {infoExpanded && (
                <div className="ml-6 space-y-1">
                  {info.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-secondary-foreground"
                          )}
                        />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
          

          {/* Admin Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  {adminDetails.admin_name ? adminDetails.admin_name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {adminDetails.admin_name || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {adminDetails.admin_unique_id || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}