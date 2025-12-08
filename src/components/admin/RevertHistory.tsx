import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Search, RefreshCw, History } from "lucide-react";

interface DecodedToken {
  data: {
    admin_id: string;
    [key: string]: any;
  };
  exp: number;
}

interface RevertHistory {
  revert_id: string;
  unique_id: string;
  name: string;
  phone: string;
  amount: string;
  created_at: string;
}

const RevertHistoryPage = () => {
  const token = localStorage.getItem("authToken");
  const [adminId, setAdminId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [revertHistory, setRevertHistory] = useState<RevertHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
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
        toast.error("Invalid token. Please log in again.");
      }
    }
  }, [token]);

  // Fetch revert history by phone number
  const fetchRevertHistory = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/revert/get/history/${phoneNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.status === "success" && response.data.data) {
        // Extract revert_history from nested data structure
        const historyList = response.data.data.revert_history || [];
        
        // Sort by created_at (most recent first)
        const sortedHistory = [...historyList].sort((a: RevertHistory, b: RevertHistory) => {
          try {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
            const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
            return timeB - timeA; // Descending order (most recent first)
          } catch (error) {
            return 0;
          }
        });
        
        setRevertHistory(sortedHistory);
        setCurrentPage(1);
        
        if (sortedHistory.length > 0) {
          toast.success(`Found ${sortedHistory.length} revert record${sortedHistory.length > 1 ? 's' : ''}`);
        } else {
          toast.info("No revert history found for this phone number");
        }
      } else {
        setRevertHistory([]);
        toast.info("No revert history found for this phone number");
      }
    } catch (error: any) {
      setRevertHistory([]);
      
      if (error.response?.status === 404) {
        toast.info("No revert history found for this phone number");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch revert history"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRevertHistory();
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
        second: "2-digit",
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

  const totalPages = Math.ceil(revertHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = revertHistory.slice(startIndex, endIndex);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <History className="h-8 w-8" />
            Revert History
          </h1>
          <p className="text-muted-foreground mt-1">
            Search revert history by phone number (Latest first)
          </p>
        </div>
        {searched && revertHistory.length > 0 && (
          <Button onClick={fetchRevertHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="phone-input">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder="Enter phone number (e.g., 9876543210)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !phoneNumber.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a 10-digit phone number to search revert history
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Table */}
      {searched && (
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
                        Revert ID
                      </th>
                      <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                        Unique ID
                      </th>
                      <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                        Name
                      </th>
                      <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                        Phone Number
                      </th>
                      <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                        Amount
                      </th>
                      <th className="text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-muted-foreground py-12"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-lg font-medium">No revert history found</p>
                            <p className="text-sm">
                              Try searching with a different phone number
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((record) => (
                        <tr
                          key={record.revert_id}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="text-center px-4 py-3">
                            <span className="font-mono text-sm font-medium">
                              {record.revert_id}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="font-mono text-sm">
                              {record.unique_id}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="font-medium text-sm">
                              {record.name}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="font-mono text-sm">
                              {record.phone}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="font-semibold text-sm">
                              ₹{formatAmount(record.amount)}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3 whitespace-nowrap">
                            <span className="text-sm">
                              {formatDate(record.created_at)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {revertHistory.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, revertHistory.length)} of{" "}
                {revertHistory.length} records
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
    </div>
  );
};

export default RevertHistoryPage;