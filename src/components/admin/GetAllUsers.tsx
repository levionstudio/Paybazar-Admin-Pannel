import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface User {
  user_id: string;
  user_unique_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_wallet_balance?: string;
  user_aadhar_number?: string;
  user_pan_number?: string;
  user_city?: string;
  user_state?: string;
  user_address?: string;
  user_pincode?: string;
  user_date_of_birth?: string;
  user_gender?: string;

}

interface JWTPayload {
  data?: { admin_id?: string; [key: string]: any };
  [key: string]: any;
}

interface EditFormData {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_aadhar_number: string;
  user_pan_number: string;
  user_city: string;
  user_state: string;
  user_address: string;
  user_pincode: string;
  user_date_of_birth: string;
  user_gender: string;
}

export default function GetAllUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    user_name: "",
    user_email: "",
    user_phone: "",
    user_aadhar_number: "",
    user_pan_number: "",
    user_city: "",
    user_state: "",
    user_address: "",
    user_pincode: "",
    user_date_of_birth: "",
    user_gender: "",
  });
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

  const fetchUsers = async () => {
    if (!admin_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/admin/get/user/${admin_id}`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      if (res.data?.status === "success" && res.data?.data) {
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data.users || [];
        setUsers(list);
        setCurrentPage(1);
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

  useEffect(() => {
    fetchUsers();
  }, [admin_id]);

  const handleEditClick = async (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
    setIsFetchingProfile(true);

    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/user/get/profile/${user.user_id}`;

      console.log("Fetching user profile from:", url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // The API returns data in response.data.data.user
      if (response.data?.data?.user) {
        const userData = response.data.data.user;
        
        setEditFormData({
          user_name: userData.user_name || "",
          user_email: userData.user_email || "",
          user_phone: userData.user_phone || "",
          user_aadhar_number: userData.user_aadhar_number || "",
          user_pan_number: userData.user_pan_number || "",
          user_city: userData.user_city || "",
          user_state: userData.user_state || "",
          user_address: userData.user_address || "",
          user_pincode: userData.user_pincode || "",
          user_date_of_birth: userData.user_date_of_birth || "",
          user_gender: userData.user_gender || ""
        });
        // Update selected user with full data
        setSelectedUser(userData);
        toast.success("User profile loaded successfully");
      } else {
        toast.error("Failed to load user profile - invalid response format");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load user profile");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Validation
    if (!editFormData.user_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editFormData.user_email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editFormData.user_phone.trim() || editFormData.user_phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
 

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/user/update/profile`;

      const requestBody = {
        user_id: selectedUser.user_id,
        user_name: editFormData.user_name,
        user_email: editFormData.user_email,
        user_phone: editFormData.user_phone,
        user_aadhar_number: editFormData.user_aadhar_number,
        user_pan_number: editFormData.user_pan_number,
        user_city: editFormData.user_city,
        user_state: editFormData.user_state,
        user_address: editFormData.user_address,
        user_pincode: editFormData.user_pincode,
        user_date_of_birth: editFormData.user_date_of_birth,
        user_gender: editFormData.user_gender,
      };

      const response = await axios.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Check if request was successful (200-299 status code)
      if (response.status >= 200 && response.status < 300) {
        // If we got a 2xx response, consider it successful
        const successMessage = response.data?.message || response.data?.msg || "User updated successfully";
        toast.success(successMessage);
        
        // Close dialog and clear selection
        setEditDialogOpen(false);
        setSelectedUser(null);
        
        // Wait for backend to commit changes, then refresh
        setTimeout(async () => {
          await fetchUsers();
          toast.success("User list refreshed with latest data");
        }, 500);
      } else if (response.data?.status === "success" || response.data?.success) {
        toast.success(response.data?.message || response.data?.msg || "User updated successfully");
        
        // Close dialog and clear selection
        setEditDialogOpen(false);
        setSelectedUser(null);
        
        // Wait for backend to commit changes, then refresh
        setTimeout(async () => {
          await fetchUsers();
          toast.success("User list refreshed with latest data");
        }, 500);
      } else {
        toast.error(response.data?.message || response.data?.msg || response.data?.error || "Failed to update user");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all registered users
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Sl No</TableHead>
                  <TableHead className="text-center">Unique ID</TableHead>
                  <TableHead className="text-center">Name</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">Phone</TableHead>
                  <TableHead className="text-center">Wallet Balance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((u, index) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-center">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-mono text-center">
                        {u.user_unique_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        {u.user_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">{u.user_email || "N/A"}</TableCell>
                      <TableCell className="text-center">{u.user_phone || "N/A"}</TableCell>
                      <TableCell className="font-semibold text-center">
                        ₹{Number(u.user_wallet_balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(u)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination Controls */}
        {users.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of{" "}
              {users.length} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {isFetchingProfile ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
          ) : (
            selectedUser && (
              <div className="space-y-6">
                {/* Non-editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </Label>
                    <p className="font-mono text-sm">{selectedUser.user_unique_id || "N/A"}</p>
                  </div>                
                </div>

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        type="text"
                        value={editFormData.user_name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_name: e.target.value })
                        }
                        placeholder="Enter user name"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormData.user_email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_email: e.target.value })
                        }
                        placeholder="Enter email address"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number *</Label>
                      <Input
                        id="edit-phone"
                        type="tel"
                        inputMode="numeric"
                        value={editFormData.user_phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            user_phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-dob">Date of Birth</Label>
                      <Input
                        id="edit-dob"
                        type="date"
                        value={editFormData.user_date_of_birth}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_date_of_birth: e.target.value })
                        }
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
                      <Input
                        id="edit-gender"
                        type="text"
                        value={editFormData.user_gender}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_gender: e.target.value })
                        }
                        placeholder="Enter gender"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-aadhar">Aadhar Number</Label>
                      <Input
                        id="edit-aadhar"
                        type="tel"
                        inputMode="numeric"
                        value={editFormData.user_aadhar_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            user_aadhar_number: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="Enter 12-digit Aadhar number"
                        maxLength={12}
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-pan">PAN Number</Label>
                      <Input
                        id="edit-pan"
                        type="text"
                        value={editFormData.user_pan_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            user_pan_number: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Enter PAN number"
                        maxLength={10}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Input
                        id="edit-address"
                        type="text"
                        value={editFormData.user_address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_address: e.target.value })
                        }
                        placeholder="Enter full address"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        type="text"
                        value={editFormData.user_city}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_city: e.target.value })
                        }
                        placeholder="Enter city"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        type="text"
                        value={editFormData.user_state}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, user_state: e.target.value })
                        }
                        placeholder="Enter state"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-pincode">Pincode</Label>
                      <Input
                        id="edit-pincode"
                        type="tel"
                        inputMode="numeric"
                        value={editFormData.user_pincode}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            user_pincode: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={isUpdating || isFetchingProfile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              disabled={isUpdating || isFetchingProfile}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}