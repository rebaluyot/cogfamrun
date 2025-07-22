import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-utils";
import { sendPaymentStatusEmail } from "@/lib/email-notification";
import { updatePaymentStatus } from "@/lib/payment-utils";
import { getPaymentStatusColorClass } from "@/lib/payment-styles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ExternalLink, Loader2, Search, RefreshCw, Mail, BarChart, Clock, FileText } from "lucide-react";
import { PaymentAnalytics } from "./PaymentAnalytics";
import { EmailNotifications } from "./EmailNotifications";
import { PaymentHistoryComponent } from "./PaymentHistory";
import { PaymentReceiptComponent } from "./PaymentReceipt";

interface PaymentRegistration {
  id: string;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  category: string;
  price: number;
  payment_method_id: number | null;
  payment_reference_number: string | null;
  payment_status: string | null;
  payment_date: string | null;
  payment_confirmed_by: string | null;
  payment_notes: string | null;
  payment_proof_url?: string | null;
  status: string;
  created_at: string;
  payment_method_name?: string;
  // Additional fields from the database
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  shirt_size?: string | null;
  is_church_attendee?: boolean | null;
  department?: string | null;
  ministry?: string | null;
  cluster?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  medical_conditions?: string | null;
  updated_at?: string | null;
}

interface PaymentMethod {
  id: number;
  name: string;
  account_number: string;
  account_type: string;
  qr_image_url?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PaymentVerification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("verify");
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<PaymentRegistration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("confirmed");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  
  // Payment method and reference editing
  const [showPaymentMethodField, setShowPaymentMethodField] = useState<boolean>(false);
  const [showReferenceField, setShowReferenceField] = useState<boolean>(false);
  const [updatedPaymentMethodId, setUpdatedPaymentMethodId] = useState<string>("");
  const [updatedReferenceNumber, setUpdatedReferenceNumber] = useState<string>("");
  
