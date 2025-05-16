'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { sellingSchema, type SellingFormData } from '@/lib/schemas/onboarding-schemas';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { onboardingSellingUrl } from '@/consts/paths';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { Loader2, ArrowLeft, Store, Code, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const integrationLabels = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  wordpress: 'WordPress',
  custom: 'Custom API',
};

const integrationDescriptions = {
  shopify: 'Integrate with your Shopify store',
  woocommerce: 'Integrate with your WooCommerce store',
  wordpress: 'Integrate with your WordPress site',
  custom: 'Custom API integration',
};

// Integration icons/logos using public folder paths
const integrationIcons = {
  shopify: '/integration/shopify.webp',
  woocommerce: '/integration/woocommerce.webp',
  wordpress: '/integration/wordpress.webp',
  custom: 'https://brandeps.com/icon-download/A/Api-icon-vector-03.svg',
};

export default function SellingPage() {
  const router = useRouter();
  const { data, updateData, setStage, clearData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if previous steps not completed
  useEffect(() => {
    if (!data.businessName || !data.country || !data.line1) {
      router.replace('/onboarding/business');
      return;
    }
  }, [data, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<SellingFormData>({
    resolver: zodResolver(sellingSchema),
    defaultValues: {
      sellingMethod: data.sellingMethod || 'hosted_store',
      integrationTypes: data.integrationTypes || [],
    },
  });

  const sellingMethod = watch('sellingMethod');
  const integrationTypes = watch('integrationTypes') || [];

  // Set initial values when component mounts
  useEffect(() => {
    if (data.sellingMethod) setValue('sellingMethod', data.sellingMethod);
    if (data.integrationTypes) setValue('integrationTypes', data.integrationTypes);
  }, [data, setValue]);

  const onSubmit = async (formData: SellingFormData) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/signup');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${onboardingSellingUrl}`, {
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
        setStage('complete');
        
        // Clear the onboarding storage since it's complete
        clearData();
        
        // Update local storage with completion status
        if (result.data && result.data.user) {
          localStorage.setItem('user_data', JSON.stringify(result.data.user));
        }
        
        // Navigate to merchant dashboard
        router.push('/merchant');
      } else {
        // If the API returns 401, the token might be invalid
        if (response.status === 401) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('onboarding-storage');
          router.push('/signup');
          return;
        }
        setError('root', { message: result.message || 'Something went wrong' });
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      setError('root', { message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    updateData(watch()); // Save current form data
    router.push('/onboarding/address');
  };

  const handleSellingMethodChange = (method: 'hosted_store' | 'integration') => {
    setValue('sellingMethod', method);
    if (method === 'hosted_store') {
      setValue('integrationTypes', []);
    }
  };

  const handleIntegrationTypeChange = (type: string, checked: boolean) => {
    const current = integrationTypes || [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);
    setValue('integrationTypes', updated);
  };

  if (!data.businessName) {
    return null; // Prevent flash of content before redirect
  }

  return (
    <OnboardingLayout step={2}>
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
                <h1 className="text-2xl font-bold text-gray-900">Selling Method</h1>
                <p className="mt-2 text-sm text-gray-600">
                  How would you like to start accepting payments?
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Selling Method Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Choose your selling method <span className="text-red-500">*</span>
              </label>

              {/* Hosted Store Option */}
              <div
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  sellingMethod === 'hosted_store'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => !isLoading && handleSellingMethodChange('hosted_store')}
              >
                <div className="flex items-start">
                  <input
                    {...register('sellingMethod')}
                    type="radio"
                    value="hosted_store"
                    disabled={isLoading}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Store className="h-6 w-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900">Hosted Store</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Get a ready-to-use online store hosted by ArkusPay. Perfect for getting started quickly without technical setup.
                    </p>
                    {sellingMethod === 'hosted_store' && (
                      <div className="mt-3 flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        No technical knowledge required
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Integration Option */}
              <div
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  sellingMethod === 'integration'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => !isLoading && handleSellingMethodChange('integration')}
              >
                <div className="flex items-start">
                  <input
                    {...register('sellingMethod')}
                    type="radio"
                    value="integration"
                    disabled={isLoading}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Code className="h-6 w-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900">Integration</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Integrate ArkusPay with your existing website, ecommerce platform, or custom application.
                    </p>
                    {sellingMethod === 'integration' && (
                      <div className="mt-3 flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Flexible integration options
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Types (only shown when integration is selected) */}
            {sellingMethod === 'integration' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select integration types <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(integrationLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        integrationTypes.includes(key)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                      onClick={() => 
                        !isLoading && handleIntegrationTypeChange(key, !integrationTypes.includes(key))
                      }
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={integrationTypes.includes(key)}
                          onChange={(e) => handleIntegrationTypeChange(key, e.target.checked)}
                          disabled={isLoading}
                          className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-6 h-6 mr-3 flex items-center justify-center">
                              {key === 'custom' ? (
                                <img
                                  src={integrationIcons[key as keyof typeof integrationIcons]}
                                  alt={`${label} logo`}
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                                <Image
                                  src={integrationIcons[key as keyof typeof integrationIcons]}
                                  alt={`${label} logo`}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900">{label}</h4>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {integrationDescriptions[key as keyof typeof integrationDescriptions]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.integrationTypes && (
                  <p className="text-sm text-red-600">{errors.integrationTypes.message}</p>
                )}
              </div>
            )}

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
                    Finalizing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
}