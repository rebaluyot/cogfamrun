import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, AlertTriangle, Check, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KitClaimData, useKitDistribution } from '@/hooks/useKitDistribution';
import type { Registration } from '@/types/database';
// Import dynamically to avoid SSR issues
import { type Html5QrcodeScanner } from 'html5-qrcode';
// The actual import will be done dynamically in the component

interface QRScannerProps {
  onComplete?: () => void;
}

export const KitDistributionScanner: React.FC<QRScannerProps> = ({ onComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [claimerName, setClaimerName] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const qrScannerRef = useRef<any>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { lookupRegistration, updateKitClaimStatus } = useKitDistribution();

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear();
        } catch (e) {
          console.error('Error cleaning up scanner:', e);
        }
      }
    };
  }, []);

  // State to track camera errors
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Utility function to check camera permissions
  const checkCameraPermission = async (): Promise<{granted: boolean, error?: string}> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: "Camera API not available in this browser" };
      }
      
      // Try to access the camera - this will trigger the permission prompt if not decided yet
      await navigator.mediaDevices.getUserMedia({ video: true });
      return { granted: true };
    } catch (err) {
      console.warn("Camera permission check failed:", err);
      
      // Parse the error to provide more specific guidance
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        return { granted: false, error: "Camera permission denied. Please enable camera access in your browser settings." };
      } else if (error.name === "NotFoundError") {
        return { granted: false, error: "No camera found. Please ensure your camera is connected properly." };
      } else if (error.name === "NotReadableError") {
        return { granted: false, error: "Camera is in use by another application. Please close other applications that might be using the camera." };
      }
      
      return { granted: false, error: `Camera error: ${error.message}` };
    }
  };

  const startScanner = async () => {
    // First check if we're in a secure context
    if (!isSecureContext) {
      setCameraError("Camera access requires HTTPS. Please use manual entry mode instead or deploy with HTTPS.");
      setManualMode(true);
      return;
    }
    
    setScanning(true);
    setRegistration(null);
    setHasSubmitted(false);
    setCameraError(null);
    
    // Ensure container exists
    if (!qrContainerRef.current) return;
    
    // Clear any previous scanner instance
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      } catch (e) {
        console.error('Error cleaning up scanner:', e);
      }
    }
    
    // Check if camera is available
    try {
      // Check camera permissions first on modern browsers
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log("Available camera devices:", videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error("No camera detected on this device");
      }        // Check for Mac-specific privacy concerns
        const labeledDevices = videoDevices.filter(device => !!device.label);
        if (videoDevices.length > 0 && labeledDevices.length === 0) {
          console.warn("Camera detected but labels are empty - likely permission issue");
          setHasEmptyLabelsIssue(true);
          
          // On macOS this typically means permission hasn't been granted yet
          const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
          if (isMac) {
            // We'll notify the user but continue - the browser will show its own permission dialog
            toast({
              title: "Camera Permission Required",
              description: "We've detected your camera, but permission is needed. Please click 'Allow' when prompted.",
              duration: 8000,
            });
            
            // Try to explicitly request permission to trigger the browser dialog
            try {
              // This should trigger the browser permission prompt
              setTimeout(async () => {
                try {
                  await navigator.mediaDevices.getUserMedia({ video: true });
                  
                  // If successful, restart scanner after a short delay
                  setTimeout(() => {
                    stopScanner();
                    startScanner();
                  }, 1000);
                } catch (err) {
                  console.error("Permission request failed during empty labels handling:", err);
                }
              }, 500);
            } catch (e) {
              // Don't show error, just log it - we'll continue with scanner init anyway
              console.warn("Could not request permission during empty labels handling:", e);
            }
          }
        }
    } catch (err) {
      console.warn("Camera permission check failed:", err);
      // We'll continue anyway, as the scanner will handle permission requests
      // but log this for debugging
      console.log("Camera permission error details:", {
        error: err instanceof Error ? err.message : String(err),
        secureContext: isSecureContext,
        navigator: navigator && navigator.mediaDevices ? 'available' : 'unavailable'
      });
    }
    
    // Dynamically import the scanner to avoid SSR issues
    try {
      // Dynamic import for better compatibility with different environments
      const Html5QRCode = await import('html5-qrcode');
      const Html5QrcodeScanner = Html5QRCode.Html5QrcodeScanner;
      
      if (!Html5QrcodeScanner) {
        throw new Error("Failed to load QR scanner library");
      }
      
      const scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
          fps: 5, // Lower fps for better compatibility
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true, // Show torch button for low light
          aspectRatio: 1.0, // Use square aspect ratio for better compatibility
          formatsToSupport: [0], // Only support QR codes for better performance
        },
        /* verbose= */ false
      );
      
      scanner.render(onQRCodeSuccess, onQRCodeError);
      qrScannerRef.current = scanner;
      
      // Check if the scanner initialized properly
      // First check: Look for immediate permission dialog appearance (faster feedback)
      setTimeout(() => {
        if (scanning) {
          const qrReader = document.getElementById('qr-reader');
          const permissionSection = qrReader?.querySelector('[class*="permission"]');
          
          if (permissionSection) {
            console.log("Permission dialog detected - waiting for user input");
            // We found a permission dialog - don't show an error yet, wait for user to respond
            toast({
              title: "Camera Permission",
              description: "Please click 'Allow' in the browser permission dialog to access your camera.",
              duration: 8000,
            });
          }
        }
      }, 1000);
      
      // Second check: More complete verification after waiting longer
      setTimeout(() => {
        if (scanning) {
          const qrReader = document.getElementById('qr-reader');
          const videoElement = qrReader?.querySelector('video');
          
          if (!videoElement) {
            // Check if there's a permission error message
            const permissionSection = qrReader?.querySelector('[class*="permission"]');
            if (permissionSection) {
              setCameraError("Camera permission required. Please allow camera access when prompted by your browser.");
            } else {
              // More detailed Mac-specific guidance
              const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
              if (isMac) {
                setCameraError(
                  "Camera not accessible on macOS. Please check:\n" +
                  "1. System Preferences > Security & Privacy > Camera\n" +
                  "2. Ensure your browser is checked in the list\n" +
                  "3. Restart your browser after enabling permissions\n" +
                  "4. Consider using Manual QR Entry instead"
                );
                
                // On macOS Catalina and later, show additional help
                toast({
                  title: "macOS Camera Permission Required",
                  description: "Your Mac requires explicit permission for camera access. Open System Preferences and grant permission to your browser.",
                  duration: 10000,
                  variant: "destructive",
                });
              } else {
                setCameraError("Camera not accessible. Please check your camera permissions and ensure your browser has access.");
              }
              setScanning(false);
            }
          }
        }
      }, 3000);
    } catch (e) {
      console.error('Error initializing scanner:', e);
      toast({
        title: "Scanner Error",
        description: "Could not initialize QR scanner. Please check camera permissions.",
        variant: "destructive",
      });
      setCameraError("Failed to initialize scanner. Please ensure you have given camera permissions or try using Manual Entry mode instead.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setScanning(false);
  };

  const onQRCodeSuccess = async (decodedText: string) => {
    // Stop scanning once we have a result
    stopScanner();
    
    setIsLoading(true);
    
    try {
      // Lookup registration by QR code
      const registrationData = await lookupRegistration(decodedText);
      setRegistration(registrationData);
      
      // Pre-fill claimer name if kit was already claimed
      if (registrationData.claimed_by) {
        setClaimerName(registrationData.claimed_by);
      }
      
      // Pre-fill claim notes if they exist
      if (registrationData.claim_notes) {
        setClaimNotes(registrationData.claim_notes);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      // Restart scanner after error
      startScanner();
    } finally {
      setIsLoading(false);
    }
  };

  const onQRCodeError = (error: any) => {
    console.error('QR Code scanning error:', error);
    // Don't show toast for every failed scan attempt
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!registration) return;
    
    // Prepare claim data
    const claimData: KitClaimData = {
      id: registration.id,
      kit_claimed: true,
      claimed_at: new Date().toISOString(),
      claimed_by: claimerName,
      claim_notes: claimNotes
    };
    
    try {
      await updateKitClaimStatus.mutateAsync(claimData);
      setHasSubmitted(true);
      
      // Update local registration data to reflect changes
      setRegistration({
        ...registration,
        kit_claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by: claimerName,
        claim_notes: claimNotes
      });
      
      // Notify parent component if needed
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting kit claim:', error);
    }
  };

  const handleUnclaim = async () => {
    if (!registration) return;
    
    const claimData: KitClaimData = {
      id: registration.id,
      kit_claimed: false,
      claimed_at: null,
      claimed_by: null,
      claim_notes: `Unclaimed on ${new Date().toLocaleString()}. Previous notes: ${claimNotes || 'None'}`
    };
    
    try {
      await updateKitClaimStatus.mutateAsync(claimData);
      setHasSubmitted(true);
      
      // Update local registration data to reflect changes
      setRegistration({
        ...registration,
        kit_claimed: false,
        claimed_at: null,
        claimed_by: null,
        claim_notes: claimData.claim_notes
      });
      
      // Reset form fields
      setClaimerName('');
      setClaimNotes('');
      
      // Notify parent component if needed
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error unclaiming kit:', error);
    }
  };

  const handleReset = () => {
    setRegistration(null);
    setClaimerName('');
    setClaimNotes('');
    setHasSubmitted(false);
    startScanner();
  };

  // State for manual entry mode and protocol checking
  const [manualMode, setManualMode] = useState(false);
  const [manualQrValue, setManualQrValue] = useState("");
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);
  const [securityWarningDismissed, setSecurityWarningDismissed] = useState<boolean>(false);

  // State to track empty camera labels issue
  const [hasEmptyLabelsIssue, setHasEmptyLabelsIssue] = useState<boolean>(false);
  
  // Check if we're in a secure context (HTTPS)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      setIsSecureContext(isSecure);
      
      // Automatically switch to manual mode if not secure
      if (!isSecure && !securityWarningDismissed) {
        setManualMode(true);
      }

      // Check for the "empty labels" issue that happens on macOS
      const checkForEmptyLabelsIssue = async () => {
        if (isSecure) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const labeledDevices = videoDevices.filter(device => !!device.label);
            
            // This is the specific condition: cameras exist but their labels are empty
            if (videoDevices.length > 0 && labeledDevices.length === 0) {
              console.log("Detected the 'empty labels' issue - this is common on macOS");
              setHasEmptyLabelsIssue(true);
            }
          } catch (err) {
            console.warn("Could not perform empty labels check:", err);
          }
        }
      };
      
      checkForEmptyLabelsIssue();
    }
  }, [securityWarningDismissed]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQrValue.trim()) return;
    
    setIsLoading(true);
    try {
      const registrationData = await lookupRegistration(manualQrValue);
      setRegistration(registrationData);
      
      if (registrationData.claimed_by) {
        setClaimerName(registrationData.claimed_by);
      }
      
      if (registrationData.claim_notes) {
        setClaimNotes(registrationData.claim_notes);
      }
      
      setManualMode(false);
      setManualQrValue("");
    } catch (error) {
      console.error('Error processing manual QR code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-6 w-6" />
          Kit Distribution Scanner
        </CardTitle>
        <CardDescription>
          Scan participant QR codes to distribute race kits
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* HTTPS Warning Banner */}
        {!isSecureContext && !securityWarningDismissed && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Camera Access Restricted</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Your browser requires HTTPS for camera access. This app is currently running on HTTP which prevents camera functionality.
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Use manual entry mode instead (recommended)</li>
                    <li>Switch to localhost development if testing locally</li>
                    <li>Deploy this application with HTTPS enabled</li>
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setManualMode(true)} size="sm" variant="default">
                      Use Manual Entry
                    </Button>
                    <Button onClick={() => setSecurityWarningDismissed(true)} size="sm" variant="outline">
                      Dismiss Warning
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* macOS Empty Labels Issue Warning */}
        {isSecureContext && hasEmptyLabelsIssue && !scanning && !registration && !manualMode && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">macOS Camera Permission Issue Detected</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    We've detected your Mac has cameras, but browser permissions may not be granted yet.
                    When you click "Start Camera Scanner", you'll need to allow camera access when prompted.
                  </p>
                  <p className="mt-2">
                    If you're not prompted or have issues:
                  </p>
                  <ol className="list-decimal pl-5 mt-1 space-y-1">
                    <li>Open System Preferences - Security & Privacy - Camera</li>
                    <li>Make sure your browser is checked in the list</li>
                    <li>Restart your browser and try again</li>
                  </ol>
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          // This will trigger the permission dialog
                          await navigator.mediaDevices.getUserMedia({ video: true });
                          setHasEmptyLabelsIssue(false);
                          toast({
                            title: "Permission Granted",
                            description: "Camera permission has been successfully granted.",
                          });
                        } catch (err) {
                          console.error("Permission request failed:", err);
                          toast({
                            title: "Permission Denied",
                            description: "Camera permission was denied. Please check your system settings.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Request Camera Permission Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      
        {!scanning && !registration && !manualMode && (
          <div className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-center text-muted-foreground mb-6">
              Use the scanner or manual entry to process participant QR codes
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={startScanner} className="gap-2" disabled={!isSecureContext}>
                <QrCode className="h-4 w-4" /> Start Camera Scanner
                {!isSecureContext && <span className="ml-1 text-xs">(HTTPS Required)</span>}
              </Button>
              <Button onClick={() => setManualMode(true)} variant="outline" className="gap-2">
                <Edit className="h-4 w-4" /> Manual QR Entry
              </Button>
            </div>
          </div>
        )}
        
        {scanning && (
          <div className="space-y-4">
            {cameraError && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Camera Error</p>
                    <p className="text-sm whitespace-pre-line">{cameraError}</p>
                    
                    {cameraError.includes("HTTPS") ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">HTTPS Requirement:</p>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          <li>Modern browsers restrict camera access to secure contexts (HTTPS)</li>
                          <li>This application is currently running on HTTP</li>
                          <li>For testing, use localhost (which is exempt from this requirement)</li>
                          <li>For production, deploy with HTTPS enabled</li>
                        </ul>
                      </div>
                    ) : cameraError.includes("macOS") ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Troubleshooting Camera Access on Mac:</p>
                        <ol className="text-sm list-decimal pl-5 space-y-1">
                          <li>Open System Preferences (or System Settings)</li>
                          <li>Go to Security & Privacy (or Privacy & Security) &gt; Camera</li>
                          <li>Ensure your browser (Chrome/Safari/Firefox) is checked/enabled</li>
                          <li>You may need to restart your browser after enabling</li>
                          <li>If issues persist, try using Safari which has better integration with macOS permissions</li>
                        </ol>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">General Troubleshooting:</p>
                        <ol className="text-sm list-decimal pl-5 space-y-1">
                          <li>Check that your browser has permission to use the camera</li>
                          <li>Make sure no other applications are using your camera</li>
                          <li>Try refreshing the page or using a different browser</li>
                          <li>Consider using Manual QR Entry mode instead</li>
                        </ol>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setManualMode(true)}
                        className="text-destructive border-destructive hover:bg-destructive/10">
                        Switch to Manual Entry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={qrContainerRef} id="qr-reader" className="mx-auto" style={{ maxWidth: "500px" }}></div>
            
            {/* Special button for "empty labels" issue */}
            {scanning && !cameraError && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Troubleshooting:</strong> If you see "Camera detected but labels are empty" in the console, 
                  this might be a macOS permission issue. Try requesting camera permissions explicitly:
                </p>
                <Button 
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      // Explicitly request camera permission which will show the browser permission dialog
                      await navigator.mediaDevices.getUserMedia({ video: true });
                      toast({
                        title: "Permission Requested",
                        description: "If prompted, please click 'Allow' to grant camera access.",
                        duration: 5000,
                      });
                      
                      // Wait a moment and restart scanner
                      setTimeout(() => {
                        stopScanner();
                        startScanner();
                      }, 1500);
                    } catch (err) {
                      console.error("Permission request failed:", err);
                      setCameraError("Camera permission denied. Please check your browser and system settings.");
                    }
                  }}
                >
                  Request Camera Permission
                </Button>
              </div>
            )}
            
            <div className="flex justify-center mt-4 gap-2">
              <Button variant="outline" onClick={stopScanner}>
                Cancel Scanning
              </Button>
              {cameraError && (
                <>
                  <Button variant="default" onClick={() => startScanner()}>
                    Try Again
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      stopScanner();
                      setManualMode(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Use Manual Entry
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
        {manualMode && !registration && (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-2">
              <h4 className="font-medium text-blue-800">Manual QR Code Entry</h4>
              <p className="text-sm text-blue-700 mt-1">
                Enter the QR code value from the participant's registration confirmation.
                The format should be: <code className="bg-blue-100 px-1 py-0.5 rounded">CogFamRun2025|REG123|...</code>
              </p>
            </div>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-qr">QR Code Value</Label>
                <Input
                  id="manual-qr"
                  value={manualQrValue}
                  onChange={(e) => setManualQrValue(e.target.value)}
                  placeholder="Enter QR code value (e.g. CogFamRun2025|REG123|...)"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setManualMode(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!manualQrValue.trim() || isLoading}>
                  {isLoading ? (
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
            </form>
          </div>
        )}

        {isLoading && !manualMode && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-center">Looking up registration...</p>
          </div>
        )}
        
        {registration && !isLoading && (
          <div className="space-y-6">
            {/* Registration Information */}
            <div className="space-y-2 border-b pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {registration.first_name} {registration.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{registration.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={registration.status === "confirmed" ? "default" : "outline"}>
                    {registration.status || "pending"}
                  </Badge>
                  <Badge variant={registration.kit_claimed ? "success" : "outline"}>
                    {registration.kit_claimed ? "Kit Claimed" : "Kit Not Claimed"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm font-medium">Registration ID</p>
                  <p className="text-sm">{registration.registration_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">{registration.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shirt Size</p>
                  <p className="text-sm">{registration.shirt_size}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Registration Date</p>
                  <p className="text-sm">{new Date(registration.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {registration.kit_claimed && (
                <Alert className="mt-4">
                  <AlertTitle className="flex items-center gap-1">
                    <Check className="h-4 w-4" /> Kit Already Claimed
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mt-1">
                      Claimed by: <span className="font-medium">{registration.claimed_by || "Unknown"}</span>
                    </p>
                    <p className="mt-1">
                      Claimed at: <span className="font-medium">{new Date(registration.claimed_at).toLocaleString()}</span>
                    </p>
                    {registration.claim_notes && (
                      <p className="mt-1">
                        Notes: <span className="font-medium">{registration.claim_notes}</span>
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {registration.status !== "confirmed" && (
                <Alert variant="warning" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Payment Not Confirmed</AlertTitle>
                  <AlertDescription>
                    This registration's payment has not been confirmed yet. Please verify payment status before distributing kit.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Claim Form */}
            {!hasSubmitted && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claimer-name">Kit Claimed By</Label>
                  <Input
                    id="claimer-name"
                    value={claimerName}
                    onChange={(e) => setClaimerName(e.target.value)}
                    placeholder="Enter name of person claiming kit"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="claim-notes">Notes (Optional)</Label>
                  <Textarea
                    id="claim-notes"
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="Add any notes about this kit distribution"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Scan New Code
                  </Button>
                  <div className="space-x-2">
                    {registration.kit_claimed && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleUnclaim}
                        disabled={updateKitClaimStatus.isPending}
                      >
                        {updateKitClaimStatus.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Mark as Unclaimed
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={updateKitClaimStatus.isPending}
                    >
                      {updateKitClaimStatus.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Mark Kit as Claimed
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
            
            {/* Success Message */}
            {hasSubmitted && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">
                  {registration.kit_claimed ? "Kit Marked as Claimed" : "Kit Marked as Unclaimed"}
                </h3>
                <p className="text-center text-muted-foreground mb-6">
                  {registration.kit_claimed ? 
                    `Kit has been successfully claimed by ${claimerName}` : 
                    "Kit has been marked as unclaimed"}
                </p>
                <Button onClick={handleReset}>Scan Another Code</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          {scanning ? "Camera active. Please allow camera permissions if prompted." : "Ready to scan"}
        </div>
      </CardFooter>
    </Card>
  );
};
