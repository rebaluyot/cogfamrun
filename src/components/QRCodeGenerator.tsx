import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatCurrency, getCategoryColorClass } from "@/lib/format-utils";
import QRCode from "react-qr-code";
import QRCodeNode from "qrcode";
import emailjs from '@emailjs/browser';
import { initializeEmailJS, sendEmailWithEmailJS } from "@/lib/emailjs-utils";
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

      /*
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
      */
      const initialized = await initializeEmailJS();
      
      if (!initialized) {
        throw new Error("Failed to initialize EmailJS. Check your settings in the Admin panel.");
      }


     const result = await sendEmailWithEmailJS({
             to_email: email,
             participant_name: participantName,
             registration_id: registrationId,
             category: category,
             price: formatCurrency(price),
             shirt_size: shirtSize,
             qr_code_image: qrDataUrl,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

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
    // Create a print-friendly iframe that stays within the page
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <title>CogFamRun Registration - ${registrationId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px; 
              line-height: 1.6;
              margin: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .header h2 {
              font-size: 18px;
              margin-top: 0;
            }
            .section { 
              margin-bottom: 20px; 
            }
            .section h3 {
              font-size: 16px;
              margin-bottom: 10px;
            }
            .qr-code { 
              text-align: center; 
              margin: 20px 0; 
            }
            .details { 
              margin-bottom: 20px; 
            }
            .details div { 
              margin: 8px 0; 
            }
            .reminder { 
              background: #f0f7ff; 
              padding: 12px; 
              border-radius: 8px; 
            }
            .reminder ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .footer { 
              margin-top: 20px; 
              text-align: center; 
              font-size: 0.9em; 
            }
            .print-button {
              display: block;
              margin: 20px auto;
              padding: 10px 20px;
              background: #0066cc;
              color: white;
              border: none;
              border-radius: 5px;
              font-size: 16px;
              cursor: pointer;
            }
            .print-button:hover {
              background: #0055aa;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .print-button { display: none; }
            }
            @media screen and (max-width: 480px) {
              body {
                padding: 10px;
                font-size: 14px;
              }
              .header h1 {
                font-size: 20px;
              }
              .header h2 {
                font-size: 16px;
              }
              .section h3 {
                font-size: 15px;
              }
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
              ''}" alt="QR Code" style="width: 180px; height: 180px; max-width: 100%;"/>
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
          
          <button class="print-button" onclick="printRegistration()">Print this page</button>

          <script>
            function printRegistration() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    // Write content to the iframe
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();
    
    // Once loaded, trigger print but don't close automatically
    printFrame.onload = function() {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Show success message
        setTimeout(() => {
          toast({
            title: "Ready to print",
            description: "Print dialog has been opened. Your registration details are ready to print.",
          });
        }, 500);
      } catch (err) {
        console.error('Error printing:', err);
        toast({
          title: "Error",
          description: "Could not open print dialog. Please try again.",
          variant: "destructive",
        });
      }
      
      // Remove the frame after a delay (but keep it long enough for print to complete)
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 5000);
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">Registration Successful! 🎉</h1>
        <p className="text-sm sm:text-base text-gray-600">Your registration has been completed successfully.</p>
      </div>

      <Card>
        <CardHeader className="text-center py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg">Registration Details</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Keep this information for your records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="text-base sm:text-lg font-semibold">Registration ID</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 bg-blue-50 p-2 sm:p-3 rounded-lg break-all">
              {registrationId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg text-sm sm:text-base">
            <div>
              <span className="text-xs sm:text-sm text-gray-600">Participant:</span>
              <div className="font-semibold truncate">{participantName}</div>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-600">Category:</span>
              <div>
                <Badge className={`${getCategoryColorClass(category)} text-xs sm:text-sm`}>{category}</Badge>
              </div>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-600">Registration Fee:</span>
              <div className="font-bold text-green-600">{formatCurrency(price)}</div>
            </div>
            <div>
              <span className="text-xs sm:text-sm text-gray-600">Status:</span>
              <div>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">Pending Payment</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-center py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg">QR Code for Payment & Kit Collection</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use this QR code for payment processing and to claim your race kit and freebies
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-3 sm:space-y-4 px-3 sm:px-6">
          {!qrGenerated ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                <span className="text-gray-500 text-xs sm:text-sm px-2">QR Code will appear here</span>
              </div>
              <Button 
                onClick={generateQR} 
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 px-3 sm:py-2 sm:px-4"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    <span className="text-sm">Sending to Email...</span>
                  </>
                ) : "Generate & Send QR Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div ref={qrRef} className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg shadow-md p-1 sm:p-2">
                <QRCode
                  value={qrData}
                  size={150}
                  style={{ height: "auto", maxWidth: "100%", width: "100%", padding: "0.5rem" }}
                  level="H"
                />
              </div>
              <div className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                <p className="font-medium mb-1 sm:mb-2">QR Code Generated Successfully!</p>
                <p>Present this QR code at:</p>
                <ul className="text-left space-y-0.5 sm:space-y-1 mt-1 sm:mt-2">
                  <li>• Payment counter for fee processing</li>
                  <li>• Registration booth for kit collection</li>
                  <li>• Freebies distribution area</li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" onClick={handleDownload} className="text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Download QR Code</Button>
                <Button variant="outline" onClick={handlePrint} className="text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Print Registration</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Important Reminders:</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
            <li>• Save your Registration ID: {registrationId}</li>
            <li>• Payment deadline: August 15, 2025</li>
            <li>• Kit collection: August 1-15, 2024</li>
            <li>• Race day: August 22, 2025 at 5:00 AM</li>
            <li>• Bring a valid ID and this QR code for verification</li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:space-y-0">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm py-1 px-3 sm:py-2">
            View Home
          </Button>
        </Link>
        <Link to="/registration?new=true" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm py-1 px-3 sm:py-2">
            Register Another Participant
          </Button>
        </Link>
      </div>
    </div>
  );
};
