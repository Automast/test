'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { verifyEmailUrl, sendVerificationEmailUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';

// This component contains the original logic and uses useSearchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [showResendOption, setShowResendOption] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      // Get the API URL from environment
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        setError('You need to be logged in to request a new verification email');
        setResending(false);
        return;
      }
      
      const response = await axios.post(
        `${apiBaseUrl}${sendVerificationEmailUrl}`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Resend response:', response.data);
      
      if (response.data?.success) {
        setResendSuccess(true);
        Toaster.success('Verification email sent successfully!');
      } else {
        setError('Failed to send verification email');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

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
        // Get the API URL from environment
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Build the complete URL directly
        const fullUrl = `${apiBaseUrl}${verifyEmailUrl}/${token}`;
        
        console.log('Verifying with token:', token);
        console.log('Using full URL:', fullUrl);
        
        // Make a direct axios call instead of using the hook
        const response = await axios.get(fullUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Full Axios Response:', response);
        
        if (response.data?.success && !done) {
          setVerified(true);
          Toaster.success('Email verified successfully!');
        } else if (!done) {
          setError(response.data?.message || 'Verification failed');
          setShowResendOption(true);
        }
      } catch (err) {
        console.error('Verification error:', err);
        // Extract error message from Axios error
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred during verification';
        console.log('Error details:', errorMessage);
        
        if (!done) {
          if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            setError('Your verification link has expired or is invalid');
            setShowResendOption(true);
          } else {
            setError(errorMessage);
          }
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
              
              {showResendOption && !resendSuccess && (
                <div className="mt-2 mb-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {resending ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Sending...
                      </>
                    ) : (
                      'Send new verification email'
                    )}
                  </button>
                </div>
              )}
              
              {resendSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-2 mb-4 rounded-md text-left">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        A new verification email has been sent. Please check your inbox.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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

// The main page component now wraps VerifyEmailContent in Suspense
export default function VerifyEmailPage() {
  // You can provide a more sophisticated skeleton loader as a fallback
  const fallbackUI = (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">ArkusPay</h1>
        </div>
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4 mx-auto" />
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