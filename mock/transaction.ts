// types/transaction.ts
export type TransactionStatus = 'successful' | 'pending' | 'failed' | 'chargeback' | 'refunded' | 'canceled';
export type PaymentMethod = 'card' | 'paypal' | 'pix' | 'wallet' | 'other';

export type Transaction = {
  date: Date;
  id: string;
  card?: 'mastercard' | 'visa';
  customer: string;
  status: TransactionStatus;
  amount: number;
  method?: PaymentMethod;
  saleCurrency?: string;
  subtotal?: number;
  buyerEmail?: string;
  buyerName?: string;
  paymentMethod?: PaymentMethod;
};

export type TransactionData = {
  pagination: {
    totalLength: number;
    itemsPerPage: number;
    pageCount: number;
    currentPage: number;
  };
  data: Transaction[];
};

export type TransactionProduct = {
  name: string;
  id: string;
  imageUrl: string;
  price: number;
  quantity: number;
};

export type TransactionVariant = {
  name: string;
  value: string;
};

export type TransactionItem = {
  productId: string;
  productName: string;
  productType: 'digital' | 'physical';
  productOwnerId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productCurrency: string;
  vatEnabled: boolean;
  vatAmount?: number;
  variants?: TransactionVariant[];
};

export type TransactionMetadata = {
  buyerEmail?: string;
  buyerPhone?: string;
  billingDetails?: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  ipAddress?: string;
  deviceInfo?: string;
  browserInfo?: string;
  items?: TransactionItem[];
  localCurrency?: string;
  localPrice?: number;
  localSubtotal?: number;
  localShipping?: number;
  localTotal?: number;
  originalCurrency?: string;
  originalPrice?: number;
  originalSubtotal?: number;
  originalTotal?: number;
};

export type TransactionDetail = {
  _id: string;
  merchantId?: string;
  type: 'sale' | 'refund' | 'payout_debit' | 'adjustment' | 'fee';
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  originAmount: number;
  originCurrency: string;
  amountUSD?: number;
  amountBRL?: number;
  dashboardCurrencyAtTransaction?: string;
  fxRateUsedToUSD?: number;
  fxRateUsedToBRL?: number;
  description?: string;
  metadata?: TransactionMetadata;
  processedAt: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  
  // Additional fields for backwards compatibility with the UI
  id?: string;
  amount?: number;
  customer?: {
    name?: string;
    email?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  billing?: {
    address?: string;
    name?: string;
  };
  technical?: {
    ip?: string;
    device?: string;
  };
  products?: TransactionProduct[];
  generatedBy?: string;
};