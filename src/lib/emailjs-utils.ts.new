// filepath: /Users/robertbaluyot/Desktop/famrun-main/src/lib/emailjs-utils.ts
import { supabase } from '@/integrations/supabase/client';
import emailjs from '@emailjs/browser';

// Type to represent any Supabase table to work around type checking issues
type AnySupabaseTable = any;

// Get EmailJS settings from the database
export const getEmailJSSettings = async (): Promise<{
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string;
}> => {
  const { data, error } = await (supabase
    .from('system_settings' as AnySupabaseTable)
    .select('setting_key, setting_value')
    .in('setting_key', [
      'emailjs_service_id',
      'emailjs_template_id',
      'emailjs_public_key',
      'emailjs_private_key'
    ]) as any);

  if (error) {
    console.error('Error fetching EmailJS settings:', error);
    throw error;
  }

  // Create a map of settings
  const settingsMap: Record<string, string> = {};
  data?.forEach((setting: any) => {
    if (setting.setting_value) {
      settingsMap[setting.setting_key] = setting.setting_value;
    }
  });

  return {
    serviceId: settingsMap.emailjs_service_id || '',
    templateId: settingsMap.emailjs_template_id || '',
    publicKey: settingsMap.emailjs_public_key || '',
    privateKey: settingsMap.emailjs_private_key
  };
};

// Initialize EmailJS with settings from the database
export const initializeEmailJS = async (): Promise<boolean> => {
  try {
    const { publicKey } = await getEmailJSSettings();
    
    if (!publicKey) {
      console.error('EmailJS public key not found in settings');
      return false;
    }

    emailjs.init(publicKey);
    return true;
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    return false;
  }
};

// Send an email using EmailJS with settings from the database
export const sendEmailWithEmailJS = async (
  templateParams: Record<string, any>,
  templateIdOverride?: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Get settings from database
    const { serviceId, templateId, publicKey } = await getEmailJSSettings();
    
    if (!serviceId || !templateId || !publicKey) {
      return {
        success: false,
        error: 'EmailJS settings are incomplete. Please configure in Admin settings.'
      };
    }
    
    // Initialize EmailJS if not already initialized
    emailjs.init(publicKey);
    
    // Send the email
    await emailjs.send(
      serviceId,
      templateIdOverride || templateId,
      templateParams,
      publicKey
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email with EmailJS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email sending error'
    };
  }
};
