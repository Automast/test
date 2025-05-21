// app/product/payment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate, generateTransactionId } from '../../../productlib/utils';

const PaymentResultPage = () => {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId') || generateTransactionId();
  const status = searchParams.get('status') || 'successful'; // Default to successful if not provided
  const [currentDate] = useState<Date>(new Date());

  // Define UI elements based on status
  const getStatusContent = () => {
    switch (status) {
      case 'successful':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          title: 'Payment Successful!',
          message: 'Thank you for your purchase. Your order has been confirmed.'
        };
      case 'pending':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          title: 'Payment Pending',
          message: 'Your payment is being processed. We will notify you once it is confirmed.'
        };
      case 'canceled':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          title: 'Payment Canceled',
          message: 'Your payment was canceled. Please try again or contact customer support if you need assistance.'
        };
      default:
        // Fallback to successful UI
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          title: 'Payment Successful!',
          message: 'Thank you for your purchase. Your order has been confirmed.'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white shadow-md rounded-lg p-8 mt-8">
        <div className="flex justify-center mb-8">
          <div className={`h-16 w-16 ${statusContent.bgColor} ${statusContent.color} rounded-full flex items-center justify-center`}>
            {statusContent.icon}
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{statusContent.title}</h1>
          <p className="text-gray-600">{statusContent.message}</p>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <span className="text-gray-500 text-sm">Receipt #{transactionId.substring(0, 8)}</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDate(currentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={statusContent.color}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-600">
            {status === 'successful' 
              ? 'A confirmation with more details has been sent to your email address. If you have any questions about your order, please contact customer support.'
              : status === 'pending'
              ? 'You will receive an email once your payment is confirmed. If you have any questions, please contact customer support.'
              : 'If you encountered any issues with your payment, please contact our customer support team for assistance.'}
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link href="/" className="inline-block text-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition">
            Return to Homepage
          </Link>
          {status === 'successful' && (
            <button 
              onClick={() => window.print()}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition"
            >
              Print Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;