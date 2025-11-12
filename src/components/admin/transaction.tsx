import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  transaction_id: string;
  admin_id: string;
  amount: string;
  transaction_type: string;
  transaction_service: string;
  reference_id: string;
  remarks: string;
  created_at: string;
  transactor_name: string;
  receiver_name: string;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any }
}

export default function AdminTransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "credit" | "debit">("all");

  useEffect(() => {
    setCurrentPage(1);
  }, [transactionTypeFilter]);
  

  const getAdminId = (): string | null => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          toast.error("Authentication token not found");
          return null
        }
        const decoded = jwtDecode<JWTPayload>(token)
        return decoded.data.admin_id
      } catch (error) {
        toast.error("Invalid authentication token");
        return null
      }
    }
  
    const admin_id = getAdminId();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get(
          `https://server.paybazaar.in/admin/wallet/get/transactions/${admin_id}`
        );
        setTransactions(res.data.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

 // Filter by transaction_type (credit/debit) before paginating
const filteredByType = transactionTypeFilter === "all"
? transactions
: transactions.filter(
    (t) => (t.transaction_type || "").toLowerCase() === transactionTypeFilter
  );

// Pagination calculations based on filtered results
const totalPages = Math.ceil(filteredByType.length / transactionsPerPage) || 1;
const startIndex = (currentPage - 1) * transactionsPerPage;
const currentTransactions = filteredByType.slice(
startIndex,
startIndex + transactionsPerPage
);

  const handlePrevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-poppins text-xl">
          Admin Wallet Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2">
              <Select value={transactionTypeFilter} onValueChange={(v) => setTransactionTypeFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
          </div>
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Sl No</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Transaction Service</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Reciver Name</TableHead>
                  <TableHead>Transactor Name</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((txn, index) => (
                    <TableRow key={txn.transaction_id}>
                      <TableCell>
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell>₹{txn.amount || "null"}</TableCell>
                      <TableCell>{txn.transaction_type || "null"}</TableCell>
                      <TableCell>{txn.transaction_service || "null"}</TableCell>
                      <TableCell>{txn.remarks || "null"}</TableCell>
                      {/* <TableCell>
                        {txn.created_at
                          ? format(new Date(txn.created_at), "PPpp")
                          : "null"}
                      </TableCell> */}
                      <TableCell>{txn.receiver_name || "null"}</TableCell>
                      <TableCell>{txn.transactor_name || "null"}</TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {filteredByType.length > transactionsPerPage && (
  <div className="flex justify-end gap-x-4 mt-5 items-center mt-4">
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrevPage}
      disabled={currentPage === 1}
    >
      Previous
    </Button>
    <span className="text-sm text-muted-foreground">
      Page {currentPage} of {totalPages}
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={handleNextPage}
      disabled={currentPage === totalPages}
    >
      Next
    </Button>
  </div>
)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
