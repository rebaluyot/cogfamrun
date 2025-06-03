/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a number as Philippine Peso (PHP)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

/**
 * Get a CSS color class based on race category
 * @param category - The race category (3K, 6K, 10K)
 * @returns CSS class string for styling
 */
export function getCategoryColorClass(category: string): string {
  switch (category) {
    case "3K":
      return "bg-green-100 text-green-800";
    case "6K":
      return "bg-blue-100 text-blue-800";
    case "10K":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get description for a race category
 * @param category - The race category (3K, 6K, 10K)
 * @returns Description string
 */
export function getCategoryDescription(category: string): string {
  switch (category) {
    case "3K":
      return "Perfect for beginners and families";
    case "6K":
      return "Ideal for intermediate runners";
    case "10K":
      return "Challenge for experienced runners";
    default:
      return "";
  }
}

/**
 * Get a CSS color class based on registration status
 * @param status - The registration status (confirmed, pending, cancelled)
 * @returns CSS class string for styling
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
