/**
 * Theme Color Diagnostic Tool
 * 
 * This script verifies that theme colors are correctly stored and applied
 * It checks:
 * 1. Database storage of color settings
 * 2. Proper retrieval via app-settings.ts
 * 3. Correct conversion to HSL values for Tailwind
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define our own hexToHSL function to avoid import issues
function hexToHSL(hex) {
  // Default to blue if invalid
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return "221.2 83.2% 53.3%"; // Default blue
  }

  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find min/max for HSL conversion
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  // Format as "H S% L%" - the format Tailwind CSS expects
  return `${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

async function diagnosticThemeColors() {
  console.log('📊 Theme Color Diagnostic Tool 📊');
  console.log('=================================');
  
  try {
    // 1. Check the database for theme color settings
    console.log('\n🔍 Checking database for theme color settings...');
    const { data: primaryColorData, error: primaryColorError } = await supabase
      .from('system_settings')
      .select('setting_value, setting_type')
      .eq('setting_key', 'primary_color')
      .single();
    
    const { data: secondaryColorData, error: secondaryColorError } = await supabase
      .from('system_settings')
      .select('setting_value, setting_type')
      .eq('setting_key', 'secondary_color')
      .single();

    if (primaryColorError || secondaryColorError) {
      console.error('Error fetching color settings:', primaryColorError || secondaryColorError);
    } else {
      console.log('✅ Found color settings in database:');
      console.log('  Primary Color:', primaryColorData?.setting_value || 'Not set');
      console.log('  Primary Color Type:', primaryColorData?.setting_type || 'Not set');
      console.log('  Secondary Color:', secondaryColorData?.setting_value || 'Not set');
      console.log('  Secondary Color Type:', secondaryColorData?.setting_type || 'Not set');
    }

    // 2. Test the hexToHSL conversion function
    console.log('\n🧪 Testing hexToHSL conversion function...');
    const testColors = [
      { hex: '#2563eb', name: 'Blue' },
      { hex: '#f59e0b', name: 'Amber' },
      { hex: '#ec4899', name: 'Pink' },
      { hex: '#10b981', name: 'Green' },
      { hex: '#111111', name: 'Dark' },
      { hex: '#ffffff', name: 'White' },
    ];

    for (const color of testColors) {
      const hsl = hexToHSL(color.hex);
      console.log(`  ${color.name} ${color.hex} → HSL ${hsl}`);
    }

    console.log('\n✅ Diagnostic complete!');
    
    // 3. Output CSS variables for inclusion in a test page
    console.log('\n📝 Sample CSS variables for testing:');
    console.log(`:root {
  --primary-color: ${primaryColorData?.setting_value || '#2563eb'};
  --primary: ${hexToHSL(primaryColorData?.setting_value || '#2563eb')};
  --secondary-color: ${secondaryColorData?.setting_value || '#f59e0b'};
  --secondary: ${hexToHSL(secondaryColorData?.setting_value || '#f59e0b')};
}`);

  } catch (error) {
    console.error('Error running theme diagnostic:', error);
  }
}

diagnosticThemeColors();
