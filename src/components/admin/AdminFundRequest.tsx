import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  amount: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  bank_branch: string;
  utr_number: string;
  remarks: string;
  request_status: string;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any };
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://64.227.165.232:8080";

export function FundRequest() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      setRequests(Array.isArray(data) ? data : []);
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

    setProcessingIds((prev) => new Set(prev).add(requestId));

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
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    const adminId = getAdminId();
    if (!adminId) return;

    setProcessingIds((prev) => new Set(prev).add(requestId));

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
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300"
          >
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fund Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage E-wallet fund requests
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-wallet-bg border border-wallet-border">
            <Wallet className="w-4 h-4 text-wallet-text" />
            <span className="text-sm font-semibold text-wallet-text">
              ₹{walletBalance.toLocaleString()}
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
          <div>
            <div className="max-h-[600px] max-w-7xl overflow-y-auto   ">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
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
                        colSpan={11}
                        className="text-center text-muted-foreground py-8"
                      >
                        No fund requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRequests.map((request) => (
                      <TableRow key={request.request_id}>
                        <TableCell className="font-medium text-center whitespace-nowrap">
                          {request.requester_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {request.requester_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-center whitespace-nowrap">
                          ₹{parseFloat(request.amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {request.utr_number}
                        </TableCell>
                        <TableCell className="text-center max-w-xs truncate">
                          {request.remarks}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(request.request_status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {request.request_status.toUpperCase() ===
                            "PENDING" && (
                            <div className="flex gap-2 justify-center whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAccept(request.request_id)}
                                disabled={processingIds.has(request.request_id)}
                              >
                                {processingIds.has(request.request_id) ? (
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
                                disabled={processingIds.has(request.request_id)}
                              >
                                {processingIds.has(request.request_id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>

        {requests.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, requests.length)}{" "}
              of {requests.length} requests
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
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
  );
}
