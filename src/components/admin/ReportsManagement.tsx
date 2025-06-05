import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Eye, Send, CheckCircle, XCircle, Search, Edit, MoreHorizontal, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCategoryColorClass, getStatusColorClass } from "@/lib/format-utils";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegistrationDetails } from "@/components/RegistrationDetails";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';
import QRCodeNode from "qrcode";
import { initializeEmailJS, sendEmailWithEmailJS } from "@/lib/emailjs-utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const ReportsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { data: registrations, isLoading } = useRegistrations();
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();
  const [isExporting, setIsExporting] = useState(false);
  const [sendingQRCode, setSendingQRCode] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [statusUpdateInfo, setStatusUpdateInfo] = useState<{
    registrationIds: string[];
    oldStatus: string;
    newStatus: string;
    isBulk: boolean;
  } | null>(null);

  // Transform registration data for reporting
  const formattedRegistrations = registrations?.map(reg => ({
    id: reg.registration_id || reg.id.toString(),
    name: `${reg.first_name} ${reg.last_name}`,
    email: reg.email,
    firstName: reg.first_name,
    lastName: reg.last_name,
    phone: reg.phone,
    age: reg.age,
    gender: reg.gender,
    shirtSize: reg.shirt_size,
    category: reg.category,
    department: reg.department,
    ministry: reg.ministry,
    cluster: reg.cluster,
    paymentMethod: reg.payment_method_name,
    payment_date: reg.payment_date,
    payment_reference_number: reg.payment_reference_number,
    payment_notes: reg.payment_notes,
    status: reg.status ? reg.status.charAt(0).toUpperCase() + reg.status.slice(1) : "Pending",
    registeredAt: new Date(reg.created_at).toLocaleDateString(),
    fee: reg.price,
    emergencyContact: reg.emergency_contact,
    emergencyPhone: reg.emergency_phone,
    medicalConditions: reg.medical_conditions,
    isChurchAttendee: reg.is_church_attendee,
    paymentProofUrl: reg.payment_proof_url,
    created_at: reg.created_at,
    // Keep the original registration data for the dialog
    original: reg
  })) || [];

  // Clear selected registrations when status filter changes
  useEffect(() => {
    setSelectedRegistrations([]);
  }, [selectedStatus]);

  // Using utility functions from format-utils.ts
  // Note: Status in the util function expects lowercase, but our data has uppercase first letter
  const adaptStatusForUtilFunction = (status: string) => {
    return status.toLowerCase();
  };

  const generateExcelReport = () => {
    if (!selectedReport) {
      toast({
        title: "No Report Selected",
        description: "Please select a report type to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Filter data based on selected status and report type
      let filteredData = selectedStatus === "all" 
        ? formattedRegistrations 
        : formattedRegistrations.filter(reg => reg.status.toLowerCase() === selectedStatus.toLowerCase());
      
      // Apply additional filters based on report type
      switch (selectedReport) {
        case "church-members":
          filteredData = filteredData.filter(reg => reg.isChurchAttendee);
          break;
        case "non-church":
          filteredData = filteredData.filter(reg => !reg.isChurchAttendee);
          break;
        // Other report types will use the status-filtered data without additional filtering
      }

      // Prepare data for Excel export - select fields based on report type
      const exportData = filteredData.map(reg => {
        // Basic fields for all report types
        const baseData = {
          "Registration ID": reg.id,
          "Name": reg.name,
          "Email": reg.email,
          "Phone": reg.phone || "N/A",
          "Category": reg.category,
          "Status": reg.status,
          "Registration Date": reg.registeredAt,
          "Fee": reg.fee
        };

        // Additional fields based on report type
        if (selectedReport === "all-registrations" || selectedReport === "by-category") {
          return {
            ...baseData,
            "Gender": reg.gender || "N/A",
            "Age": reg.age || "N/A",
            "Shirt Size": reg.shirtSize,
            "Church Attendee": reg.isChurchAttendee ? "Yes" : "No"
          };
        } else if (selectedReport === "church-members" || selectedReport === "by-department") {
          return {
            ...baseData,
            "Department": reg.department || "N/A",
            "Ministry": reg.ministry || "N/A",
            "Cluster": reg.cluster || "N/A",
            "Shirt Size": reg.shirtSize
          };
        } else if (selectedReport === "financial-summary") {
          return {
            ...baseData,
            "Payment Status": reg.status === "Confirmed" ? "Paid" : "Unpaid",
            "Payment Method": reg.paymentMethod,
            "Payment Reference": reg.payment_reference_number,
            "Payment Date": reg.payment_date,
            "Payment Notes": reg.payment_notes
          };
        }

        return baseData;
      });

      // Create a new workbook and add the data
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

      // Generate report file name based on report type and date
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const reportName = `${selectedReport}-${date}.xlsx`;

      // Export the file
      XLSX.writeFile(workbook, reportName);

      toast({
        title: "Report Generated",
        description: `${selectedReport} report has been downloaded with ${filteredData.length} registrations.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // View registration details
  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration);
    setShowRegistrationDetails(true);
  };

  // Generate and send QR code to registrant
  const generateQRCode = async (registration: any) => {
    setSendingQRCode(registration.id);
    try {
      // Initialize EmailJS with settings from the database
      const initialized = await initializeEmailJS();
      
      if (!initialized) {
        throw new Error("Failed to initialize EmailJS. Check your settings in the Admin panel.");
      }

      // Prepare QR data
      const qrData = `CogFamRun2025|${registration.id}|${registration.name}|${registration.category}|${registration.fee}|${registration.shirtSize}`;
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeNode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Send email with QR code using our utility function
      const result = await sendEmailWithEmailJS({
        to_email: registration.email,
        participant_name: registration.name,
        registration_id: registration.id,
        category: registration.category,
        price: formatCurrency(registration.fee),
        shirt_size: registration.shirtSize,
        qr_code_image: qrDataUrl,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      toast({
        title: "QR Code Sent",
        description: `QR code has been sent to ${registration.email}`,
      });
    } catch (error) {
      console.error("Error sending QR code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingQRCode(null);
    }
  };

  // Handle single status update
  const handleStatusUpdate = (registration: any) => {
    setSelectedRegistration(registration);
    setNewStatus(registration.status.toLowerCase());
    setShowStatusUpdateDialog(true);
  };

  // Submit status update for a single registration
  const submitStatusUpdate = async () => {
    if (!selectedRegistration || !newStatus) return;

    setStatusUpdateInfo({
      registrationIds: [selectedRegistration.id],
      oldStatus: selectedRegistration.status.toLowerCase(),
      newStatus: newStatus,
      isBulk: false
    });
    setShowConfirmationDialog(true);
    setShowStatusUpdateDialog(false);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No Registrations Selected",
        description: "Please select at least one registration to update.",
        variant: "destructive",
      });
      return;
    }

    setShowBulkUpdateDialog(true);
  };

  // Submit bulk status update
  const submitBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedRegistrations.length === 0) return;

    setStatusUpdateInfo({
      registrationIds: selectedRegistrations,
      oldStatus: selectedStatus === 'all' ? 'multiple' : selectedStatus,
      newStatus: bulkStatus,
      isBulk: true
    });
    setShowConfirmationDialog(true);
    setShowBulkUpdateDialog(false);
  };

  // Confirm and execute status update
  const executeStatusUpdate = async () => {
    if (!statusUpdateInfo) return;
    
    setIsUpdatingStatus(true);
    try {
      const { registrationIds, newStatus } = statusUpdateInfo;
      
      // Update the status in the database
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus.toLowerCase() })
        .in('registration_id', registrationIds);

      if (error) {
        throw error;
      }

      // Refresh the data
      await queryClient.invalidateQueries({ queryKey: ['registrations'] });

      // Show success message
      toast({
        title: "Status Updated",
        description: `Successfully updated ${registrationIds.length} registration(s) to ${newStatus}.`,
      });

      // Clear selected registrations
      setSelectedRegistrations([]);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update registration status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
      setShowConfirmationDialog(false);
      setStatusUpdateInfo(null);
    }
  };

  // Handle registration selection for bulk actions
  const toggleRegistrationSelection = (id: string) => {
    if (selectedRegistrations.includes(id)) {
      setSelectedRegistrations(selectedRegistrations.filter(regId => regId !== id));
    } else {
      setSelectedRegistrations([...selectedRegistrations, id]);
    }
  };

  // Apply filters and search to registrations
  const filteredRegistrations = isLoading ? [] : (
    selectedStatus === "all" 
      ? formattedRegistrations 
      : formattedRegistrations.filter(reg => reg.status.toLowerCase() === selectedStatus.toLowerCase())
  );

  // Search functionality
  const filteredAndSearchedRegistrations = searchQuery 
    ? filteredRegistrations.filter(reg => 
        reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredRegistrations;

  // Check if all visible registrations are selected
  const allSelected = filteredAndSearchedRegistrations.length > 0 && 
    filteredAndSearchedRegistrations.every(reg => selectedRegistrations.includes(reg.id));

  // Toggle all registrations selection
  const toggleAllRegistrations = () => {
    if (allSelected) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(filteredAndSearchedRegistrations.map(reg => reg.id));
    }
  };

  // Check if there are any selected registrations
  const hasSelectedRegistrations = selectedRegistrations.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>Create Excel reports for registrations and analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-registrations">All Registrations</SelectItem>
                  <SelectItem value="church-members">Church Members Only</SelectItem>
                  <SelectItem value="non-church">Non-Church Attendees</SelectItem>
                  <SelectItem value="by-category">By Race Category</SelectItem>
                  <SelectItem value="by-department">By Department</SelectItem>
                  <SelectItem value="financial-summary">Financial Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed Only</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="cancelled">Cancelled Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={generateExcelReport} 
            className="bg-green-600 hover:bg-green-700"
            disabled={!selectedReport || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Excel Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registration Management</CardTitle>
            <CardDescription>
              {isLoading 
                ? "Loading registration data..."
                : `Manage registrations and update status (${filteredAndSearchedRegistrations.length} registrations)`
              }
            </CardDescription>
          </div>
          {hasSelectedRegistrations && (
            <Button 
              variant="outline"
              onClick={handleBulkStatusUpdate}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Update {selectedRegistrations.length} Registration{selectedRegistrations.length > 1 ? 's' : ''}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Reload registrations
                  queryClient.invalidateQueries({ queryKey: ['registrations'] });
                  toast({
                    title: "Data Refreshed",
                    description: "Registration data has been refreshed.",
                  });
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredRegistrations.length}
                </div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredRegistrations.filter(r => r.status.toLowerCase() === "confirmed").length}
                </div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredRegistrations.filter(r => r.status.toLowerCase() === "pending").length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(filteredRegistrations.filter(r => r.status.toLowerCase() === 'confirmed').reduce((sum, r) => sum + r.fee, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all" 
                    checked={allSelected && filteredAndSearchedRegistrations.length > 0} 
                    onCheckedChange={toggleAllRegistrations}
                    disabled={filteredAndSearchedRegistrations.length === 0}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    {selectedRegistrations.length > 0 
                      ? `${selectedRegistrations.length} selected` 
                      : 'Select all'
                    }
                  </Label>
                </div>
                {hasSelectedRegistrations && (
                  <div className="text-sm text-muted-foreground">
                    {selectedRegistrations.length} of {filteredAndSearchedRegistrations.length} selected
                  </div>
                )}
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading registration data...
                  </div>
                ) : filteredAndSearchedRegistrations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No registrations found matching the selected filters
                  </div>
                ) : (
                  filteredAndSearchedRegistrations.map((registration) => (
                    <div key={registration.id} className="flex items-center border-b hover:bg-gray-50 px-3 py-2">
                      <Checkbox 
                        className="mr-3"
                        checked={selectedRegistrations.includes(registration.id)} 
                        onCheckedChange={() => toggleRegistrationSelection(registration.id)}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{registration.name}</span>
                            <Badge className={getCategoryColorClass(registration.category)}>
                              {registration.category}
                            </Badge>
                            <Badge className={getStatusColorClass(adaptStatusForUtilFunction(registration.status))}>
                              {registration.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {registration.email} • {registration.id}
                          </div>
                          {registration.department && (
                            <div className="text-xs text-gray-500">
                              {registration.department} {registration.ministry ? `→ ${registration.ministry}` : ''} {registration.cluster ? `→ ${registration.cluster}` : ''}
                            </div>
                          )}
                          {!registration.department && (
                            <div className="text-xs text-gray-500">Non-church attendee</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <div className="font-bold text-green-600">{formatCurrency(registration.fee)}</div>
                            <div className="text-sm text-gray-500">{registration.registeredAt}</div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(registration)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusUpdate(registration)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateQRCode(registration)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send QR Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details Dialog */}
      <RegistrationDetails 
        registration={selectedRegistration?.original} 
        open={showRegistrationDetails} 
        onOpenChange={setShowRegistrationDetails} 
      />

      {/* Status Update Dialog for Single Registration */}
      <Dialog open={showStatusUpdateDialog} onOpenChange={setShowStatusUpdateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Registration Status</DialogTitle>
            <DialogDescription>
              Change the status for registration {selectedRegistration?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Current status: <span className="font-medium">{selectedRegistration?.status}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdateDialog(false)}>Cancel</Button>
            <Button onClick={submitStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Update Registration Status</DialogTitle>
            <DialogDescription>
              Change the status for {selectedRegistrations.length} selected registration{selectedRegistrations.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-md p-3 bg-amber-50 text-amber-800 text-sm">
              <p>You are about to update {selectedRegistrations.length} registration{selectedRegistrations.length > 1 ? 's' : ''}. This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>Cancel</Button>
            <Button onClick={submitBulkStatusUpdate}>Update All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Status Updates */}
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              {statusUpdateInfo?.isBulk 
                ? `Are you sure you want to change the status of ${statusUpdateInfo.registrationIds.length} registration${statusUpdateInfo.registrationIds.length > 1 ? 's' : ''} to "${statusUpdateInfo.newStatus}"?`
                : `Are you sure you want to change the status of registration ${statusUpdateInfo?.registrationIds[0]} from "${statusUpdateInfo?.oldStatus}" to "${statusUpdateInfo?.newStatus}"?`
              }
              <div className="mt-2 font-medium">
                This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeStatusUpdate} 
              disabled={isUpdatingStatus}
              className={statusUpdateInfo?.newStatus === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : statusUpdateInfo?.newStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : statusUpdateInfo?.newStatus === 'confirmed' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Update
                </>
              ) : statusUpdateInfo?.newStatus === 'cancelled' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Update
                </>
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
