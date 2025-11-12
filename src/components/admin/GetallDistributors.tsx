import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface MasterDistributor {
  master_distributor_id: string;
  master_distributor_unique_id?: string;
  master_distributor_name?: string;
  master_distributor_email?: string;
  master_distributor_phone?: string;
  master_distributor_wallet_balance?: string;
}

interface Distributor {
  distributor_id: string;
  distributor_unique_id?: string;
  distributor_name?: string;
  distributor_email?: string;
  distributor_phone?: string;
  distributor_wallet_balance?: string;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any };
}

export default function GetAllDistributor() {
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([]);
  const [selectedMD, setSelectedMD] = useState<string>("");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loadingMDs, setLoadingMDs] = useState(true);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token not found");
        return null;
      }
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.data.admin_id;
    } catch (error) {
      toast.error("Invalid authentication token");
      return null;
    }
  };

  const admin_id = useMemo(() => getAdminId(), []);

  // Fetch all MDs on mount
  useEffect(() => {
    const fetchMasterDistributors = async () => {
      if (!admin_id) {
        setLoadingMDs(false);
        return;
      }
      setLoadingMDs(true);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get/md/${admin_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.data?.status === "success" && res.data?.data) {
          const list = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data.master_distributors || [];
          
          const normalized = list.map((md: any) => ({
            master_distributor_id: md.master_distributor_id,
            master_distributor_unique_id: md.master_distributor_unique_id,
            master_distributor_name: md.master_distributor_name,
            master_distributor_email: md.master_distributor_email,
            ...md,
          }));

          setMasterDistributors(normalized);
          // Auto-select first MD if available
          if (normalized.length > 0) {
            setSelectedMD(normalized[0].master_distributor_id);
          }
        } else {
          toast.error("Failed to load master distributors");
          setMasterDistributors([]);
        }
      } catch (error: any) {
        console.error("Error fetching master distributors:", error);
        toast.error(error.response?.data?.message || "Failed to load master distributors");
        setMasterDistributors([]);
      } finally {
        setLoadingMDs(false);
      }
    };

    fetchMasterDistributors();
  }, [admin_id]);

  // Fetch distributors when master distributor is selected
  useEffect(() => {
    const fetchDistributors = async (mdId: string) => {
      if (!mdId) {
        setDistributors([]);
        return;
      }
      setLoadingDistributors(true);
      setDistributors([]);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get/distributor/${mdId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.data?.status === "success" && res.data?.data) {
          const list = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data.distributors || [];
          
          const normalized = list.map((d: any) => ({
            distributor_id: d.distributor_id,
            distributor_unique_id: d.distributor_unique_id,
            distributor_name: d.distributor_name,
            distributor_email: d.distributor_email,
            distributor_phone: d.distributor_phone,
            distributor_wallet_balance: d.distributor_wallet_balance,
            ...d,
          }));

          setDistributors(normalized);
          setCurrentPage(1); // reset pagination on MD change
        } else {
          toast.error("Failed to load distributors");
          setDistributors([]);
        }
      } catch (error: any) {
        console.error("Error fetching distributors:", error);
        toast.error(error.response?.data?.message || "Failed to load distributors");
        setDistributors([]);
      } finally {
        setLoadingDistributors(false);
      }
    };

    if (selectedMD) fetchDistributors(selectedMD);
  }, [selectedMD]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(distributors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDistributors = distributors.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="font-poppins text-xl">Distributors</CardTitle>
        
        {/* Master Distributor Select */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">Master Distributor:</Label>
          {loadingMDs ? (
            <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-md bg-background min-w-[200px]">
              <Loader2 className="animate-spin h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <Select
              value={selectedMD}
              onValueChange={setSelectedMD}
            >
              <SelectTrigger className="h-10 min-w-[200px]">
                <SelectValue placeholder="Select master distributor" />
              </SelectTrigger>
              <SelectContent>
                {masterDistributors.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No master distributors found
                  </div>
                ) : (
                  masterDistributors.map((md) => (
                    <SelectItem
                      key={md.master_distributor_id}
                      value={md.master_distributor_id}
                    >
                      {md.master_distributor_name || md.master_distributor_unique_id || md.master_distributor_id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!selectedMD ? (
          <div className="flex justify-center items-center py-10">
            <p className="text-muted-foreground">Please select a master distributor to view distributors</p>
          </div>
        ) : loadingDistributors ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <span className="ml-2 text-muted-foreground">Loading distributors...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sl No</TableHead>
                  <TableHead>Unique ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentDistributors.length > 0 ? (
                  currentDistributors.map((d, idx) => (
                    <TableRow key={d.distributor_id}>
                      <TableCell>{startIndex + idx + 1}</TableCell>
                      <TableCell className="font-mono">
                        {d.distributor_unique_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {d.distributor_name || "N/A"}
                      </TableCell>
                      <TableCell>{d.distributor_email || "N/A"}</TableCell>
                      <TableCell>{d.distributor_phone || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{Number(d.distributor_wallet_balance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No distributors found for the selected master distributor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination controls */}
            {distributors.length > itemsPerPage && (
              <div className="flex justify-end gap-x-4 mt-4 items-center">
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
