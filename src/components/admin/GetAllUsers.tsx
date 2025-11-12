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

interface User {
  user_id: string;
  user_unique_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_wallet_balance?: string;
}

interface JWTPayload {
  data?: { admin_id?: string; [key: string]: any };
  [key: string]: any;
}

export default function GetAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("authToken not found in localStorage");
        toast.error("Authentication token not found");
        return null;
      }
      const decoded = jwtDecode<JWTPayload>(token as string);
      const adminId =
        (decoded && (decoded as any).data?.admin_id) ||
        (decoded && (decoded as any).admin_id) ||
        null;
      if (!adminId) {
        console.warn("admin_id not present in decoded token:", decoded);
        toast.error("Admin ID not found in token");
        return null;
      }
      return adminId;
    } catch (err) {
      console.error("Error decoding token:", err);
      toast.error("Invalid authentication token");
      return null;
    }
  };

  const admin_id = getAdminId();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!admin_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const url = `${import.meta.env.VITE_API_BASE_URL}/admin/get/user/${admin_id}`;

        console.log("Requesting users from:", url);
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        console.log("GET /admin/get/user response:", res.status, res.data);

        if (res.data?.status === "success" && res.data?.data) {
          const list = Array.isArray(res.data.data)
            ? res.data.data
            : res.data.data.users || [];
          setUsers(list);
          setCurrentPage(1); // reset pagination
        } else {
          const serverMsg = res.data?.message || JSON.stringify(res.data);
          toast.error(`Failed to load users: ${serverMsg}`);
          setUsers([]);
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        if (error.response) {
          console.error("Server response data:", error.response.data);
          toast.error(error.response.data?.message || "Failed to load users (server error)");
        } else if (error.request) {
          toast.error("No response from server. Check backend or network (CORS?).");
        } else {
          toast.error(error.message || "Failed to load users");
        }
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin_id]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-poppins text-xl">Users</CardTitle>
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
                {currentUsers.length > 0 ? (
                  currentUsers.map((u, index) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-mono">
                        {u.user_unique_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {u.user_name || "N/A"}
                      </TableCell>
                      <TableCell>{u.user_email || "N/A"}</TableCell>
                      <TableCell>{u.user_phone || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{Number(u.user_wallet_balance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {users.length > itemsPerPage && (
              <div className="flex justify-end gap-x-4 mt-5 items-center">
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
