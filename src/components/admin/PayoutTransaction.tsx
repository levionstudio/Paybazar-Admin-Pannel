import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";

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
  const { toast } = useToast();
  const token = localStorage.getItem("authToken");

  const [adminId, setAdminId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Decode token to get admin_id
  useEffect(() => {
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setAdminId(decoded?.data?.admin_id || "");
      } catch (error) {
        console.error("Error decoding token:", error);
        toast({
          title: "Authentication Error",
          description: "Invalid token. Please log in again.",
          variant: "destructive",
        });
      }
    }
  }, [token, toast]);

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
          toast({
            title: "No Users Found",
            description: "No users available for this admin.",
            variant: "default",
          });
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load users",
          variant: "destructive",
        });
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [adminId, token, toast]);

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
        toast({
          title: "Success",
          description: `Loaded ${transactionsList.length} transactions`,
        });
      } else {
        setTransactions([]);
        toast({
          title: "No Transactions",
          description: "No payout transactions found for this user.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load transactions",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [selectedUserId]);

  const getStatusBadge = (status: string) => {
    return status === "SUCCESS" ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-300"
      >
        Success
      </Badge>
    ) : status === "PENDING" ? (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-300"
      >
        Pending
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-300"
      >
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

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Payout Transactions
                </h1>
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
              <CardHeader>
                <CardTitle>Select User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="user-select">User</Label>
                  {loadingUsers ? (
                    <div className="flex items-center gap-2 h-11 px-3 border border-input rounded-md bg-background">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Loading users...
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger className="h-11" id="user-select">
                        <SelectValue placeholder="Select a user to view transactions" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No users found
                          </div>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.user_name} {user.user_email && `(${user.user_email})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            {selectedUserId && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Transactions
                    {transactions.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({transactions.length} total)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div>
                      <div className="max-h-[600px] overflow-y-auto">
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
                                Ad Commission
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                MD Commission
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                Dis Commission
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                Ret Commission
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                Transfer Type
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                Status
                              </TableHead>
                              <TableHead className="text-center whitespace-nowrap">
                                Date & Time
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedTransactions.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={9}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No transactions found
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedTransactions.map((tx) => (
                                <TableRow key={tx.transaction_id}>
                                  <TableCell className="text-center font-mono text-sm">
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
                                    ₹{parseFloat(tx.amount).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">
  ₹{(parseFloat(tx.commission) * 0.25).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</TableCell>

<TableCell className="text-center whitespace-nowrap">
  ₹{(parseFloat(tx.commission) * 0.05).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</TableCell>

<TableCell className="text-center whitespace-nowrap">
  ₹{(parseFloat(tx.commission) * 0.20).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</TableCell>

<TableCell className="text-center whitespace-nowrap">
  ₹{(parseFloat(tx.commission) * 0.50).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</TableCell>

                                  <TableCell className="text-center">
                                    {tx.transfer_type}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {getStatusBadge(tx.transaction_status)}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">
                                    {formatDate(tx.transaction_date_and_time)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>

                {transactions.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, transactions.length)} of{" "}
                      {transactions.length} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutTransactionPage;

