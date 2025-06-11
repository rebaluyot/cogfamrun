/**
 * Utilities for working with colors and CSS variables
 */

/**
 * Converts a hex color to HSL values used by Tailwind
 * @param hex Hex color code (e.g. #ff0000)
 * @returns HSL values formatted for CSS variables (e.g. "0 100% 50%")
 */
export function hexToHSL(hex: string): string {
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
