/**
 * This file adds a browser-side script to detect theme changes and 
 * help ensure that Tailwind's theme is properly updated when settings change.
 */

// Function to observe changes to CSS variables and apply them to Tailwind
function setupThemeWatcher() {
  // Create a MutationObserver to watch for style attribute changes on :root
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style') {
        const rootStyles = document.documentElement.style;
        const primaryColor = rootStyles.getPropertyValue('--primary-color');
        const secondaryColor = rootStyles.getPropertyValue('--secondary-color');

        // If we have colors, convert them to HSL and update Tailwind variables
        if (primaryColor) {
          const primaryHSL = hexToHSL(primaryColor);
          if (primaryHSL) {
            rootStyles.setProperty('--primary', primaryHSL);
            console.log('Theme Watcher: Updated primary HSL to', primaryHSL);
          }
        }

        if (secondaryColor) {
          const secondaryHSL = hexToHSL(secondaryColor);
          if (secondaryHSL) {
            rootStyles.setProperty('--secondary', secondaryHSL);
            console.log('Theme Watcher: Updated secondary HSL to', secondaryHSL);
          }
        }
      }
    });
  });

  // Start observing the document root for style attribute changes
  observer.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['style']
  });

  console.log('Theme watcher initialized');
}

// Simple hex to HSL conversion function
function hexToHSL(hex: string): string | null {
  // Default to a reasonable value if invalid
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
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

// Add type declaration for the global themeUtils
declare global {
  interface Window {
    themeUtils: {
      hexToHSL: (hex: string) => string;
      setupThemeWatcher: () => void;
    };
  }
}

// Set up the watcher when the page loads
document.addEventListener('DOMContentLoaded', setupThemeWatcher);

// Expose the utility functions globally to help with debugging
window.themeUtils = {
  hexToHSL,
  setupThemeWatcher
};
