import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentReceipt, generatePaymentReceipt, PaymentReceipt } from "@/lib/payment-utils";
import { formatCurrency } from "@/lib/format-utils";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, Printer, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface PaymentReceiptComponentProps {
  registration: {
    id: string;
    registration_id: string;
    first_name: string;
    last_name: string;
    email: string;
    category: string;
    price: number;
    payment_method_name?: string;
    payment_reference_number?: string | null;
    payment_date?: string | null;
    payment_status?: string | null;
  };
}

export const PaymentReceiptComponent: React.FC<PaymentReceiptComponentProps> = ({ registration }) => {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { toast } = useToast();

  // Fetch or generate receipt
  const fetchReceipt = async () => {
    if (!registration.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await getPaymentReceipt(registration.id);
      
      if (error) {
        throw error;
      }
      
      setReceipt(data);
    } catch (err) {
      console.error("Failed to fetch payment receipt:", err);
      setError("Unable to load receipt information");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReceipt();
  }, [registration.id]);

  // Generate a new receipt
  const handleGenerateReceipt = async () => {
    try {
      setGenerating(true);
      const { success, receiptNumber, error } = await generatePaymentReceipt(
        registration.id,
        "admin"
      );
      
      if (!success) {
        throw error || new Error("Failed to generate receipt");
      }
      
      toast({
        title: "Receipt Generated",
        description: `Receipt ${receiptNumber} has been generated successfully.`
      });
      
      // Refresh receipt data
      fetchReceipt();
    } catch (err) {
      console.error("Error generating receipt:", err);
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Current date for receipt
  const receiptDate = receipt?.generated_at 
    ? new Date(receipt.generated_at).toLocaleDateString() 
    : new Date().toLocaleDateString();

  // Handle printing the receipt
  const handlePrintReceipt = () => {
    // Open print dialog for the receipt dialog content
    window.print();
  };

  // Handle downloading the receipt (in a real app, this would download a PDF)
  const handleDownloadReceipt = () => {
    toast({
      title: "Download Started",
      description: "Your receipt will download shortly."
    });
    
    // This would be replaced with actual PDF download logic
    setTimeout(() => {
      toast({
        title: "Feature Notice",
        description: "This is a placeholder for PDF download functionality.",
      });
    }, 1500);
  };

  if (!registration.payment_status || registration.payment_status !== "confirmed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Payment Receipt
          </CardTitle>
          <CardDescription>No receipt available - payment not confirmed</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Payment Receipt
        </CardTitle>
        <CardDescription>
          {receipt ? `Receipt #${receipt.receipt_number}` : "Generate or view receipt"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : receipt ? (
          <div className="space-y-4">
            <p className="text-sm">
              Receipt <span className="font-semibold">#{receipt.receipt_number}</span> was generated on{" "}
              {new Date(receipt.generated_at).toLocaleDateString()}
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => setShowReceipt(true)}
              >
                View Receipt
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDownloadReceipt}
              >
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No receipt has been generated yet. Generate one now?
            </p>
            <Button 
              onClick={handleGenerateReceipt} 
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Receipt</>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Receipt #{receipt?.receipt_number}</DialogDescription>
          </DialogHeader>
          
          {/* Receipt Content */}
          <div className="p-6 border rounded-lg bg-white text-black print:shadow-none" id="printable-receipt">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div className="flex items-center">
                <img 
                  src="/assets/solid-fam-run-logo.png" 
                  alt="COG FamRun Logo" 
                  className="h-12 mr-4" 
                />
                <div>
                  <h2 className="font-bold text-xl">COG FamRun 2025</h2>
                  <p className="text-sm text-gray-600">Official Payment Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">Receipt #{receipt?.receipt_number}</p>
                <p className="text-sm text-gray-600">Date: {receiptDate}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Participant Information</h3>
              <p><span className="font-medium">Name:</span> {registration.first_name} {registration.last_name}</p>
              <p><span className="font-medium">Email:</span> {registration.email}</p>
              <p><span className="font-medium">Registration ID:</span> {registration.registration_id}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference #</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Registration Fee</TableCell>
                    <TableCell>{registration.category}</TableCell>
                    <TableCell>{registration.payment_method_name || "N/A"}</TableCell>
                    <TableCell>{registration.payment_reference_number || "N/A"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(registration.price)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(registration.price)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t">
              <p>Thank you for participating in COG FamRun 2025!</p>
              <p>This receipt was automatically generated and is valid without signature.</p>
              <p className="mt-2">Receipt ID: {receipt?.id}</p>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <Button onClick={() => setShowReceipt(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
