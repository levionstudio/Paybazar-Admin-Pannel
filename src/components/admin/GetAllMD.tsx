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

interface MasterDistributor {
  master_distributor_id: string;
  master_distributor_unique_id?: string;
  master_distributor_name?: string;
  master_distributor_email?: string;
  master_distributor_phone?: string;
  master_distributor_wallet_balance?: string;
  master_distributor_aadhar_number?: string;
  master_distributor_pan_number?: string;
  master_distributor_city?: string;
  master_distributor_state?: string;
  master_distributor_address?: string;
  master_distributor_pincode?: string;
  master_distributor_date_of_birth?: string;
  master_distributor_gender?: string;
}

interface JWTPayload {
  data?: { admin_id?: string; [key: string]: any };
  [key: string]: any;
}

interface EditFormData {
  master_distributor_name: string;
  master_distributor_email: string;
  master_distributor_phone: string;
  master_distributor_aadhar_number: string;
  master_distributor_pan_number: string;
  master_distributor_city: string;
  master_distributor_state: string;
  master_distributor_address: string;
  master_distributor_pincode: string;
  master_distributor_date_of_birth: string;
  master_distributor_gender: string;
}

export default function GetAllMD() {
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMD, setSelectedMD] = useState<MasterDistributor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    master_distributor_name: "",
    master_distributor_email: "",
    master_distributor_phone: "",
    master_distributor_aadhar_number: "",
    master_distributor_pan_number: "",
    master_distributor_city: "",
    master_distributor_state: "",
    master_distributor_address: "",
    master_distributor_pincode: "",
    master_distributor_date_of_birth: "",
    master_distributor_gender: "",
  });
  const itemsPerPage = 10;

  const getAdminId = (): string | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication token not found");
        return null;
      }
      const decoded = jwtDecode<JWTPayload>(token);
      const adminId =
        (decoded && (decoded as any).data?.admin_id) ||
        (decoded && (decoded as any).admin_id) ||
        null;
      if (!adminId) {
        toast.error("Admin ID not found in token");
        return null;
      }
      return adminId;
    } catch (error) {
      toast.error("Invalid authentication token");
      return null;
    }
  };

  const admin_id = getAdminId();

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
        setCurrentPage(1);
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

  useEffect(() => {
    fetchMasterDistributors();
  }, [admin_id]);

  const handleEditClick = async (md: MasterDistributor) => {
    setSelectedMD(md);
    setEditDialogOpen(true);
    setIsFetchingProfile(true);

    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/md/get/profile/${md.master_distributor_id}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      // Check for data in response
      if (response.data?.data?.master_distributor) {
        const mdData = response.data.data.master_distributor;
        
        setEditFormData({
          master_distributor_name: mdData.master_distributor_name || "",
          master_distributor_email: mdData.master_distributor_email || "",
          master_distributor_phone: mdData.master_distributor_phone || "",
          master_distributor_aadhar_number: mdData.master_distributor_aadhar_number || "",
          master_distributor_pan_number: mdData.master_distributor_pan_number || "",
          master_distributor_city: mdData.master_distributor_city || "",
          master_distributor_state: mdData.master_distributor_state || "",
          master_distributor_address: mdData.master_distributor_address || "",
          master_distributor_pincode: mdData.master_distributor_pincode || "",
          master_distributor_date_of_birth: mdData.master_distributor_date_of_birth || "",
          master_distributor_gender: mdData.master_distributor_gender || ""
        });
        
        setSelectedMD(mdData);
        toast.success("Master Distributor profile loaded successfully");
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load profile - invalid response format");
      }
    } catch (error: any) {
      console.error("Error fetching MD profile:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleUpdateMD = async () => {
    if (!selectedMD) return;

    // Validation
    if (!editFormData.master_distributor_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editFormData.master_distributor_email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editFormData.master_distributor_phone.trim() || editFormData.master_distributor_phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/md/update/profile`;

      const requestBody = {
        master_distributor_id: selectedMD.master_distributor_id,
        master_distributor_name: editFormData.master_distributor_name,
        master_distributor_email: editFormData.master_distributor_email,
        master_distributor_phone: editFormData.master_distributor_phone,
        master_distributor_aadhar_number: editFormData.master_distributor_aadhar_number,
        master_distributor_pan_number: editFormData.master_distributor_pan_number,
        master_distributor_city: editFormData.master_distributor_city,
        master_distributor_state: editFormData.master_distributor_state,
        master_distributor_address: editFormData.master_distributor_address,
        master_distributor_pincode: editFormData.master_distributor_pincode,
        master_distributor_date_of_birth: editFormData.master_distributor_date_of_birth,
        master_distributor_gender: editFormData.master_distributor_gender,
      };


      const response = await axios.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      if (response.status >= 200 && response.status < 300) {
        const successMessage = response.data?.message || response.data?.msg || "Master Distributor updated successfully";
        toast.success(successMessage);
        
        setEditDialogOpen(false);
        setSelectedMD(null);
        
        setTimeout(async () => {
          await fetchMasterDistributors();
          toast.success("List refreshed with latest data");
        }, 500);
      } else if (response.data?.status === "success" || response.data?.success) {
        toast.success(response.data?.message || response.data?.msg || "Master Distributor updated successfully");
        
        setEditDialogOpen(false);
        setSelectedMD(null);
        
        setTimeout(async () => {
          await fetchMasterDistributors();
          toast.success("List refreshed with latest data");
        }, 500);
      } else {
        console.error("Update failed - response.data:", response.data);
        toast.error(response.data?.message || response.data?.msg || response.data?.error || "Failed to update");
      }
    } catch (error: any) {
      console.error("Error updating MD:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(masterDistributors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMDs = masterDistributors.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold text-foreground">Master Distributors</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all master distributors
          </p>
        </div>
        <Button onClick={fetchMasterDistributors} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* MD Table */}
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
                {currentMDs.length > 0 ? (
                  currentMDs.map((md, index) => (
                    <TableRow key={md.master_distributor_id}>
                      <TableCell className="text-center">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-mono text-center">
                        {md.master_distributor_unique_id || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        {md.master_distributor_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">{md.master_distributor_email || "N/A"}</TableCell>
                      <TableCell className="text-center">{md.master_distributor_phone || "N/A"}</TableCell>
                      <TableCell className="font-semibold text-center">
                        ₹{Number(
                          md.master_distributor_wallet_balance || 
                          (md as any).wallet_balance || 
                          (md as any).md_wallet_balance || 
                          0
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(md)}
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
                      No master distributors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination Controls */}
        {masterDistributors.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, masterDistributors.length)} of{" "}
              {masterDistributors.length} master distributors
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

      {/* Edit MD Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Master Distributor Profile</DialogTitle>
          </DialogHeader>
          {isFetchingProfile ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
          ) : (
            selectedMD && (
              <div className="space-y-6">
                {/* Non-editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      MD ID
                    </Label>
                    <p className="font-mono text-sm">{selectedMD.master_distributor_unique_id || "N/A"}</p>
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
                        value={editFormData.master_distributor_name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_name: e.target.value })
                        }
                        placeholder="Enter name"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editFormData.master_distributor_email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_email: e.target.value })
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
                        value={editFormData.master_distributor_phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            master_distributor_phone: e.target.value.replace(/\D/g, ""),
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
                        value={editFormData.master_distributor_date_of_birth}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_date_of_birth: e.target.value })
                        }
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
                      <Input
                        id="edit-gender"
                        type="text"
                        value={editFormData.master_distributor_gender}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_gender: e.target.value })
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
                        value={editFormData.master_distributor_aadhar_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            master_distributor_aadhar_number: e.target.value.replace(/\D/g, ""),
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
                        value={editFormData.master_distributor_pan_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            master_distributor_pan_number: e.target.value.toUpperCase(),
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
                        value={editFormData.master_distributor_address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_address: e.target.value })
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
                        value={editFormData.master_distributor_city}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_city: e.target.value })
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
                        value={editFormData.master_distributor_state}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, master_distributor_state: e.target.value })
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
                        value={editFormData.master_distributor_pincode}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            master_distributor_pincode: e.target.value.replace(/\D/g, ""),
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
                setSelectedMD(null);
              }}
              disabled={isUpdating || isFetchingProfile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateMD} 
              disabled={isUpdating || isFetchingProfile}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Master Distributor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}