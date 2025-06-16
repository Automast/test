
export type Payout = {
  id: string;
  createdAt: Date;
  txid: string;
  method: 'bank' | 'crypto';
  status: 'Approved' | 'Pending' | 'Failed';
  amount: number;
  sourceCurrency: 'USD' | 'BRL';
  destinationCurrency: 'USD' | 'BRL';
  amountRequested: number;
  amountPayable: number;
  fxRateUsed: number;
  processedAt?: Date;
  depositedAt?: Date;
  failureReason?: string;
};

export type PayoutDetail = {
  id: string;
  merchantId: string;
  status: 'Approved' | 'Pending' | 'Failed';
  sourceCurrency: 'USD' | 'BRL';
  destinationCurrency: 'USD' | 'BRL';
  amountRequested: number;
  amountPayable: number;
  fxRateUsed: number;
  method: 'bank' | 'crypto';
  txid: string;
  createdAt: string;
  processedAt?: string;
  depositedAt?: string;
  failureReason?: string;
  payoutAccount: {
    id: string;
    type: 'bank' | 'crypto';
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      routingNumber?: string;
      branch?: string;
      swift?: string;
      iban?: string;
    };
    cryptoDetails?: {
      asset: 'USDT' | 'USDC';
      network: 'ERC20' | 'BEP20' | 'TRC20' | 'SOLANA';
      address: string;
    };
  };
};

export type PayoutData = {
  pagination: {
    totalLength: number;
    itemsPerPage: number;
    pageCount: number;
    currentPage: number;
  };
  withdrawals: Payout[]; // renamed – matches component usage
};


export type Account = {
  holder: string;
  id: string;
  address: string;
  where: string;
  isActive: boolean;
  updatedAt: Date;
  type: 'bank' | 'crypto';
  currency?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
    swift?: string;
    iban?: string;
  };
  cryptoDetails?: {
    asset: 'USDT' | 'USDC';
    network: 'ERC20' | 'BEP20' | 'TRC20' | 'SOLANA';
    address: string;
  };
};

export type WithdrawLimits = {
  min: {
    USD: number;
    BRL: number;
  };
  maxDaily: {
    USD: number;
    BRL: number;
  };
};

export type ExchangeRates = {
  brlToBrlRateBR:    number;
  brlToUsdRateOther: number;
  brlToCryptoRate:   number;

  usdRateUS:         number;
  usdRateOther:      number;
  usdToBrlRateBR:    number;
  usdToCryptoRate:   number;
};


export type PayoutAccount = {
  id: string;
  type: 'bank' | 'crypto';
  currency: string;
  isActive: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
    swift?: string;
    iban?: string;
  };
  cryptoDetails?: {
    asset: 'USDT' | 'USDC';
    network: 'ERC20' | 'BEP20' | 'TRC20' | 'SOLANA';
    address: string;
  };
};