// consts/styles.ts
import { TransactionStatus } from '@/types';

export const txStatusStyles: Record<string, string> = {
  // Original styles
  Succeeded: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Failed: 'bg-red-100 text-red-700',
  Chargeback: 'bg-red-100 text-red-700',
  Refunded: 'bg-gray-200 text-gray-700',
  
  // New status styles
  successful: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  chargeback: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-200 text-gray-700',
  canceled: 'bg-gray-200 text-gray-700',
};