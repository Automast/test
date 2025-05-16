'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { businessSchema, type BusinessFormData } from '@/lib/schemas/onboarding-schemas';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { onboardingBusinessUrl } from '@/consts/paths';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { Loader2 } from 'lucide-react';

export default function BusinessPage() {
  const router = useRouter();
  const { data, updateData, setStage } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication and onboarding status
  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        router.replace('/signup');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          // If user has completed onboarding, redirect to merchant
          if (result.data.user.onboardingComplete) {
            router.replace('/merchant');
            return;
          }
        } else {
          // Invalid token, redirect to signup
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_data');
          router.replace('/signup');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, redirect to signup
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        router.replace('/signup');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuthAndOnboarding();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: data.businessName || '',
      country: data.country || 'US',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
    },
  });

  // Watch country changes to update currency display
  const country = watch('country');

  // Set initial values when component mounts
  useEffect(() => {
    if (data.businessName) setValue('businessName', data.businessName);
    if (data.country) setValue('country', data.country);
    if (data.firstName) setValue('firstName', data.firstName);
    if (data.lastName) setValue('lastName', data.lastName);
  }, [data, setValue]);

  const onSubmit = async (formData: BusinessFormData) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${onboardingBusinessUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Update store with form data
        updateData(formData);
        setStage('address');
        
        // Navigate to next step
        router.push('/onboarding/address');
      } else {
        setError('root', { message: result.message || 'Something went wrong' });
      }
    } catch (error) {
      setError('root', { message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrencySymbol = (country: 'US' | 'BR') => {
    return country === 'US' ? 'USD ($)' : 'BRL (R$)';
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout step={0}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Business Details</h1>
            <p className="mt-2 text-sm text-gray-600">
              Let's start with some basic information about your business.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('businessName')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your business name"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
              )}
            </div>

            {/* Country Selection */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                {...register('country')}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="US">United States</option>
                <option value="BR">Brazil</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Currency will be set to {getCurrencySymbol(country)}
              </p>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>

            {/* Owner Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
}