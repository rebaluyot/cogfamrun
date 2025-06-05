import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format-utils";
import { sendPaymentStatusEmail } from "@/lib/email-notification";
import { updatePaymentStatus } from "@/lib/payment-utils";
import { getPaymentStatusColorClass } from "@/lib/payment-styles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, RefreshCw, Mail, FileText, Filter } from "lucide-react";

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
  // Additional fields
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  shirt_size?: string | null;
  is_church_attendee?: boolean | null;
  department?: string | null;
  ministry?: string | null;
  cluster?: string | null;
}

export const BatchPaymentVerification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("confirmed");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  
  // Filter options
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Fetch pending registrations with payment information
  const { data: registrations, isLoading, refetch } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      // First fetch registrations with pending payment status
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (registrationsError) {
        console.error('Error fetching registrations:', registrationsError);
        toast({
          title: "Error",
          description: "Failed to load registrations. Please try again.",
          variant: "destructive",
        });
        throw registrationsError;
      }

      // Fetch payment methods
      const { data: methodsData } = await supabase
        .from('payment_methods')
        .select('id, name, account_number, account_type');
      
      // Create a map of payment methods by ID
      const methodsMap = new Map();
      if (methodsData) {
        methodsData.forEach(method => {
          methodsMap.set(method.id, method);
        });
      }

      // Enhance registrations with payment method names
      const enhancedData = registrationsData.map(reg => {
        const paymentMethod = reg.payment_method_id ? methodsMap.get(reg.payment_method_id) : null;
        return {
          ...reg,
          payment_method_name: paymentMethod ? paymentMethod.name : 'Unknown'
        };
      });

      return enhancedData as PaymentRegistration[];
    },
  });

  // Fetch payment methods for dropdown
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name, account_number, account_type')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      return data;
    },
  });

  // Get unique categories from registrations
  const categories = registrations 
    ? [...new Set(registrations.map(reg => reg.category))].sort()
    : [];

  // Apply filters and search
  const filteredRegistrations = registrations?.filter(reg => {
    // Apply payment method filter
    if (paymentMethodFilter !== "all" && reg.payment_method_id?.toString() !== paymentMethodFilter) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter !== "all" && reg.category !== categoryFilter) {
      return false;
    }
    
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

  // Toggle individual registration selection
  const toggleRegistrationSelection = (id: string) => {
    const newSelection = new Set(selectedRegistrations);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRegistrations(newSelection);
  };
  
  // Toggle all registrations selection
  useEffect(() => {
    if (selectAll && filteredRegistrations) {
      const allIds = new Set(filteredRegistrations.map(reg => reg.id));
      setSelectedRegistrations(allIds);
    } else if (!selectAll) {
      setSelectedRegistrations(new Set());
    }
  }, [selectAll, filteredRegistrations]);
  
  // Update selectAll state when individual selections change
  useEffect(() => {
    if (filteredRegistrations && filteredRegistrations.length > 0) {
      const allSelected = filteredRegistrations.every(reg => selectedRegistrations.has(reg.id));
      if (allSelected !== selectAll) {
        setSelectAll(allSelected);
      }
    }
  }, [selectedRegistrations, filteredRegistrations]);
  
  // Open confirmation dialog for batch verification
  const handleBatchVerify = () => {
    if (selectedRegistrations.size === 0) {
      toast({
        title: "No Registrations Selected",
        description: "Please select at least one registration to verify.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDialogOpen(true);
  };
  
  // Perform batch verification
  const handleConfirmBatchVerification = async () => {
    if (selectedRegistrations.size === 0) return;
    
    setIsUpdating(true);
    
    try {
      const selectedRegistrationIds = Array.from(selectedRegistrations);
      const selectedRegistrationsData = registrations?.filter(reg => selectedRegistrationIds.includes(reg.id)) || [];
      
      // Process in batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      const batches = Math.ceil(selectedRegistrationsData.length / batchSize);
      
      let successCount = 0;
      let failCount = 0;
      let receiptCount = 0;
      
      // Show processing toast
      toast({
        title: "Processing",
        description: `Updating ${selectedRegistrationsData.length} registrations...`,
      });
      
      // Process registrations in batches
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min((i + 1) * batchSize, selectedRegistrationsData.length);
        const batchRegistrations = selectedRegistrationsData.slice(start, end);
        
        // Update each registration with history tracking
        await Promise.all(batchRegistrations.map(async (registration) => {
          try {
            const { success, error, receiptNumber } = await updatePaymentStatus(
              registration,
              paymentStatus as 'confirmed' | 'rejected' | 'pending',
              paymentNotes || null,
              "admin", // This could be dynamically set to the logged-in admin
              sendEmail
            );
            
            if (success) {
              successCount++;
              if (receiptNumber) receiptCount++;
            } else {
              console.error(`Error updating registration ${registration.registration_id}:`, error);
              failCount++;
            }
          } catch (err) {
            console.error(`Error processing registration ${registration.registration_id}:`, err);
            failCount++;
          }
        }));
      }
      
      // Show completion toast
      toast({
        title: "Batch Update Complete",
        description: `Successfully updated ${successCount} registrations to ${paymentStatus}.${
          failCount > 0 ? ` ${failCount} failed.` : ''
        }${
          receiptCount > 0 ? ` ${receiptCount} receipts generated.` : ''
        }`,
      });
      
      // Refetch data to update the UI
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      setIsDialogOpen(false);
      setSelectedRegistrations(new Set());
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
  
  // Reset filters
  const resetFilters = () => {
    setPaymentMethodFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Payment Verification</CardTitle>
          <CardDescription>Verify multiple payments at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Filters */}
            <div className="bg-muted/40 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-1" /> Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="payment-method-filter" className="text-xs">Payment Method</Label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger id="payment-method-filter" className="w-full">
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Methods</SelectItem>
                      {paymentMethods?.map(method => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category-filter" className="text-xs">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="category-filter" className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search-filter" className="text-xs">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-filter"
                      placeholder="Search by name, ID, reference..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          
            {/* Batch Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectAll} 
                  onCheckedChange={() => setSelectAll(!selectAll)}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  {selectAll ? "Deselect All" : "Select All"}
                </label>
                <span className="text-xs text-muted-foreground ml-2">
                  {selectedRegistrations.size} selected
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button 
                  onClick={handleBatchVerify} 
                  disabled={selectedRegistrations.size === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Verify Selected
                </Button>
              </div>
            </div>
            
            {/* Registrations Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRegistrations && filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRegistrations.has(registration.id)}
                            onCheckedChange={() => toggleRegistrationSelection(registration.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{registration.registration_id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{registration.first_name} {registration.last_name}</div>
                          <div className="text-xs text-muted-foreground">{registration.email}</div>
                        </TableCell>
                        <TableCell>{registration.category}</TableCell>
                        <TableCell>{formatCurrency(registration.price)}</TableCell>
                        <TableCell>{registration.payment_method_name || "-"}</TableCell>
                        <TableCell>{registration.payment_reference_number || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-10 w-10 mb-2 opacity-30" />
                          <p>No pending payments found</p>
                          {(paymentMethodFilter !== "all" || categoryFilter !== "all" || searchTerm) && (
                            <Button 
                              variant="link" 
                              className="mt-2 text-sm" 
                              onClick={resetFilters}
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Batch Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Verify Payments</DialogTitle>
            <DialogDescription>
              You are about to update {selectedRegistrations.size} registrations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="batch-payment-status">Set Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger id="batch-payment-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="batch-payment-notes">Notes (optional)</Label>
              <Textarea 
                id="batch-payment-notes" 
                placeholder="Add notes about these payments"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These notes will be added to all selected registrations
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="batch-send-email" 
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked === true)}
              />
              <Label 
                htmlFor="batch-send-email" 
                className="text-sm cursor-pointer flex items-center"
              >
                <Mail className="h-4 w-4 mr-1" />
                Send email notifications
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBatchVerification}
              disabled={isUpdating || isSendingEmails}
              className={
                paymentStatus === "confirmed" ? "bg-green-600 hover:bg-green-700" : 
                paymentStatus === "rejected" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSendingEmails ? "Sending Emails..." : "Processing..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {`Verify ${selectedRegistrations.size} Payments`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
