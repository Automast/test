// app/product/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    // Redirect to the new payment page with the status parameter set to 'successful'
    router.replace(`/product/payment?transactionId=${transactionId || ''}&status=successful`);
  }, [router, transactionId]);

  // Return a minimal loading state while redirecting
  return (
    <div className="container mx-auto p-4 flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to payment summary...</p>
      </div>
    </div>
  );
};

export default SuccessPage;