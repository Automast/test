export type Transaction = {
  date: Date;
  id: string;
  card: 'mastercard' | 'visa';
  customer: string;
  status: 'Succeeded' | 'Pending' | 'Failed' | 'Chargeback' | 'Refunded';
  amount: number;
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

export type TransactionDetail = {
  id: string;
  amount: number;
  status: 'Succeeded' | 'Pending' | 'Failed' | 'Chargeback' | 'Refunded';
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    email: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  billing: {
    address: string;
    name: string;
  };
  technical: {
    ip: string;
    device: string;
  };
  products: TransactionProduct[];
  generatedBy:
    | 'Shopify'
    | 'WooCommerce'
    | 'Wordpress'
    | 'Google Tag Manager'
    | 'Google Analytics'
    | 'Google Ads'
    | 'Facebook Ads'
    | 'TikTok Ads'
    | 'API Integration'
    | 'Webhook';
  paymentMethod: 'Mastercard' | 'Visa';
};
