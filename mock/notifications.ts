import { Notification } from '@/types';

export const mockNotiData: Notification[] = [
  {
    id: '1',
    date: new Date('2023-10-01T10:00:00Z'),
    title: 'Transaction Succeeded',
    content: 'Your transaction has been successfully processed.',
  },
  {
    id: '2',
    date: new Date('2023-10-02T12:00:00Z'),
    title: 'Transaction Pending',
    content: 'Your transaction is currently pending.',
  },
  {
    id: '3',
    date: new Date('2023-10-03T14:00:00Z'),
    title: 'Transaction Failed',
    content: 'Your transaction has failed. Please try again.',
  },
  {
    id: '4',
    date: new Date('2023-10-04T16:00:00Z'),
    title: 'Chargeback Notification',
    content: 'A chargeback has been initiated for your transaction.',
  },
  {
    id: '5',
    date: new Date('2023-10-05T18:00:00Z'),
    title: 'Refund Processed',
    content: 'Your refund has been successfully processed.',
  },
];
