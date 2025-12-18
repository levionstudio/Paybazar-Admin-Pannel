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
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react";

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
  payout_transaction_id: string;
  transaction_id: string;
  distributor_id: string; // ✅ ADD THIS
  phone_number: string;
  bank_name: string;
  beneficiary_name: string;
  account_number: string;
  amount: string;
  commission: string;
  transfer_type: string;
  transaction_status: string;
  transaction_date_and_time: string;
  operator_transaction_id?: string;
}


const PayoutTransactionPage = () => {
  const token = localStorage.getItem("authToken");
  const [adminId, setAdminId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<PayoutTransaction | null>(null);
  const [operatorTxnId, setOperatorTxnId] = useState("");

  // Decode token to get admin_id
  useEffect(() => {
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setAdminId(decoded?.data?.admin_id || "");
      } catch (error) {
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
        `${
          import.meta.env.VITE_API_BASE_URL
        }/user/payout/get/transactions/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success" && response.data.data) {
        const transactionsList = response.data.data.transactions || [];
        const sortedTransactions = transactionsList.sort(
          (a: PayoutTransaction, b: PayoutTransaction) => {
            const dateA = new Date(a.transaction_date_and_time).getTime();
            const dateB = new Date(b.transaction_date_and_time).getTime();
            return dateB - dateA;
          }
        );
        setTransactions(sortedTransactions);
        toast.success(`Loaded ${sortedTransactions.length} transactions`);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error("", error);
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

  // Update transaction status
  const handleUpdateStatus = async (newStatus: "SUCCESS" | "FAILED" | "PENDING") => {
    

    if (!selectedTransaction || !token || !adminId) {
      console.error(" Missing required data");
      toast.error("Missing required data. Please refresh and try again.");
      return;
    }

    const requestPayload = {
      payout_transaction_id: selectedTransaction.payout_transaction_id,
      status: newStatus,
      operator_transaction_id: operatorTxnId.trim(),
    };

    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/update/payout/request`;
    
    setUpdatingStatus(true);
    
    try {
      const response = await axios.post(apiUrl, requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      const isSuccess = response.status === 200 && response.data?.status;

      if (isSuccess) {
        
        toast.success(
          `Transaction status updated to ${response.data.status.toUpperCase()} successfully`
        );
        
        const updatedStatus = response.data.status;
        const updatedOperatorTxnId = response.data.operator_transaction_id;
        
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.payout_transaction_id === selectedTransaction.payout_transaction_id
              ? {
                  ...tx,
                  transaction_status: updatedStatus,
                  operator_transaction_id: updatedOperatorTxnId || tx.operator_transaction_id,
                }
              : tx
          )
        );

        setSelectedTransaction({
          ...selectedTransaction,
          transaction_status: updatedStatus,
          operator_transaction_id: updatedOperatorTxnId || selectedTransaction.operator_transaction_id,
        });

        setOperatorTxnId("");
        setDetailsOpen(false);
        fetchTransactions();
      } else {
        console.error(" API returned non-success status");
        toast.error(response.data.message || "Failed to update transaction status");
      }
    } catch (error: any) {
      console.error(" ERROR:", error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Failed to update transaction status. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Success
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">
            Failed
          </Badge>
        );
      case "REFUND":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
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

const DISTRIBUTOR_COMMISSION_MAP: Record<
  string,
  {
    admin: number;
    md: number;
    distributor: number;
    retailer: number;
  }
> = {
  "4cd64ced-f620-4900-a0d4-a34292f5720c": {
    admin:  0.25,
    md: 0.05,
    distributor: 0.20,
    retailer: 0.50,
  },
  "32c4da17-0dd5-4ebd-80b9-52bffa8235b0": {
    admin: 0.25,
    md: 0.05,
    distributor: 0.20,
    retailer: 0.50,
  },
  "fc20cf02-5076-4564-858e-3c9f2ff5260a": {
    admin: 0.25,
    md: 0.05,
    distributor: 0.20,
    retailer: 0.50,
  },
  "158fb0c0-e3a5-404c-9b59-4014141402f5": {
    admin: 0.25,
    md: 0.05,
    distributor: 0.20,
    retailer: 0.50,
  },
};
const commissionData = selectedTransaction
  ? (() => {
      const total = parseFloat(selectedTransaction.commission);

      const split =
        DISTRIBUTOR_COMMISSION_MAP[selectedTransaction.distributor_id];

      return split
        ? {
            admin: total *split.admin,
            md: total *split.md,
            distributor: total *split.distributor,
            retailer: total *split.retailer,
            total,
          }
        : {
            admin: total * 0.2917,
            md: total * 0.0417,
            distributor: total * 0.1667,
            retailer: total * 0.5,
            total,
          };
    })()
  : null;


  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleViewDetails = (transaction: PayoutTransaction) => {
    setSelectedTransaction(transaction);
    setOperatorTxnId(transaction.operator_transaction_id || "");
    setDetailsOpen(true);
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout Transactions</h1>
          <p className="text-muted-foreground">
            View payout transaction history by user (Latest first)
          </p>
        </div>
        {selectedUserId && (
          <Button
            onClick={fetchTransactions}
            disabled={loadingTransactions}
            variant="outline"
          >
            {loadingTransactions ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* User Selection */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="user-select" className="text-base font-semibold mb-2">
            Select User
          </Label>
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
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
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
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {selectedUserId && (
        <Card>
          {loadingTransactions ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <TableRow key={tx.payout_transaction_id}>
                        <TableCell className="font-mono text-xs">
                          {tx.transaction_id}
                        </TableCell>
                       
                        <TableCell>{tx.phone_number}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{formatAmount(tx.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(tx.transaction_status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(tx.transaction_date_and_time)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(tx)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Show Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          )}

          {transactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, transactions.length)} of{" "}
                {transactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status Update Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Update Transaction Status</h3>
                    <div className="text-sm">
                      Current: {getStatusBadge(selectedTransaction.transaction_status)}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="operator-txn-id">
                      Operator Transaction ID
                      <span className="text-muted-foreground ml-1">(Optional)</span>
                    </Label>
                    <input
                      id="operator-txn-id"
                      type="text"
                      value={operatorTxnId}
                      onChange={(e) => setOperatorTxnId(e.target.value)}
                      placeholder="Enter operator transaction ID"
                      className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional field - can be added or updated for any status
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleUpdateStatus("PENDING")}
                      disabled={updatingStatus || selectedTransaction.transaction_status.toUpperCase() === "PENDING"}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      PENDING
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("SUCCESS")}
                      disabled={updatingStatus || selectedTransaction.transaction_status.toUpperCase() === "SUCCESS"}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      SUCCESS
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("FAILED")}
                      disabled={updatingStatus || selectedTransaction.transaction_status.toUpperCase() === "FAILED"}
                      variant="destructive"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      FAILED
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    You can change from any status to any other status. Current status button is disabled.
                  </p>
                </CardContent>
              </Card>

              {/* Transaction Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">
                    Transaction ID
                  </Label>
                  <p className="font-mono text-sm font-medium mt-1">
                    {selectedTransaction.transaction_id}
                  </p>
                </div>

             

                {selectedTransaction.operator_transaction_id && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground text-xs">
                      Operator Transaction ID
                    </Label>
                    <p className="font-mono text-sm font-medium mt-1">
                      {selectedTransaction.operator_transaction_id}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Phone Number
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedTransaction.phone_number}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Bank Name
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedTransaction.bank_name}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Beneficiary Name
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedTransaction.beneficiary_name}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Account Number
                  </Label>
                  <p className="font-mono text-sm font-medium mt-1">
                    {selectedTransaction.account_number}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Amount
                  </Label>
                  <p className="font-semibold text-lg mt-1">
                    ₹{formatAmount(selectedTransaction.amount)}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Transfer Type
                  </Label>
                  <p className="font-medium mt-1">
                    {selectedTransaction.transfer_type}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.transaction_status)}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">
                    Date & Time
                  </Label>
                  <p className="font-medium mt-1">
                    {formatDate(selectedTransaction.transaction_date_and_time)}
                  </p>
                </div>
              </div>

          {commissionData && (
  <Card className="bg-slate-50">
    <CardContent className="pt-6">
      <h3 className="font-semibold mb-4">Commission Breakdown</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Admin Commission:</span>
          <span>₹{formatAmount(commissionData.admin.toString())}</span>
        </div>

        <div className="flex justify-between">
          <span>MD Commission:</span>
          <span>₹{formatAmount(commissionData.md.toString())}</span>
        </div>

        <div className="flex justify-between">
          <span>Distributor Commission:</span>
          <span>₹{formatAmount(commissionData.distributor.toString())}</span>
        </div>

        <div className="flex justify-between">
          <span>Retailer Commission:</span>
          <span>₹{formatAmount(commissionData.retailer.toString())}</span>
        </div>

        <div className="flex justify-between pt-2 border-t font-semibold">
          <span>Total Commission:</span>
          <span>₹{formatAmount(commissionData.total.toString())}</span>
        </div>
      </div>
    </CardContent>
  </Card>
)}
       </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutTransactionPage;