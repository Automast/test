// app/product/payment/page.tsx
import React, { Suspense } from 'react';
import PaymentClientContent from './PaymentClientContent';

// Loading fallback component
const PaymentLoading = () => (
  <div className="container mx-auto p-4 max-w-3xl">
    <div className="bg-white shadow-md rounded-lg p-8 mt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading payment information...</h1>
        <div className="animate-pulse flex justify-center">
          <div className="h-10 w-10 bg-blue-200 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);

// Main page component with Suspense boundary
export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentClientContent />
    </Suspense>
  );
}
