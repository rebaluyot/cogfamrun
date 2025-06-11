// App configuration module to centralize all configurable settings
// This file loads settings from the database and provides a unified way to access them

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

// Type to represent any Supabase table to work around type checking issues
type AnySupabaseTable = any;

// Interface for the system_settings table structure
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

export type AppSettings = {
  appTitle: string;
  appLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
  registrationDeadline: Date;
  eventDate: Date;
  [key: string]: any; // Allow for custom settings
};

const DEFAULT_SETTINGS: AppSettings = {
  appTitle: 'COG FamRun 2025',
  appLogoUrl: '/assets/solid-fam-run-logo.png',
  primaryColor: '#2563eb',
  secondaryColor: '#f59e0b',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  registrationDeadline: new Date('2025-08-01T00:00:00Z'),
  eventDate: new Date('2025-08-22T05:00:00Z')
};

// Function to convert database settings to app settings object
function mapDbSettingsToAppSettings(dbSettings: any[]): AppSettings {
  if (!dbSettings || dbSettings.length === 0) {
    return DEFAULT_SETTINGS;
  }

  const settings = { ...DEFAULT_SETTINGS };

  dbSettings.forEach(setting => {
    const key = convertDbKeyToCamelCase(setting.setting_key);
    let value = setting.setting_value;
    
    // Convert value based on setting type
    if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'boolean') {
      value = value.toLowerCase() === 'true';
    } else if (setting.setting_type === 'datetime') {
      value = new Date(value);
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.error(`Error parsing JSON setting ${key}:`, e);
      }
    }
    
    settings[key] = value;
  });

  return settings;
}

// Helper to convert snake_case to camelCase
function convertDbKeyToCamelCase(key: string): string {
  return key.replace(/(_\w)/g, k => k[1].toUpperCase());
}

// Helper to convert camelCase to snake_case
function convertCamelCaseToDbKey(key: string): string {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// Hook to access and update app settings
export function useAppSettings() {
  const { data: settings, error, isLoading, refetch } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      // Use type assertion to bypass strong typing
      const { data, error } = await (supabase
        .from('system_settings' as AnySupabaseTable)
        .select('*') as any);
      
      if (error) throw error;
      
      return mapDbSettingsToAppSettings(data);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to update a setting
  const updateSetting = async (key: string, value: any) => {
    const dbKey = convertCamelCaseToDbKey(key);
    
    // Determine the type of the value
    let valueType = 'string';
    if (typeof value === 'number') valueType = 'number';
    else if (typeof value === 'boolean') valueType = 'boolean';
    else if (value instanceof Date) {
      valueType = 'datetime';
      value = value.toISOString();
    }
    else if (typeof value === 'object') {
      valueType = 'json';
      value = JSON.stringify(value);
    }
    
    try {
      // Check if setting exists
      const { data: existingSetting } = await (supabase
        .from('system_settings' as AnySupabaseTable)
        .select('id')
        .eq('setting_key', dbKey)
        .single() as any);
      
      if (existingSetting) {
        // Update existing setting
        try {
          // First try with the setting_type column
          const { error } = await (supabase
            .from('system_settings' as AnySupabaseTable)
            .update({
              setting_value: String(value),
              setting_type: valueType,
              updated_at: new Date().toISOString()
            })
            .eq('setting_key', dbKey) as any);
            
          if (error) {
            // If there's an error related to setting_type column not existing
            if (error.message && error.message.includes("setting_type")) {
              // Try without the setting_type column
              console.log("Falling back to update without setting_type column");
              const { error: fallbackError } = await (supabase
                .from('system_settings' as AnySupabaseTable)
                .update({
                  setting_value: String(value),
                  updated_at: new Date().toISOString()
                })
                .eq('setting_key', dbKey) as any);
                
              if (fallbackError) throw fallbackError;
            } else {
              throw error;
            }
          }
        } catch (updateError) {
          console.error("Error updating setting:", updateError);
          throw updateError;
        }
      } else {
        // Insert new setting
        try {
          // First try with the setting_type column
          const { error } = await (supabase
            .from('system_settings' as AnySupabaseTable)
            .insert({
              setting_key: dbKey,
              setting_value: String(value),
              setting_type: valueType,
              description: `Auto-created setting for ${key}`
            }) as any);
            
          if (error) {
            // If there's an error related to setting_type column not existing
            if (error.message && error.message.includes("setting_type")) {
              // Try without the setting_type column
              console.log("Falling back to insert without setting_type column");
              const { error: fallbackError } = await (supabase
                .from('system_settings' as AnySupabaseTable)
                .insert({
                  setting_key: dbKey,
                  setting_value: String(value),
                  description: `Auto-created setting for ${key}`
                }) as any);
                
              if (fallbackError) throw fallbackError;
            } else {
              throw error;
            }
          }
        } catch (insertError) {
          console.error("Error inserting setting:", insertError);
          throw insertError;
        }
      }
      
      // Refetch settings after update
      await refetch();
      
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      return false;
    }
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
    updateSetting,
    refetch
  };
}

// Standalone function to get a specific setting synchronously
// Useful for components that need settings before React is ready
export async function getAppSetting(key: string): Promise<any> {
  try {
    const dbKey = convertCamelCaseToDbKey(key);
    
    const { data, error } = await (supabase
      .from('system_settings' as AnySupabaseTable)
      .select('setting_value, setting_type')
      .eq('setting_key', dbKey)
      .single() as any);
    
    if (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return DEFAULT_SETTINGS[key];
    }
    
    if (!data) return DEFAULT_SETTINGS[key];
    
    // Convert value based on type
    let value = data.setting_value;
    if (data.setting_type === 'number') {
      return parseFloat(value);
    } else if (data.setting_type === 'boolean') {
      return value.toLowerCase() === 'true';
    } else if (data.setting_type === 'datetime') {
      return new Date(value);
    } else if (data.setting_type === 'json') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error(`Error parsing JSON setting ${key}:`, e);
        return DEFAULT_SETTINGS[key];
      }
    }
    
    return value;
  } catch (err) {
    console.error(`Error retrieving setting ${key}:`, err);
    return DEFAULT_SETTINGS[key];
  }
}

// Function to get Supabase configuration
export function getSupabaseConfig() {
  // This is a synchronous function that can't use the database,
  // so we need to use environment variables or locally stored values
  let supabaseConfig = {
    url: import.meta.env.VITE_SUPABASE_URL || "https://lkumpuiyepjtztdwtcwg.supabase.co",
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk"
  };
  
  // Try to get from localStorage if available
  if (typeof localStorage !== 'undefined') {
    const storedUrl = localStorage.getItem('supabase_url');
    const storedKey = localStorage.getItem('supabase_key');
    
    if (storedUrl) supabaseConfig.url = storedUrl;
    if (storedKey) supabaseConfig.publishableKey = storedKey;
  }
  
  return supabaseConfig;
}
