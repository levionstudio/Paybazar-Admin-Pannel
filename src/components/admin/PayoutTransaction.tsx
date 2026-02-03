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
  user_id: string; 
  distributor_id: string; 
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

const RetailerCommissionMap: Record<
  string,
  {
    retailer: number;
    distributor: number;
    md: number;
  }
> = {
"6ede16d1-7c4b-4cc0-9a04-2896d2273ff2": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "ef9d9491-3024-4f39-8e42-28e20203e004": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "a5e61077-418a-4792-8247-fae90e9d4a8d": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "b1bb7498-561b-451c-b0b7-83f24a113175": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "0b45ef0c-8214-4eff-abec-b33e10fdab1e": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "9059e173-207f-4a7a-8986-b4291f5f9862": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "c2576845-9399-4eca-b0ed-792883403ea7": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "4c80845d-063a-40e9-8c5d-820223aefd25": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "1aad7bf8-dce8-4946-a050-b160079d04f1": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "c7856f40-de06-4313-845f-be18730d1e46": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "408513e5-e1f7-4d37-8465-4746fdfa0aa8": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "8522a1a8-7e2e-43f2-8b89-0e63fdee85af": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "ca36d7a2-9f13-4997-88e1-7512d6355650": { retailer: 0.5, distributor: 0.2, md: 0.05 },

  "9abc983a-6751-4578-b091-782c20ca518c": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "588f08ba-99c0-45d4-ad10-3e0ba2f0f5ba": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "3038eb4b-df7e-40d7-806a-5b0e93e51e33": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "d20d9650-6ddf-45bf-9267-01795e8301f3": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "10161525-f8b6-4e09-9378-c8320c597c35": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "e0edcd84-0783-4bbb-943f-7d50471d402c": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "3e222ad0-33a0-4822-9f87-8c392ecb5cec": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "5a5d9433-b2de-4d4c-a2ce-ef984b0fa3c1": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "d25f700d-9186-4f4a-a410-8be16ee3ea35": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "75e33916-4339-4f91-b2e3-6800a14da56f": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "ea3b2b66-3042-4e1f-8aca-7c037dc70cc6": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "e081e9b5-2674-4c76-8fe4-d7e97ed9c76e": { retailer: 0.5, distributor: 0.2, md: 0.05 },
  "0ee30163-b777-4db8-a54f-968fd6334cda": { retailer: 0.5, distributor: 0.2, md: 0.05 },

  "9a61b72c-ab1b-4fae-96e3-934d2aa2a697":{retailer: 0.5, distributor: 0.2, md: 0.05},
  "39324029-4f37-41a8-8fa1-596d1b71570a":{retailer: 0.5, distributor: 0.2, md: 0.05},
  

  "912bfe33-cc18-42a9-95e5-6601e9792d2e":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "e97abd42-3602-47e7-86c1-941849d5bfc7":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "cf315988-3a63-4e3e-a043-b82e29645a27":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "087adc59-29a6-40ee-9143-80d811e37691":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "44ca46d-b7aa-4075-8cc9-c5b1c728af51":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "cbc50485-4ff4-4670-bd00-d01071c0d44a":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "141a55fd-f8d6-4bb9-b079-7e33a0f4c103":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "71ebb8f6-9725-4b29-ab8d-2e18e905da0a":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "85f1bd2a-aa1a-4005-b19c-8423a0746789":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  "91da3ca8-aa20-4584-9149-c2ebd624dcd7":{ retailer: 0.5, distributor: 0.2, md: 0.05 },
  

  "fca6741b-e405-4c06-9ebb-3f1e9951c22c": { retailer: 0.45, distributor: 0.20, md: 0.10 },
  "df2704ad-7cb1-4b28-a29d-866dfdded0ae": { retailer: 0.45, distributor: 0.20, md: 0.10 },

};

// ===== ADMIN OVERRIDE COMMISSION (FROM DB TABLE) =====
const ADMIN_USER_COMMISSION_MAP: Record<
  string,
  {
    admin: number;
    md: number;
    distributor: number;
    retailer: number;
  }
> = {
  // 60% users
  "912bfe33-cc18-42a9-95e5-6601e9792d2e": {
    admin: 0.275,
    md: 0.105,
    distributor: 0.02,
    retailer: 0.60,
  },
  "e97abd42-3602-47e7-86c1-941849d5bfc7": {
    admin: 0.275,
    md: 0.105,
    distributor: 0.02,
    retailer: 0.60,
  },

  // 50% users
  "b1c09449-d5d1-49af-b4fa-319267b07ce2": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "6e8affb2-009d-4389-9fb9-384f90a3404c": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "90600cca-e776-4373-8bf2-3f19fdcc0cc4": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "6ef85c54-c2b5-48a0-b4d8-2f0080156906": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "e081e9b5-2674-4c76-8fe4-d7e97ed9c76e": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "9a61b72c-ab1b-4fae-96e3-934d2aa2a697": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "39324029-4f37-41a8-8fa1-596d1b71570a": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "2c86a6f7-a527-4151-a541-7fa22922a914": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "cb24bd56-6030-4fed-8751-efcd8b39bfa3": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
  "b113aaf0-4c51-4451-9adf-e38eca36bf5b": {
    admin: 0.43,
    md: 0.05,
    distributor: 0.02,
    retailer: 0.50,
  },
};

const commissionData = (() => {
  if (!selectedTransaction) return null;

  const amount = Number(selectedTransaction.amount);
  const isListedUser =
    !!RetailerCommissionMap[selectedTransaction.user_id];

  // 1% for listed, 1.2% for non-listed
  const commissionRate = isListedUser ? 0.01 : 0.012;
  const total = amount * commissionRate;

// 1️⃣ ADMIN CONFIG USERS (from DB)
if (ADMIN_USER_COMMISSION_MAP[selectedTransaction.user_id]) {
  const split = ADMIN_USER_COMMISSION_MAP[selectedTransaction.user_id];

  return {
    retailer: total * split.retailer,
    distributor: total * split.distributor,
    md: total * split.md,
    admin: total * split.admin,
    total,
  };
}

// 2️⃣ OLD LISTED USERS (keep old behavior)
if (isListedUser) {
  const split = RetailerCommissionMap[selectedTransaction.user_id];

  const retailer = total * split.retailer;
  const distributor = total * split.distributor;
  const md = total * split.md;
  const admin = total - (retailer + distributor + md);

  return { retailer, distributor, md, admin, total };
}


  // ✅ NON-LISTED USER (1.2%)
  return {
    retailer: total * 0.5,      // ₹6 on ₹1000
    distributor: total * 0.1667,// ₹2 on ₹1000
    md: total * 0.0417,         // ₹0.5 on ₹1000
    admin: total * 0.2917,      // ₹3.5 on ₹1000
    total,
  };
})();


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