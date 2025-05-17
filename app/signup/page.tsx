'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupSchema, type SignupFormData } from '@/lib/schemas/onboarding-schemas';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { signupUrl } from '@/consts/paths';
import { sendVerificationEmailUrl } from '@/consts/paths';import { useApiRequest } from '@/hooks/useApiRequest';
import logoImg from '@/assets/images/logo.svg';
import { Loader2, Eye, EyeOff, Shield, Zap, Globe, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { setStage, clearData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize the resend hook
  const { sendRequest: resendVerificationEmail } = useApiRequest({
    endpoint: sendVerificationEmailUrl,
    method: 'POST',
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // Validate token by checking user status
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          // User is authenticated, check onboarding status
          if (result.data.user.onboardingComplete) {
            router.replace('/merchant');
          } else {
            // User exists but onboarding not complete, go to onboarding
            router.replace('/onboarding/business');
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_data');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
      })
      .catch(() => {
        // If error, remove invalid token and let them stay on signup
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      });
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      // Clear any existing onboarding data before starting fresh
      clearData();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${signupUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the token in both localStorage and as a cookie for middleware
        localStorage.setItem('jwt_token', result.data.token);
        localStorage.setItem('user_data', JSON.stringify(result.data.user));

        // Set cookie for middleware
        document.cookie = `token=${result.data.token}; path=/; max-age=86400; secure; samesite=lax`;

        // Set onboarding stage to business (first step after signup)
        setStage('business');
        await resendVerificationEmail();
        // Redirect to onboarding
        router.push('/onboarding/business');
      } else {
        // Handle specific errors
        if (result.message?.includes('email')) {
          setError('email', { message: result.message });
        } else {
          setError('root', { message: result.message || 'Something went wrong' });
        }
      }
    } catch (error) {
      setError('root', { message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Left Content Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-blue-50 p-12 flex-col justify-center">
          <div className="max-w-md">
            <div className="mb-8">
              <Image src={logoImg} alt="ArkusPay" className="h-10 w-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Accept payments with confidence
              </h1>
              <p className="text-lg text-gray-600">
                Join thousands of merchants who trust ArkusPay for secure, fast, and reliable payment processing.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Advanced Security</h3>
                  <p className="text-gray-600 text-sm">
                    Bank-level encryption and fraud protection to keep your transactions secure.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Lightning Fast Setup</h3>
                  <p className="text-gray-600 text-sm">
                    Get your payment system up and running in minutes, not hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Global Reach</h3>
                  <p className="text-gray-600 text-sm">
                    Accept payments from customers worldwide with multi-currency support.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Competitive Rates</h3>
                  <p className="text-gray-600 text-sm">
                    Transparent pricing with no hidden fees and competitive transaction rates.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">Trusted by 10,000+ merchants</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900">99.9% uptime guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src={logoImg} alt="ArkusPay" className="h-10 w-auto mx-auto" />
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Create your account
              </h2>
              <p className="mt-3 text-gray-600">
                Start accepting payments in minutes
              </p>
            </div>

            <div className="bg-white">
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center disabled:cursor-not-allowed"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center disabled:cursor-not-allowed"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {errors.root && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-600">{errors.root.message}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Creating account...
                      </div>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Mobile Benefits */}
            <div className="lg:hidden mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">Secure payments</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-600">Fast setup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}