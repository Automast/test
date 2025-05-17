'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import { useApiRequest } from '@/hooks';
import { verifyEmailUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const { sendRequest: verifyEmail } = useApiRequest({
    endpoint: `${verifyEmailUrl}/${token}`,
    method: 'GET',
    auth: false,
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setVerifying(false);
      return;
    }

    let done = false;

    const verify = async () => {
      setVerifying(true);
      try {
        const response = await verifyEmail();

        if (response?.success && !done) {
          setVerified(true);
          Toaster.success('Email verified successfully!');
        } else if (!done) {
          setError(response?.message || 'Verification failed');
        }
      } catch (err: any) {
        if (!done) {
          setError('An error occurred during verification');
        }
      } finally {
        if (!done) setVerifying(false);
      }
    };

    verify();
    return () => { done = true; };
}, [token]);

  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        router.replace('/merchant');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [verified, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">ArkusPay</h1>
        </div>

        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 text-center">
          {verifying && (
            <div className="flex flex-col items-center">
              <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email</h2>
              <p className="text-sm text-gray-500">Please wait...</p>
            </div>
          )}

          {!verifying && verified && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified successfully!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your email has been verified. You can now access all features.
              </p>
              <p className="text-xs text-blue-600">Redirecting to dashboard...</p>
            </div>
          )}

          {!verifying && !verified && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 mb-6">
                {error || 'Your verification link is invalid or has expired.'}
              </p>
              <Link
                href="/merchant"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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