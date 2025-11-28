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
}

const UserWalletTransactions = () => {
  const { toast } = useToast();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
        setTransactions(res.data.data || []);
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
                  View your wallet transaction history
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
                  <div>
                    <div className="max-h-[600px]  overflow-y-auto ">
                      <Table className="w-full">
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="text-center whitespace-nowrap">
                              Transactor
                            </TableHead>
                            <TableHead className="text-center whitespace-nowrap">
                              Receiver
                            </TableHead>
                            <TableHead className="text-center whitespace-nowrap">
                              Type
                            </TableHead>
                            <TableHead className="text-center whitespace-nowrap">
                              Amount
                            </TableHead>
                            <TableHead className="text-center whitespace-nowrap">
                              Status
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
                                <TableCell className="text-center">
                                  <div>
                                    <span className="font-medium">
                                      {tx.transactor_name}
                                    </span>
                                    <div className="text-xs text-muted-foreground">
                                      {tx.transactor_type}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div>
                                    <span className="font-medium">
                                      {tx.receiver_name}
                                    </span>
                                    <div className="text-xs text-muted-foreground">
                                      {tx.receiver_type}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getTransactionTypeBadge(tx.transaction_type)}
                                </TableCell>
                                <TableCell className="font-semibold text-center whitespace-nowrap">
                                  ₹
                                  {parseFloat(tx.amount).toLocaleString(
                                    "en-IN"
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(tx.transaction_status)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletTransactions;