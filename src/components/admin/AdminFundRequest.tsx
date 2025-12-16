import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, RefreshCw, Wallet } from "lucide-react";

interface FundRequest {
  admin_id: string;
  request_id: string;
  requester_id: string;
  requester_name: string;
  requester_type: string;
  requester_unique_id: string;
  amount: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  bank_branch: string;
  utr_number: string;
  remarks: string;
  request_status: string;
  request_date: string;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function FundRequest() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<{
    requestId: string;
    action: "accept" | "reject";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const maxVisiblePages = 5;

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return null;
      }
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.data.admin_id;
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid authentication token",
        variant: "destructive",
      });
      return null;
    }
  };

  const admin_id = getAdminId();

  const fetchWalletBalance = async () => {
    if (!admin_id) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/wallet/get/balance/${admin_id}`
      );
      setWalletBalance(response.data.data.balance);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance",
        variant: "destructive",
      });
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    const adminId = getAdminId();
    if (!adminId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/get/fund/requests/${adminId}`
      
      );
      const data = response.data.data;

      // ✅ Safely handle null or undefined
      const requestsList = Array.isArray(data) ? data : [];

      // Sort by request_date (latest first)
      const sortedRequests = [...requestsList].sort((a: FundRequest, b: FundRequest) => {
        try {
          const dateA = new Date(a.request_date);
          const dateB = new Date(b.request_date);
          const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
          const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
          return timeB - timeA; // Latest first
        } catch {
          return 0;
        }
      });

      setRequests(sortedRequests);
    } catch (error: any) {
      // Silently handle error - just set empty array to show "No fund requests found"
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    const adminId = getAdminId();
    if (!adminId) return;

    setProcessingAction({ requestId, action: "accept" });

    try {
      await axios.post(`${API_BASE_URL}/admin/accept/fund/request`, {
        admin_id: adminId,
        request_id: requestId,
      });

      toast({
        title: "Success",
        description: "Fund request accepted successfully",
      });
      fetchWalletBalance();
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to accept fund request",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const adminId = getAdminId();
    if (!adminId) return;

    setProcessingAction({ requestId, action: "reject" });

    try {
      await axios.get(`${API_BASE_URL}/admin/reject/fund/request/${requestId}`);

      toast({
        title: "Success",
        description: "Fund request rejected successfully",
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to reject fund request",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
          >
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  // Calculate which page numbers to show (5 at a time)
  const getVisiblePages = () => {
    const currentGroup = Math.ceil(currentPage / maxVisiblePages);
    const startPage = (currentGroup - 1) * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const visiblePages = getVisiblePages();
  const canGoPrevGroup = currentPage > maxVisiblePages;
  const canGoNextGroup = currentPage <= totalPages - maxVisiblePages;

  const goToPrevGroup = () => {
    const newPage = Math.max(1, currentPage - maxVisiblePages);
    setCurrentPage(newPage);
  };

  const goToNextGroup = () => {
    const newPage = Math.min(totalPages, currentPage + maxVisiblePages);
    setCurrentPage(newPage);
  };

  const isProcessing = (requestId: string, action: "accept" | "reject") => {
    return processingAction?.requestId === requestId && processingAction?.action === action;
  };

  const isAnyProcessing = (requestId: string) => {
    return processingAction?.requestId === requestId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Fund Requests
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage E-wallet fund requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-wallet-bg border border-wallet-border">
            <Wallet className="w-4 h-4 text-wallet-text" />
            <span className="text-sm font-semibold text-wallet-text">
              ₹{walletBalance.toLocaleString("en-IN")}
            </span>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-center whitespace-nowrap">
                    Request Date
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Requester Name
                  </TableHead>
                
                  <TableHead className="text-center whitespace-nowrap">
                    Type
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Amount
                  </TableHead>
               
                  <TableHead className="text-center whitespace-nowrap">
                    UTR Number
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Remarks
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-12"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-base md:text-lg font-medium">
                          No fund requests found
                        </p>
                        <p className="text-xs md:text-sm">
                          Fund requests will appear here
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((request) => (
                    <TableRow key={request.request_id}>
                      <TableCell className="text-center whitespace-nowrap text-xs sm:text-sm">
                        {formatDate(request.request_date)}
                      </TableCell>
                      <TableCell className="font-medium text-center whitespace-nowrap text-xs sm:text-sm">
                        {request.requester_name}
                      </TableCell>
                   
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {request.requester_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-center whitespace-nowrap text-xs sm:text-sm">
                        ₹{parseFloat(request.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                     
                      <TableCell className="text-center font-mono whitespace-nowrap text-xs sm:text-sm">
                        {request.utr_number}
                      </TableCell>
                      <TableCell className="text-center max-w-xs truncate text-xs sm:text-sm">
                        {request.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(request.request_status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {request.request_status.toUpperCase() === "PENDING" ? (
                          <div className="flex gap-2 justify-center whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAccept(request.request_id)}
                              disabled={isAnyProcessing(request.request_id)}
                              className="min-w-[80px]"
                            >
                              {isProcessing(request.request_id, "accept") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.request_id)}
                              disabled={isAnyProcessing(request.request_id)}
                              className="min-w-[80px]"
                            >
                              {isProcessing(request.request_id, "reject") ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {requests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(endIndex, requests.length)}{" "}
              of {requests.length} requests
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

              {canGoPrevGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevGroup}
                  className="w-10"
                >
                  ...
                </Button>
              )}

              <div className="flex items-center gap-1 flex-wrap">
                {visiblePages.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 sm:w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              {canGoNextGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextGroup}
                  className="w-10"
                >
                  ...
                </Button>
              )}

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
  );
}