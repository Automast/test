// productcomponents/PaymentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { IBillingInfo } from '../productlib/types';
import { isPixSupported } from '../productlib/currency';
import { validateBillingInfo } from '../productlib/utils';
import { getUserCountry } from '../productlib/currency';

interface PaymentFormProps {
  currency: string;
  onSubmit: (
    billingInfo: IBillingInfo,
    paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other',
    status: 'pending' | 'successful' | 'canceled'
  ) => void;
  isSubmitting: boolean;
}


const PaymentForm: React.FC<PaymentFormProps> = ({ 
  currency, 
  onSubmit,
  isSubmitting
}) => {
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    email: '',
    phone: '',
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',  // Will be auto-populated from IP
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'card'|'pix'|'paypal'|'wallet'|'other'>('card');
  const [txnStatus, setTxnStatus] = useState<'pending'|'successful'|'canceled'>('pending');

  // Check if PIX is supported for this currency (only BRL)
  const pixSupported = isPixSupported(currency);
  
  // Detect user's country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const country = await getUserCountry();
        setBillingInfo(prev => ({
          ...prev,
          country
        }));
      } catch (error) {
        console.error('Error detecting country:', error);
        // Default to US if detection fails
        setBillingInfo(prev => ({
          ...prev,
          country: 'US'
        }));
      }
    };
    
    detectCountry();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate billing info
    const validation = validateBillingInfo(billingInfo);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Submit to parent
    onSubmit(billingInfo, paymentMethod, txnStatus);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={billingInfo.email}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={billingInfo.phone}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1 (123) 456-7890"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={billingInfo.name}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={billingInfo.address}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123 Main St, Apt 4B"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500">{errors.address}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={billingInfo.city}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="New York"
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-500">{errors.city}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={billingInfo.state}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="NY"
              />
              {errors.state && (
                <p className="mt-1 text-xs text-red-500">{errors.state}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="postalCode"
                value={billingInfo.postalCode}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  errors.postalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10001"
              />
              {errors.postalCode && (
                <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
              )}
            </div>
            
            {/* Country field is now hidden and populated automatically */}
            <input type="hidden" name="country" value={billingInfo.country} />
            
            {/* Show detected country for reference */}
            <div className="text-sm text-gray-600 mt-1">
              Country detected: {billingInfo.country || 'Detecting...'}
            </div>
          </div>
        </div>
      </div>
      
      <div>
{/* Transaction Status (test only) */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    Transaction Status (test only)
  </label>
  <select
    value={txnStatus}
    onChange={e => setTxnStatus(e.target.value as any)}
    className="border rounded px-2 py-1 w-full"
  >
    <option value="pending">Pending</option>
    <option value="successful">Successful</option>
    <option value="canceled">Canceled</option>
  </select>
</div>

<h3 className="text-lg font-semibold mb-4">Payment Method</h3>
<div className="space-y-3">

          {/* Credit Card Option (always available) */}
          <div className="flex items-center">
            <input
              type="radio"
              id="card"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="mr-2"
            />
            <label htmlFor="card" className="flex items-center">
              <span className="mr-2">Credit/Debit Card</span>
              <div className="flex space-x-1">
                <span className="w-8 h-5 bg-blue-100 rounded">Visa</span>
                <span className="w-8 h-5 bg-red-100 rounded">MC</span>
              </div>
            </label>
          </div>
          
          {/* PIX Option (only for BRL) */}
          {pixSupported && (
            <div className="flex items-center">
              <input
                type="radio"
                id="pix"
                name="paymentMethod"
                value="pix"
                checked={paymentMethod === 'pix'}
                onChange={() => setPaymentMethod('pix')}
                className="mr-2"
              />
              <label htmlFor="pix" className="flex items-center">
                <span className="mr-2">PIX</span>
                <span className="text-xs bg-green-100 px-1 py-0.5 rounded">Brasil Only</span>
              </label>
            </div>
          )}
          
          {/* PayPal Option */}
          <div className="flex items-center">
            <input
              type="radio"
              id="paypal"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={() => setPaymentMethod('paypal')}
              className="mr-2"
            />
            <label htmlFor="paypal">PayPal</label>
          </div>
        </div>
        
        {/* Coming soon message */}
        <p className="text-xs text-gray-500 mt-2">
          Note: This is a test payment page. No actual payment will be processed.
        </p>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium rounded-md transition`}
        >
          {isSubmitting ? 'Processing...' : 'Complete Purchase'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;