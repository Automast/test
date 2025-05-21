// app/product/success/page.tsx
import React, { Suspense } from 'react';
import SuccessClientContent from './SuccessClientContent';

// Loading fallback component
const RedirectLoading = () => (
  <div className="container mx-auto p-4 flex items-center justify-center h-64">
    <div className="text-center">
      <p className="text-gray-600">Processing your payment...</p>
    </div>
  </div>
);

// Main page component with Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense fallback={<RedirectLoading />}>
      <SuccessClientContent />
    </Suspense>
  );
}
