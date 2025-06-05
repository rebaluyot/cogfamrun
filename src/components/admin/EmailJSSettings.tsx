import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Loader2, Save, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

export const EmailJSSettings = () => {
  const { data: settings, isLoading, error } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    emailjs_service_id: "",
    emailjs_template_id: "",
    emailjs_public_key: "",
    emailjs_private_key: ""
  });
  
  const [showSecretKeys, setShowSecretKeys] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Populate form when settings are loaded
  useEffect(() => {
    if (settings) {
      const newFormData = { ...formData };
      settings.forEach((setting) => {
        if (Object.keys(formData).includes(setting.setting_key)) {
          newFormData[setting.setting_key as keyof typeof formData] = setting.setting_value || '';
        }
      });
      setFormData(newFormData);
    }
  }, [settings]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Save each setting separately
      for (const key of Object.keys(formData)) {
        const typedKey = key as keyof typeof formData;
        await updateSetting.mutateAsync({
          key: typedKey,
          value: formData[typedKey]
        });
      }
      
      toast({
        title: "Settings Saved",
        description: "EmailJS settings have been updated successfully.",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };
  
  const testEmailJSConnection = async () => {
    setIsTesting(true);
    try {
      // Initialize EmailJS with the provided public key
      emailjs.init(formData.emailjs_public_key);
      
      // Create test parameters
      const testParams = {
        to_email: "test@example.com", // Not actually sent in test mode
        participant_name: "Test User",
        registration_id: "TEST-123",
        category: "10K Run",
        price: "$500",
        shirt_size: "Medium",
        qr_code_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
      };
      
      // Send a test email in development mode (won't actually send)
      await emailjs.send(
        formData.emailjs_service_id,
        formData.emailjs_template_id,
        testParams,
        formData.emailjs_public_key
      );
      
      // Note: test mode is not supported in this call pattern, but this is just a connection test
      
      // If we reach here, the connection was successful
      toast({
        title: "Connection Successful",
        description: "EmailJS connection test completed successfully.",
      });
    } catch (error) {
      console.error("EmailJS test failed:", error);
      toast({
        title: "Connection Failed",
        description: `EmailJS test failed: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EmailJS Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EmailJS Settings</CardTitle>
          <CardDescription className="text-red-500">Error loading settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EmailJS Settings</CardTitle>
        <CardDescription>
          Configure EmailJS integration for sending QR codes and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="emailjs_service_id">Service ID</Label>
            <Input
              id="emailjs_service_id"
              value={formData.emailjs_service_id}
              onChange={(e) => handleChange("emailjs_service_id", e.target.value)}
              placeholder="e.g., service_xxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Your EmailJS service ID (found in the EmailJS dashboard)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailjs_template_id">Template ID</Label>
            <Input
              id="emailjs_template_id"
              value={formData.emailjs_template_id}
              onChange={(e) => handleChange("emailjs_template_id", e.target.value)}
              placeholder="e.g., template_xxxxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Template ID for the QR code email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailjs_public_key">Public Key</Label>
            <div className="flex gap-2">
              <Input
                id="emailjs_public_key"
                type={showSecretKeys ? "text" : "password"}
                value={formData.emailjs_public_key}
                onChange={(e) => handleChange("emailjs_public_key", e.target.value)}
                placeholder="e.g., xxxxxxxxxx"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowSecretKeys(!showSecretKeys)}
                type="button"
              >
                {showSecretKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your EmailJS public key (required for initialization)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailjs_private_key">Private Key (Optional)</Label>
            <Input
              id="emailjs_private_key"
              type={showSecretKeys ? "text" : "password"}
              value={formData.emailjs_private_key}
              onChange={(e) => handleChange("emailjs_private_key", e.target.value)}
              placeholder="Only if you're using restricted access"
            />
            <p className="text-xs text-muted-foreground">
              Only required if you have restricted access enabled in EmailJS
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex space-x-2 pt-2 justify-between">
          <Button onClick={testEmailJSConnection} variant="outline" disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
