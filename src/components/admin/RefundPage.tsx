import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCcw,
  AlertCircle,
  TrendingUp,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  transaction_id: string;
  amount: string;
  status: string;
  retailer_mobile: string;
  retailer_name: string;
  created_at: string;
  operator: string;
  recharge_number: string;
}

// Dummy data - expanded for pagination
const dummyTransactions: Transaction[] = [
  {
    transaction_id: "TXN001234567890",
    amount: "299",
    status: "pending",
    retailer_mobile: "9876543210",
    retailer_name: "Rajesh Kumar",
    created_at: "2024-12-06T10:30:00",
    operator: "Airtel",
    recharge_number: "9123456789",
  },
  {
    transaction_id: "TXN001234567891",
    amount: "499",
    status: "failed",
    retailer_mobile: "9876543211",
    retailer_name: "Priya Sharma",
    created_at: "2024-12-06T09:15:00",
    operator: "Jio",
    recharge_number: "9123456788",
  },
  {
    transaction_id: "TXN001234567892",
    amount: "199",
    status: "pending",
    retailer_mobile: "9876543212",
    retailer_name: "Amit Patel",
    created_at: "2024-12-06T08:45:00",
    operator: "Vi",
    recharge_number: "9123456787",
  },
  {
    transaction_id: "TXN001234567893",
    amount: "599",
    status: "failed",
    retailer_mobile: "9876543213",
    retailer_name: "Sneha Reddy",
    created_at: "2024-12-05T16:20:00",
    operator: "BSNL",
    recharge_number: "9123456786",
  },
  {
    transaction_id: "TXN001234567894",
    amount: "149",
    status: "pending",
    retailer_mobile: "9876543214",
    retailer_name: "Vikram Singh",
    created_at: "2024-12-05T14:10:00",
    operator: "Airtel",
    recharge_number: "9123456785",
  },
  {
    transaction_id: "TXN001234567895",
    amount: "399",
    status: "failed",
    retailer_mobile: "9876543215",
    retailer_name: "Anita Desai",
    created_at: "2024-12-05T12:30:00",
    operator: "Jio",
    recharge_number: "9123456784",
  },
  {
    transaction_id: "TXN001234567896",
    amount: "249",
    status: "pending",
    retailer_mobile: "9876543216",
    retailer_name: "Rahul Verma",
    created_at: "2024-12-05T11:20:00",
    operator: "Vi",
    recharge_number: "9123456783",
  },
  {
    transaction_id: "TXN001234567897",
    amount: "699",
    status: "failed",
    retailer_mobile: "9876543217",
    retailer_name: "Deepak Rao",
    created_at: "2024-12-04T18:45:00",
    operator: "Airtel",
    recharge_number: "9123456782",
  },
  {
    transaction_id: "TXN001234567898",
    amount: "179",
    status: "pending",
    retailer_mobile: "9876543218",
    retailer_name: "Kavita Nair",
    created_at: "2024-12-04T15:30:00",
    operator: "BSNL",
    recharge_number: "9123456781",
  },
  {
    transaction_id: "TXN001234567899",
    amount: "449",
    status: "failed",
    retailer_mobile: "9876543219",
    retailer_name: "Suresh Mehta",
    created_at: "2024-12-04T13:15:00",
    operator: "Jio",
    recharge_number: "9123456780",
  },
  {
    transaction_id: "TXN001234567900",
    amount: "329",
    status: "pending",
    retailer_mobile: "9876543220",
    retailer_name: "Meena Iyer",
    created_at: "2024-12-04T10:00:00",
    operator: "Vi",
    recharge_number: "9123456779",
  },
  {
    transaction_id: "TXN001234567901",
    amount: "549",
    status: "failed",
    retailer_mobile: "9876543221",
    retailer_name: "Arun Pillai",
    created_at: "2024-12-03T16:45:00",
    operator: "Airtel",
    recharge_number: "9123456778",
  },
];

export default function RefundPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions] = useState<Transaction[]>(dummyTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate statistics
  const totalTransactions = transactions.length;
  const pendingCount = transactions.filter((t) => t.status.toLowerCase() === "pending").length;
  const failedCount = transactions.filter((t) => t.status.toLowerCase() === "failed").length;
  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.retailer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.retailer_mobile.includes(searchTerm) ||
    transaction.recharge_number.includes(searchTerm) ||
    transaction.operator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;

    try {
      setIsRefunding(true);
      const token = localStorage.getItem("authToken");

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/refund`,
        {
          transaction_id: selectedTransaction.transaction_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Refund processed successfully",
        });
        setShowRefundDialog(false);
        setSelectedTransaction(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "failed":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const canRefund = (status: string) => {
    return status.toLowerCase() === "pending" || status.toLowerCase() === "failed";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and process transaction refunds
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All refundable transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Failed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Refundable amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl">Transaction History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 flex-1 md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Transaction ID</TableHead>
                  <TableHead className="font-semibold">Retailer</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Recharge Number</TableHead>
                  <TableHead className="font-semibold">Operator</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date & Time</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((transaction) => (
                    <TableRow key={transaction.transaction_id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.retailer_name}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.retailer_mobile}
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.recharge_number}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.operator}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-base">
                        ₹{transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {canRefund(transaction.status) ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowRefundDialog(true);
                            }}
                            className="gap-1"
                          >
                            <RefreshCcw className="h-3 w-3" />
                            Refund
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not available
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 opacity-50" />
                        <div>
                          <p className="font-medium">No transactions found</p>
                          <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length} transactions
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-red-600" />
              Confirm Refund
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                Are you sure you want to refund this transaction to the retailer's wallet?
              </p>
              {selectedTransaction && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2.5 border">
                  <p className="font-semibold text-foreground text-sm">Transaction Details:</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono font-medium text-foreground">
                        {selectedTransaction.transaction_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-foreground text-base">
                        ₹{selectedTransaction.amount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retailer:</span>
                      <span className="font-medium text-foreground">
                        {selectedTransaction.retailer_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-medium text-foreground">
                        {selectedTransaction.retailer_mobile}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operator:</span>
                      <span className="font-medium text-foreground">
                        {selectedTransaction.operator}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={isRefunding}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRefunding ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Yes, Refund
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}