  // Participant info editing
  const [showParticipantInfoFields, setShowParticipantInfoFields] = useState<boolean>(false);
  const [updatedEmail, setUpdatedEmail] = useState<string>("");
  const [updatedShirtSize, setUpdatedShirtSize] = useState<string>("");
  const [updatedCategory, setUpdatedCategory] = useState<string>("");
  const [updatedIsChurchAttendee, setUpdatedIsChurchAttendee] = useState<boolean>(false);
  const [updatedDepartment, setUpdatedDepartment] = useState<string>("");
  const [updatedMinistry, setUpdatedMinistry] = useState<string>("");
  const [updatedCluster, setUpdatedCluster] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "3K", "6K", "10K"
  ]);
  const [availableShirtSizes, setAvailableShirtSizes] = useState<string[]>([
    "3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"
  ]);


  // Fetch registrations with payment information
  const { data: registrations, isLoading, refetch } = useQuery({
    queryKey: ['payment-registrations'],
    queryFn: async () => {
      // First fetch registrations
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast({
          title: "Error",
          description: "Failed to load registrations. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      // Then fetch payment methods to get method names
      const { data: paymentMethodsData } = await supabase
        .from('payment_methods')
        .select('id, name, account_number, account_type');
      
      // Create a lookup map for payment methods
      const methodMap = new Map();
      if (paymentMethodsData) {
        paymentMethodsData.forEach((method) => {
          methodMap.set(method.id, method);
        });
      }

      // Add payment_method_name to registrations
      const enhancedData = data.map(reg => {
        const method = reg.payment_method_id ? methodMap.get(reg.payment_method_id) : null;
        return {
          ...reg,
          payment_method_name: method ? method.name : 'Unknown'
        };
      });

      return enhancedData as PaymentRegistration[];
    },
  });

  // Fetch payment methods for dropdown (including inactive ones)
  const { data: paymentMethods } = useQuery({
    queryKey: ['all-payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name, account_number, account_type, active')
        .order('name');
      // No active=true filter to include all methods

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      return data as PaymentMethod[];
    },
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await (supabase as any)
        .from('departments')
        .select('id, name')
        .order('name');

      if (response.error) {
        console.error('Error fetching departments:', response.error);
        return [];
      }

      // Remove duplicates based on name to prevent duplicate SelectItems
      const uniqueDepartments = response.data.reduce((acc: Array<{id: number, name: string}>, dept: {id: number, name: string}) => {
        if (!acc.find(d => d.name === dept.name)) {
          acc.push(dept);
        }
        return acc;
      }, []);

      return uniqueDepartments as Array<{id: number, name: string}>;
    },
  });

  // Fetch ministries for dropdown
  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const response = await (supabase as any)
        .from('ministries')
        .select('id, name, department_id')
        .order('name');

      if (response.error) {
        console.error('Error fetching ministries:', response.error);
        return [];
      }

      // Remove duplicates based on name to prevent duplicate SelectItems
      const uniqueMinistries = response.data.reduce((acc: Array<{id: number, name: string, department_id: number}>, ministry: {id: number, name: string, department_id: number}) => {
        if (!acc.find(m => m.name === ministry.name)) {
          acc.push(ministry);
        }
        return acc;
      }, []);

      return uniqueMinistries as Array<{id: number, name: string, department_id: number}>;
    },
  });

  // Fetch clusters for dropdown
  const { data: clusters } = useQuery({
    queryKey: ['clusters'],
    queryFn: async () => {
      const response = await (supabase as any)
        .from('clusters')
        .select('id, name')
        .order('name');

      if (response.error) {
        console.error('Error fetching clusters:', response.error);
        return [];
      }

      // Remove duplicates based on name to prevent duplicate SelectItems
      const uniqueClusters = response.data.reduce((acc: Array<{id: number, name: string}>, cluster: {id: number, name: string}) => {
        if (!acc.find(c => c.name === cluster.name)) {
          acc.push(cluster);
        }
        return acc;
      }, []);

      return uniqueClusters as Array<{id: number, name: string}>;
    },
  });

  const filteredRegistrations = registrations?.filter(reg => {
    // Apply tab filter
    if (activeTab === "pending" && reg.payment_status !== "pending") return false;
    if (activeTab === "confirmed" && reg.payment_status !== "confirmed") return false;
    if (activeTab === "rejected" && reg.payment_status !== "rejected") return false;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        reg.registration_id?.toLowerCase().includes(searchLower) ||
        `${reg.first_name} ${reg.last_name}`.toLowerCase().includes(searchLower) ||
        reg.email?.toLowerCase().includes(searchLower) ||
        reg.payment_reference_number?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Handle verification dialog open
  const handleVerify = (registration: PaymentRegistration) => {
    setSelectedRegistration(registration);
    setPaymentStatus(registration.payment_status || "pending");
    setPaymentNotes(registration.payment_notes || "");
    
    // Reset payment method and reference editing fields
    setShowPaymentMethodField(false);
    setShowReferenceField(false);
    setUpdatedPaymentMethodId("");
    setUpdatedReferenceNumber("");
    
    // Reset participant info editing fields
    setShowParticipantInfoFields(false);
    setUpdatedEmail(registration.email || "");
    setUpdatedShirtSize(registration.shirt_size || "");
    setUpdatedCategory(registration.category || "");
    setUpdatedIsChurchAttendee(registration.is_church_attendee || false);
    setUpdatedDepartment(registration.department || "no_department");
    setUpdatedMinistry(registration.ministry || "no_ministry");
    setUpdatedCluster(registration.cluster || "no_cluster");
    
    setIsDialogOpen(true);
  };

  // Save payment verification
  const handleSaveVerification = async () => {
    if (!selectedRegistration) return;
    
    setIsUpdating(true);
    
    try {
      // Create a copy of the registration to apply updates
      let updatedRegistration = { ...selectedRegistration };
      
      // Apply payment method update if selected
      if (showPaymentMethodField && updatedPaymentMethodId && updatedPaymentMethodId !== "no_change") {
        updatedRegistration.payment_method_id = parseInt(updatedPaymentMethodId);
        
        // Update payment method name for display in success message
        const selectedMethod = paymentMethods?.find(m => m.id.toString() === updatedPaymentMethodId);
        if (selectedMethod) {
          updatedRegistration.payment_method_name = selectedMethod.name;
        }
      }
      
      // Apply reference number update if selected
      if (showReferenceField && updatedReferenceNumber.trim()) {
        updatedRegistration.payment_reference_number = updatedReferenceNumber.trim();
      }
      
      // Apply participant info updates if selected
      let participantInfoChanged = false;
      let participantUpdateFields: any = {};
      
      if (showParticipantInfoFields) {
        // Check and apply email update
        if (updatedEmail && updatedEmail !== selectedRegistration.email) {
          updatedRegistration.email = updatedEmail.trim();
          participantUpdateFields.email = updatedEmail.trim();
          participantInfoChanged = true;
        }
        
        // Check and apply shirt size update
        if (updatedShirtSize && updatedShirtSize !== selectedRegistration.shirt_size) {
          updatedRegistration.shirt_size = updatedShirtSize;
          participantUpdateFields.shirt_size = updatedShirtSize;
          participantInfoChanged = true;
        }
        
        // Check and apply category update
        if (updatedCategory && updatedCategory !== selectedRegistration.category) {
          updatedRegistration.category = updatedCategory;
          participantUpdateFields.category = updatedCategory;
          participantInfoChanged = true;
        }
        
        // Check and apply church attendee status update
        if (updatedIsChurchAttendee !== undefined && updatedIsChurchAttendee !== selectedRegistration.is_church_attendee) {
          updatedRegistration.is_church_attendee = updatedIsChurchAttendee;
          participantUpdateFields.is_church_attendee = updatedIsChurchAttendee;
          participantInfoChanged = true;
        }
        
        // Check and apply department update
        if (updatedDepartment !== undefined) {
          const deptValue = updatedDepartment === "no_department" ? null : updatedDepartment;
          const currentDeptValue = selectedRegistration.department || null;
          if (deptValue !== currentDeptValue) {
            updatedRegistration.department = deptValue;
            participantUpdateFields.department = deptValue;
            participantInfoChanged = true;
          }
        }
        
        // Check and apply ministry update
        if (updatedMinistry !== undefined) {
          const ministryValue = updatedMinistry === "no_ministry" ? null : updatedMinistry;
          const currentMinistryValue = selectedRegistration.ministry || null;
          if (ministryValue !== currentMinistryValue) {
            updatedRegistration.ministry = ministryValue;
            participantUpdateFields.ministry = ministryValue;
            participantInfoChanged = true;
          }
        }
        
        // Check and apply cluster update
        if (updatedCluster !== undefined) {
          const clusterValue = updatedCluster === "no_cluster" ? null : updatedCluster;
          const currentClusterValue = selectedRegistration.cluster || null;
          if (clusterValue !== currentClusterValue) {
            updatedRegistration.cluster = clusterValue;
            participantUpdateFields.cluster = clusterValue;
            participantInfoChanged = true;
          }
        }
        
        // If participant info changed but payment status didn't, update the registration directly
        if (participantInfoChanged && paymentStatus === selectedRegistration.payment_status) {
          const { data: updatedData, error: updateError } = await supabase
            .from('registrations')
            .update(participantUpdateFields)
            .eq('id', selectedRegistration.id)
            .select();
            
          if (updateError) {
            console.error('Error updating participant info:', updateError);
            throw updateError;
          }
        }
      }
      
      // Check if we need to update payment status - if status changed or there are payment-related updates
      const paymentStatusChanged = paymentStatus !== selectedRegistration.payment_status;
      // Check if payment fields actually changed, not just if they're shown
      const paymentMethodChanged = showPaymentMethodField && updatedPaymentMethodId && updatedPaymentMethodId !== "no_change";
      const referenceChanged = showReferenceField && updatedReferenceNumber.trim() !== (selectedRegistration.payment_reference_number || "");
      const notesChanged = paymentNotes !== selectedRegistration.payment_notes;
      const paymentFieldsChanged = paymentMethodChanged || referenceChanged || notesChanged;
      
      let receiptNumber: string | undefined;

      console.warn(paymentFieldsChanged);
      if (paymentStatusChanged || paymentFieldsChanged) {
        // Use the utility function for updating payment status with history tracking
        const result = await updatePaymentStatus(
          updatedRegistration,
          paymentStatus as 'confirmed' | 'rejected' | 'pending',
          paymentNotes || null,
          "admin", // This could be dynamically set to the logged-in admin
          sendEmail
        );
        
        if (!result.success) throw result.error;
        receiptNumber = result.receiptNumber;
      }
      
      // Prepare base message
      let baseMessage = '';
      let toastTitle = '';
      
      // Create payment status change message if applicable
      if (paymentStatusChanged) {
        if (paymentStatus === 'confirmed') {
          baseMessage = receiptNumber 
            ? `Payment for ${selectedRegistration.first_name} confirmed. Receipt #${receiptNumber} generated.` 
            : `Payment for ${selectedRegistration.first_name} confirmed.`;
          toastTitle = "Payment Confirmed";
        } else if (paymentStatus === 'rejected') {
          baseMessage = `Payment for ${selectedRegistration.first_name} has been marked as rejected.`;
          toastTitle = "Payment Rejected";
        } else {
          baseMessage = `Payment status for ${selectedRegistration.first_name} has been updated to ${paymentStatus}.`;
          toastTitle = "Payment Updated";
        }
      } else if (participantInfoChanged || paymentFieldsChanged) {
        // If only participant info or payment details changed
        baseMessage = `Information for ${selectedRegistration.first_name} has been updated.`;
        toastTitle = "Information Updated";
      } else {
        // If no changes detected
        baseMessage = `No changes detected for ${selectedRegistration.first_name}.`;
        toastTitle = "No Changes";
      }
      
      // Add info about payment method updates
      if (paymentMethodChanged) {
        const methodName = paymentMethods?.find(m => m.id.toString() === updatedPaymentMethodId)?.name || 'selected method';
        baseMessage += ` Payment method updated to ${methodName}.`;
      }
      
      // Add info about reference updates
      if (referenceChanged) {
        baseMessage += ` Reference number updated.`;
      }
      
      // Add info about notes updates
      if (notesChanged && !paymentStatusChanged) {
        baseMessage += ` Payment notes updated.`;
      }
      
      // Add info about participant field updates
      if (participantInfoChanged) {
        const updatedFields = [];
        
        if (updatedEmail && updatedEmail !== selectedRegistration.email) {
          updatedFields.push("email");
        }
        if (updatedShirtSize && updatedShirtSize !== selectedRegistration.shirt_size) {
          updatedFields.push("shirt size");
        }
        if (updatedCategory && updatedCategory !== selectedRegistration.category) {
          updatedFields.push("race category");
        }
        if (updatedIsChurchAttendee !== selectedRegistration.is_church_attendee) {
          updatedFields.push("church attendee status");
        }
        if (updatedDepartment !== undefined) {
          const deptValue = updatedDepartment === "no_department" ? null : updatedDepartment;
          const currentDeptValue = selectedRegistration.department || null;
          if (deptValue !== currentDeptValue) {
            updatedFields.push("department");
          }
        }
        if (updatedMinistry !== undefined) {
          const ministryValue = updatedMinistry === "no_ministry" ? null : updatedMinistry;
          const currentMinistryValue = selectedRegistration.ministry || null;
          if (ministryValue !== currentMinistryValue) {
            updatedFields.push("ministry");
          }
        }
        if (updatedCluster !== undefined) {
          const clusterValue = updatedCluster === "no_cluster" ? null : updatedCluster;
          const currentClusterValue = selectedRegistration.cluster || null;
          if (clusterValue !== currentClusterValue) {
            updatedFields.push("cluster");
          }
        }
        
        baseMessage += ` Participant ${updatedFields.join(", ")} updated.`;
      }
      
      // Show toast with the combined message
      toast({
        title: toastTitle,
        description: baseMessage,
      });
      
      // Refetch data to update the UI
      queryClient.invalidateQueries({ queryKey: ['payment-registrations'] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="verify">Payment Verification</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-1" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Payment Verification Section */}
        <TabsContent value="verify" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Verification</CardTitle>
              <CardDescription>Verify and manage registration payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, reference..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ['departments'] });
                    queryClient.invalidateQueries({ queryKey: ['ministries'] });
                    queryClient.invalidateQueries({ queryKey: ['clusters'] });
                  }}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="pt-4">
                    {renderRegistrationsTable(filteredRegistrations, isLoading, handleVerify)}
                  </TabsContent>
                  <TabsContent value="confirmed" className="pt-4">
                    {renderRegistrationsTable(filteredRegistrations, isLoading, handleVerify)}
                  </TabsContent>
                  <TabsContent value="rejected" className="pt-4">
                    {renderRegistrationsTable(filteredRegistrations, isLoading, handleVerify)}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Analytics Section */}
        <TabsContent value="analytics" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Analytics</CardTitle>
              <CardDescription>Overview and analysis of payment data</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Import and use the PaymentAnalytics component */}
              <div className="mt-2">
                <PaymentAnalytics />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Notifications Section */}
        <TabsContent value="emails" className="pt-4">
          <EmailNotifications />
        </TabsContent>
      </Tabs>
      
      {/* Payment Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Review and update payment status for Registration ID: {selectedRegistration?.registration_id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-4">
              {/* Registration Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Registration Details</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedRegistration.first_name} {selectedRegistration.last_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedRegistration.email}</p>
                    <p><span className="font-medium">Category:</span> {selectedRegistration.category}</p>
                    <p><span className="font-medium">Amount:</span> {formatCurrency(selectedRegistration.price)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Payment Information</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge className={getPaymentStatusColorClass(selectedRegistration.payment_status || "pending")}>
                        {(selectedRegistration.payment_status || "pending").toUpperCase()}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Reference #:</span> {selectedRegistration.payment_reference_number || "Not provided"}</p>
                    <p><span className="font-medium">Payment Date:</span> {selectedRegistration.payment_date ? 
                      new Date(selectedRegistration.payment_date).toLocaleDateString() : "Not recorded"}</p>
                    {selectedRegistration.payment_confirmed_by && (
                      <p><span className="font-medium">Confirmed By:</span> {selectedRegistration.payment_confirmed_by}</p>
                    )}
                    <p><span className="font-medium">Payment Method:</span> {selectedRegistration.payment_method_name}</p>
                  </div>
                </div>
              </div>
              
              {/* Dialog Tabs for different sections */}
              <Tabs defaultValue="verify" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="verify">Verification</TabsTrigger>
                  <TabsTrigger value="history">
                    <Clock className="h-4 w-4 mr-1" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="receipt">
                    <FileText className="h-4 w-4 mr-1" />
                    Receipt
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="verify">
                  {/* Payment Proof */}
                  {selectedRegistration.payment_proof_url && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Payment Proof</h3>
                      <div className="border rounded-md overflow-hidden">
                        <div className="aspect-video relative bg-muted">
                          <img 
                            src={selectedRegistration.payment_proof_url} 
                            alt="Payment Proof" 
                            className="object-contain w-full h-full"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder.svg'; 
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="absolute top-2 right-2"
                            onClick={() => window.open(selectedRegistration.payment_proof_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Update Payment Status */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payment-status">Update Payment Status</Label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                        <SelectTrigger id="payment-status" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Payment Method Update Option */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="update-payment-method" 
                          checked={showPaymentMethodField}
                          onCheckedChange={(checked) => setShowPaymentMethodField(checked === true)}
                        />
                        <Label 
                          htmlFor="update-payment-method" 
                          className="text-sm cursor-pointer"
                        >
                          Update payment method
                        </Label>
                      </div>
                      
                      {showPaymentMethodField && (
                        <div className="pt-2">
                          <Label htmlFor="updated-payment-method">Payment Method</Label>
                          <Select value={updatedPaymentMethodId} onValueChange={setUpdatedPaymentMethodId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no_change">No change</SelectItem>
                              {paymentMethods?.map(method => (
                                <SelectItem key={method.id} value={method.id.toString()}>
                                  {method.name} {!method.active && "(Inactive)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    {/* Payment Reference Update Option */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="update-reference-number" 
                          checked={showReferenceField}
                          onCheckedChange={(checked) => setShowReferenceField(checked === true)}
                        />
                        <Label 
                          htmlFor="update-reference-number" 
                          className="text-sm cursor-pointer"
                        >
                          Update payment reference number
                        </Label>
                      </div>
                      
                      {showReferenceField && (
                        <div className="pt-2">
                          <Label htmlFor="updated-reference-number">Reference Number</Label>
                          <Input
                            id="updated-reference-number"
                            placeholder="Enter payment reference number" 
                            value={updatedReferenceNumber}
                            onChange={(e) => setUpdatedReferenceNumber(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Participant Information Update Option */}
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="update-participant-info" 
                          checked={showParticipantInfoFields}
                          onCheckedChange={(checked) => setShowParticipantInfoFields(checked === true)}
                        />
                        <Label 
                          htmlFor="update-participant-info" 
                          className="text-sm cursor-pointer"
                        >
                          Update participant information
                        </Label>
                      </div>
                      
                      {showParticipantInfoFields && (
                        <div className="space-y-3 mt-2 pl-6 border-l-2 border-muted">
                          <div>
                            <Label htmlFor="updated-email">Email</Label>
                            <Input
                              id="updated-email"
                              placeholder="Updated email address" 
                              value={updatedEmail}
                              onChange={(e) => setUpdatedEmail(e.target.value)}
                              type="email"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="updated-shirt-size">Shirt Size</Label>
                            <Select value={updatedShirtSize} onValueChange={setUpdatedShirtSize}>
                              <SelectTrigger id="updated-shirt-size" className="w-full">
                                <SelectValue placeholder="Select shirt size" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableShirtSizes.map(size => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="updated-category">Race Category</Label>
                            <Select value={updatedCategory} onValueChange={setUpdatedCategory}>
                              <SelectTrigger id="updated-category" className="w-full">
                                <SelectValue placeholder="Select race category" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCategories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="updated-church-attendee"
                                checked={updatedIsChurchAttendee}
                                onCheckedChange={(checked) => setUpdatedIsChurchAttendee(checked === true)}
                              />
                              <Label htmlFor="updated-church-attendee" className="text-sm cursor-pointer">
                                Church Attendee
                              </Label>
                            </div>
                          </div>

                          {updatedIsChurchAttendee && (
                            <>
                              <div>
                                <Label htmlFor="updated-department">Department</Label>
                                <Select value={updatedDepartment} onValueChange={setUpdatedDepartment}>
                                  <SelectTrigger id="updated-department" className="w-full">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no_department">No Department</SelectItem>
                                    {departments?.map((dept, index) => (
                                      <SelectItem key={`dept-${dept.id}-${index}`} value={dept.name}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="updated-ministry">Ministry</Label>
                                <Select value={updatedMinistry} onValueChange={setUpdatedMinistry}>
                                  <SelectTrigger id="updated-ministry" className="w-full">
                                    <SelectValue placeholder="Select ministry" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no_ministry">No Ministry</SelectItem>
                                    {ministries?.map((ministry, index) => (
                                      <SelectItem key={`ministry-${ministry.id}-${index}`} value={ministry.name}>
                                        {ministry.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="updated-cluster">Cluster</Label>
                                <Select value={updatedCluster} onValueChange={setUpdatedCluster}>
                                  <SelectTrigger id="updated-cluster" className="w-full">
                                    <SelectValue placeholder="Select cluster" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no_cluster">No Cluster</SelectItem>
                                    {clusters?.map((cluster, index) => (
                                      <SelectItem key={`cluster-${cluster.id}-${index}`} value={cluster.name}>
                                        {cluster.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="payment-notes">Notes</Label>
                      <Textarea 
                        id="payment-notes" 
                        placeholder="Add notes about this payment verification"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="send-email"
                        checked={sendEmail}
                        onCheckedChange={(checked) => setSendEmail(checked === true)}
                      />
                      <Label htmlFor="send-email" className="text-sm cursor-pointer flex items-center">
                        <Mail className="h-4 w-4 mr-1" /> 
                        Send email notification to participant
                      </Label>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <div className="pt-2">
                    <PaymentHistoryComponent registrationId={selectedRegistration.id} />
                  </div>
                </TabsContent>
                
                <TabsContent value="receipt">
                  <div className="pt-2">
                    <PaymentReceiptComponent registration={selectedRegistration} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveVerification}
              disabled={isUpdating || isSendingEmail}
              className={paymentStatus === "confirmed" ? "bg-green-600 hover:bg-green-700" : 
                paymentStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingEmail ? "Sending Email..." : "Updating..."}
                </>
              ) : (
                paymentStatus === "confirmed" ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {sendEmail ? "Confirm & Notify" : "Confirm Payment"}
                  </>
                ) : paymentStatus === "rejected" ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    {sendEmail ? "Reject & Notify" : "Reject Payment"}
                  </>
                ) : sendEmail ? "Update & Notify" : "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to render the table
function renderRegistrationsTable(
  registrations: PaymentRegistration[] | undefined,
  isLoading: boolean,
  handleVerify: (registration: PaymentRegistration) => void
) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!registrations || registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No registrations found</p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Registration ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Reference #</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map(registration => (
          <TableRow key={registration.id}>
            <TableCell className="font-medium">{registration.registration_id}</TableCell>
            <TableCell>{registration.first_name} {registration.last_name}</TableCell>
            <TableCell>{registration.category}</TableCell>
            <TableCell>{formatCurrency(registration.price)}</TableCell>
            <TableCell>{registration.payment_reference_number || "-"}</TableCell>
            <TableCell>
              <Badge className={getPaymentStatusColorClass(registration.payment_status || "pending")}>
                {(registration.payment_status || "pending").toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => handleVerify(registration)}>
                Verify
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
