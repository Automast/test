// consts/styles.ts
export const txStatusStyles: Record<string, string> = {
  // Existing styles (some might be redundant if backend uses lowercase consistently)
  Succeeded: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Failed: 'bg-red-100 text-red-700',
  Chargeback: 'bg-orange-100 text-orange-700', // Changed for distinctness
  Refunded: 'bg-cyan-100 text-cyan-700', // Changed for distinctness
  
  // Styles for lowercase backend statuses (primary)
  successful: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-200 text-gray-700',
  refunded: 'bg-cyan-100 text-cyan-700',
  'partial_refund': 'bg-blue-50 text-blue-600', // Specific style for partial refund
  chargeback: 'bg-orange-100 text-orange-700', // Consistent with Chargeback
  disputed: 'bg-orange-100 text-orange-700', // Can be same as chargeback or new style
  
  // Default/fallback
  default: 'bg-gray-100 text-gray-600',
};