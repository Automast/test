export type WebhookEvent = 'Payment' | 'Subscription' | 'Order' | 'Payout & Settlement' | 'Customer' | 'Merchant';
export type Webhook = {
  type: WebhookEvent;
  url: string;
  isActive: boolean;
  createdAt: Date;
};
