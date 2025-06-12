// productlib/types.ts
export interface IImage {
    url: string;
    isMain: boolean;
  }
  
  export interface IShippingMethod {
    name: string;
    price: number; // 0 means free shipping
    minDays: number;
    maxDays: number;
  }
  
  export interface IVariant {
    name: string;
    values: string[];
    stock: number;
  }
  
  export interface IVariantSelection {
    name: string;
    value: string;
  }
  
  export interface IDigitalOptions {
    fileUrl?: string;
    fileUpload?: string;
    recurring?: {
      interval: 'monthly' | 'yearly';
      trialDays?: number;
      hasTrial: boolean;
    };
  }
  
  export interface IPhysicalOptions {
    weight?: number;  // in kg
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: string;
    stock?: number;
    shippingMethods?: IShippingMethod[];
  }
  
  export interface IProduct {
    _id: string;
    merchantId?: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    description?: string;
    slug: string;
    price: number;
    defaultCurrency: string;
    autoLocalPrice: boolean;
    productSource?: 'shopify' | 'woocommerce' | 'wordpress' | 'customapi' | 'hosted' | 'others';
    vatEnabled: boolean;
    type: 'digital' | 'physical';
    sku?: string;
    barcode?: string;
    digital?: IDigitalOptions;
    physical?: IPhysicalOptions;
    variants?: IVariant[];
    images: IImage[];
    status?: 'active' | 'deactivated' | 'deleted';
    quantityEnabled?: boolean; // New field to enable/disable quantity selection
    // Add these new fields for local currency handling
    localPrice?: number;
    localCurrency?: string;
  }
  
  export interface IBillingInfo {
    email: string;
    phone?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }
  
export interface ITransactionItem {
  productId: string;
  productSlug: string;
  productName: string;
  productType: 'digital' | 'physical';
  productOwnerId: string;
  quantity: number;
  unitPrice: number; // Price of ONE unit in the sale currency
  totalPrice: number;  // << CHANGED from subtotal: This should be unitPrice * quantity for THIS item line
  currency: string;   // << CHANGED from productCurrency: Currency for THIS item line
  vatEnabled: boolean;
  vatAmount?: number; // VAT amount for THIS item line
  variants?: IVariantSelection[];
}
  
  // Define the transaction types and statuses
  export type TransactionType = 'sale' | 'refund' | 'payout_debit' | 'adjustment' | 'fee';
  export type TransactionStatus = 'successful' | 'pending' | 'canceled' | 'failed' | 'refunded' | 'others';

  // Simplified transaction interface for API calls - matches backend expectations
  export interface ITransaction {
    items: ITransactionItem[];
    productSource: 'hosted' | 'shopify' | 'woocommerce' | 'wordpress' | 'customapi' | 'others';
    saleCurrency: string;
    subtotal: number;
    shippingFee?: number;
    total: number;
    paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other';
    buyerEmail: string;
    buyerPhone?: string;
    billingName: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingPostalCode: string;
    billingCountry: string;
    status: TransactionStatus;
    ipAddress?: string;
    deviceInfo?: string;
    browserInfo?: string;
    metadata?: Record<string, any>;
    
    // Additional fields for Stripe integration
    useStripe?: boolean;
    paymentIntentId?: string;
    
    // Legacy fields for compatibility
    type?: TransactionType;
    originAmount?: number;
    originCurrency?: string;
  }
  
  export interface ICurrency {
    code: string;
    symbol: string;
    name: string;
    countries: string[];
    pixSupported: boolean;
  }
  
  export interface IFormData {
    quantity: number;
    variantSelections: IVariantSelection[];
    billingInfo: IBillingInfo;
    paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other';
  }
  
  export interface IApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any;
  }