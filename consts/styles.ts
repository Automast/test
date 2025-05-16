import { Transaction } from '@/types';

export const txStatusStyles: Record<Transaction['status'], string> = {
  Succeeded: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Failed: 'bg-red-100 text-red-700',
  Chargeback: 'bg-red-100 text-red-700',
  Refunded: 'bg-gray-200 text-gray-700',
};
