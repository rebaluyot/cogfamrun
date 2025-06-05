/**
 * Payment style utility functions
 */

/**
 * Get CSS class for payment status coloring
 */
export const getPaymentStatusColorClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  }
};

/**
 * Get icon color for payment status
 */
export const getPaymentStatusIconColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "pending":
    default:
      return "text-yellow-600";
  }
};
