import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client directly for testing connections
const supabaseUrl = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";
const supabase = createClient(supabaseUrl, supabaseKey);

export const QRImageTester = () => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [errorDetails, setErrorDetails] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const checkBucket = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.storage.getBucket('payment-qr-images');
      
      if (error) {
        setBucketStatus("error");
        setErrorDetails(error.message);
        toast({
          title: "Bucket Check Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        setBucketStatus("ok");
        toast({
          title: "Bucket Check Successful",
          description: `The payment-qr-images bucket is ${data.public ? 'public' : 'not public'}`,
        });
      }
    } catch (err: any) {
      setBucketStatus("error");
      setErrorDetails(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Generate a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `test_qr_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload the file
      const { data, error } = await supabase.storage
        .from('payment-qr-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: selectedFile.type,
        });

      if (error) {
        toast({
          title: "Upload Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
        setErrorDetails(error.message);
      } else {
        // Get the public URL - Note: getPublicUrl is synchronous and doesn't need await
        const { data: urlData } = supabase.storage
          .from('payment-qr-images')
          .getPublicUrl(filePath);
        
        setUploadedUrl(urlData.publicUrl);
        
        toast({
          title: "Upload Successful",
          description: "The test QR image has been uploaded successfully."
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message,
        variant: "destructive"
      });
      setErrorDetails(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>QR Image Storage Tester</CardTitle>
        <CardDescription>
          Test the connection to the payment-qr-images storage bucket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bucketStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Storage Bucket Error</AlertTitle>
            <AlertDescription>{errorDetails}</AlertDescription>
          </Alert>
        )}
        
        {bucketStatus === "ok" && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Storage Bucket Available</AlertTitle>
            <AlertDescription>
              The payment-qr-images storage bucket is accessible and ready to use.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-4">
          <Button 
            onClick={checkBucket} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : "Check Storage Bucket"}
          </Button>
        </div>
        
        {bucketStatus === "ok" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="test-file">Upload Test QR Image</Label>
              <Input 
                id="test-file" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            <Button 
              onClick={uploadImage} 
              disabled={isUploading || !selectedFile}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Test Image
                </>
              )}
            </Button>
            
            {uploadedUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Uploaded Image:</p>
                <div className="border rounded-md p-2 bg-gray-50">
                  <img 
                    src={uploadedUrl} 
                    alt="Uploaded QR Code" 
                    className="max-h-64 mx-auto"
                  />
                  <p className="text-xs text-muted-foreground mt-2 break-all">
                    {uploadedUrl}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          If you're having issues with storage, remember to run the SQL fix from the
          PAYMENT-METHODS-RLS-FIX.md file.
        </p>
      </CardFooter>
    </Card>
  );
};
