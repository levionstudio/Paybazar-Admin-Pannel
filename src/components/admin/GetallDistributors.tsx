import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
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
  distributor_aadhar_number?: string;
  distributor_pan_number?: string;
  distributor_city?: string;
  distributor_state?: string;
  distributor_address?: string;
  distributor_pincode?: string;
  distributor_date_of_birth?: string;
  distributor_gender?: string;
}

interface JWTPayload {
  data?: { admin_id?: string; [key: string]: any };
  [key: string]: any;
}

interface EditFormData {
  distributor_name: string;
  distributor_email: string;
  distributor_phone: string;
  distributor_aadhar_number: string;
  distributor_pan_number: string;
  distributor_city: string;
  distributor_state: string;
  distributor_address: string;
  distributor_pincode: string;
  distributor_date_of_birth: string;
  distributor_gender: string;
}

export default function GetAllDistributor() {
  const [masterDistributors, setMasterDistributors] = useState<MasterDistributor[]>([]);
  const [selectedMD, setSelectedMD] = useState<string>("");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loadingMDs, setLoadingMDs] = useState(true);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    distributor_name: "",
    distributor_email: "",
    distributor_phone: "",
    distributor_aadhar_number: "",
    distributor_pan_number: "",
    distributor_city: "",
    distributor_state: "",
    distributor_address: "",
    distributor_pincode: "",
    distributor_date_of_birth: "",
    distributor_gender: "",
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
        `${import.meta.env.VITE_API_BASE_URL}/admin/get/distributors/${mdId}`,
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
        setCurrentPage(1);
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

  useEffect(() => {
    if (selectedMD) fetchDistributors(selectedMD);
  }, [selectedMD]);

  const handleEditClick = async (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setEditDialogOpen(true);
    setIsFetchingProfile(true);

    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/distributor/get/profile/${distributor.distributor_id}`;

      console.log("Fetching Distributor profile from:", url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Distributor profile response:", response.data);

      if (response.data?.data?.distributor) {
        const distData = response.data.data.distributor;
        console.log("Distributor profile data:", distData);
        
        setEditFormData({
          distributor_name: distData.distributor_name || "",
          distributor_email: distData.distributor_email || "",
          distributor_phone: distData.distributor_phone || "",
          distributor_aadhar_number: distData.distributor_aadhar_number || "",
          distributor_pan_number: distData.distributor_pan_number || "",
          distributor_city: distData.distributor_city || "",
          distributor_state: distData.distributor_state || "",
          distributor_address: distData.distributor_address || "",
          distributor_pincode: distData.distributor_pincode || "",
          distributor_date_of_birth: distData.distributor_date_of_birth || "",
          distributor_gender: distData.distributor_gender || ""
        });
        
        console.log("Form data set successfully");
        setSelectedDistributor(distData);
        toast.success("Distributor profile loaded successfully");
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Failed to load profile - invalid response format");
      }
    } catch (error: any) {
      console.error("Error fetching Distributor profile:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleUpdateDistributor = async () => {
    if (!selectedDistributor) return;

    // Validation
    if (!editFormData.distributor_name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editFormData.distributor_email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!editFormData.distributor_phone.trim() || editFormData.distributor_phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}/distributor/update/profile`;

      const requestBody = {
        distributor_id: selectedDistributor.distributor_id,
        distributor_name: editFormData.distributor_name,
        distributor_email: editFormData.distributor_email,
        distributor_phone: editFormData.distributor_phone,
        distributor_aadhar_number: editFormData.distributor_aadhar_number,
        distributor_pan_number: editFormData.distributor_pan_number,
        distributor_city: editFormData.distributor_city,
        distributor_state: editFormData.distributor_state,
        distributor_address: editFormData.distributor_address,
        distributor_pincode: editFormData.distributor_pincode,
        distributor_date_of_birth: editFormData.distributor_date_of_birth,
        distributor_gender: editFormData.distributor_gender,
      };

      console.log("Updating Distributor profile at:", url);
      console.log("Request body:", requestBody);

      const response = await axios.post(url, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update response status:", response.status);
      console.log("Update response data:", response.data);

      if (response.status >= 200 && response.status < 300) {
        const successMessage = response.data?.message || response.data?.msg || "Distributor updated successfully";
        toast.success(successMessage);
        
        setEditDialogOpen(false);
        setSelectedDistributor(null);
        
        setTimeout(async () => {
          console.log("Refreshing Distributor list after update...");
          await fetchDistributors(selectedMD);
          toast.success("List refreshed with latest data");
        }, 500);
      } else if (response.data?.status === "success" || response.data?.success) {
        toast.success(response.data?.message || response.data?.msg || "Distributor updated successfully");
        
        setEditDialogOpen(false);
        setSelectedDistributor(null);
        
        setTimeout(async () => {
          console.log("Refreshing Distributor list after update...");
          await fetchDistributors(selectedMD);
          toast.success("List refreshed with latest data");
        }, 500);
      } else {
        console.error("Update failed - response.data:", response.data);
        toast.error(response.data?.message || response.data?.msg || response.data?.error || "Failed to update");
      }
    } catch (error: any) {
      console.error("Error updating Distributor:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(distributors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDistributors = distributors.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Distributors</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all distributors
          </p>
        </div>
        <Button 
          onClick={() => selectedMD && fetchDistributors(selectedMD)} 
          variant="outline" 
          size="sm"
          disabled={!selectedMD}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Master Distributor Selection Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap min-w-[140px]">
              Master Distributor:
            </Label>
            {loadingMDs ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-md bg-background flex-1">
                <Loader2 className="animate-spin h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <Select value={selectedMD} onValueChange={setSelectedMD}>
                <SelectTrigger className="h-10 flex-1">
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
        </CardContent>
      </Card>

      {/* Distributors Table */}
      <Card>
        <CardContent className="p-0">
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
                  {currentDistributors.length > 0 ? (
                    currentDistributors.map((d, idx) => (
                      <TableRow key={d.distributor_id}>
                        <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-mono text-center">
                          {d.distributor_unique_id || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium text-center">
                          {d.distributor_name || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">{d.distributor_email || "N/A"}</TableCell>
                        <TableCell className="text-center">{d.distributor_phone || "N/A"}</TableCell>
                        <TableCell className="font-semibold text-center">
                          ₹{Number(d.distributor_wallet_balance || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(d)}
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
                        No distributors found for the selected master distributor
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination controls */}
        {distributors.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, distributors.length)} of{" "}
              {distributors.length} distributors
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

      {/* Edit Distributor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Distributor Profile</DialogTitle>
          </DialogHeader>
          {isFetchingProfile ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
              <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
          ) : (
            selectedDistributor && (
              <div className="space-y-6">
                {/* Non-editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Distributor ID
                    </Label>
                    <p className="font-mono text-sm">{selectedDistributor.distributor_unique_id || "N/A"}</p>
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
                        value={editFormData.distributor_name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_name: e.target.value })
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
                        value={editFormData.distributor_email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_email: e.target.value })
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
                        value={editFormData.distributor_phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            distributor_phone: e.target.value.replace(/\D/g, ""),
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
                        value={editFormData.distributor_date_of_birth}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_date_of_birth: e.target.value })
                        }
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-gender">Gender</Label>
                      <Input
                        id="edit-gender"
                        type="text"
                        value={editFormData.distributor_gender}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_gender: e.target.value })
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
                        value={editFormData.distributor_aadhar_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            distributor_aadhar_number: e.target.value.replace(/\D/g, ""),
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
                        value={editFormData.distributor_pan_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            distributor_pan_number: e.target.value.toUpperCase(),
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
                        value={editFormData.distributor_address}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_address: e.target.value })
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
                        value={editFormData.distributor_city}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_city: e.target.value })
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
                        value={editFormData.distributor_state}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, distributor_state: e.target.value })
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
                        value={editFormData.distributor_pincode}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            distributor_pincode: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  * Required fields
                </p>
              </div>
            )
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedDistributor(null);
              }}
              disabled={isUpdating || isFetchingProfile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDistributor} 
              disabled={isUpdating || isFetchingProfile}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Distributor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}