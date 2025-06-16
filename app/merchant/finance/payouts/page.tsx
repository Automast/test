// app/merchant/finance/payouts/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DashLayout } from '@/components/layouts';
import { ListFilter, AlertCircle, Info, Calendar, CreditCard, Wallet, Copy, Eye, EyeOff, ArrowLeft, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Pagination } from '@/components/widgets';
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { useApiRequest } from '@/hooks';
import Toaster from '@/helpers/Toaster';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Import icons
import walletIcon from '@/assets/images/icons/walletIcon.svg';
import bankIcon from '@/assets/images/icons/bank.svg';
import cryptoIcon from '@/assets/images/icons/crypto.svg';

interface PayoutItem {
  _id: string;
  sourceCurrency: 'USD' | 'BRL';
  destinationCurrency: 'USD' | 'BRL';
  amountRequested: number;
  amountPayable: number;
  fxRateUsed: number;
  method: 'bank' | 'crypto';
  status: 'Pending' | 'Approved' | 'Failed';
  failureReason?: string;
  createdAt: string;
  processedAt?: string;
  depositedAt?: string;
  payoutAccountId?: {
    asset: 'USDT' | 'USDC';
    network: string;
    address: string;
  };
  verificationId?: any;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface PayoutData {
  withdrawals: PayoutItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const statusStyles: Record<PayoutItem['status'], string> = {
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Failed: 'bg-red-100 text-red-700 border-red-200',
};

const PayoutsPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCurrency, setCurrentCurrency] = useState<'USD' | 'BRL' | 'all'>('all');
  const [payoutData, setPayoutData] = useState<PayoutData>({
    withdrawals: [],
    pagination: {
      total: 0,
      page: 1,
      limit: ITEMS_PER_PAGE,
      pages: 0,
    },
  });
  const [userCountry, setUserCountry] = useState<string>('');
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  // Fetch user profile to determine country
  const {
    response: userResponse,
    sendRequest: sendUserRequest,
  } = useApiRequest({
    endpoint: '/auth/me',
    method: 'GET',
    auth: true,
  });

  // Fetch payout history
  const {
    response: payoutResponse,
    error: payoutError,
    loading: payoutLoading,
    sendRequest: sendPayoutRequest,
  } = useApiRequest({
    endpoint: `/finance/withdrawals`,
    method: 'GET',
    auth: true,
    params: {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      currency: currentCurrency === 'all' ? undefined : currentCurrency,
    },
  });

  // Fetch user profile on component mount
  useEffect(() => {
    sendUserRequest();
  }, []);

  // Set user country and initial currency based on country
  useEffect(() => {
    if (userResponse && userResponse.success) {
      const merchant = userResponse.data.merchant;
      setUserCountry(merchant.country);
      // Set initial currency based on country
      if (merchant.country === 'BR') {
        setCurrentCurrency('BRL');
      } else {
        setCurrentCurrency('USD');
      }
    }
  }, [userResponse]);

  // Fetch payouts data when dependencies change
  useEffect(() => {
    sendPayoutRequest();
  }, [currentPage, currentCurrency]);

  useEffect(() => {
    if (payoutResponse && payoutResponse.success) {
      setPayoutData({
        withdrawals: payoutResponse.data.withdrawals || [],
        pagination: payoutResponse.data.pagination || {
          total: 0,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          pages: 0,
        },
      });
    }
  }, [payoutResponse, currentPage]);

