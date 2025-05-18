// app/verify-email/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import Toaster from '@/helpers/Toaster';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only run once
    if (!token) {
      setError('Invalid verification link');
      setVerifying(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email/${token}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          }
        );
        const data = await res.json();

        if (data.success) {
          setVerified(true);
          Toaster.success('Email verified successfully!');
        } else {
          setError(data.message || 'Verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('An error occurred during verification');
      } finally {
        setVerifying(false);
      }
    })();
  }, [token, router]);

  useEffect(() => {
    if (verified) {
      // Redirect after a short pause
      const t = setTimeout(() => router.replace('/merchant'), 3000);
      return () => clearTimeout(t);
    }
  }, [verified, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">ArkusPay</h1>

        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          {verifying && (
            <div className="flex flex-col items-center">
              <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verifying your email
              </h2>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          )}

          {!verifying && verified && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Email verified successfully!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your email has been verified. You can now access all features.
              </p>
              <p className="text-xs text-blue-600">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {!verifying && !verified && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verification failed
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {error || 'Your verification link is invalid or has expired.'}
              </p>
              <Link
                href="/merchant"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const fallbackUI = (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">ArkusPay</h1>
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-sm text-gray-500">Please wait.</p>
        </div>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallbackUI}>
      <VerifyEmailContent />
    </Suspense>
  );
}
