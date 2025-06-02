// types/transaction.ts

// Matches backend TransactionStatus enum
export type TransactionStatus = 
  | 'pending' 
  | 'successful' 
  | 'failed' 
  | 'canceled' 
  | 'refunded' 
  | 'partial_refund' 
  | 'chargeback' 
  | 'disputed';

// Matches backend PaymentMethod enum
export type PaymentMethod = 'card' | 'pix' | 'paypal' | 'wallet' | 'other';

// For the transaction list page (app/merchant/transactions/page.tsx)
export type TransactionListItem = {
  id: string; // This will be transaction.transactionId (TX_...) or transaction._id from backend
  date: Date;
  customer: string; // Derived from billingName or buyerEmail
  status: TransactionStatus;
  amount: number; // This is the primary display amount (e.g., total in saleCurrency)
  saleCurrency: string; // The currency for the 'amount' field
  method?: PaymentMethod; // The paymentMethod string from backend

  // Optional detailed fields if needed for specific columns or hover effects on the list
  amountUSD?: number;
  amountBRL?: number;
  buyerEmail?: string; 
  // paymentMethod is already covered by 'method' but can be kept if Transaction type is used elsewhere with this name
};

export type TransactionData = {
  pagination: {
    totalLength: number;
    itemsPerPage: number;
    pageCount: number;
    currentPage: number;
  };
  data: TransactionListItem[];
};


// ---- For Transaction Detail Page (app/merchant/transactions/[id]/page.tsx) ----
// The detail page currently uses `txDetail: any`. If you want strong typing,
// you'd define a type that mirrors the backend's ITransaction structure accurately.
// Example (you can expand this based on all fields in your backend's ITransaction):
export type BackendTransaction = {
  _id: string;
  transactionId: string;
  type: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  originAmount: number;
  originCurrency: string;
  saleCurrency: string;
  total: number;
  subtotal: number;
  shippingFee?: number;
  taxAmount?: number;
  amountUSD?: number;
  amountBRL?: number;
  fxRateUsedToUSD?: number;
  fxRateUsedToBRL?: number;
  processedAt?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
  items: Array<{ // Simplified item structure for example
    productName: string;
    productId: string;
    quantity: number;
    totalPrice: number;
    currency: string;
    metadata?: { productType?: string; variants?: any[] };
  }>;
  buyerEmail?: string;
  buyerPhone?: string;
  billingName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  ipAddress?: string;
  deviceInfo?: string;
  browserInfo?: string;
  metadata?: Record<string, any>; // For other metadata
  // ... and any other fields from your backend ITransaction model
};

// Original TransactionProduct, TransactionVariant, TransactionItem, TransactionMetadata types
// can remain if they are used by other parts of your frontend, for example, during product checkout submission.
// But for displaying existing transaction details, the BackendTransaction type (or direct access to `any`) is more relevant.

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
  subtotal: number; // This was likely intended for line item total, backend uses totalPrice
  productCurrency: string; // Backend item uses 'currency'
  vatEnabled: boolean;
  vatAmount?: number;
  variants?: TransactionVariant[];
};

export type TransactionMetadata = {
  buyerEmail?: string;
  buyerPhone?: string;
  billingDetails?: { // This structure is not at the root of backend metadata
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
  items?: TransactionItem[]; // Items are at root in backend JSON
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

// This TransactionDetail type is significantly different from the backend.
// It's safer for the detail page to access properties directly from the `txDetail: any`
// or use a type like `BackendTransaction` defined above.
export type TransactionDetail = {
  _id: string; // Corresponds to backend _id
  // ... other fields from your old TransactionDetail type if needed for some specific transformation
  // but generally, try to use fields as they come from the backend for simplicity.
  id?: string; // Usually refers to transactionId (TX_...)
  amount?: number; // total or originAmount
  status: TransactionStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
  // These nested structures are not directly in backend root, but from txDetail.fieldName
  customer?: { name?: string; email?: string; }; // -> billingName, buyerEmail
  contact?: { email?: string; phone?: string; }; // -> buyerEmail, buyerPhone
  billing?: { address?: string; name?: string; }; // -> billingAddress, billingName
  technical?: { ip?: string; device?: string; }; // -> ipAddress, deviceInfo
  products?: TransactionProduct[]; // -> items array
  generatedBy?: string; // Not in backend example
  paymentMethod: PaymentMethod; // Backend has this
  originAmount: number; // Backend has this
  originCurrency: string; // Backend has this
  metadata?: TransactionMetadata; // This would be txDetail.metadata from backend
};