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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface MasterDistributor {
  master_distributor_id: string;
  master_distributor_unique_id: string;
  master_distributor_name: string;
  master_distributor_email: string;
  master_distributor_phone: string;
  master_distributor_wallet_balance: string;
}

interface JWTPayload {
  data: { admin_id: string; [key: string]: any };
}

export default function GetAllMD() {
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([]);
  const [loading, setLoading] = useState(true);
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

  const admin_id = getAdminId();

  useEffect(() => {
    const fetchMasterDistributors = async () => {
      if (!admin_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
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

        if (res.data.status === "success" && res.data.data) {
          const distributors = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data.master_distributors || [];
          setMasterDistributors(distributors);
        } else {
          toast.error("Failed to load master distributors");
          setMasterDistributors([]);
        }
      } catch (error: any) {
        console.error("Error fetching master distributors:", error);
        toast.error(
          error.response?.data?.message || "Failed to load master distributors"
        );
        setMasterDistributors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterDistributors();
  }, [admin_id]);

  // Pagination calculations
  const totalPages = Math.ceil(masterDistributors.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMasterDistributors = masterDistributors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-poppins text-xl">
          Master Distributors
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
                {currentMasterDistributors.length > 0 ? (
                  currentMasterDistributors.map((md, index) => (
                    <TableRow key={md.master_distributor_id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-mono">
                        {md.master_distributor_unique_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {md.master_distributor_name || "N/A"}
                      </TableCell>
                      <TableCell>{md.master_distributor_email || "N/A"}</TableCell>
                      <TableCell>{md.master_distributor_phone || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{Number(md.master_distributor_wallet_balance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No master distributors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {masterDistributors.length > itemsPerPage && (
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

