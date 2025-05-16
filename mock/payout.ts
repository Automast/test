import { Account, PayoutData, PayoutDetail } from '@/types';

export const payoutDataMock: PayoutData = {
  pagination: {
    totalLength: 120,
    itemsPerPage: 10,
    pageCount: 12,
    currentPage: 1,
  },
  data: [
    {
      id: '9817201208129',
      createdAt: new Date(),
      txid: 'adsoifuasofjoiefwe2',
      method: 'bank',
      status: 'Approved',
      amount: 927,
    },
    {
      id: '456546456456',
      createdAt: new Date(),
      txid: 'adsoifuasofjoiefwe2',
      method: 'bank',
      status: 'Failed',
      amount: 234,
    },
    {
      id: '2554765464564',
      createdAt: new Date(),
      txid: 'adsoifuasofjoiefwe2',
      method: 'crypto',
      status: 'Pending',
      amount: 927,
    },
    {
      id: '7688567567567',
      createdAt: new Date(),
      txid: '4568678678678678',
      method: 'bank',
      status: 'Failed',
      amount: 12.67,
    },
    {
      id: '9817201208129',
      createdAt: new Date(),
      txid: 'adsoifuasofjoiefwe2',
      method: 'bank',
      status: 'Approved',
      amount: 6785,
    },
  ],
};

export const payoutDetailMock: PayoutDetail = {
  id: '2124fsdfsd2424',
  status: 'Approved',
  amount: {
    total: 145,
    tax: 2.5,
    fee: 2,
  },
  txid: 'HSBSHS7895GSRh',
  createdAt: new Date(),
  processedAt: new Date(),
  depositedAt: new Date(),
};

export const accountsMock: Account[] = [
  {
    id: 'sdfdsfsdfdsfdf',
    holder: 'Nur Hassan',
    address: '9870802109012912',
    where: 'American Bank',
    isActive: true,
    updatedAt: new Date(),
  },
];
