import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import QRCode from "react-qr-code";

interface PaymentMethodProps {
  amount: number;
}

export const PaymentMethod = ({ amount }: PaymentMethodProps) => {
  const [selectedAccount, setSelectedAccount] = useState("");

  const gcashAccounts = [
    {
      id: "1",
      name: "COG FamRun Official",
      number: "0999 88. ..88 ",
      qr: "/assets/famrungcash01.jpeg",
    },
    {
      id: "2",
      name: "COG Events",
      number: "0918-234-5678",
      qr: "/assets/famrungcash01.jpeg",
    },
    {
      id: "3",
      name: "COG Sports Ministry",
      number: "0919-345-6789",
      qr: "/assets/famrungcash01.jpeg",
    },
  ];
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full bg-white text-[#00A1E4] py-4 rounded-xl font-bold transition-all shadow hover:shadow-md border-2 border-[#00A1E4]/20 hover:border-[#00A1E4] hover:-translate-y-0.5 active:translate-y-0">
          <div className="flex items-center justify-center gap-4">
            <div className="rounded-lg">
              <img 
                src="/assets/gcash-logo.png" 
                alt="GCash" 
                className="h-8 w-24 object-contain"
              />
            </div>
            <span className="text-lg tracking-wide">Pay with GCash</span>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="sm:max-w-md mx-auto h-auto max-h-[90vh] overflow-y-auto pt-6">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold mb-2">GCash Payment</SheetTitle>
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
            {gcashAccounts.map((account) => (
              <Card key={account.id} className={`transition-all ${
                selectedAccount === account.id ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={account.id} id={account.id} />
                    <div className="flex-grow">
                      <Label htmlFor={account.id} className="text-base font-medium">
                        {account.name}
                      </Label>
                      <p className="text-sm text-gray-600">{account.number}</p>
                    </div>
                  </div>
                  {selectedAccount === account.id && (
                    <div className="mt-4">
                      <div className="bg-white p-4 rounded-lg flex justify-center">
                        {/* 
                        <QRCode value={account.qr} size={200} />
                        */}
                        <img src="/assets/qr-famrun.jpeg" alt="GCash QR" className="w-64 mx-auto" />
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        <p>1. Open your GCash app</p>
                        <p>2. Scan this QR code or send to {account.number}</p>
                        <p>3. Enter the exact amount: ₱{amount.toLocaleString()}</p>
                        <p>4. Take a screenshot of your payment confirmation</p>
                        <p>5. Upload the screenshot below</p>
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
