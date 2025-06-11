import { useEffect } from 'react';
import { useAppSettings } from '@/config/app-settings';
import { hexToHSL } from '@/lib/color-utils';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings } = useAppSettings();
  
  useEffect(() => {
    // Apply custom theme colors from settings
    if (settings) {
      // Set custom CSS variables
      if (settings.primaryColor) {
        // Set the legacy CSS variable
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        
        // Set the Tailwind CSS variable (in HSL format)
        document.documentElement.style.setProperty('--primary', hexToHSL(settings.primaryColor));
        
        console.log(`Applied primary color: ${settings.primaryColor} → ${hexToHSL(settings.primaryColor)}`);
      }
      
      if (settings.secondaryColor) {
        // Set the legacy CSS variable
        document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
        
        // Set the Tailwind CSS variable (in HSL format)
        document.documentElement.style.setProperty('--secondary', hexToHSL(settings.secondaryColor));
        
        console.log(`Applied secondary color: ${settings.secondaryColor} → ${hexToHSL(settings.secondaryColor)}`);
      }
    }
  }, [settings?.primaryColor, settings?.secondaryColor]);

  return <>{children}</>;
}
