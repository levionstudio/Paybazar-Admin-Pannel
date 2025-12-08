import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Eye, RotateCcw } from "lucide-react";

interface DecodedToken {
  data: {
    admin_id: string;
    [key: string]: any;
  };
  exp: number;
}

interface User {
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  [key: string]: any;
}

interface PayoutTransaction {
  transaction_id: string;
  payout_transaction_id: string;
  phone_number: string;
  bank_name: string;
  beneficiary_name: string;
  account_number: string;
  amount: string;
  commission: string;
  transfer_type: string;
  transaction_status: string;
  transaction_date_and_time: string;
}

const PayoutTransactionPage = () => {
  const token = localStorage.getItem("authToken");
  const [adminId, setAdminId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PayoutTransaction | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [transactionToRefund, setTransactionToRefund] = useState<PayoutTransaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Decode token to get admin_id
  useEffect(() => {
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setAdminId(decoded?.data?.admin_id || "");
      } catch (error) {
        console.error("Error decoding token:", error);
        toast.error("Invalid token. Please log in again.");
      }
    }
  }, [token]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!adminId || !token) return;

      setLoadingUsers(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get/user/${adminId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.status === "success" && response.data.data) {
          const usersList = Array.isArray(response.data.data)
            ? response.data.data
            : response.data.data.users || [];
          setUsers(usersList);
        } else {
          setUsers([]);
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [adminId, token]);

  // Fetch transactions when user is selected
  const fetchTransactions = async () => {
    if (!selectedUserId || !token) return;

    setLoadingTransactions(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/user/payout/get/transactions/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success" && response.data.data) {
        const transactionsList = response.data.data.transactions || [];
        
        // Sort transactions by date and time (latest/most recent first)
        const sortedTransactions = [...transactionsList].sort((a: PayoutTransaction, b: PayoutTransaction) => {
          try {
            // Parse dates and handle invalid dates
            const dateA = new Date(a.transaction_date_and_time);
            const dateB = new Date(b.transaction_date_and_time);
            
            // Check for invalid dates
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            
            // Descending order: most recent (highest timestamp) first
            return timeB - timeA;
          } catch (error) {
            console.error("Error sorting dates:", error);
            return 0;
          }
        });
        
        console.log("Sorted transactions (first 3):", sortedTransactions.slice(0, 3).map(t => ({
          id: t.transaction_id,
          date: t.transaction_date_and_time
        })));
        
        setTransactions(sortedTransactions);
        toast.success(`Loaded ${sortedTransactions.length} transactions`);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchTransactions();
      setCurrentPage(1);
    } else {
      setTransactions([]);
    }
  }, [selectedUserId]);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Success
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Failed
          </Badge>
        );
      case "REFUND":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleViewDetails = (transaction: PayoutTransaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleRefundClick = (transaction: PayoutTransaction) => {
    setTransactionToRefund(transaction);
    setRefundDialogOpen(true);
  };

  const handleRefund = async () => {
    if (!transactionToRefund || !token) return;

    try {
      setIsRefunding(true);

      console.log("🔄 Refund Request:");
      console.log("Transaction ID:", transactionToRefund.transaction_id);
      console.log("Payout Transaction ID:", transactionToRefund.payout_transaction_id);

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/user/payout/refund/${transactionToRefund.payout_transaction_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Refund Response:", response.data);

      if (response.data.status === "success") {
        toast.success("Refund processed successfully");
        setRefundDialogOpen(false);
        setTransactionToRefund(null);
        // Refresh transactions list
        fetchTransactions();
      } else {
        toast.error(response.data.message || "Failed to process refund");
      }
    } catch (error: any) {
      console.error("❌ Error processing refund:", error);
      toast.error(
        error.response?.data?.message || "Failed to process refund"
      );
    } finally {
      setIsRefunding(false);
    }
  };

  const canRefund = (status: string) => {
    const statusUpper = status.toUpperCase();
    // Can refund: SUCCESS, PENDING, FAILED
    // Cannot refund: REFUND (already refunded)
    return statusUpper !== "REFUND";
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Generate page numbers to show (max 10 visible page buttons)
  const getPageNumbers = () => {
    const maxVisiblePages = 10;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payout Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View payout transaction history by user (Latest first)
          </p>
        </div>
        {selectedUserId && (
          <Button onClick={fetchTransactions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* User Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="user-select">Select User</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingUsers}
            >
              <SelectTrigger id="user-select" className="w-full">
                <SelectValue placeholder="Choose a user to view transactions" />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Loading users...</span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.user_name}
                      {user.user_email && ` (${user.user_email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {selectedUserId && (
        <Card>
          <CardContent className="p-0">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center whitespace-nowrap">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap">
                        Phone Number
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap">
                        Date & Time
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTransactions.map((tx) => (
                        <TableRow key={tx.transaction_id}>
                          <TableCell className="font-mono text-center whitespace-nowrap">
                            {tx.transaction_id}
                          </TableCell>
                          <TableCell className="text-center">
                            {tx.phone_number}
                          </TableCell>
                          <TableCell className="font-semibold text-center whitespace-nowrap">
                            ₹{formatAmount(tx.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(tx.transaction_status)}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {formatDate(tx.transaction_date_and_time)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(tx)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRefundClick(tx)}
                                disabled={tx.transaction_status.toUpperCase() === "REFUND"}
                                className={tx.transaction_status.toUpperCase() === "REFUND" ? "opacity-30 cursor-not-allowed" : ""}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Refund
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of{" "}
                {transactions.length} transactions
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 flex-wrap">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transaction ID
                  </Label>
                  <p className="font-mono text-sm">{selectedTransaction.transaction_id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </Label>
                  <p className="text-sm">{selectedTransaction.phone_number}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Bank Name
                  </Label>
                  <p className="text-sm">{selectedTransaction.bank_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Beneficiary Name
                  </Label>
                  <p className="text-sm">{selectedTransaction.beneficiary_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Account Number
                  </Label>
                  <p className="text-sm">{selectedTransaction.account_number}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{formatAmount(selectedTransaction.amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transfer Type
                  </Label>
                  <p className="text-sm">{selectedTransaction.transfer_type}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div>{getStatusBadge(selectedTransaction.transaction_status)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date & Time
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedTransaction.transaction_date_and_time)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Commission Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between p-3 bg-secondary/50 rounded">
                    <span className="text-sm font-medium">Admin Commission:</span>
                    <span className="text-sm font-semibold">
                      ₹{formatAmount((parseFloat(selectedTransaction.commission) * 0.2917).toString())}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary/50 rounded">
                    <span className="text-sm font-medium">MD Commission:</span>
                    <span className="text-sm font-semibold">
                      ₹{formatAmount((parseFloat(selectedTransaction.commission) * 0.0417).toString())}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary/50 rounded">
                    <span className="text-sm font-medium">Distributor Commission:</span>
                    <span className="text-sm font-semibold">
                      ₹{formatAmount((parseFloat(selectedTransaction.commission) * 0.1667).toString())}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary/50 rounded">
                    <span className="text-sm font-medium">Retailer Commission:</span>
                    <span className="text-sm font-semibold">
                      ₹{formatAmount((parseFloat(selectedTransaction.commission) * 0.50).toString())}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-primary/10 rounded">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Commission:</span>
                    <span className="font-bold text-lg">
                      ₹{formatAmount(selectedTransaction.commission)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-600" />
              Confirm Refund
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                Are you sure you want to refund this transaction? This action cannot be undone.
              </p>
              {transactionToRefund && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2.5 border">
                  <p className="font-semibold text-foreground text-sm">Transaction Details:</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono font-medium text-foreground">
                        {transactionToRefund.transaction_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payout ID:</span>
                      <span className="font-mono font-medium text-foreground">
                        {transactionToRefund.payout_transaction_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-foreground text-base">
                        ₹{formatAmount(transactionToRefund.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficiary:</span>
                      <span className="font-medium text-foreground">
                        {transactionToRefund.beneficiary_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground font-mono">
                        {transactionToRefund.phone_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium text-foreground">
                        {transactionToRefund.bank_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(transactionToRefund.transaction_status)}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Yes, Refund
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PayoutTransactionPage;