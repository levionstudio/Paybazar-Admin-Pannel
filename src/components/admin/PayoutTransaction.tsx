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
import { Loader2, RefreshCw, Eye } from "lucide-react";

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
  phone_number: string;
  bank_name: string;
  beneficiary_name: string;
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
  const itemsPerPage = 6;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PayoutTransaction | null>(null);

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
        setTransactions(transactionsList);
        toast.success(`Loaded ${transactionsList.length} transactions`);
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
    return status === "SUCCESS" ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        Success
      </Badge>
    ) : status === "PENDING" ? (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
        Pending
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        Failed
      </Badge>
    );
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

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

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
            View payout transaction history by user
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
            <div>
              <div className="max-h-[600px] max-w-7xl overflow-y-auto">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="text-center whitespace-nowrap">
                          Transaction ID
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Phone Number
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Bank Name
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Beneficiary
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
                            colSpan={8}
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
                            <TableCell className="text-center">
                              {tx.bank_name}
                            </TableCell>
                            <TableCell className="text-center">
                              {tx.beneficiary_name}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(tx)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>

          {transactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of{" "}
                {transactions.length} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
    </div>
  );
};

export default PayoutTransactionPage;