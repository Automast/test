export type Payout = {
  id: string;
  createdAt: Date;
  txid: string;
  method: 'bank' | 'crypto';
  status: 'Approved' | 'Pending' | 'Failed';
  amount: number;
};

export type PayoutDetail = {
  id: string;
  status: 'Approved' | 'Pending' | 'Failed';
  amount: {
    total: number;
    tax: number;
    fee: number;
  };
  txid: string;
  createdAt: Date | null;
  processedAt: Date | null;
  depositedAt: Date | null;
};

export type PayoutData = {
  pagination: {
    totalLength: number;
    itemsPerPage: number;
    pageCount: number;
    currentPage: number;
  };
  data: Payout[];
};

export type Account = {
  holder: string;
  id: string;
  address: string;
  where: string;
  isActive: boolean;
  updatedAt: Date;
};
