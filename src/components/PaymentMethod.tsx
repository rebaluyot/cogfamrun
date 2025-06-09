import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import QRCode from "react-qr-code";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Loader2 } from "lucide-react";

interface PaymentMethodProps {
  amount: number;
  onMethodSelect?: (methodId: number) => void;
  onReferenceInput?: (reference: string) => void;
  defaultMethodId?: number;
}

export const PaymentMethod = ({ 
  amount, 
  onMethodSelect,
  onReferenceInput,
  defaultMethodId 
}: PaymentMethodProps) => {
  const [selectedAccount, setSelectedAccount] = useState(defaultMethodId ? String(defaultMethodId) : "");
  const [referenceNumber, setReferenceNumber] = useState("");
  const { data: paymentMethods, isLoading, error } = usePaymentMethods();
  
  // Notify parent component when selected method changes
  useEffect(() => {
    if (selectedAccount && onMethodSelect) {
      onMethodSelect(Number(selectedAccount));
    }
  }, [selectedAccount, onMethodSelect]);
  
  // Notify parent component when reference number changes
  useEffect(() => {
    if (referenceNumber && onReferenceInput) {
      onReferenceInput(referenceNumber);
    }
  }, [referenceNumber, onReferenceInput]);
  
  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <div className="w-full bg-white py-4 rounded-xl shadow border-2 border-[#00A1E4]/20 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Show error state if data fetch failed
  if (error || !paymentMethods || paymentMethods.length === 0) {
    return (
      <div className="w-full bg-white text-center py-4 rounded-xl shadow border-2 border-[#00A1E4]/20 text-muted-foreground">
        Payment methods unavailable
      </div>
    );
  }

  // Get the first available payment method for button display
  const primaryMethod = paymentMethods.find(pm => pm.active) || paymentMethods[0];
  const paymentTypeLabel = primaryMethod.account_type === 'gcash' ? 'GCash' : 
    primaryMethod.account_type === 'paymaya' ? 'PayMaya' : 
    primaryMethod.account_type === 'bank' ? 'Bank Transfer' : 'Cash';
    
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full bg-white text-[#00A1E4] py-4 rounded-xl font-bold transition-all shadow hover:shadow-md border-2 border-[#00A1E4]/20 hover:border-[#00A1E4] hover:-translate-y-0.5 active:translate-y-0">
          <div className="flex items-center justify-center gap-4">
            <div className="rounded-lg">
              <img 
                src={paymentTypeLabel === 'GCash' ? "/assets/gcash-logo.png" : "/assets/solid-fam-run-logo.png"} 
                alt={paymentTypeLabel} 
                className="h-8 w-24 object-contain"
              />
            </div>
            <span className="text-lg tracking-wide">
              Pay with {paymentTypeLabel} <span className="text-red-500">*</span>
            </span>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="sm:max-w-md mx-auto h-auto max-h-[90vh] overflow-y-auto pt-6">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold mb-2">{paymentTypeLabel} Payment</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <div className="mb-6">
            <div className="text-lg font-semibold text-green-600">
              Amount to Pay: ₱{amount.toLocaleString()}
            </div>
          </div>
          
          <RadioGroup
            value={selectedAccount}
            onValueChange={setSelectedAccount}
            className="space-y-4"
          >
            {paymentMethods.filter(method => method.active).map((method) => (
              <Card key={method.id} className={`transition-all ${
                selectedAccount === String(method.id) ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={String(method.id)} id={String(method.id)} />
                    <div className="flex-grow">
                      <Label htmlFor={String(method.id)} className="text-base font-medium">
                        {method.name}
                      </Label>
                      <p className="text-sm text-gray-600">{method.account_number}</p>
                    </div>
                  </div>
                  {selectedAccount === String(method.id) && (
                    <div className="mt-4">
                      <div className="bg-white p-4 rounded-lg flex justify-center">
                        {method.qr_image_url ? (
                          <img 
                            src={method.qr_image_url} 
                            alt={`${method.name} QR Code`} 
                            className="w-64 mx-auto"
                          />
                        ) : (
                          <div className="w-64 h-64 flex items-center justify-center text-muted-foreground border rounded">
                            No QR code available
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        <p>1. Open your {paymentTypeLabel} app</p>
                        <p>2. Scan this QR code or send to {method.account_number}</p>
                        <p>3. Enter the exact amount: ₱{amount.toLocaleString()}</p>
                        <p>4. Take a screenshot of your payment confirmation</p>
                        <p>5. Enter reference number below</p>
                        <p>6. Upload the screenshot on the proof of payment</p>
                      </div>
                      
                      <div className="mt-4">
                        <label htmlFor="reference-number" className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Reference Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="reference-number"
                            placeholder="Enter transaction/reference number"
                            className={`w-full p-2 border rounded-md ${
                              referenceNumber.length < 5 && referenceNumber.length > 0
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : referenceNumber.length >= 5
                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                : ''
                            }`}
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                          />
                          {referenceNumber.length >= 5 && (
                            <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>
                          )}
                        </div>
                        {referenceNumber.length < 5 && referenceNumber.length > 0 ? (
                          <p className="text-xs text-red-500 mt-1">
                            Reference number must be at least 5 characters
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Please enter the reference/transaction number from your payment receipt
                          </p>
                        )}
                        
                        <div className="mt-4">
                          <SheetClose asChild>
                            <button 
                              className={`w-full py-3 rounded-xl font-semibold transition-all shadow hover:shadow-md ${
                                referenceNumber.length >= 5 
                                ? 'bg-[#00A1E4] text-white hover:bg-[#0089c3] hover:-translate-y-0.5 active:translate-y-0 border border-[#00A1E4]/20' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                              disabled={referenceNumber.length < 5}
                            >
                              {referenceNumber.length >= 5 ? (
                                <div className="flex items-center justify-center">
                                  <span className="mr-2">✓</span>
                                  <span>Confirm Payment</span>
                                </div>
                              ) : (
                                "Confirm Payment"
                              )}
                            </button>
                          </SheetClose>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
};
