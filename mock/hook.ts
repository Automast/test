import { Webhook } from '@/types';

export const webhookMockData: Webhook[] = [
  {
    createdAt: new Date(),
    type: 'Payment',
    url: 'https://connect.riskpay.com/sendwebhook/vbsfrddsfsdf',
    isActive: true,
  },
  {
    createdAt: new Date(),
    type: 'Payment',
    url: 'https://connect.riskpay.com/sendwebhook/sasbhjsx5ssSKH',
    isActive: true,
  },
  {
    createdAt: new Date(),
    type: 'Order',
    url: 'https://connect.riskpay.com/sendwebhook/uyisdfgsdfsdf',
    isActive: true,
  },
  {
    createdAt: new Date(),
    type: 'Subscription',
    url: 'https://connect.riskpay.com/sendwebhook/trugdfgdfg',
    isActive: false,
  },
  {
    createdAt: new Date(),
    type: 'Payment',
    url: 'https://connect.riskpay.com/sendwebhook/sdfcvsdf',
    isActive: true,
  },
  {
    createdAt: new Date(),
    type: 'Customer',
    url: 'https://connect.riskpay.com/sendwebhook/sasbhjsx5ssSKH',
    isActive: false,
  },
];
