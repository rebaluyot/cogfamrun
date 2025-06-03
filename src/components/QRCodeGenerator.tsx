import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatCurrency, getCategoryColorClass } from "@/lib/format-utils";
import QRCode from "react-qr-code";
import QRCodeNode from "qrcode";
import emailjs from '@emailjs/browser';
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  registrationId: string;
  participantName: string;
  category: string;
  price: number;
  shirtSize: string;
  email: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ registrationId, participantName, category, price, shirtSize, email }) => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const qrData = `CogFamRun2025|${registrationId}|${participantName}|${category}|${price}|${shirtSize}`;
  
  const generateQRImage = async (): Promise<string> => {
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCodeNode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return qrDataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw err;
    }
  };

  const generateQR = async () => {
    setIsSending(true);
    try {
      // Generate QR code image
      const qrDataUrl = await generateQRImage();
      
      // Convert data URL to base64
      // const base64Data = qrDataUrl.split(',')[1];

      // Initialize EmailJS
      emailjs.init("vc8LzDacZcreqI6fN");

      // Send email with QR code image
      await emailjs.send(
        "service_i6px4qb",
        "template_1zf9bgr",
        {
          to_email: email,
          participant_name: participantName,
          registration_id: registrationId,
          category: category,
          price: formatCurrency(price),
          shirt_size: shirtSize,
          qr_code_image: qrDataUrl,
        }
      );

      setQrGenerated(true);
      toast({
        title: "Success!",
        description: "QR code has been sent to your email.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    try {
      const qrDataUrl = await generateQRImage();
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `CogFamRun-${registrationId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Failed to open print window. Please check your popup blocker.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>CogFamRun Registration - ${registrationId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .details { margin-bottom: 20px; }
            .details div { margin: 10px 0; }
            .reminder { background: #f0f7ff; padding: 15px; border-radius: 8px; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.9em; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CogFamRun 2025 Registration</h1>
            <h2>Registration ID: ${registrationId}</h2>
          </div>
          
          <div class="section details">
            <h3>Participant Details</h3>
            <div><strong>Name:</strong> ${participantName}</div>
            <div><strong>Category:</strong> ${category}</div>
            <div><strong>Registration Fee:</strong> ${formatCurrency(price)}</div>
            <div><strong>Shirt Size:</strong> ${shirtSize}</div>
            <div><strong>Status:</strong> Pending Payment</div>
          </div>

          <div class="section qr-code">
            <h3>QR Code for Payment & Kit Collection</h3>
            <img src="${qrRef.current?.querySelector('svg')?.outerHTML ? 
              'data:image/svg+xml;base64,' + btoa(qrRef.current.querySelector('svg')?.outerHTML || '') : 
              ''}" alt="QR Code" style="width: 200px; height: 200px;"/>
            <p><em>Present this QR code at the payment counter and kit collection area</em></p>
          </div>

          <div class="section reminder">
            <h3>Important Reminders</h3>
            <ul>
              <li>Payment deadline: August 15, 2025</li>
              <li>Kit collection: August 1-15, 2024</li>
              <li>Race day: August 22, 2025 at 5:00 AM</li>
              <li>Bring a valid ID and this QR code for verification</li>
            </ul>
          </div>

          <div class="footer">
            <p>For inquiries, please contact the event organizers.</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-2">Registration Successful! 🎉</h1>
        <p className="text-gray-600">Your registration has been completed successfully.</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>Keep this information for your records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold">Registration ID</div>
            <div className="text-2xl font-bold text-blue-600 bg-blue-50 p-3 rounded-lg">
              {registrationId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm text-gray-600">Participant:</span>
              <div className="font-semibold">{participantName}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Category:</span>
              <div>
                <Badge className={getCategoryColorClass(category)}>{category}</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Registration Fee:</span>
              <div className="font-bold text-green-600">{formatCurrency(price)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <div>
                <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center">
          <CardTitle>QR Code for Payment & Kit Collection</CardTitle>
          <CardDescription>
            Use this QR code for payment processing and to claim your race kit and freebies
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {!qrGenerated ? (
            <div className="space-y-4">
              <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                <span className="text-gray-500">QR Code will appear here</span>
              </div>
              <Button 
                onClick={generateQR} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    Sending to Email...
                  </>
                ) : "Generate & Send QR Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div ref={qrRef} className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg shadow-md p-2">
                <QRCode
                  value={qrData}
                  size={180}
                  style={{ height: "auto", maxWidth: "100%", width: "100%", padding: "1rem" }}
                  level="H"
                />
              </div>
              <div className="text-sm text-gray-600 max-w-md mx-auto">
                <p className="font-medium mb-2">QR Code Generated Successfully!</p>
                <p>Present this QR code at:</p>
                <ul className="text-left space-y-1 mt-2">
                  <li>• Payment counter for fee processing</li>
                  <li>• Registration booth for kit collection</li>
                  <li>• Freebies distribution area</li>
                </ul>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleDownload}>Download QR Code</Button>
                <Button variant="outline" onClick={handlePrint}>Print Registration</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Important Reminders:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Save your Registration ID: {registrationId}</li>
            <li>• Payment deadline: August 15, 2025</li>
            <li>• Kit collection: August 1-15, 2024</li>
            <li>• Race day: August 22, 2025 at 5:00 AM</li>
            <li>• Bring a valid ID and this QR code for verification</li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <Link to="/dashboard">
          <Button variant="outline" className="mr-2">
            View Dashboard
          </Button>
        </Link>
        <Link to="/registration">
          <Button variant="outline">
            Register Another Participant
          </Button>
        </Link>
      </div>
    </div>
  );
};
