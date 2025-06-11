import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/config/app-settings";
import { Loader2, Save, Calendar, Image, Palette, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
// Import DatePicker from multiple sources to ensure it loads
import { DatePicker as DatePickerOriginal } from "@/components/ui/date-picker";
import { DatePicker as DatePickerReexport } from "@/components/DatePickerReexport";
// Import alternative date picker as backup
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";

// Use the first available DatePicker implementation
const DatePicker = DatePickerOriginal || DatePickerReexport;

export const AppSettings = () => {
  // Log which DatePicker implementation is being used
  console.log("DatePicker availability status:", {
    original: !!DatePickerOriginal,
    reexport: !!DatePickerReexport,
    usingComponent: !!DatePicker,
  });
  
  const { settings, isLoading, error, updateSetting, refetch } = useAppSettings();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    appTitle: "",
    appLogoUrl: "",
    primaryColor: "",
    secondaryColor: "",
    registrationDeadline: new Date(),
    eventDate: new Date(),
    supabaseUrl: "",
    supabasePublishableKey: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // Populate form when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        appTitle: settings.appTitle || "",
        appLogoUrl: settings.appLogoUrl || "",
        primaryColor: settings.primaryColor || "",
        secondaryColor: settings.secondaryColor || "",
        registrationDeadline: settings.registrationDeadline || new Date(),
        eventDate: settings.eventDate || new Date(),
        supabaseUrl: settings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "",
        supabasePublishableKey: settings.supabasePublishableKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
      });
    }
  }, [settings]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Flag to track if theme-related settings changed
      const themeChanged = 
        settings?.primaryColor !== formData.primaryColor || 
        settings?.secondaryColor !== formData.secondaryColor;

      // Save each setting separately
      for (const key of Object.keys(formData)) {
        const typedKey = key as keyof typeof formData;
        await updateSetting(typedKey, formData[typedKey]);
        
        // Store Supabase connection details in localStorage for immediate use
        if (typedKey === 'supabaseUrl') {
          localStorage.setItem('supabase_url', formData[typedKey] as string);
        }
        if (typedKey === 'supabasePublishableKey') {
          localStorage.setItem('supabase_key', formData[typedKey] as string);
        }
      }
      
      // Force a refetch of settings to ensure the UI updates
      await refetch();
      
      // Apply theme changes immediately
      if (themeChanged) {
        // Import and use the color conversion utility
        const { hexToHSL } = await import('@/lib/color-utils');
        
        // Apply the primary color - both legacy and Tailwind variables
        if (formData.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', formData.primaryColor);
          document.documentElement.style.setProperty('--primary', hexToHSL(formData.primaryColor));
          console.log(`AppSettings: Applied primary color: ${formData.primaryColor} → ${hexToHSL(formData.primaryColor)}`);
        }
        
        // Apply the secondary color - both legacy and Tailwind variables
        if (formData.secondaryColor) {
          document.documentElement.style.setProperty('--secondary-color', formData.secondaryColor);
          document.documentElement.style.setProperty('--secondary', hexToHSL(formData.secondaryColor));
          console.log(`AppSettings: Applied secondary color: ${formData.secondaryColor} → ${hexToHSL(formData.secondaryColor)}`);
        }
      }
      
      toast({
        title: "Settings Saved",
        description: "Application settings have been updated successfully.",
      });
    } catch (err) {
      console.error("Error saving settings:", err);
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your application settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
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
          <CardTitle>Application Settings</CardTitle>
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
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>
          Configure general application settings like title, logo, and colors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="dates">Event Dates</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="appTitle">Application Title</Label>
                <Input
                  id="appTitle"
                  value={formData.appTitle}
                  onChange={(e) => handleChange("appTitle", e.target.value)}
                  placeholder="e.g., COG FamRun 2025"
                />
                <p className="text-xs text-muted-foreground">
                  The title displayed on the website and in the browser tab
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appLogoUrl">Logo URL</Label>
                <Input
                  id="appLogoUrl"
                  value={formData.appLogoUrl}
                  onChange={(e) => handleChange("appLogoUrl", e.target.value)}
                  placeholder="e.g., /assets/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Path to the logo image file (relative to the public directory)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      placeholder="e.g., #2563eb"
                    />
                    <input 
                      type="color" 
                      value={formData.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-md cursor-pointer border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      placeholder="e.g., #f59e0b"
                    />
                    <input 
                      type="color" 
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      className="w-10 h-10 rounded-md cursor-pointer border"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <div className="p-4 border rounded-md bg-muted/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Preview
                  </h4>
                  <div className="flex gap-2">
                    <div 
                      className="w-full h-10 rounded-md shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: formData.primaryColor || '#2563eb' }}
                    >
                      Primary
                    </div>
                    <div 
                      className="w-full h-10 rounded-md shadow-sm flex items-center justify-center text-white"
                      style={{ backgroundColor: formData.secondaryColor || '#f59e0b' }}
                    >
                      Secondary
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="dates" className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {/* Try DatePicker first with a fallback to SimpleDatePicker */}
                  {DatePicker ? (
                    <DatePicker
                      date={formData.registrationDeadline}
                      onSelect={(date) => handleChange("registrationDeadline", date)}
                    />
                  ) : (
                    <SimpleDatePicker
                      date={formData.registrationDeadline}
                      onSelect={(date) => handleChange("registrationDeadline", date)}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  The last day participants can register for the event
                </p>
              </div>

              <div className="space-y-2">
                <Label>Event Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {/* Try DatePicker first with a fallback to SimpleDatePicker */}
                  {DatePicker ? (
                    <DatePicker
                      date={formData.eventDate}
                      onSelect={(date) => handleChange("eventDate", date)}
                    />
                  ) : (
                    <SimpleDatePicker
                      date={formData.eventDate}
                      onSelect={(date) => handleChange("eventDate", date)}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  The actual date when the event takes place
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="connection" className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Supabase URL</Label>
                <Input
                  id="supabaseUrl"
                  value={formData.supabaseUrl}
                  onChange={(e) => handleChange("supabaseUrl", e.target.value)}
                  placeholder="e.g., https://yourproject.supabase.co"
                />
                <p className="text-xs text-muted-foreground">
                  The URL of your Supabase project
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabasePublishableKey">Supabase Anon Key</Label>
                <Input
                  id="supabasePublishableKey"
                  type="password"
                  value={formData.supabasePublishableKey}
                  onChange={(e) => handleChange("supabasePublishableKey", e.target.value)}
                  placeholder="Your Supabase anon key"
                />
                <p className="text-xs text-muted-foreground">
                  The publishable (anon) key for your Supabase project
                </p>
              </div>

              <div className="mt-2 p-4 border rounded-md bg-muted/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Connection Information
                </h4>
                <p className="text-sm text-muted-foreground">
                  Changes to database connection settings will require an application restart to take effect.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
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
