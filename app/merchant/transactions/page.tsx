'use client';

import { DashLayout } from '@/components/layouts';
import { 
  ArrowDownUp, Calendar, ChevronDown, CreditCard, 
  Filter, RefreshCw, Search, X, DollarSign
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Assets
import cardpayImage from '@/assets/images/cardpay.svg';
import visaImage from '@/assets/images/visa.svg';
import paypalIcon from '@/assets/images/paypal.svg';
import pixIcon from '@/assets/images/pix.svg';

// Components
import { Pagination } from '@/components/widgets';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

// Utils & Constants
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { useApiRequest } from '@/hooks';
import { transactionsUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { TransactionListItem, TransactionData, TransactionStatus, PaymentMethod } from '@/types'; // Updated import
import { txStatusStyles } from '@/consts/styles';

// Payment method icons mapping
const paymentMethodIcons: Record<string, any> = {
  'card': cardpayImage,
  'visa': visaImage,
  'cardpay': cardpayImage,
  'paypal': paypalIcon,
  'pix': pixIcon,
};

// Formatters
const currencyFormatter = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

// Date formatter
const formatDate = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TransactionPage = () => {
  const router = useRouter();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<
    'All' | TransactionStatus // Use TransactionStatus type
  >('All');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>(undefined); // Use PaymentMethod type
  const [dateFilter, setDateFilter] = useState<string | undefined>(undefined);
  const [currencyFilter, setCurrencyFilter] = useState<'USD' | 'BRL' | undefined>(undefined);
  const [amountFilter, setAmountFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionListItem | null>(null); // Use TransactionListItem

  // Sorting
  const [sortField, setSortField] = useState<string>('processedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Data states
  const [txData, setTxData] = useState<TransactionData>({ // Use TransactionData type
    pagination: {
      totalLength: 0,
      itemsPerPage: 0,
      pageCount: 0,
      currentPage: 1,
    },
    data: [] as TransactionListItem[], // Use TransactionListItem array
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the auth token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token') || '';
    }
    return '';
  };

  // Build API request params based on filters
  const buildRequestParams = () => {
    const params: Record<string, any> = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      sortBy: sortField,
      sortOrder: sortOrder,
    };

    if (statusFilter !== 'All') params.status = statusFilter;
    if (methodFilter) params.paymentMethod = methodFilter;
    if (dateFilter) params.date = dateFilter; // Backend should handle date string parsing
    if (searchTerm) params.search = searchTerm;
    
    // Handle currency and amount filters
    if (currencyFilter && amountFilter) {
      params.currency = currencyFilter; // Send currency to backend if amount filter is used
      params.amountRange = amountFilter; // Send range string like "0-100"
    }

    return params;
  };

  const {
    response: txResponse,
    error: txError,
    loading: txLoading,
    sendRequest: sendTxRequest,
  } = useApiRequest({
    endpoint: transactionsUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    method: 'GET',
    // Params will be dynamically set in useEffect
  });

  // Handle status filter change
  const handleStatusFilter = (status: 'All' | TransactionStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle date filter
  const handleDateFilter = (filter: string) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  // Handle currency selection and amount
  const handleCurrencyFilter = (currency: 'USD' | 'BRL' | undefined) => {
    setCurrencyFilter(currency);
    // Clear amount filter if currency is cleared
    if (!currency) setAmountFilter(undefined);
    setCurrentPage(1);
  };

  const handleAmountFilter = (amount: string) => {
    setAmountFilter(amount);
    setCurrentPage(1);
  };

  // Handle method filter
  const handleMethodFilter = (method: PaymentMethod | undefined) => {
    setMethodFilter(method);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    if (searchInputRef.current) {
      setSearchTerm(searchInputRef.current.value);
      setCurrentPage(1);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('All');
    setMethodFilter(undefined);
    setDateFilter(undefined);
    setCurrencyFilter(undefined);
    setAmountFilter(undefined);
    if (searchInputRef.current) searchInputRef.current.value = '';
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Fetch data on filter or pagination changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Rebuild params before sending request
      const currentParams = buildRequestParams();
      sendTxRequest(undefined, undefined, currentParams); // Pass params to sendRequest
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ 
    statusFilter, methodFilter, dateFilter, 
    currencyFilter, amountFilter, searchTerm,
    currentPage, sortField, sortOrder
  ]);

  // Process API response data
  useEffect(() => {
    if (txResponse) {
      if (txResponse.success && txResponse.data) {
        const payload = txResponse.data as any;
        
        const transactionsFromApi = payload.transactions || payload.data || [];
const normalizedTransactions: TransactionListItem[] = transactionsFromApi.map((tx: any) => {
          // --- MODIFICATION START ---
          // Determine the base amount (total excluding VAT)
          const baseAmount = tx.total !== undefined ? tx.total : (tx.originAmount || 0);
          
          // Safely get the VAT from metadata, default to 0
          const vatAmount = tx.metadata?.vat || 0;

          // Calculate the display amount by adding VAT to the base amount
          const displayAmount = baseAmount + vatAmount;
          // --- MODIFICATION END ---

          return {
            id: tx.transactionId || tx._id,
            date: new Date(tx.processedAt || tx.createdAt || Date.now()),
            status: tx.status as TransactionStatus || 'pending',
            
            // Use the new calculated displayAmount
            amount: displayAmount,
            
            // Use 'saleCurrency' if available, otherwise 'originCurrency'.
            saleCurrency: tx.saleCurrency || tx.originCurrency || 'USD',
            
            // Customer identification: prioritize billingName, then buyerEmail
            customer: tx.billingName || tx.buyerEmail || 'Anonymous',
            
            method: tx.paymentMethod as PaymentMethod || 'card',
            
            // Include specific currency amounts if they exist, for potential filtering/display logic
            amountUSD: tx.amountUSD,
            amountBRL: tx.amountBRL,
            buyerEmail: tx.buyerEmail, // Retain for full object if needed
          };
        });

        const mappedData: TransactionData = {
          data: normalizedTransactions,
          pagination: {
            totalLength: payload.total || payload.pagination?.totalLength || 0,
            itemsPerPage: payload.limit || payload.pagination?.itemsPerPage || ITEMS_PER_PAGE,
            pageCount: payload.pages || payload.pagination?.pageCount || 1,
            currentPage: payload.page || payload.pagination?.currentPage || 1,
          },
        };

        setTxData(mappedData);
      } else {
        Toaster.error(txResponse.message || 'Failed to load transactions');
        setTxData({
          pagination: { totalLength: 0, itemsPerPage: ITEMS_PER_PAGE, pageCount: 0, currentPage: 1 },
          data: [],
        });
      }
      setIsLoading(false);
    }
  }, [txResponse]);

  // Handle API errors
  useEffect(() => {
    if (txError) {
      Toaster.error(txError?.message || 'Failed to load transactions');
      setTxData({
        pagination: { totalLength: 0, itemsPerPage: ITEMS_PER_PAGE, pageCount: 0, currentPage: 1 },
        data: [],
      });
      setIsLoading(false);
    }
  }, [txError]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/signin');
        return;
      }
      // Initial request uses params from buildRequestParams
      const initialParams = buildRequestParams();
      sendTxRequest(undefined, undefined, initialParams);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for initial load

  // Display payment method with icon
  const renderPaymentMethod = (method?: PaymentMethod) => { // method can be undefined
    const methodKey = method?.toLowerCase() || 'card'; // Default to 'card' if undefined
    const icon = paymentMethodIcons[methodKey] || paymentMethodIcons['card']; // Fallback to card icon
  
    return (
      <div className="flex items-center justify-center h-full w-full">
        {icon && <Image src={icon} alt={method || 'Card'} className="w-5 h-5" />}
      </div>
    );
  };
  
  // Render the amount based on filter settings
  const renderAmount = (transaction: TransactionListItem) => {
    if (currencyFilter === 'USD' && transaction.amountUSD !== undefined) {
      return currencyFormatter(transaction.amountUSD, 'USD');
    } else if (currencyFilter === 'BRL' && transaction.amountBRL !== undefined) {
      return currencyFormatter(transaction.amountBRL, 'BRL');
    } else {
      // Default to transaction's primary display amount and currency
      return currencyFormatter(transaction.amount, transaction.saleCurrency || 'USD');
    }
  };

  // Filter options
  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' }
  ];

  const amountOptions = [
    { value: '0-100', label: '0 - 100' },
    { value: '100-500', label: '100 - 500' },
    { value: '500-1000', label: '500 - 1000' },
    { value: '1000+', label: 'Over 1000' }
  ];

  const methodOptions: {value: PaymentMethod, label: string}[] = [
    { value: 'card', label: 'Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'pix', label: 'PIX' }
  ];

  const statusOptions: {value: 'All' | TransactionStatus, label: string}[] = [
    { value: 'All', label: 'All Status' },
    { value: 'successful', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'chargeback', label: 'Chargeback' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'partial_refund', label: 'Partial Refund' },
    { value: 'disputed', label: 'Disputed' },
  ];

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Function to check if any filters are applied
  const hasActiveFilters = () => {
    return statusFilter !== 'All' || 
           methodFilter !== undefined || 
           dateFilter !== undefined || 
           currencyFilter !== undefined || 
           amountFilter !== undefined ||
           searchTerm !== '';
  };

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-gray-500">
            {txData.pagination.totalLength} transaction{txData.pagination.totalLength !== 1 ? 's' : ''}
          </p>
        </>
      }
    >
      <div className="bg-white rounded-lg shadow-sm">
        {/* Filter and search toolbar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Search */}
            <div className="relative flex-grow">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by ID, customer name/email..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                defaultValue={searchTerm}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search size={18} />
              </button>
            </div>
            
            {/* Filter buttons and controls */}
            <div className="flex gap-2">
              <button
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
                  showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-300 text-gray-700'
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-1" />
                {showFilters ? 'Hide Filters' : 'Filters'}
                {hasActiveFilters() && !showFilters && (
                  <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
                    {[statusFilter !== 'All', methodFilter !== undefined, dateFilter !== undefined, 
                       currencyFilter !== undefined, amountFilter !== undefined, searchTerm !== '']
                      .filter(Boolean).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                    const currentParams = buildRequestParams();
                    sendTxRequest(undefined, undefined, currentParams);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700"
                title="Refresh"
                disabled={txLoading || isLoading}
              >
                <RefreshCw size={16} className={`${(txLoading || isLoading) ? 'animate-spin' : ''}`} />
              </button>
              
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700"
                  title="Clear filters"
                >
                  <X size={16} className="mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Status filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Payment method filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                <select
                  value={methodFilter || ''}
                  onChange={(e) => handleMethodFilter(e.target.value as PaymentMethod || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">All Methods</option>
                  {methodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Time Period</label>
                <select
                  value={dateFilter || ''}
                  onChange={(e) => handleDateFilter(e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">All Time</option>
                  {dateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Currency filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Currency In
                </label>
                <select
                  value={currencyFilter || ''}
                  onChange={(e) => handleCurrencyFilter(e.target.value as any || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Original Currency</option>
                  <option value="USD">USD </option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              
              {/* Amount filter - disabled unless currency is selected */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Amount Range
                </label>
                <select
                  value={amountFilter || ''}
                  onChange={(e) => handleAmountFilter(e.target.value || undefined)}
                  disabled={!currencyFilter}
                  className={`w-full p-2 border border-gray-300 rounded-md bg-white ${
                    !currencyFilter ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">All Amounts</option>
                  {amountOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} {currencyFilter}
                    </option>
                  ))}
                </select>
                {!currencyFilter && (
                  <p className="text-xs text-gray-500 mt-1">Select a currency first</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Active filters display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
            {statusFilter !== 'All' && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Status: {statusOptions.find(o => o.value === statusFilter)?.label || statusFilter}
                <button 
                  onClick={() => setStatusFilter('All')} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {methodFilter && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Method: {methodOptions.find(o => o.value === methodFilter)?.label || methodFilter}
                <button 
                  onClick={() => setMethodFilter(undefined)} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {dateFilter && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Date: {dateOptions.find(o => o.value === dateFilter)?.label || dateFilter}
                <button 
                  onClick={() => setDateFilter(undefined)} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {currencyFilter && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Currency: {currencyFilter}
                <button 
                  onClick={() => {
                    setCurrencyFilter(undefined);
                    setAmountFilter(undefined);
                  }} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {amountFilter && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Amount: {amountOptions.find(o => o.value === amountFilter)?.label || amountFilter}
                <button 
                  onClick={() => setAmountFilter(undefined)} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {searchTerm && (
              <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                Search: {searchTerm.length > 15 ? `${searchTerm.substring(0, 15)}...` : searchTerm}
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    if (searchInputRef.current) searchInputRef.current.value = '';
                  }} 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transactions table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center font-medium" 
                    onClick={() => handleSort('processedAt')}
                  >
                    Date/Time
                    {renderSortIndicator('processedAt')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center font-medium" 
                    onClick={() => handleSort('transactionId')} // Sort by transactionId
                  >
                    Transaction ID
                    {renderSortIndicator('transactionId')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center font-medium" 
                    onClick={() => handleSort('paymentMethod')}
                  >
                    Method
                    {renderSortIndicator('paymentMethod')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center font-medium" 
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {renderSortIndicator('status')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center font-medium" 
                    onClick={() => handleSort(currencyFilter === 'USD' ? 'amountUSD' : currencyFilter === 'BRL' ? 'amountBRL' : 'total')} // Sort by total or specific currency amount
                  >
                    Amount
                    {renderSortIndicator(currencyFilter === 'USD' ? 'amountUSD' : currencyFilter === 'BRL' ? 'amountBRL' : 'total')}
                  </button>
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isLoading || txLoading) ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
                      <p className="text-gray-500">Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : txData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-gray-500 mb-2">No transactions found</p>
                    {hasActiveFilters() && (
                      <button 
                        onClick={clearFilters}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                txData.data.map((transaction, index) => (
                  <tr 
                    key={transaction.id || index} // Use transaction.id which should be unique backend _id or transactionId
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/merchant/transactions/${transaction.id}`)} // Use the correct ID for navigation
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                      {transaction.id} {/* This should be the TX_... or _id */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {transaction.customer}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {renderPaymentMethod(transaction.method)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        txStatusStyles[transaction.status.toLowerCase()] || txStatusStyles['pending'] // Use lowercase for matching and fallback
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {renderAmount(transaction)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <Menu as="div" className="relative inline-block text-left">
                        <div onClick={(e) => e.stopPropagation()}>
                          <MenuButton className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <span className="sr-only">Open options</span>
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </MenuButton>
                        </div>

                        <MenuItems className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                          <div className="py-1">
                            <MenuItem>
                              {({ active }) => (
                                <a
                                  href={`/merchant/transactions/${transaction.id}`}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex px-4 py-2 text-sm`}
                                >
                                  View Details
                                </a>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } flex w-full text-left px-4 py-2 text-sm`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTx(transaction);
                                    setShowRefundModal(true);
                                  }}
                                >
                                  Refund Transaction
                                </button>
                              )}
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {txData.data.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination
              totalLength={txData.pagination.totalLength}
              limit={txData.pagination.itemsPerPage}
              pageCount={txData.pagination.pageCount}
              page={txData.pagination.currentPage}
              pageClick={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* ------------ Refund confirmation modal ------------- */}
      {showRefundModal && selectedTx && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]" 
          onClick={() => setShowRefundModal(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-sm p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              Refund this transaction?
            </h3>
            <p className="text-sm text-gray-700 mb-6">
              Status will change to <b>refunded</b> and the amount will be debited from your balances.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200" 
                onClick={() => setShowRefundModal(false)}
              >
                No, cancel
              </button>
              <button 
                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('jwt_token');
                    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const res = await fetch(
                      `${base}/finance/transactions/${selectedTx!.id}/refund`, // Use selectedTx.id which is the backend _id
                      {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      },
                    );
                    const data = await res.json();
                    if (data.success) {
                      Toaster.success('Refund processed');
                      setShowRefundModal(false);
                      const currentParams = buildRequestParams(); // Re-fetch with current filters
                      sendTxRequest(undefined, undefined, currentParams);
                    } else {
                      Toaster.error(data.message || 'Refund failed');
                    }
                  } catch (err) {
                    Toaster.error('Refund failed');
                  }
                }}
              >
                Yes, refund
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default TransactionPage;