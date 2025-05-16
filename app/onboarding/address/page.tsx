'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addressSchema, type AddressFormData } from '@/lib/schemas/onboarding-schemas';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { onboardingAddressUrl } from '@/consts/paths';
import { getStatesForCountry } from '@/lib/data/states';
import { getTimezonesForCountry } from '@/lib/data/timezones';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AddressPage() {
  const router = useRouter();
  const { data, updateData, setStage } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication and onboarding status first
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
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        router.replace('/signup');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuthAndOnboarding();
  }, [router]);

  // Redirect if business step not completed
  useEffect(() => {
    if (!checkingAuth && (!data.businessName || !data.country)) {
      router.replace('/onboarding/business');
      return;
    }
  }, [data, router, checkingAuth]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      line1: data.line1 || '',
      line2: data.line2 || '',
      city: data.city || '',
      state: data.state || '',
      postalCode: data.postalCode || '',
      phone: data.phone || '',
      timezone: data.timezone || '',
    },
  });

  // Watch state changes for timezone suggestions
  const selectedState = watch('state');

  // Set initial values when component mounts
  useEffect(() => {
    if (data.line1) setValue('line1', data.line1);
    if (data.line2) setValue('line2', data.line2);
    if (data.city) setValue('city', data.city);
    if (data.state) setValue('state', data.state);
    if (data.postalCode) setValue('postalCode', data.postalCode);
    if (data.phone) setValue('phone', data.phone);
    if (data.timezone) setValue('timezone', data.timezone);
  }, [data, setValue]);

  // Auto-suggest timezone based on state
  useEffect(() => {
    if (selectedState && data.country) {
      const timezones = getTimezonesForCountry(data.country);
      if (timezones.length > 0 && !watch('timezone')) {
        // Simple mapping for common states (you can expand this)
        const timezoneMapping: Record<string, string> = {
          'CA': 'America/Los_Angeles',
          'NY': 'America/New_York',
          'IL': 'America/Chicago',
          'TX': 'America/Chicago',
          'SP': 'America/Sao_Paulo',
          'RJ': 'America/Sao_Paulo',
        };
        
        const suggestedTimezone = timezoneMapping[selectedState] || timezones[0].value;
        setValue('timezone', suggestedTimezone);
      }
    }
  }, [selectedState, data.country, setValue, watch]);

  // Phone number formatting functions
  const formatUSPhone = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return digits;
  };

  const formatBRPhone = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XX) XXXXX-XXXX
    if (digits.length >= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    } else if (digits.length >= 2) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return digits;
  };

  const formatPhoneNumber = (value: string, country: 'US' | 'BR'): string => {
    return country === 'US' ? formatUSPhone(value) : formatBRPhone(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target as HTMLInputElement;
    const newValue = inputElement.value;
    const currentValue = watch('phone') || '';
    
    // Check if user is deleting
    const isDeleting = newValue.length < currentValue.length;
    
    if (isDeleting) {
      // When deleting, remove the last digit from the current digits
      const currentDigits = currentValue.replace(/\D/g, '');
      const newDigits = currentDigits.slice(0, -1);
      const formatted = formatPhoneNumber(newDigits, data.country);
      setValue('phone', formatted);
    } else {
      // When adding, format the new value
      const formatted = formatPhoneNumber(newValue, data.country);
      setValue('phone', formatted);
    }
  };

  const onSubmit = async (formData: AddressFormData) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${onboardingAddressUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          country: data.country, // Include country from previous step
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update store with form data
        updateData(formData);
        setStage('selling');
        
        // Navigate to next step
        router.push('/onboarding/selling');
      } else {
        setError('root', { message: result.message || 'Something went wrong' });
      }
    } catch (error) {
      setError('root', { message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    updateData(watch()); // Save current form data
    router.push('/onboarding/business');
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

  if (!data.country) {
    return null; // Prevent flash of content before redirect
  }

  const states = getStatesForCountry(data.country);
  const timezones = getTimezonesForCountry(data.country);

  const getPostalCodePlaceholder = (country: 'US' | 'BR') => {
    return country === 'US' ? '12345 or 12345-6789' : '12345-678';
  };

  const getPhonePlaceholder = (country: 'US' | 'BR') => {
    return country === 'US' ? '(123) 456-7890' : '(11) 98765-4321';
  };

  return (
    <OnboardingLayout step={1}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Address</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Please provide your business address and contact information.
                </p>
              </div>
            </div>
            
            {/* Country Display */}
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Country:</span> {data.country === 'US' ? 'United States' : 'Brazil'}
                <span className="text-gray-500 ml-2"></span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Address Line 1 */}
            <div>
              <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('line1')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Street address"
              />
              {errors.line1 && (
                <p className="mt-1 text-sm text-red-600">{errors.line1.message}</p>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 <span className="text-gray-500">(optional)</span>
              </label>
              <input
                {...register('line2')}
                type="text"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Apartment, suite, etc."
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="space-y-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('city')}
                  type="text"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="City"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('state')}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={getPostalCodePlaceholder(data.country)}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                disabled={isLoading}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={getPhonePlaceholder(data.country)}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone <span className="text-red-500">*</span>
              </label>
              <select
                {...register('timezone')}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select timezone</option>
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:space-x-4 sm:gap-0">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full sm:flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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