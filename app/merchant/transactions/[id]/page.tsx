'use client';

import { DashLayout } from '@/components/layouts';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { txStatusStyles } from '@/consts/styles';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Globe,
  Info,
  Mail,
  MapPin,
  MonitorSmartphone,
  Network,
  Phone,
  RefreshCw,
  User,
  UserIcon,
  FileText,
} from 'lucide-react';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { transactionDetailUrl } from '@/consts/paths';
// No need for mock data with real backend integration
import { TransactionDetail } from '@/types';
import backIcon from '@/assets/images/icons/back.svg';
import mastercardImage from '@/assets/images/mastercard.svg';
import visaImage from '@/assets/images/visa.svg';
import paypalIcon from '@/assets/images/paypal.svg';
import pixIcon from '@/assets/images/pix.svg';
import { SpinnerCircular } from 'spinners-react';

// Payment method icons mapping
const paymentMethodIcons: Record<string, any> = {
  'card': mastercardImage,
  'visa': visaImage,
  'mastercard': mastercardImage,
  'paypal': paypalIcon,
  'pix': pixIcon,
};

const TransactionDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [txDetail, setTxDetail] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'logs'>('details');
  const [showRawData, setShowRawData] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Get the auth token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token') || '';
    }
    return '';
  };
  
  const {
    response: txResponse,
    error: txError,
    loading: txLoading,
    sendRequest: sendTxRequest,
  } = useApiRequest({
    endpoint: `${transactionDetailUrl}/${id}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    method: 'GET',
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }
    }
    
    if (id) {
      setIsLoading(true);
      sendTxRequest();
    }
  }, [id]);
  
  useEffect(() => {
    if (txResponse) {
      if (txResponse.success && txResponse.data) {
        setTxDetail(txResponse.data);
      } else {
        Toaster.error(txResponse.message || 'Failed to load transaction details');
        setTxDetail(null);
      }
      setIsLoading(false);
    }
  }, [txResponse]);
  
  useEffect(() => {
    if (txError) {
      Toaster.error(txError?.message || 'Failed to load transaction details');
      setTxDetail(null);
      setIsLoading(false);
    }
  }, [txError]);
  
  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string, message: string = 'Copied to clipboard') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Toaster.success(message);
    } else {
      Toaster.error('Clipboard access denied');
    }
  };
  
  // Format date helper
  const formatDate = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Currency formatter
  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Render transaction items
  const renderItems = () => {
    if (!txDetail?.metadata?.items || txDetail.metadata.items.length === 0) {
      return <div className="text-gray-500 py-4 text-center">No items found in this transaction</div>;
    }

    return (
      <div className="space-y-4">
        {txDetail.metadata.items.map((item: any, index: number) => {
          // Calculate local price if available
          const localPrice = txDetail.metadata?.localPrice || item.unitPrice;
          const localCurrency = txDetail.metadata?.localCurrency || item.productCurrency;
          
          return (
            <div key={index} className="border border-gray-200 rounded-md p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="font-medium text-lg">{item.productName}</div>
                <div className="text-sm text-gray-500">Product ID: {item.productId}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-500 text-sm">Type</div>
                  <div className="font-medium capitalize">{item.productType}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Quantity</div>
                  <div className="font-medium">{item.quantity}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Total</div>
                  <div className="font-medium">{formatCurrency(item.subtotal, item.productCurrency)}</div>
                </div>
              </div>

              {/* Price comparison if local currency is different */}
              {localCurrency !== item.productCurrency && (
                <div className="mt-3 bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium mb-2">Price Conversion</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 text-xs">Original Price: </span>
                      <span className="font-medium">{formatCurrency(item.unitPrice, item.productCurrency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Customer Paid: </span>
                      <span className="font-medium">{formatCurrency(localPrice, localCurrency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Variant information if available */}
              {item.variants && item.variants.length > 0 && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <div className="text-sm font-medium mb-2">Product Variants</div>
                  <div className="grid grid-cols-2 gap-2">
                    {item.variants.map((variant: any, vIdx: number) => (
                      <div key={vIdx} className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 text-xs">{variant.name}: </span>
                        <span className="font-medium">{variant.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading || txLoading) {
    return (
      <DashLayout titleArea={<h2 className="text-xl font-semibold">Transaction Details</h2>}>
        <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
          <SpinnerCircular color="#006aff" secondaryColor="#66AAFF" />
          <div className="text-gray-600">Loading transaction details...</div>
        </div>
      </DashLayout>
    );
  }

  // If no transaction data is available
  if (!txDetail) {
    return (
      <DashLayout titleArea={<h2 className="text-xl font-semibold">Transaction Details</h2>}>
        <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
          <div className="text-gray-600">Transaction not found</div>
          <Link href="/merchant/transactions" className="text-blue-500 hover:underline">
            Return to Transactions
          </Link>
        </div>
      </DashLayout>
    );
  }

  // Process the transaction data
  const {
    _id,
    type,
    status,
    paymentMethod,
    originAmount,
    originCurrency,
    amountUSD,
    amountBRL,
    fxRateUsedToUSD,
    fxRateUsedToBRL,
    processedAt,
    createdAt,
    updatedAt,
    metadata,
  } = txDetail;

  // Get correct display values from the transaction
  const buyerEmail = metadata?.buyerEmail || 'N/A';
  const buyerPhone = metadata?.buyerPhone || 'N/A';
  const billingDetails = metadata?.billingDetails || {};
  const ipAddress = metadata?.ipAddress || 'N/A';
  const deviceInfo = metadata?.deviceInfo || 'N/A';
  const browserInfo = metadata?.browserInfo || 'N/A';
  
  // Currency and amounts
  const localCurrency = metadata?.localCurrency || originCurrency;
  const localPrice = metadata?.localPrice || null;
  const localSubtotal = metadata?.localSubtotal || originAmount;
  const localShipping = metadata?.localShipping || 0;
  const localTotal = metadata?.localTotal || originAmount;
  
  // Original values
  const originalCurrency = metadata?.originalCurrency || originCurrency;
  const originalPrice = metadata?.originalPrice || null;
  const originalSubtotal = metadata?.originalSubtotal || null;
  const originalTotal = metadata?.originalTotal || null;

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">
            Transaction Details
          </h2>
          <p className="text-sm text-gray-500">
            ID: {_id}
          </p>
        </>
      }
    >
      <div className="p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <Link href="/merchant/transactions" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
            <Image src={backIcon} alt="Back" className="w-4 h-4" />
            Back to Transactions
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
              onClick={() => sendTxRequest()}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              className="hover:bg-blue-600 bg-blue-500 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Action {menuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {menuOpen && (
              <div className="absolute right-12 mt-32 w-32 bg-white border border-gray-300 rounded-md z-50 py-1 shadow-lg">
                <ul className="text-sm text-gray-700">
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Archive</li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => setShowRefundModal(true)}>Refund</li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Checkout URL</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Status and main info bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{billingDetails?.name || buyerEmail}</h2>
              <p className="text-sm text-gray-500">{buyerEmail}</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                txStatusStyles[status] || 'bg-gray-100 text-gray-600'
              } rounded-full`}
            >
              {status}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-lg font-bold">{formatCurrency(originAmount, originCurrency)}</div>
            <div className="text-sm text-gray-500">
              {formatDate(processedAt || createdAt)}
            </div>
          </div>
        </div>

        {/* Transaction tabs */}
        <div className="border-b border-gray-200 mt-4">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'details' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Transaction Details
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'items' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('items')}
            >
              Items ({metadata?.items?.length || 0})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'logs' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              Transaction Log
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="py-4">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Transaction Information */}
              <div className="md:col-span-2 space-y-6">
                {/* Transaction Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Transaction Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
                      <div className="flex items-center">
                        <span className="font-medium text-sm font-mono truncate">{_id}</span>
                        <button 
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          onClick={() => copyToClipboard(_id)}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Type</div>
                      <div className="font-medium capitalize">{type}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            txStatusStyles[status] || 'bg-gray-100 text-gray-600'
                          } rounded-full`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                      <div className="font-medium">{formatDate(processedAt || createdAt)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                      <div className="font-medium capitalize flex items-center">
                        {paymentMethodIcons[paymentMethod] && (
                          <Image 
                            src={paymentMethodIcons[paymentMethod]} 
                            alt={paymentMethod}
                            className="mr-2 h-5 w-5" 
                          />
                        )}
                        {paymentMethod}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                    Financial Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Customer Payment</div>
                      <div className="font-medium text-lg">{formatCurrency(localTotal, localCurrency)}</div>
                      <div className="text-xs text-gray-500">Currency: {localCurrency}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Original Product Price</div>
                      <div className="font-medium">
                        {originalPrice ? formatCurrency(originalPrice, originalCurrency) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Currency: {originalCurrency}</div>
                    </div>
                    
                    {/* Credited Amount section */}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Credited Amount</div>
                      <div className="font-medium">
                        {paymentMethod === 'pix' 
                          ? formatCurrency(amountBRL, 'BRL')
                          : formatCurrency(amountUSD, 'USD')
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {paymentMethod === 'pix' ? 'Credited in BRL' : 'Credited in USD'}
                      </div>
                    </div>
                    
                    {/* Exchange Rate */}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Exchange Rate</div>
                      <div className="font-medium">
                        {paymentMethod === 'pix' && fxRateUsedToBRL 
                          ? `1 ${originCurrency} = ${fxRateUsedToBRL.toFixed(4)} BRL`
                          : fxRateUsedToUSD 
                          ? `1 ${originCurrency} = ${fxRateUsedToUSD.toFixed(4)} USD`
                          : 'No conversion'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed price breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium mb-2">Price Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatCurrency(localSubtotal, localCurrency)}</span>
                      </div>
                      {localShipping > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping</span>
                          <span>{formatCurrency(localShipping, localCurrency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(localTotal, localCurrency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Customer & Technical Info */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Customer Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <Mail className="w-4 h-4 mr-1" /> Email
                      </div>
                      <div className="font-medium">{buyerEmail}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <Phone className="w-4 h-4 mr-1" /> Phone
                      </div>
                      <div className="font-medium">{buyerPhone}</div>
                    </div>
                  </div>
                </div>
                
                {/* Billing Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    Billing Address
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-1" /> Name
                      </div>
                      <div className="font-medium">{billingDetails?.name || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> Address
                      </div>
                      <div className="font-medium">{billingDetails?.address || 'N/A'}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">City</div>
                        <div className="font-medium">{billingDetails?.city || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">State</div>
                        <div className="font-medium">{billingDetails?.state || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Postal Code</div>
                        <div className="font-medium">{billingDetails?.postalCode || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Country</div>
                        <div className="font-medium">{billingDetails?.country || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MonitorSmartphone className="w-5 h-5 mr-2 text-blue-500" />
                    Technical Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <Network className="w-4 h-4 mr-1" /> IP Address
                      </div>
                      <div className="font-medium">{ipAddress}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <MonitorSmartphone className="w-4 h-4 mr-1" /> Device
                      </div>
                      <div className="font-medium">{deviceInfo}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1 flex items-center">
                        <Globe className="w-4 h-4 mr-1" /> Browser
                      </div>
                      <div className="font-medium">{browserInfo}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'items' && renderItems()}
          
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Log</h3>
                <button 
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                  onClick={() => setShowRawData(!showRawData)}
                >
                  {showRawData ? 'Hide' : 'Show'} Raw Transaction Data
                  {showRawData ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {/* Timeline of events */}
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  </div>
                  <div>
                    <p className="font-medium">Transaction Created</p>
                    <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  </div>
                  <div>
                    <p className="font-medium">Transaction Processed</p>
                    <p className="text-sm text-gray-500">{formatDate(processedAt || createdAt)}</p>
                  </div>
                </div>
                
                {updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime() && (
                  <div className="flex">
                    <div className="mr-3 flex flex-col items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-0.5 h-full bg-gray-200"></div>
                    </div>
                    <div>
                      <p className="font-medium">Transaction Updated</p>
                      <p className="text-sm text-gray-500">{formatDate(updatedAt)}</p>
                      <p className="text-sm text-gray-500">Status: {status}</p>
                    </div>
                  </div>
                )}

                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">Current Status</p>
                    <p className="text-sm text-gray-500">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          txStatusStyles[status] || 'bg-gray-100 text-gray-600'
                        } rounded-full`}
                      >
                        {status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Raw JSON data */}
              {showRawData && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Raw Transaction Data</h4>
                    <button 
                      className="text-blue-500 hover:text-blue-700 text-xs"
                      onClick={() => copyToClipboard(JSON.stringify(txDetail, null, 2), 'Raw data copied to clipboard')}
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="text-xs overflow-auto max-h-96 p-2 bg-gray-100 rounded">
                    {JSON.stringify(txDetail, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------ Refund confirmation modal ------------- */}
      {showRefundModal && (
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
                      `${base}/finance/transactions/${id}/refund`,
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
                      sendTxRequest(); // refresh details
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

export default TransactionDetailPage;