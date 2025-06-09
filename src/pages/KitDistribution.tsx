import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useKitDistribution, KitClaimData } from "@/hooks/useKitDistribution";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getCategoryColorClass } from "@/lib/format-utils";
import { QrCode, Loader2, CheckCircle, User, Calendar, Package, Scan, AlertTriangle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useQueryClient } from "@tanstack/react-query";

// For camera scanning
let scanner: any = null;

// Main component
export const KitDistributionPage = () => {
  const [qrData, setQrData] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [claimNotes, setClaimNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<any>(null);
  const { parseQRCode, lookupRegistration, updateKitClaimStatus } = useKitDistribution();
  const { toast } = useToast();
  const { isAuthenticated, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  // Clean up scanner on component unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        try {
          scanner.stop();
        } catch (e) {
          console.error("Error stopping scanner:", e);
        }
      }
    };
  }, []);
  
  // Handle manual QR code input
  const handleManualQRInput = async () => {
    if (!qrData.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid QR code value",
        variant: "destructive",
      });
      return;
    }
    
    await processQRData(qrData);
  };
  
  // Check if we're in a secure context (HTTPS)
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);
  
  // Check if we're in a secure context (HTTPS)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecureContext(
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
      );
    }
  }, []);

  // Start QR code scanner
  const startScanner = async () => {
    if (scanActive) return;
    
    // Check if we're in a secure context first
    if (!isSecureContext) {
      setError("Camera access requires HTTPS. This app is currently running on HTTP which prevents camera functionality. Please use manual entry instead.");
      return;
    }
    
    try {
      setError(null);
      
      // Check if camera is available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log("Available camera devices:", videoDevices);
        
        if (videoDevices.length === 0) {
          setError("No camera detected on your device. Please use manual entry instead.");
          return;
        }
        
        // Check for Mac-specific privacy concerns
        const labeledDevices = videoDevices.filter(device => !!device.label);
        if (videoDevices.length > 0 && labeledDevices.length === 0) {
          console.warn("Camera detected but labels are empty - likely permission issue");
          // We'll continue but flag this as a potential permission issue
        }
      } catch (err) {
        console.error("Error checking for camera devices:", err);
      }
      
      // Dynamically import HTML5-QRCode library
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      
      setScanActive(true);
      
      // Initialize scanner with more Mac-friendly options
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 5,  // Lower fps for better compatibility
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,  // Show torch button if available
          aspectRatio: 1.0,  // Use square aspect ratio for better compatibility
          formatsToSupport: [0], // Only support QR codes for better performance
        },
        false
      );
      
      // Define success callback
      const onScanSuccess = async (decodedText: string) => {
        // Stop scanner after successful scan
        await scanner.clear();
        setScanActive(false);
        
        // Process the QR data
        await processQRData(decodedText);
      };
      
      // Start scanner
      scanner.render(onScanSuccess, (error: any) => {
        console.error("QR scan error:", error);
        // We don't need to show errors to the user as the scanner UI handles that
      });
      
      // Verify the qr-reader element actually has content and check camera permissions
      setTimeout(() => {
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          // Check if there's a camera permission section displayed
          const permissionSection = qrReader.querySelector('[class*="permission"]');
          if (permissionSection) {
            setError("Camera permission required. Please allow camera access when prompted by your browser.");
            // Don't set scanActive to false here to allow user to grant permissions
          } 
          // Check if the scanner has properly initialized with camera element
          else if (!qrReader.children || qrReader.children.length === 0 || 
                  !qrReader.querySelector('video')) {
            setError("Scanner could not access camera. On Mac, please check System Preferences > Security & Privacy > Camera and ensure your browser has permission.");
            setScanActive(false);
          }
        }
      }, 3000);
    } catch (error) {
      console.error("Scanner initialization error:", error);
      setError(`Scanner initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast({
        title: "Scanner Error",
        description: "Could not start QR code scanner. Please try manual input.",
        variant: "destructive",
      });
      setScanActive(false);
    }
  };
  
  // Stop scanner
  const stopScanner = async () => {
    if (scanner) {
      try {
        await scanner.clear();
        setScanActive(false);
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
  };
  
  // Process QR data (either from manual input or scanner)
  const processQRData = async (data: string) => {
    setLoading(true);
    
    try {
      // Parse QR code to check format
      const parsedData = parseQRCode(data);
      if (!parsedData) {
        toast({
          title: "Invalid QR Code",
          description: "The QR code is not in the correct format",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Look up registration
      const registrationData = await lookupRegistration(data);
      
      // Set registration data
      setRegistration(registrationData);
      
      // Clear claim notes for new registration
      setClaimNotes("");
      
      toast({
        title: "Registration Found",
        description: `Found registration for ${registrationData.first_name} ${registrationData.last_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process QR code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update kit claim status
  const handleKitClaim = async (claimed: boolean) => {
    if (!registration) return;
    
    const claimData: KitClaimData = {
      id: registration.id,
      kit_claimed: claimed,
      claimed_by: isAuthenticated ? "admin" : "staff",
      claim_notes: claimNotes.trim() || null,
    };
    
    try {
      await updateKitClaimStatus.mutateAsync(claimData);
      
      // Update local state to reflect changes
      setRegistration({
        ...registration,
        kit_claimed: claimed,
        claimed_at: claimed ? new Date().toISOString() : null,
        claimed_by: claimData.claimed_by,
        claim_notes: claimData.claim_notes,
      });
      
      // Clear registration data after a few seconds
      setTimeout(() => {
        setRegistration(null);
        setQrData("");
      }, 5000);
    } catch (error) {
      console.error("Error updating kit claim status:", error);
    }
  };
  
  return (
    <ProtectedRoute requiredPermission="canDistributeKits">
      <div className="container max-w-5xl mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Kit Distribution</h1>
          <p className="text-muted-foreground">Scan participant QR codes or enter them manually to distribute race kits</p>
        </div>
        
        {/* HTTPS Warning */}
        {!isSecureContext && (
          <Alert variant="warning" className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>HTTPS Required for Camera Access</AlertTitle>
            <AlertDescription>
              <p>This application is running on HTTP. Modern browsers require HTTPS for camera functionality.</p>
              <p className="mt-2">
                Please use <strong>Manual Entry</strong> mode instead, or deploy this application with HTTPS enabled.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="scanner" data-value="scanner" className="py-3">
              <Scan className="mr-2 h-4 w-4" />
              QR Scanner
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Camera Required</span>
            </TabsTrigger>
            <TabsTrigger value="manual" data-value="manual" className="py-3">
              <QrCode className="mr-2 h-4 w-4" />
              Manual Entry
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">No Camera Needed</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Scan the participant's QR code to validate and mark their kit as claimed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!scanActive ? (
                    <Button 
                      onClick={startScanner} 
                      className="w-full"
                      disabled={loading}
                    >
                      <Scan className="mr-2 h-4 w-4" />
                      Start Scanner
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopScanner} 
                      variant="outline"
                      className="w-full"
                    >
                      Stop Scanner
                    </Button>
                  )}
                  
                  {error && (
                    <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mt-2 mb-2">
                      <p className="font-medium">Scanner Error</p>
                      <p className="text-sm">{error}</p>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Troubleshooting Camera Access on Mac:</p>
                        <ol className="text-sm list-decimal pl-5 space-y-1">
                          <li>Open System Preferences (or System Settings)</li>
                          <li>Go to Security & Privacy (or Privacy & Security) &gt; Camera</li>
                          <li>Ensure your browser (Chrome/Safari/Firefox) is checked/enabled</li>
                          <li>You may need to restart your browser after enabling</li>
                        </ol>
                        <p className="text-sm mt-2">
                          Or try using the Manual Entry tab instead →
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div id="qr-reader" className="w-full max-w-md mx-auto mb-4"></div>
                  
                  {error && (
                    <div className="mt-4">
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Camera Error</AlertTitle>
                        <AlertDescription>
                          {error}
                          {error.includes("macOS") || error.includes("Mac") ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm font-medium">Troubleshooting on Mac:</p>
                              <ol className="text-sm list-decimal pl-5 space-y-1">
                                <li>Open System Preferences (or System Settings)</li>
                                <li>Go to Security & Privacy (or Privacy & Security) &gt; Camera</li>
                                <li>Ensure your browser (Chrome/Safari/Firefox) is checked/enabled</li>
                                <li>Restart your browser after enabling permissions</li>
                              </ol>
                            </div>
                          ) : error.includes("HTTPS") ? (
                            <div className="mt-3">
                              <p className="text-sm">Modern browsers require HTTPS for camera access. Please use manual entry instead.</p>
                            </div>
                          ) : null}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="default"
                          onClick={() => document.querySelector('[data-value="manual"]')?.dispatchEvent(new MouseEvent('click'))}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Switch to Manual Entry
                        </Button>
                        
                        {!error.includes("HTTPS") && (
                          <Button 
                            variant="outline"
                            onClick={startScanner}
                          >
                            Try Again
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual QR Entry</CardTitle>
                <CardDescription>
                  Enter the QR code value manually (recommended option for Mac users)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-2">
                    <h4 className="font-medium text-blue-800 mb-1">How to use manual entry:</h4>
                    <ol className="text-sm text-blue-700 list-decimal pl-5 space-y-1">
                      <li>Check the physical QR code on the participant's receipt or registration confirmation</li>
                      <li>Type the text value exactly as shown under the QR code</li>
                      <li>Format should be: <code className="bg-blue-100 px-1 py-0.5 rounded">CogFamRun2025|REG123|...</code></li>
                    </ol>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="qr-input">QR Code Value</Label>
                    <Input 
                      id="qr-input"
                      value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      placeholder="Enter QR code value (e.g. CogFamRun2025|REG123|...)"
                    />
                  </div>
                  <Button 
                    onClick={handleManualQRInput} 
                    disabled={!qrData.trim() || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Lookup Registration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {registration && (
          <Card className={registration.kit_claimed ? "border-green-500 bg-green-50" : ""}>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle className="text-xl">Registration Details</CardTitle>
                <Badge className={getCategoryColorClass(registration.category)}>
                  {registration.category}
                </Badge>
              </div>
              <CardDescription>
                Registration ID: {registration.registration_id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Participant</div>
                  <div className="font-medium flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {registration.first_name} {registration.last_name}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{registration.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{registration.phone}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Registration Date</div>
                  <div className="font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    {new Date(registration.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Shirt Size</div>
                  <div className="font-medium flex items-center">
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    {registration.shirt_size}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                  <div className="font-medium">{formatCurrency(registration.amount_paid || 0)}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <Label htmlFor="claim-notes">Distribution Notes (Optional)</Label>
                <Textarea 
                  id="claim-notes"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Add any notes about kit distribution"
                  disabled={registration.kit_claimed}
                />
              </div>
              
              {registration.kit_claimed && (
                <div className="bg-green-100 border border-green-200 rounded-md p-4 flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-800">Kit already claimed</p>
                    <p className="text-sm text-green-700">
                      Claimed on {new Date(registration.claimed_at).toLocaleString()} 
                      {registration.claimed_by && ` by ${registration.claimed_by}`}
                    </p>
                    {registration.claim_notes && (
                      <p className="text-sm text-green-700 italic">
                        Note: {registration.claim_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!registration.kit_claimed ? (
                <div className="flex flex-col sm:flex-row w-full gap-3">
                  <Button
                    onClick={() => setRegistration(null)}
                    variant="outline"
                    className="sm:flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleKitClaim(true)}
                    variant="default"
                    className="sm:flex-1 bg-green-600 hover:bg-green-700"
                    disabled={updateKitClaimStatus.isPending}
                  >
                    {updateKitClaimStatus.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Kit as Claimed
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setRegistration(null)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default KitDistributionPage;
