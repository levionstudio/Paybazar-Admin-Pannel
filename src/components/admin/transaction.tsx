import { useState, useEffect } from "react";
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

import { Loader2, RefreshCw } from "lucide-react";

interface TokenData {
  data: {
    user_id: string;
    user_unique_id: string;
    user_name: string;
    admin_id: string;
    distributor_id: string;
    master_distributor_id: string;
  };
  exp: number;
}

interface Transaction {
  transaction_id: string;
  transactor_name: string;
  transactor_type: string;
  receiver_name: string;
  receiver_type: string;
  transaction_type: string;
  amount: string;
  transaction_status: string;
  remarks: string;
  transaction_date?: string;
  created_at?: string;
  timestamp?: string;
}

const UserWalletTransactions = () => {
  const { toast } = useToast();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Decode token
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please login to continue.",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }

    try {
      const decoded: TokenData = jwtDecode(token);

      if (!decoded?.exp || decoded.exp * 1000 < Date.now()) {
        toast({
          title: "Session expired",
          description: "Login again.",
          variant: "destructive",
        });
        localStorage.removeItem("authToken");
        window.location.href = "/login";
        return;
      }

      setTokenData(decoded);
    } catch (error) {
      toast({
        title: "Invalid token",
        description: "Please login.",
        variant: "destructive",
      });
      window.location.href = "/login";
    }
  }, []);

  // ✅ Fetch wallet transactions
  const fetchTransactions = async () => {
    if (!tokenData) return;

    const token = localStorage.getItem("authToken");
    setLoading(true);

    try {
      const res = await axios.get(
        `https://server.paybazaar.in/admin/wallet/get/transactions/${tokenData.data.admin_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === "success") {
        const transactionsList = res.data.data || [];
        
        // Sort transactions by date/time (latest first)
        // Try different possible date field names
        const sortedTransactions = transactionsList.sort((a: Transaction, b: Transaction) => {
          // Try to get timestamp from various possible fields
          const getTimestamp = (tx: Transaction) => {
            const dateField = tx.transaction_date || tx.created_at || tx.timestamp;
            if (dateField) {
              return new Date(dateField).getTime();
            }
            // If no date field, use transaction_id as fallback (assuming newer IDs are larger)
            return parseInt(tx.transaction_id) || 0;
          };
          
          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          
          return timeB - timeA; // Descending order (newest first)
        });
        
        setTransactions(sortedTransactions);
        toast({
          title: "Success",
          description: "Transactions loaded successfully",
        });
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      toast({
        title: "Error",
        description: "Unable to fetch transactions",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenData) fetchTransactions();
  }, [tokenData]);

  const getTransactionTypeBadge = (type: string) => {
    return type === "DEBIT" ? (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-300"
      >
        Debit
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-300"
      >
        Credit
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === "SUCCESS" ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-300"
      >
        Success
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-300"
      >
        Pending
      </Badge>
    );
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Generate page numbers to show (max 5 visible page buttons)
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate which group of 5 pages to show
    const pageGroup = Math.ceil(currentPage / maxVisiblePages);
    const startPage = (pageGroup - 1) * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Wallet Transactions
                </h1>
                <p className="text-muted-foreground mt-1">
                  View your wallet transaction history (Latest first)
                </p>
              </div>
              <Button onClick={fetchTransactions} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                            Transactor
                          </th>
                          <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                            Receiver
                          </th>
                          <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                            Type
                          </th>
                          <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                            Amount
                          </th>
                          <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTransactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          paginatedTransactions.map((tx) => (
                            <tr key={tx.transaction_id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="text-center px-4 py-3">
                                <div>
                                  <span className="font-medium text-sm">
                                    {tx.transactor_name}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {tx.transactor_type}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center px-4 py-3">
                                <div>
                                  <span className="font-medium text-sm">
                                    {tx.receiver_name}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {tx.receiver_type}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center px-4 py-3">
                                {getTransactionTypeBadge(tx.transaction_type)}
                              </td>
                              <td className="font-semibold text-center whitespace-nowrap px-4 py-3 text-sm">
                                ₹
                                {parseFloat(tx.amount).toLocaleString(
                                  "en-IN"
                                )}
                              </td>
                              <td className="text-center px-4 py-3">
                                {getStatusBadge(tx.transaction_status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>

              {transactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, transactions.length)} of{" "}
                    {transactions.length} transactions
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
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
                    <div className="flex items-center gap-1 flex-wrap">
                      {getPageNumbers().map((page) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletTransactions;