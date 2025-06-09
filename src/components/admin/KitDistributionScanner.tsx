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
// Import custom styles for QR scanner
import './KitScanner.css';
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // State for manual entry mode and protocol checking
  const [manualMode, setManualMode] = useState(false);
  const [manualQrValue, setManualQrValue] = useState("");
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);
  const [securityWarningDismissed, setSecurityWarningDismissed] = useState<boolean>(false);
  
  // State to track empty camera labels issue
  const [hasEmptyLabelsIssue, setHasEmptyLabelsIssue] = useState<boolean>(false);
  
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
  
  // Utility function to check camera permissions
  const checkCameraPermission = async (): Promise<{granted: boolean, error?: string, status?: string}> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { granted: false, error: "Camera API not available in this browser", status: "api_not_available" };
      }
      
      // First check if we can enumerate devices (this doesn't need permissions on all browsers)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        return { granted: false, error: "No camera detected on this device.", status: "no_camera" };
      }
      
      // Check for the "empty labels" issue which indicates permission hasn't been granted on macOS
      const labeledDevices = videoDevices.filter(device => !!device.label);
      if (videoDevices.length > 0 && labeledDevices.length === 0) {
        console.log("Empty labels detected - macOS permission issue likely");
        setHasEmptyLabelsIssue(true);
        
        // This is a special case for macOS where we detect cameras but can't access them yet
        return { granted: false, error: "Camera detected but requires explicit permission", status: "empty_labels" };
      }
      
      // Try to access the camera - this will trigger the permission prompt if not decided yet
      await navigator.mediaDevices.getUserMedia({ video: true });
      return { granted: true, status: "granted" };
    } catch (err) {
      console.warn("Camera permission check failed:", err);
      
      // Parse the error to provide more specific guidance
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        return { 
          granted: false, 
          error: "Camera permission denied. Please enable camera access in your browser settings.", 
          status: "denied" 
        };
      } else if (error.name === "NotFoundError") {
        return { 
          granted: false, 
          error: "No camera found. Please ensure your camera is connected properly.", 
          status: "not_found" 
        };
      } else if (error.name === "NotReadableError") {
        return { 
          granted: false, 
          error: "Camera is in use by another application. Please close other applications that might be using the camera.", 
          status: "in_use" 
        };
      } else if (error.name === "TypeError" && error.message.includes("overconstrained")) {
        return { 
          granted: false, 
          error: "Camera constraints not satisfied. Try using a different camera if available.", 
          status: "overconstrained" 
        };
      }
      
      return { granted: false, error: `Camera error: ${error.message}`, status: "unknown_error" };
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
    
    // Give a little time for the component to fully render and ensure the container reference is available
    // This helps avoid the "QR container reference is not available" error
    if (!qrContainerRef.current) {
      console.log("Waiting for QR container to be available...");
      
      // Wait briefly for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check again after waiting
      if (!qrContainerRef.current) {
        console.error("QR container reference is not available even after waiting");
        setCameraError("Could not initialize scanner. Please try again.");
        setScanning(false);
        return;
      }
    }
    
    // Clear any previous scanner instance
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear();
        qrScannerRef.current = null;
        
        // Reset the container element to ensure clean start
        if (qrContainerRef.current) {
          qrContainerRef.current.innerHTML = '';
        }
      } catch (e) {
        console.error('Error cleaning up scanner:', e);
      }
    }
    
    // Make sure the QR container is visible with consistent size
    if (qrContainerRef.current) {
      qrContainerRef.current.style.display = 'block';
      qrContainerRef.current.style.maxWidth = '500px';
      qrContainerRef.current.style.minHeight = '300px';
      qrContainerRef.current.style.width = '100%';
      qrContainerRef.current.style.position = 'relative';
      qrContainerRef.current.style.margin = '0 auto';
      qrContainerRef.current.style.border = '2px solid #e5e7eb';
      qrContainerRef.current.style.borderRadius = '0.5rem';
      qrContainerRef.current.style.overflow = 'hidden';
      qrContainerRef.current.style.backgroundColor = '#f9fafb';
    }
    
    // Comprehensive camera permission check and handling
    try {
      // First explicitly check camera permissions to handle them properly
      const permissionCheck = await checkCameraPermission();
      console.log("Camera permission check result:", permissionCheck);
      
      if (!permissionCheck.granted) {
        // Specific handling for different camera permission scenarios
        if (permissionCheck.status === 'empty_labels') {
          // This is the macOS specific issue where cameras are detected but labels are empty
          console.log("Detected macOS empty labels issue - will try to request permission explicitly");
          setHasEmptyLabelsIssue(true);
          
          // On macOS this typically means permission hasn't been granted yet
          const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
          if (isMac) {
            // We'll notify the user but continue - may need to explicitly trigger permission dialog
            toast({
              title: "Camera Permission Required",
              description: "We've detected your camera, but permission is needed. Please click 'Allow' when prompted.",
              duration: 8000,
            });
            
            // Try to explicitly request permission to trigger the browser dialog
            try {
              // This should trigger the browser permission prompt - explicitly wait for it
              const permissionResult = await new Promise<boolean>((resolve) => {
                // Use a timeout to give the browser a chance to show the permission dialog
                setTimeout(async () => {
                  try {
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    resolve(true);
                  } catch (err) {
                    console.error("Permission request failed during empty labels handling:", err);
                    resolve(false);
                  }
                }, 500);
              });
              
              if (permissionResult) {
                // Permission was granted, clear the empty labels issue flag
                setHasEmptyLabelsIssue(false);
                console.log("Camera permission granted successfully");
              }
            } catch (e) {
              // Don't show error, just log it - we'll continue with scanner init anyway
              console.warn("Could not request permission during empty labels handling:", e);
            }
          }
        } else if (permissionCheck.status === 'denied') {
          // User has explicitly denied permission before
          setCameraError("Camera permission was denied. Please check your browser settings to enable camera access.");
          // Show macOS specific instructions if on Mac
          if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
            setCameraError("Camera permission denied on macOS. Please go to System Preferences > Security & Privacy > Camera and enable permission for your browser, then restart your browser.");
          }
          setScanning(false);
          return;
        } else if (permissionCheck.status === 'no_camera') {
          setCameraError("No camera detected on this device. Please make sure your camera is connected and working.");
          setScanning(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Camera permission check failed:", err);
      // Log detailed information for debugging purposes
      console.log("Camera permission error details:", {
        error: err instanceof Error ? err.message : String(err),
        secureContext: isSecureContext,
        navigator: navigator && navigator.mediaDevices ? 'available' : 'unavailable',
        platform: navigator.platform,
        userAgent: navigator.userAgent
      });
      
      // Continue anyway in most cases, as we handle permissions in the scanner initialization
    }
    
    // Dynamically import the scanner to avoid SSR issues
    try {
      // Dynamic import for better compatibility with different environments
      const Html5QRCode = await import('html5-qrcode');
      const Html5QrcodeScanner = Html5QRCode.Html5QrcodeScanner;
      
      if (!Html5QrcodeScanner) {
        throw new Error("Failed to load QR scanner library");
      }
      
      // Before initializing the scanner, try to explicitly get camera permission
      // This is particularly important for macOS where the camera might be detected
      // but permission might not have been granted yet
      try {
        // Try to access the camera directly first to trigger permission dialog if needed
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera permission successfully obtained before scanner initialization");
        setHasEmptyLabelsIssue(false);
      } catch (permErr) {
        console.warn("Pre-scanner camera permission request failed:", permErr);
        // We'll continue with scanner initialization and let it handle permissions
      }
      
      try {
        // Make absolutely sure the container exists before initializing
        if (document.getElementById('qr-reader')) {
          console.log("Creating QR scanner with container:", document.getElementById('qr-reader'));
          
          // Get container dimensions to make qrbox responsive
          const containerElement = document.getElementById('qr-reader');
          const containerWidth = containerElement ? containerElement.offsetWidth : 500;
          const qrboxSize = Math.min(250, containerWidth - 50); // Make QR box responsive but not too large
          
          const scanner = new Html5QrcodeScanner(
            "qr-reader", 
            { 
              fps: 10, // Increased for better responsiveness
              qrbox: { width: qrboxSize, height: qrboxSize },
              rememberLastUsedCamera: true,
              showTorchButtonIfSupported: true, // Show torch button for low light
              aspectRatio: 1.0, // Use square aspect ratio for better compatibility
              formatsToSupport: [0], // Only support QR codes for better performance
              disableFlip: false, // Allow image flip if needed
              videoConstraints: {
                // Explicitly set video constraints for better compatibility
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "environment" // Use rear camera on mobile devices
              }
            },
            /* verbose= */ true // Enable verbose mode for better debugging
          );
          
          // Render the scanner and store the reference
          scanner.render(onQRCodeSuccess, onQRCodeError);
          qrScannerRef.current = scanner;
          console.log("QR scanner initialized successfully");
        } else {
          throw new Error("QR container element not found in DOM");
        }
      } catch (initError) {
        console.error("Error initializing QR scanner:", initError);
        setCameraError(`Failed to initialize scanner: ${initError.message}`);
        setScanning(false);
        return;
      }
      
      // Enhanced permission detection system
      // First quick check: Look for immediate permission dialog appearance (faster feedback)
      setTimeout(() => {
        if (!scanning) return; // Exit early if no longer scanning
        
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
      }, 1000);
      
      // Second check: Check for camera initialization after a short delay
      setTimeout(async () => {
        if (!scanning) return; // Exit early if no longer scanning
        
        const qrReader = document.getElementById('qr-reader');
        const videoElement = qrReader?.querySelector('video');
        
        if (videoElement) {
          console.log("Camera successfully initialized");
          // Camera is working, make sure we clear any empty labels issue flag
          setHasEmptyLabelsIssue(false);
        } else {
          // No video element found - check if permission dialog is showing
          const permissionSection = qrReader?.querySelector('[class*="permission"]');
          if (permissionSection) {
            console.log("Permission dialog still showing - waiting for user response");
            // We'll continue waiting as the user might still respond to permission dialog
          } else {
            // Try to diagnose the issue more specifically for better user guidance
            try {
              // Re-check permission status to provide more accurate feedback
              const permStatus = await checkCameraPermission();
              
              if (permStatus.status === 'empty_labels') {
                // Special handling for the macOS empty labels issue
                const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
                if (isMac) {
                  // Show detailed macOS guidance
                  setCameraError(
                    "Camera detected but inaccessible on macOS. Please check:\n" +
                    "1. System Preferences > Security & Privacy > Camera\n" +
                    "2. Ensure your browser is checked in the list\n" +
                    "3. Restart your browser after enabling permissions\n" +
                    "4. Consider using Manual QR Entry instead"
                  );
                  
                  // Show a more prominent toast with guidance
                  toast({
                    title: "macOS Camera Permission Required",
                    description: "Your Mac requires explicit permission for camera access. Open System Preferences and grant permission to your browser.",
                    duration: 10000,
                    variant: "destructive",
                  });
                }
              } else if (permStatus.status === 'denied') {
                setCameraError("Camera permission was denied. Please enable camera access in your browser settings.");
              } else {
                // Generic error for other cases
                setCameraError("Camera not accessible. Please check your camera permissions and ensure your browser has access.");
              }
              
              // If we can't initialize the camera after this time, stop scanning
              setScanning(false);
            } catch (err) {
              console.error("Error during camera diagnosis:", err);
              setCameraError("Camera initialization failed. Please check permissions and try again.");
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
    
    // Reset the container element to ensure clean start with proper sizing
    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';
      // Ensure consistent styling on reset
      qrContainerRef.current.style.maxWidth = '500px';
      qrContainerRef.current.style.minHeight = '300px';
      qrContainerRef.current.style.width = '100%';
      qrContainerRef.current.style.position = 'relative';
      qrContainerRef.current.style.margin = '0 auto';
      qrContainerRef.current.style.border = '2px solid #e5e7eb';
      qrContainerRef.current.style.borderRadius = '0.5rem';
      qrContainerRef.current.style.overflow = 'hidden';
      qrContainerRef.current.style.backgroundColor = '#f9fafb';
    }
    
    // Start scanning with a slight delay to ensure DOM is ready
    setTimeout(() => {
      startScanner();
    }, 100);
  };
  
  // Ensure QR container is ready when scanning starts
  useEffect(() => {
    if (scanning) {
      console.log("Scanning mode activated, checking QR container ref:", qrContainerRef.current);
      
      // If container doesn't exist when scanning is activated, create a fallback
      if (!qrContainerRef.current) {
        console.warn("QR container ref not available when scanning started - checking DOM directly");
        const existingContainer = document.getElementById('qr-reader');
        if (!existingContainer) {
          console.warn("Creating fallback QR container in DOM");
          // Create a container if it doesn't exist in the DOM
          const fallbackContainer = document.createElement('div');
          fallbackContainer.id = 'qr-reader';
          fallbackContainer.style.maxWidth = '500px';
          fallbackContainer.style.minHeight = '300px';
          fallbackContainer.style.position = 'relative';
          fallbackContainer.style.margin = '0 auto';
          fallbackContainer.style.border = '2px solid #e5e7eb';
          fallbackContainer.style.borderRadius = '0.5rem';
          fallbackContainer.style.backgroundColor = '#f9fafb';
          
          // Find a suitable parent element to attach it to
          const contentArea = document.querySelector('.space-y-4');
          if (contentArea) {
            contentArea.prepend(fallbackContainer);
            console.log("Fallback QR container created and inserted into DOM");
          }
        }
      }
    }
  }, [scanning]);
  
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
  
  // Monitor and fix QR scanner visibility when scanning state changes
  useEffect(() => {
    if (scanning) {
      // Apply styles initially
      const applyStyles = () => {
        // Check if QR scanner elements are visible
        const qrReader = document.getElementById('qr-reader');
        if (qrReader) {
          // Apply styling to the main container first
          qrReader.style.maxWidth = '500px';
          qrReader.style.minHeight = '300px';
          qrReader.style.width = '100%';
          qrReader.style.position = 'relative';
          qrReader.style.margin = '0 auto';
          qrReader.style.border = '2px solid #e5e7eb';
          qrReader.style.borderRadius = '0.5rem';
          qrReader.style.overflow = 'hidden';
          qrReader.style.backgroundColor = '#f9fafb';
          
          const videoElement = qrReader.querySelector('video') as HTMLVideoElement | null;
          const scanRegion = qrReader.querySelector('#qr-reader__scan_region') as HTMLElement | null;
          const scannerContainer = qrReader.querySelector('#qr-reader__dashboard_section_csr') as HTMLElement | null;
          
          console.log("QR Reader DOM check:", {
            qrReader: !!qrReader,
            videoElement: !!videoElement,
            scanRegion: !!scanRegion,
            scannerContainer: !!scannerContainer
          });
          
          // Apply additional styling to ensure visibility if elements exist but might be hidden
          if (videoElement) {
            videoElement.style.display = 'block';
            videoElement.style.width = '100%';
            videoElement.style.maxHeight = '300px';
            videoElement.style.objectFit = 'cover';
          }
          
          if (scanRegion) {
            scanRegion.style.display = 'block';
            scanRegion.style.position = 'relative';
            scanRegion.style.minHeight = '250px';
            scanRegion.style.width = '100%';
          }
          
          if (scannerContainer) {
            scannerContainer.style.width = '100%';
            scannerContainer.style.maxWidth = '500px';
            
            // Find the scanner box and ensure it's visible
            const scannerBox = scannerContainer.querySelector('div') as HTMLElement | null;
            if (scannerBox) {
              scannerBox.style.border = '3px solid #2563eb';
              scannerBox.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.3)';
            }
          }
        } else {
          console.warn("QR reader element not found in the DOM");
        }
      };
      
      // Initial application of styles
      setTimeout(applyStyles, 500);
      
      // Set up periodic style checking to ensure consistent appearance
      const styleInterval = setInterval(applyStyles, 2000);
      
      return () => {
        clearInterval(styleInterval);
      };
    }
  }, [scanning]);

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

  // Add inline styles for scanner elements
  useEffect(() => {
    // Add a style tag to the head to ensure consistent styling of QR scanner elements
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      #qr-reader {
        max-width: 500px !important;
        min-height: 300px !important;
        width: 100% !important;
        position: relative !important;
        margin: 0 auto !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 0.5rem !important;
        overflow: hidden !important;
        background-color: #f9fafb !important;
      }
      
      #qr-reader video {
        display: block !important;
        width: 100% !important;
        max-height: 300px !important;
        object-fit: cover !important;
      }
      
      #qr-reader__scan_region {
        display: block !important;
        position: relative !important;
        min-height: 250px !important;
        width: 100% !important;
      }
      
      #qr-reader__dashboard_section_csr {
        width: 100% !important;
        max-width: 500px !important;
      }
      
      #qr-reader__dashboard_section_csr div {
        border: 3px solid #2563eb !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3) !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      // Clean up style tag on component unmount
      document.head.removeChild(styleTag);
    };
  }, []);

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
            
            <div 
              ref={qrContainerRef} 
              id="qr-reader" 
              className="qr-scanner-container mx-auto border-2 border-gray-200 rounded-md overflow-hidden"
              style={{ 
                maxWidth: "500px", 
                minHeight: "300px", 
                position: "relative",
                display: "block", 
                backgroundColor: "#f9fafb" 
              }}
            >
              {/* Empty container that will be filled by the QR scanner */}
              {/* The scanner library will inject elements here */}
              <div className="flex justify-center items-center h-full" id="scanner-placeholder">
                <div className="text-center text-gray-400">
                  <QrCode className="h-12 w-12 mx-auto mb-2" />
                  <p>Initializing camera...</p>
                </div>
              </div>
            </div>
            
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
