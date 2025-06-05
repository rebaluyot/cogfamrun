// filepath: /Users/robertbaluyot/Desktop/famrun-main/src/hooks/useSystemSettings.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

// Type to represent any Supabase table to work around type checking issues
type AnySupabaseTable = any;

// Fetch all system settings
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      // Use type assertion to bypass Supabase type checking
      const { data, error } = await (supabase.from("system_settings" as AnySupabaseTable).select("*") as any);

      if (error) throw error;
      return data as unknown as SystemSetting[];
    },
  });
};

// Fetch specific settings by key(s)
export const useSystemSettingsByKeys = (keys: string[]) => {
  return useQuery({
    queryKey: ["system-settings", ...keys],
    queryFn: async () => {
      // Use type assertion to bypass Supabase type checking
      const { data, error } = await (supabase
        .from("system_settings" as AnySupabaseTable)
        .select("*")
        .in("setting_key", keys) as any);

      if (error) throw error;
      
      // Convert to a more usable object format
      const settingsMap: Record<string, string> = {};
      (data as unknown as SystemSetting[]).forEach(setting => {
        settingsMap[setting.setting_key] = setting.setting_value || '';
      });
      
      return settingsMap;
    },
  });
};

// Hook to update system settings
export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { key: string; value: string; description?: string }) => {
      const { key, value, description } = params;
      
      // Check if the setting exists
      const { data: existingData, error: checkError } = await (supabase
        .from("system_settings" as AnySupabaseTable)
        .select("id")
        .eq("setting_key", key)
        .single() as any);
      
      if (checkError && checkError.code !== "PGRST116") {
        // Error other than "not found"
        throw checkError;
      }
      
      if (existingData) {
        // Update existing setting
        const { data, error } = await (supabase
          .from("system_settings" as AnySupabaseTable)
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key) as any);
          
        if (error) throw error;
        return data;
      } else {
        // Insert new setting
        const { data, error } = await (supabase
          .from("system_settings" as AnySupabaseTable)
          .insert([{ 
            setting_key: key, 
            setting_value: value, 
            description: description || `Setting for ${key}`
          }]) as any);
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({
        title: "Setting Updated",
        description: "System setting has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update setting: ${error.message}`,
        variant: "destructive",
      });
    }
  });
};

// Helper hook to get EmailJS settings
export const useEmailJSSettings = () => {
  return useSystemSettingsByKeys([
    'emailjs_service_id',
    'emailjs_template_id',
    'emailjs_public_key',
    'emailjs_private_key'
  ]);
};
