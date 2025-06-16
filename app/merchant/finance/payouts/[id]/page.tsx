// app/merchant/finance/payouts/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { DashLayout } from '@/components/layouts';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  Info,
  FileText,
  Shield,
  TrendingUp
} from 'lucide-react';

import backIcon from '@/assets/images/icons/back.svg';
import bankIcon from '@/assets/images/icons/bank.svg';
import cryptoIcon from '@/assets/images/icons/crypto.svg';

interface PayoutDetail {
  _id: string;
  merchantId: string;
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
    _id: string;
    asset: 'USDT' | 'USDC';
    network: string;
    address: string;
    isActive: boolean;
  };
  verificationId?: any;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
    routingNumber?: string;
    bankBranch?: string;
  };
}

const PayoutDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [detail, setDetail] = useState<PayoutDetail | undefined>();

  const {
    response: payoutResponse,
    error: payoutError,
    loading: payoutLoading,
    sendRequest: sendPayoutRequest,
  } = useApiRequest({
    endpoint: `/finance/withdrawals/${id}`,
    method: 'GET',
    auth: true,
  });

  useEffect(() => {
    if (id) {
      sendPayoutRequest();
    }
  }, [id]);

  useEffect(() => {
    if (payoutResponse && payoutResponse.success) {
      setDetail(payoutResponse.data);
    }
  }, [payoutResponse]);

  useEffect(() => {
    if (payoutError) {
      Toaster.error(payoutError?.message || 'Failed to load payout details');
    }
  }, [payoutError]);

  const formatCurrency = (amount: number, currency: string) => {
    const iso = currency === 'USDT' ? 'USD' : currency;
    return new Intl.NumberFormat(iso === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: iso,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Toaster.success('Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'Pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'Failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'Pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'Failed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTimelineStatus = (step: string) => {
    if (!detail) return 'pending';
    
    switch (step) {
      case 'created':
        return detail.createdAt ? 'completed' : 'pending';
      case 'processed':
        return detail.processedAt ? 'completed' : detail.status === 'Failed' ? 'failed' : 'pending';
      case 'deposited':
        return detail.depositedAt ? 'completed' : detail.status === 'Failed' ? 'failed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'bank' ? bankIcon : cryptoIcon;
  };

  const TimelineStep = ({ 
    title, 
    description, 
    date, 
    status, 
    isLast = false 
  }: { 
    title: string; 
    description: string; 
    date?: string; 
    status: 'completed' | 'pending' | 'failed';
    isLast?: boolean;
  }) => (
    <div className="flex items-start relative">
      <div className="flex flex-col items-center mr-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
          status === 'completed' 
            ? 'bg-green-100 border-green-500 text-green-500'
            : status === 'failed'
            ? 'bg-red-100 border-red-500 text-red-500'
            : 'bg-gray-100 border-gray-300 text-gray-400'
        }`}>
          {status === 'completed' ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === 'failed' ? (
            <XCircle className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-16 mt-2 ${
            status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
          }`} />
        )}
      </div>
      <div className="flex-1 pb-8">
        <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        {date && (
          <p className="text-xs text-gray-500">{formatDate(date)}</p>
        )}
      </div>
    </div>
  );

  if (payoutLoading) {
    return (
      <DashLayout titleArea={<h2 className="text-xl font-semibold">Payout Details</h2>}>
        <div className="flex items-center justify-center bg-white rounded-lg p-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600">Loading payout details...</p>
          </div>
        </div>
      </DashLayout>
    );
  }

  if (!detail) {
    return (
      <DashLayout titleArea={<h2 className="text-xl font-semibold">Payout Details</h2>}>
        <div className="flex items-center justify-center bg-white rounded-lg p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600">Payout not found</p>
            <Link 
              href="/merchant/finance" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Finance
            </Link>
          </div>
        </div>
      </DashLayout>
    );
  }

  return (
    <DashLayout titleArea={<h2 className="text-xl font-semibold">Payout Details</h2>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <Link 
                href="/merchant/finance" 
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Finance
              </Link>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(detail.status)}`}>
                {detail.status}
              </span>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getStatusIcon(detail.status)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(detail.amountPayable, detail.destinationCurrency)}
                </h1>
                <p className="text-gray-600">
                  Withdrawal requested on {formatDate(detail.createdAt)}
                </p>
                {detail.sourceCurrency !== detail.destinationCurrency && (
                  <p className="text-sm text-gray-500 mt-1">
                    Original amount: {formatCurrency(detail.amountRequested, detail.sourceCurrency)}
                    {' • '}Rate: {detail.fxRateUsed}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Requested Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(detail.amountRequested, detail.sourceCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Final Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(detail.amountPayable, detail.destinationCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Image
                    src={getMethodIcon(detail.method)}
                    alt={detail.method}
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Method</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {detail.method === 'bank' ? 'Bank Transfer' : 'Crypto Wallet'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Transaction Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-sm">{detail._id.slice(-12)}</span>
                    <button
                      onClick={() => copyToClipboard(detail._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Source Currency</label>
                  <p className="text-sm font-semibold mt-1">{detail.sourceCurrency}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Amount</label>
                  <p className="text-sm font-semibold mt-1">
                    {formatCurrency(detail.amountRequested, detail.sourceCurrency)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDate(detail.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Destination Currency</label>
                  <p className="text-sm font-semibold mt-1">{detail.destinationCurrency}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Final Amount</label>
                  <p className="text-sm font-semibold mt-1 text-green-600">
                    {formatCurrency(detail.amountPayable, detail.destinationCurrency)}
                  </p>
                </div>

                {detail.sourceCurrency !== detail.destinationCurrency && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Exchange Rate</label>
                    <p className="text-sm mt-1">
                      1 {detail.sourceCurrency} = {detail.fxRateUsed} {detail.destinationCurrency}
                    </p>
                  </div>
                )}

                {detail.processedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Processed</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{formatDate(detail.processedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payout Destination */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Payout Destination
            </h2>
            
            {detail.method === 'bank' && detail.bankDetails && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Image src={bankIcon} alt="Bank" className="w-6 h-6" />
                  <div>
                    <p className="font-medium">{detail.bankDetails.bankName}</p>
                    <p className="text-sm text-gray-600">Bank Transfer</p>
                  </div>
                </div>
                <div className="pl-9 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Account Holder: </span>
                      <span className="text-sm font-medium">{detail.bankDetails.accountName || 'Business Account'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Account Number: </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">
                          ****{detail.bankDetails.accountNumber.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(detail.bankDetails!.accountNumber)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {detail.bankDetails.routingNumber && (
                      <div>
                        <span className="text-sm text-gray-500">Routing Number: </span>
                        <span className="font-mono text-sm">{detail.bankDetails.routingNumber}</span>
                      </div>
                    )}
                    {detail.bankDetails.bankBranch && (
                      <div>
                        <span className="text-sm text-gray-500">Branch: </span>
                        <span className="text-sm">{detail.bankDetails.bankBranch}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detail.method === 'crypto' && detail.payoutAccountId && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Image src={cryptoIcon} alt="Crypto" className="w-6 h-6" />
                  <div>
                    <p className="font-medium">
                      {detail.payoutAccountId.asset} - {detail.payoutAccountId.network}
                    </p>
                    <p className="text-sm text-gray-600">Crypto Wallet</p>
                  </div>
                </div>
                <div className="pl-9 space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Address: </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm break-all">
                        {detail.payoutAccountId.address}
                      </span>
                      <button
                        onClick={() => copyToClipboard(detail.payoutAccountId!.address)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">Network gas fees may apply for this crypto transfer</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Failed Transaction Details */}
          {detail.status === 'Failed' && detail.failureReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Transaction Failed</h3>
                  <p className="text-sm text-red-800">{detail.failureReason}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Your funds have been returned to your available balance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Processing Timeline</h2>
            
            <div className="space-y-0">
              <TimelineStep
                title="Withdrawal Requested"
                description="Your withdrawal request was submitted and funds were moved to pending."
                date={detail.createdAt}
                status={getTimelineStatus('created')}
              />
              
              <TimelineStep
                title="Review & Processing"
                description={
                  detail.status === 'Failed' 
                    ? 'The withdrawal request could not be processed.'
                    : detail.processedAt
                    ? 'Your withdrawal has been approved and is being processed.'
                    : 'Your withdrawal is being reviewed by our team.'
                }
                date={detail.processedAt}
                status={getTimelineStatus('processed')}
              />
              
              <TimelineStep
                title="Completed"
                description={
                  detail.status === 'Failed'
                    ? 'Funds have been returned to your available balance.'
                    : detail.depositedAt
                    ? 'Funds have been successfully transferred to your account.'
                    : detail.status === 'Approved'
                    ? 'Funds are being transferred to your account. This may take 1-3 business days.'
                    : 'Waiting for approval.'
                }
                date={detail.depositedAt}
                status={getTimelineStatus('deposited')}
                isLast={true}
              />
            </div>

            {detail.status === 'Approved' && !detail.depositedAt && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Transfer in Progress</p>
                    <p>
                      Your {detail.method === 'bank' ? 'bank transfer' : 'crypto transaction'} is being processed. 
                      {detail.method === 'bank' 
                        ? ' It may take 1-3 business days to reflect in your bank account.'
                        : ' It may take a few minutes to a few hours depending on network congestion.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Support Information */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Need Help?</p>
                  <p>
                    If you have questions about this withdrawal, please contact our support team with transaction ID: 
                    <span className="font-mono ml-1">{detail._id.slice(-8)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashLayout>
  );
};

export default PayoutDetailPage;