  useEffect(() => {
    if (payoutError) {
      Toaster.error(payoutError?.message || 'Failed to load payout history');
    }
  }, [payoutError]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Currency flags using flag CDN
  const getCurrencyFlag = (currency: string) => {
    const countryCode = currency === 'BRL' ? 'br' : 'us';
    return `https://flagcdn.com/24x18/${countryCode}.png`;
  };

  // Get status icon
  const getStatusIcon = (status: PayoutItem['status']) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Toaster.success('Copied to clipboard');
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  const getAccountDisplayName = (payout: PayoutItem) => {
    if (payout.method === 'bank' && payout.bankDetails) {
      return `${payout.bankDetails.bankName} (${showAccountNumbers ? payout.bankDetails.accountNumber : maskAccountNumber(payout.bankDetails.accountNumber)})`;
    } else if (payout.method === 'crypto' && payout.payoutAccountId) {
      return `${payout.payoutAccountId.asset} - ${payout.payoutAccountId.network}`;
    }
    return 'Unknown Account';
  };

  const getCryptoAddressDisplay = (payout: PayoutItem) => {
    if (payout.method === 'crypto' && payout.payoutAccountId) {
      const address = payout.payoutAccountId.address;
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return '';
  };

  const getMethodIcon = (method: string) => {
    return method === 'bank' ? bankIcon : cryptoIcon;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Currency order based on user country
  const getCurrencyOptions = () => {
    const options = [{ value: 'all', label: 'All Currencies', flag: null }];
    
    if (userCountry === 'BR') {
      options.push(
        { value: 'BRL', label: 'BRL', flag: getCurrencyFlag('BRL') },
        { value: 'USD', label: 'USD', flag: getCurrencyFlag('USD') }
      );
    } else {
      options.push(
        { value: 'USD', label: 'USD', flag: getCurrencyFlag('USD') },
        { value: 'BRL', label: 'BRL', flag: getCurrencyFlag('BRL') }
      );
    }
    
    return options;
  };

  return (
    <DashLayout
      titleArea={
        <div className="flex items-center space-x-4">
          <Link
            href="/merchant/finance"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
          </Link>
          <h2 className="text-xl font-semibold">Payout History</h2>
        </div>
      }
      tools={
        <>
          <Link
            href="/merchant/finance/accounts"
            className="rounded-full bg-white hover:text-blue-500 cursor-pointer text-sm px-4 py-2 text-gray-700 transition-colors border border-gray-200 truncate hover:bg-gray-50"
          >
            Manage Accounts
          </Link>
          <Link
            href="/merchant/finance"
            className="rounded-full hover:bg-blue-600 bg-blue-500 cursor-pointer text-sm px-4 py-2 text-white transition"
          >
            New Withdrawal
          </Link>
        </>
      }
    >
      {/* Currency Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          {getCurrencyOptions().map((option) => (
            <button
              key={option.value}
              onClick={() => setCurrentCurrency(option.value as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                currentCurrency === option.value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {option.flag && (
                <Image
                  src={option.flag}
                  alt={`${option.label} flag`}
                  width={24}
                  height={18}
                  className="rounded shadow-sm"
                />
              )}
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </div>
        {payoutLoading && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading payout history...</span>
          </div>
        )}
      </div>

      {/* Payout History Table */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 flex-wrap mb-4 items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentCurrency === 'all' ? 'All Payouts' : `${currentCurrency} Payouts`}
          </h3>
          
          {/* Toggle for showing full account numbers */}
          <button
            onClick={() => setShowAccountNumbers(!showAccountNumbers)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showAccountNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAccountNumbers ? 'Hide' : 'Show'} Account Numbers
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-700 rounded-t-lg">
              <tr className="h-12">
                <th className="p-3 text-left rounded-tl-lg">Date & Status</th>
                <th className="p-3 text-left">Method & Account</th>
                <th className="p-3 text-left">Amount Requested</th>
                <th className="p-3 text-left">Amount Received</th>
                <th className="p-3 text-left">Exchange Rate</th>
                <th className="p-3 text-left rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {payoutLoading && (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Loading payout history...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!payoutLoading &&
                payoutData?.withdrawals?.length > 0 &&
                payoutData.withdrawals.map((payout, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {/* Date & Status */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(payout.createdAt)}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payout.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[payout.status]}`}>
                            {payout.status}
                          </span>
                        </div>
                        {payout.status === 'Failed' && payout.failureReason && (
                          <div className="text-xs text-red-600 max-w-48 truncate" title={payout.failureReason}>
                            {payout.failureReason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Method & Account */}
                    <td className="p-3">
                      <div className="flex items-start space-x-3">
                        <Image
                          src={getMethodIcon(payout.method)}
                          alt={payout.method}
                          className="w-8 h-8 mt-1"
                        />
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 capitalize">
                            {payout.method === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {getAccountDisplayName(payout)}
                          </div>
                          {payout.method === 'crypto' && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500 font-mono">
                                {getCryptoAddressDisplay(payout)}
                              </span>
                              {payout.payoutAccountId && (
                                <button
                                  onClick={() => copyToClipboard(payout.payoutAccountId!.address)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Amount Requested */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(payout.amountRequested, payout.sourceCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          From {payout.sourceCurrency} balance
                        </div>
                      </div>
                    </td>

                    {/* Amount Received */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(payout.amountPayable, payout.destinationCurrency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          To {payout.destinationCurrency} account
                        </div>
                        {payout.depositedAt && (
                          <div className="text-xs text-green-600">
                            Deposited: {formatDate(payout.depositedAt)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Exchange Rate */}
                    <td className="p-3">
                      <div className="space-y-1">
                        {payout.sourceCurrency !== payout.destinationCurrency ? (
                          <>
                            <div className="font-medium text-gray-900">
                              {payout.fxRateUsed.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-500">
                              1 {payout.sourceCurrency} = {payout.fxRateUsed.toFixed(4)} {payout.destinationCurrency}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No conversion
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <button
                        onClick={() => router.push(`/merchant/finance/payouts?id=${payout._id}`)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}

              {!payoutLoading && (!payoutData?.withdrawals || payoutData?.withdrawals?.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="flex flex-col items-center space-y-3">
                      <Wallet className="w-12 h-12 text-gray-300" />
                      <div className="text-gray-500">
                        No payout history for {currentCurrency === 'all' ? 'any currency' : currentCurrency}
                      </div>
                      <Link
                        href="/merchant/finance"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Make your first withdrawal
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {payoutData?.withdrawals?.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <Pagination
              totalLength={payoutData.pagination?.total || 0}
              limit={payoutData.pagination?.limit || ITEMS_PER_PAGE}
              pageCount={payoutData.pagination?.pages || 1}
              page={payoutData.pagination?.page || 1}
              pageClick={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>
    </DashLayout>
  );
};

export default PayoutsPage;