import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { usePaymentMethods, usePaymentMethodsAdmin, PaymentMethod } from "@/hooks/usePaymentMethods";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, CreditCard, Edit, Image, Loader2, Plus, Trash2, Upload, WrenchIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRImageTester } from "./QRImageTester";

export const PaymentMethodManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const { 
    getPaymentMethods, 
    createPaymentMethod, 
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodActive,
    uploadQRImage
  } = usePaymentMethodsAdmin();
  
  const [activeTab, setActiveTab] = useState("manage");

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    account_number: '',
    qr_image_url: '',
    account_type: 'gcash',
    active: true
  });
  const [qrPreview, setQrPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset form when creating new payment method
  useEffect(() => {
    if (isCreating) {
      setFormData({
        name: '',
        account_number: '',
        qr_image_url: '',
        account_type: 'gcash',
        active: true
      });
      setQrPreview('');
      setSelectedFile(null);
    }
  }, [isCreating]);

  // Set form data when editing
  useEffect(() => {
    if (selectedPaymentMethod && isEditing) {
      setFormData({
        name: selectedPaymentMethod.name,
        account_number: selectedPaymentMethod.account_number,
        qr_image_url: selectedPaymentMethod.qr_image_url || '',
        account_type: selectedPaymentMethod.account_type,
        active: selectedPaymentMethod.active
      });
      setQrPreview(selectedPaymentMethod.qr_image_url || '');
      setSelectedFile(null);
    }
  }, [selectedPaymentMethod, isEditing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setQrPreview(previewUrl);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let qrImageUrl = formData.qr_image_url;

      // Upload QR image if selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          qrImageUrl = await uploadQRImage(selectedFile);
        } catch (uploadError: any) {
          console.error('Error uploading QR image:', uploadError);
          toast({
            title: "Upload Error",
            description: `Failed to upload QR image: ${uploadError.message || "Unknown error"}. Using previous image if available.`,
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      // Create or update payment method
      if (isCreating) {
        await createPaymentMethod({
          ...formData,
          qr_image_url: qrImageUrl
        });
        toast({
          title: "Payment Method Created",
          description: "The payment method has been created successfully."
        });
      } else if (isEditing && selectedPaymentMethod) {
        await updatePaymentMethod(selectedPaymentMethod.id, {
          ...formData,
          qr_image_url: qrImageUrl
        });
        toast({
          title: "Payment Method Updated",
          description: "The payment method has been updated successfully.",
        });
      }

      // Refresh data and reset state
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsCreating(false);
      setIsEditing(false);
      setSelectedPaymentMethod(null);
    } catch (error: any) {
      console.error('Error saving payment method:', error);
      let errorMessage = "Failed to save payment method.";
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      if (error.message?.includes("permission denied") || error.message?.includes("violates row-level security")) {
        errorMessage += " This is likely due to RLS policies. Please see PAYMENT-METHODS-RLS-FIX.md for instructions.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await togglePaymentMethodActive(id, active);
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({
        title: active ? "Payment Method Activated" : "Payment Method Deactivated",
        description: `The payment method has been ${active ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment method status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPaymentMethod) return;
    
    try {
      await deletePaymentMethod(selectedPaymentMethod.id);
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setShowDeleteDialog(false);
      setSelectedPaymentMethod(null);
      toast({
        title: "Payment Method Deleted",
        description: "The payment method has been deleted successfully."
      });
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      let errorMessage = "Failed to delete payment method.";
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      if (error.message?.includes("permission denied") || error.message?.includes("violates row-level security")) {
        errorMessage += " This is likely due to RLS policies. Please see PAYMENT-METHODS-RLS-FIX.md for instructions.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="manage">Manage Payment Methods</TabsTrigger>
          <TabsTrigger value="tools">Troubleshooting Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Configure payment options for registrations</CardDescription>
                </div>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                <Plus size={16} />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Payment Method</DialogTitle>
                <DialogDescription>Create a new payment option for registrations</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., COG FamRun Official"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select 
                    value={formData.account_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="paymaya">PayMaya</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    placeholder="e.g., 09123456789"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="block mb-2">QR Code Image</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                  
                  {qrPreview && (
                    <div className="border rounded-md p-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <img 
                        src={qrPreview} 
                        alt="QR Code Preview" 
                        className="max-w-full h-auto max-h-40 mx-auto" 
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating || isUploading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Check size={16} />
                        <span>Save Payment Method</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No payment methods found</p>
            <p className="text-sm text-muted-foreground mt-1">Click the "Add Payment Method" button to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>QR Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods?.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{method.account_type}</span>
                    </TableCell>
                    <TableCell>{method.account_number}</TableCell>
                    <TableCell>
                      {method.qr_image_url ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => window.open(method.qr_image_url!, '_blank')}
                        >
                          <Image size={16} className="mr-2" />
                          View QR
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">No QR image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={method.active} 
                          onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                        />
                        <span className={method.active ? 'text-green-600 text-xs font-medium' : 'text-gray-500 text-xs'}>
                          {method.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog open={isEditing && selectedPaymentMethod?.id === method.id} onOpenChange={(open) => {
                          setIsEditing(open);
                          if (open) setSelectedPaymentMethod(method);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Payment Method</DialogTitle>
                              <DialogDescription>Update payment method details</DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Account Name</Label>
                                <Input
                                  id="edit-name"
                                  placeholder="e.g., COG FamRun Official"
                                  value={formData.name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-account_type">Account Type</Label>
                                <Select 
                                  value={formData.account_type} 
                                  onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gcash">GCash</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="paymaya">PayMaya</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-account_number">Account Number</Label>
                                <Input
                                  id="edit-account_number"
                                  placeholder="e.g., 09123456789"
                                  value={formData.account_number}
                                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="block mb-2">QR Code Image</Label>
                                {qrPreview && (
                                  <div className="border rounded-md p-2 mb-2">
                                    <img 
                                      src={qrPreview} 
                                      alt="QR Code" 
                                      className="max-w-full h-auto max-h-40 mx-auto" 
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="flex-1"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="edit-active"
                                  checked={formData.active}
                                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                                />
                                <Label htmlFor="edit-active">Active</Label>
                              </div>

                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isUpdating}>
                                  {isUpdating || isUploading ? (
                                    <div className="flex items-center space-x-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Updating...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Check size={16} />
                                      <span>Update</span>
                                    </div>
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog open={showDeleteDialog && selectedPaymentMethod?.id === method.id} onOpenChange={(open) => {
                          setShowDeleteDialog(open);
                          if (!open) setSelectedPaymentMethod(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setSelectedPaymentMethod(method)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{method.name}" payment method?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools">
          <QRImageTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};
