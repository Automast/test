// app/merchant/finance/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DashLayout } from '@/components/layouts';
import { ListFilter, AlertCircle, Info, DollarSign, TrendingUp, Wallet } from 'lucide-react';

import Link from 'next/link';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { BalanceCard, Pagination } from '@/components/widgets';
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { useApiRequest } from '@/hooks';
import { payoutsUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { Payout, PayoutData } from '@/types/payout';
import { useRouter } from 'next/navigation';

import walletIcon from '@/assets/images/icons/walletIcon.svg';
import chartIcon from '@/assets/images/icons/chartIcon.svg';
import bagIcon from '@/assets/images/icons/bagIcon.svg';
import balanceIcon from '@/assets/images/icons/balance1.svg';
import Image from 'next/image';

const statusStyles: Record<Payout['status'], string> = {
  Approved: 'bg-green-100 text-green-700 border-green-200',
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Failed: 'bg-red-100 text-red-700 border-red-200',
};

const periods = [1, 2, 7, 15, 30, 0];

interface PayoutAccount {
  id: string;
  type: 'bank' | 'crypto';
  currency: string;
  isActive: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
  };
  cryptoDetails?: {
    asset: 'USDT' | 'USDC';
    network: string;
    address: string;
  };
}

interface WithdrawLimits {
  min: { USD: number; BRL: number };
  maxDaily: { USD: number; BRL: number };
}

const FinancePage = () => {
  const router = useRouter();

  const [period, setPeriod] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCurrency, setCurrentCurrency] = useState<'USD' | 'BRL'>('USD');
  const [userCountry, setUserCountry] = useState<string>('');
  const [balances, setBalances] = useState<any>({});
  const [payoutData, setPayoutData] = useState<PayoutData>({
    pagination: {
      totalLength: 0,
      itemsPerPage: 0,
      pageCount: 0,
      currentPage: 1,
    },
  withdrawals: [] as Payout[],

  });

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [withdrawLimits, setWithdrawLimits] = useState<WithdrawLimits | null>(null);
  const [exchangeRates, setExchangeRates] = useState<any>({});
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [gasFeeWarning, setGasFeeWarning] = useState(false);

  // Fetch user profile to determine country
  const {
    response: userResponse,
    error: userError,
    loading: userLoading,
    sendRequest: sendUserRequest,
  } = useApiRequest({
    endpoint: '/auth/me',
    method: 'GET',
    auth: true,
  });

  // Fetch balance data
  const {
    response: balanceResponse,
    error: balanceError,
    loading: balanceLoading,
    sendRequest: sendBalanceRequest,
  } = useApiRequest({
    endpoint: '/finance/balance',
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
      currency: currentCurrency,
    },
  });

  // Fetch payout accounts
  const {
    response: accountsResponse,
    error: accountsError,
    sendRequest: sendAccountsRequest,
  } = useApiRequest({
    endpoint: '/finance/accounts',
    method: 'GET',
    auth: true,
  });

  // Fetch withdrawal limits
// Fetch withdrawal limits
const {
  response: limitsResponse,
  sendRequest: sendLimitsRequest,
} = useApiRequest({
  endpoint: '/finance/withdraw/config',
  method: 'GET',
  auth: true,
});


  // Submit withdrawal request
  const {
    loading: withdrawLoading,
    sendRequest: sendWithdrawRequest,
  } = useApiRequest({
    endpoint: '/finance/withdraw',
    method: 'POST',
    auth: true,
  });

  // Fetch user profile on component mount
  useEffect(() => {
    sendUserRequest();
    sendBalanceRequest();
    sendAccountsRequest();
    sendLimitsRequest();
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

  // Handle user fetch error
  useEffect(() => {
    if (userError) {
      console.error('Error fetching user data:', userError);
      setCurrentCurrency('USD');
    }
  }, [userError]);

  // Handle balance response
  useEffect(() => {
    if (balanceResponse && balanceResponse.success) {
      setBalances(balanceResponse.data.balances);
    }
  }, [balanceResponse]);

  // Handle balance error
  useEffect(() => {
    if (balanceError) {
      console.error('Error fetching balance data:', balanceError);
      Toaster.error('Failed to load balance data');
    }
  }, [balanceError]);

  // Handle accounts response
  useEffect(() => {
    if (accountsResponse && accountsResponse.success) {
      const accounts: PayoutAccount[] = [];
      if (accountsResponse.data.bank) {
        accounts.push({
          id: accountsResponse.data.bank.id,
          type: 'bank',
          currency: accountsResponse.data.bank.currency || currentCurrency,
          isActive: true,
          bankDetails: accountsResponse.data.bank,
        });
      }
      if (accountsResponse.data.crypto) {
        accounts.push({
          id: accountsResponse.data.crypto.id,
          type: 'crypto',
          currency: 'USD', // Crypto always USD equivalent
          isActive: accountsResponse.data.crypto.isActive,
          cryptoDetails: {
  asset: accountsResponse.data.crypto.asset,
  network: accountsResponse.data.crypto.network,
  address: accountsResponse.data.crypto.address,
},

        });
      }
      setPayoutAccounts(accounts);
    }
  }, [accountsResponse, currentCurrency]);

// Handle limits response – map old `cryptoRate` into both new crypto fields
useEffect(() => {
  if (limitsResponse && limitsResponse.success) {
    setWithdrawLimits(limitsResponse.data);
    const r = limitsResponse.data.rate || {};
    
    console.log('Received withdrawal config rates:', r);

    // If your backend still returns `cryptoRate`, use that as fallback
setExchangeRates({
      ...r,
      // legacy fallback if the backend ever returns only `cryptoRate`
      brlToCryptoRate: r.brlToCryptoRate ?? r.cryptoRate ?? 0.18,
      usdToCryptoRate: r.usdToCryptoRate ?? r.cryptoRate ?? 1,
});

    console.log('Set exchange rates:', {
      ...r,
      brlToCryptoRate: r.brlToCryptoRate ?? r.cryptoRate ?? 0.18,
      usdToCryptoRate: r.usdToCryptoRate ?? r.cryptoRate ?? 1,
    });
  }
}, [limitsResponse]);


  // Fetch payouts data
  useEffect(() => {
    sendPayoutRequest();
  }, [period, currentPage, currentCurrency]);

useEffect(() => {
  if (payoutResponse && payoutResponse.success) {
    setPayoutData({
      pagination: payoutResponse.data.pagination || {
        totalLength: payoutResponse.data.total || 0,
        itemsPerPage: ITEMS_PER_PAGE,
        pageCount: payoutResponse.data.pages || Math.ceil((payoutResponse.data.total || 0) / ITEMS_PER_PAGE),
        currentPage: currentPage,
      },
      withdrawals: payoutResponse.data.withdrawals || [],
    });
  }
}, [payoutResponse, currentPage]);

  useEffect(() => {
    if (payoutError) {
      Toaster.error(payoutError?.message || 'Failed to load payout history');
    }
  }, [payoutError]);

// --------------------------------------------
// Calculate FX rate & destination currency
// --------------------------------------------
const safeRate = (v?: number) => (typeof v === 'number' && v > 0 ? v : 1);
const [destCurrency, setDestCurrency] =
  useState<'USD' | 'BRL' | 'USDT'>('USD');


useEffect(() => {
  // Need an amount AND a selected payout account
  if (!selectedAccountId) return;

  const amt = parseFloat(withdrawAmount);
  if (isNaN(amt) || amt <= 0) {
    setCalculatedAmount(0);
    return;
  }

  const acct = payoutAccounts.find(a => a.id === selectedAccountId);
  if (!acct) return;

  let fx  = 1;
let dst: 'USD' | 'BRL' | 'USDT' =
  currentCurrency as 'USD' | 'BRL' | 'USDT';

  console.log('Calculating FX for account:', acct, 'Current currency:', currentCurrency, 'Exchange rates:', exchangeRates);

if (acct.type === 'crypto') {
  // Stable‑coins are US‑pegged; show them explicitly
  dst = 'USDT';                       // <-- NEW (was 'USD')
  fx  = currentCurrency === 'BRL'
    ? safeRate(exchangeRates.brlToCryptoRate)
    : safeRate(exchangeRates.usdToCryptoRate);
  setGasFeeWarning(true);
  
  console.log('Crypto payout - FX rate:', fx, 'Source currency:', currentCurrency, 'Dest:', dst);
} else {
    setGasFeeWarning(false);

    if (currentCurrency === 'BRL') {
      if (userCountry === 'BR') {
        dst = 'BRL'; fx = safeRate(exchangeRates.brlToBrlRateBR);
      } else {
        dst = 'USD'; fx = safeRate(exchangeRates.brlToUsdRateOther);
      }
    } else { // source = USD
      if (userCountry === 'BR') {
        dst = 'BRL'; fx = safeRate(exchangeRates.usdToBrlRateBR);
      } else if (userCountry === 'US') {
        dst = 'USD'; fx = safeRate(exchangeRates.usdRateUS);
      } else {
        dst = 'USD'; fx = safeRate(exchangeRates.usdRateOther);
      }
    }
    
    console.log('Bank payout - FX rate:', fx, 'Source currency:', currentCurrency, 'Dest:', dst, 'User country:', userCountry);
  }

  setDestCurrency(dst);
  setCalculatedAmount(parseFloat((amt * fx).toFixed(2)));
  
  console.log('Final calculation - Amount:', amt, 'FX:', fx, 'Result:', parseFloat((amt * fx).toFixed(2)));
}, [
  withdrawAmount,
  selectedAccountId,
  exchangeRates,
  currentCurrency,
  userCountry,
  payoutAccounts
]);


const formatCurrency = (amount: number, currency: string) => {
  // Stable-coins map to USD for display
  const iso = currency === 'USDT' ? 'USD' : currency;

  return new Intl.NumberFormat(
    iso === 'BRL' ? 'pt-BR' : 'en-US',
    {
      style: 'currency',
      currency: iso,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
};



  // Get current balance for selected currency
  const getCurrentBalance = () => {
    if (!balances || !balances[currentCurrency]) {
      return { totalBalance: 0, available: 0, reserve: 0, pending: 0 };
    }
    return balances[currentCurrency];
  };

  const currentBalance = getCurrentBalance();

  // Currency flags using flag CDN
  const getCurrencyFlag = (currency: string) => {
    const countryCode = currency === 'BRL' ? 'br' : 'us';
    return `https://flagcdn.com/24x18/${countryCode}.png`;
  };

  // Currency order based on user country
  const getCurrencyOrder = () => {
    return userCountry === 'BR' ? ['BRL', 'USD'] : ['USD', 'BRL'];
  };

  // Filter accounts - allow cross-currency withdrawals
  const getAvailableAccounts = () => {
    return payoutAccounts.filter(account => {
      // Crypto is always available (supports USD/BRL to USDT conversion)
      if (account.type === 'crypto') return true;
      
      // Bank accounts are always available for cross-currency withdrawals
      // The backend handles USD->BRL and BRL->USD conversions via exchange rates
      if (account.type === 'bank') return true;
      
      return false;
    });
  };

  // Validate withdrawal amount
  const validateWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return 'Please enter a valid amount';
    if (!selectedAccountId) return 'Please select a payout account';
    if (!withdrawLimits) return 'Loading limits...';
    
    const minAmount = withdrawLimits.min[currentCurrency];
    const maxDaily = withdrawLimits.maxDaily[currentCurrency];
    
    if (amount < minAmount) {
      return `Minimum withdrawal is ${formatCurrency(minAmount, currentCurrency)}`;
    }
    
    if (amount > currentBalance.available) {
      return 'Insufficient available balance';
    }
    
    // Note: Daily limit check should be done on backend
    
    return null;
  };

  const handleWithdraw = async () => {
    const validation = validateWithdrawal();
    if (validation) {
      Toaster.error(validation);
      return;
    }

try {
  const selectedAccount = payoutAccounts.find(acc => acc.id === selectedAccountId);
  await sendWithdrawRequest('', {
    amount: parseFloat(withdrawAmount),
    sourceCurrency: currentCurrency,
    payoutMethod: selectedAccount?.type || 'bank',
    payoutAccountId: selectedAccount?.type === 'crypto' ? selectedAccountId : undefined,
  });
  
  setShowWithdrawModal(false);
  setShowSuccessModal(true);
  setWithdrawAmount('');
  setSelectedAccountId('');
      
      // Refresh balance and payout data
      sendBalanceRequest();
      sendPayoutRequest();
    } catch (error: any) {
      Toaster.error(error.message || 'Withdrawal request failed');
    }
  };

  const getAccountDisplayName = (account: PayoutAccount) => {
    if (account.type === 'bank') {
      return `${account.bankDetails?.bankName} (****${account.bankDetails?.accountNumber?.slice(-4)})`;
    } else {
      return `${account.cryptoDetails?.asset} - ${account.cryptoDetails?.network} (${account.cryptoDetails?.address?.slice(0, 6)}...${account.cryptoDetails?.address?.slice(-4)})`;
    }
  };

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Finance</h2>
        </>
      }
      tools={
        <>
          <Link
            href="/merchant/finance/accounts"
            className="rounded-full bg-white hover:text-blue-500 cursor-pointer text-sm px-4 py-2 text-gray-700 transition-colors border border-gray-200 truncate hover:bg-gray-50"
          >
            Manage Accounts
          </Link>
          <button
            className="rounded-full hover:bg-blue-600 bg-blue-500 cursor-pointer text-sm px-4 py-2 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowWithdrawModal(true)}
            disabled={!currentBalance.available || currentBalance.available <= 0}
          >
            Withdraw
          </button>
        </>
      }
    >
      {/* Currency Toggle */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          {getCurrencyOrder().map((currency) => (
            <button
              key={currency}
              onClick={() => setCurrentCurrency(currency as 'USD' | 'BRL')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                currentCurrency === currency
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <Image
                src={getCurrencyFlag(currency)}
                alt={`${currency} flag`}
                width={24}
                height={18}
                className="rounded shadow-sm"
              />
              <span className="font-medium">{currency}</span>
            </button>
          ))}
        </div>
        {balanceLoading && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading balances...</span>
          </div>
        )}
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <BalanceCard
          icon={walletIcon}
          label="Available Balance"
          amount={currentBalance.available || 0}
          currency={currentCurrency}
        />
        <BalanceCard
          icon={chartIcon}
          label="Pending Balance"
          amount={currentBalance.pending || 0}
          currency={currentCurrency}
        />
        <BalanceCard
          icon={bagIcon}
          label="Reserve Balance"
          amount={currentBalance.reserve || 0}
          currency={currentCurrency}
        />
      </div>

      {/* Payout History */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 flex-wrap mb-4 items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
          <div className="flex items-center space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <MenuButton className="inline-flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                  <ListFilter className="w-4 h-4 text-indigo-600" />
                  {period === 0
                    ? 'Lifetime'
                    : period === 1
                    ? 'Today'
                    : period === 2
                    ? 'Yesterday'
                    : `Last ${period} days`}
                </MenuButton>
              </div>
              <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-gray-200 focus:outline-none cursor-pointer">
                <div className="py-1">
                  {periods.map((p, i) => (
                    <MenuItem key={i}>
                      <button
                        className="hover:bg-gray-50 hover:text-gray-900 text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer transition-colors"
                        onClick={() => setPeriod(p)}
                      >
                        {p === 0 ? 'Lifetime' : p === 1 ? 'Today' : p === 2 ? 'Yesterday' : `Last ${p} days`}
                      </button>
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-700 rounded-t-lg">
              <tr className="h-12">
                <th className="p-3 text-left rounded-tl-lg">Created At</th>
                <th className="p-3 text-left">Transaction ID</th>
                <th className="p-3 text-left">Method</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {payoutLoading && (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Loading payout history...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!payoutLoading &&
  payoutData?.withdrawals?.length > 0 &&
  payoutData?.withdrawals.map((t, i) => (
    <tr
      key={i}
      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
      onClick={() => router.push(`/merchant/finance/payouts/${t._id}`)}
    >
      <td className="p-3 whitespace-nowrap">
        {new Date(t.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </td>
      <td className="p-3 whitespace-nowrap font-mono text-xs">{t._id.slice(-8)}</td>
      <td className="p-3 whitespace-nowrap capitalize">
        {t.method === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}
      </td>
      <td className="p-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[t.status]}`}>
          {t.status}
        </span>
      </td>
      <td className="p-3 font-semibold">{formatCurrency(t.amountRequested, currentCurrency)}</td>
    </tr>
  ))}
{!payoutLoading && (!payoutData?.withdrawals || payoutData?.withdrawals?.length === 0) && (
  <tr>
    <td colSpan={5} className="text-center p-8">
      <div className="flex flex-col items-center space-y-2">
        <Wallet className="w-12 h-12 text-gray-300" />
        <span className="text-gray-500">No payout history for {currentCurrency}</span>
      </div>
    </td>
  </tr>
)}
            </tbody>
          </table>
        </div>
        
{payoutData?.withdrawals?.length > ITEMS_PER_PAGE && (
  <div className="mt-6 border-t border-gray-200 pt-4">
    <Pagination
      totalLength={payoutData.pagination.totalLength}
      limit={payoutData.pagination.itemsPerPage}
      pageCount={payoutData.pagination.pageCount}
      page={payoutData.pagination.currentPage}
      pageClick={(p) => setCurrentPage(p)}
    />
  </div>
)}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg mx-auto shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Withdraw Funds</h2>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setShowWithdrawModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Available Balance Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image src={balanceIcon} alt="Balance" className="w-5 h-5" />
                    <span className="font-medium text-blue-900">Available Balance</span>
                  </div>
                  <div className="font-semibold text-blue-900 text-lg">
                    {formatCurrency(currentBalance.available || 0, currentCurrency)}
                  </div>
                </div>
              </div>

              {/* Payout Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payout account</option>
                  {getAvailableAccounts().map((account) => (
                    <option key={account.id} value={account.id}>
                      {getAccountDisplayName(account)}
                    </option>
                  ))}
                </select>
                {getAvailableAccounts().length === 0 && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>No payout accounts available. Please add an account first.</span>
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm font-medium">{currentCurrency}</span>
                  </div>
                </div>
                {withdrawLimits && (
                  <p className="mt-1 text-xs text-gray-500">
                    Min: {formatCurrency(withdrawLimits.min[currentCurrency], currentCurrency)} • 
                    Daily Max: {formatCurrency(withdrawLimits.maxDaily[currentCurrency], currentCurrency)}
                  </p>
                )}
              </div>

{/* Exchange Rate Info */}
{selectedAccountId && withdrawAmount && calculatedAmount > 0 && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div className="flex items-center space-x-2 mb-2">
      <Info className="w-4 h-4 text-blue-500" />
      <span className="text-sm font-medium text-gray-700">Exchange Information</span>
    </div>

    <div className="text-sm text-gray-600 space-y-1">
      {/* original amount */}
      <div className="flex justify-between">
        <span>Withdrawal amount:</span>
        <span className="font-medium">
          {formatCurrency(parseFloat(withdrawAmount) || 0, currentCurrency)}
        </span>
      </div>

      {/* show FX only when not 1 : 1 */}
      {Math.abs(calculatedAmount - parseFloat(withdrawAmount)) > 0.0001 ? (
        <>
          <div className="flex justify-between">
            <span>Exchange rate:</span>
            <span className="font-medium">
              1&nbsp;{currentCurrency} ={' '}
              {(calculatedAmount / parseFloat(withdrawAmount)).toFixed(4)}&nbsp;
              {destCurrency}
            </span>
          </div>

          <div className="flex justify-between border-t pt-1">
            <span>You will receive:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(calculatedAmount, destCurrency)}
            </span>
          </div>
        </>
      ) : (
        /* 1 : 1 case — still show the receive line */
        <div className="flex justify-between border-t pt-1">
          <span>You will receive:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(calculatedAmount, destCurrency)}
          </span>
        </div>
      )}
    </div>
  </div>
)}


              {/* Gas Fee Warning */}
              {gasFeeWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-800">
                      Gas fees may apply for crypto withdrawals
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || !selectedAccountId || !withdrawAmount || !!validateWithdrawal()}
                  className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md mx-auto shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Withdrawal Submitted!</h3>
              <p className="text-gray-600">
                Your withdrawal request has been submitted successfully. Our team will review and process your request within one business day.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default FinancePage;
