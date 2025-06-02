// productcomponents/PaymentForm.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';
import { loadStripe, Stripe, StripeElements, StripeCardNumberElement } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { ICountry, IState } from 'country-state-city';
import { Country, State } from 'country-state-city';

import { IBillingInfo } from '../productlib/types';
import { isPixSupported, getUserCountry } from '../productlib/currency';
import { validateBillingInfo } from '../productlib/utils';
import logger from '../productlib/logger';

interface PaymentFormProps {
  currency: string;
  amount: number; // Expected in smallest currency unit (e.g., cents)
  transactionId: string;
  onSubmit: (
    billingInfo: IBillingInfo,
    paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other',
    status: 'pending' | 'successful' | 'canceled',
    paymentIntentId?: string
  ) => void;
  isSubmitting: boolean;
  // Add product details needed for create-intent
  productOwnerId: string;
  productId: string;
  productName: string;
  quantity: number;
}

// Interface for CheckoutForm props
interface CheckoutFormPropsInternal {
  currency: string;
  amount: number;
  transactionId: string;
  onSubmit: PaymentFormProps['onSubmit'];
  isSubmitting: boolean;
  billingInfo: IBillingInfo;
  setBillingInfo: (info: IBillingInfo | ((prev: IBillingInfo) => IBillingInfo)) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  productOwnerId: string;
  productId: string;
  productName: string;
  quantityParam: number;
}

let stripePromiseSingleton: Promise<Stripe | null> | null = null;

const getStripeInstance = (): Promise<Stripe | null> => {
  if (!stripePromiseSingleton) {
    stripePromiseSingleton = (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                        (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);
        
        const apiUrl = `${baseUrl.replace(/\/api$/, '')}/api/payments/config`;
        logger.info('[PaymentForm] Fetching payment config from:', apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('[PaymentForm] Failed to fetch payment config. Status:', response.status, 'Response:', errorText);
            return null;
        }
        const config = await response.json();
        logger.info('[PaymentForm] Payment config response:', config);
        
        if (config.success && config.data?.processors?.stripe?.configured && config.data.processors.stripe.publicKey) {
          logger.info('[PaymentForm] Stripe loaded successfully with key prefix:', config.data.processors.stripe.publicKey.substring(0, 20) + '...');
          return loadStripe(config.data.processors.stripe.publicKey);
        } else {
          logger.error('[PaymentForm] Stripe not configured or public key missing in fetched config:', config.data?.processors?.stripe);
          return null;
        }
      } catch (error) {
        logger.error('[PaymentForm] Error loading Stripe config or initializing Stripe.js:', error);
        return null;
      }
    })();
  }
  return stripePromiseSingleton;
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  showIcon: false,
};

const CheckoutForm: React.FC<CheckoutFormPropsInternal> = ({
  currency,
  amount,
  transactionId,
  onSubmit,
  isSubmitting,
  billingInfo,
  setBillingInfo,
  errors,
  setErrors,
  productOwnerId,
  productId,
  productName,
  quantityParam,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(billingInfo.country || '');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'pix'>('card');
  const [addressLine2, setAddressLine2] = useState<string>('');

  const pixSupported = isPixSupported(currency);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
      if (billingInfo.country !== selectedCountry) {
        setBillingInfo(prev => ({ ...prev, country: selectedCountry, state: '' }));
      }
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (billingInfo.country && billingInfo.country !== selectedCountry) {
      setSelectedCountry(billingInfo.country);
    }
  }, [billingInfo.country, selectedCountry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  const createPaymentIntent = async (): Promise<string | null> => {
    if (paymentIntentCreated || clientSecret) {
      return clientSecret;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);
      
      const apiUrl = `${baseUrl.replace(/\/api$/, '')}/api/payments/create-intent`;
      
      logger.info('[PaymentForm] Creating payment intent for transaction:', transactionId);
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount, // This is already smallest unit (e.g. cents)
    currency: currency.toLowerCase(), // This is the currency code like 'brl'
    transactionId, // The TX_... ID
    description: `Purchase: ${productName} (x${quantityParam}) - TX: ${transactionId}`,
    // Pass new data
    productOwnerId: productOwnerId,
    productId: productId,
    productName: productName,
    quantity: quantityParam,
    customerEmail: billingInfo.email,
    // Add billing info to be stored in Stripe metadata
    billingInfo: {
      name: billingInfo.name || '',
      email: billingInfo.email || '',
      phone: billingInfo.phone || '',
      address: billingInfo.address || '',
      city: billingInfo.city || '',
      state: billingInfo.state || '',
      postalCode: billingInfo.postalCode || '',  
      country: billingInfo.country || ''
    }
  }),
});
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: "Failed to parse error from create-intent"}));
        logger.error('[PaymentForm] Failed to create payment intent. Status:', response.status, 'Error:', errorData);
        throw new Error(errorData.message || `Failed to initialize payment (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (data.success && data.data.clientSecret) {
        logger.info('[PaymentForm] Payment intent created successfully. Client Secret (first 20):', data.data.clientSecret.substring(0,20)+'...');
        setClientSecret(data.data.clientSecret);
        setPaymentIntentCreated(true);
        return data.data.clientSecret;
      } else {
        logger.error('[PaymentForm] Failed to get clientSecret from create-intent:', data.message || 'Unknown error', data.errors);
        throw new Error(data.message || 'Failed to initialize payment details.');
      }
    } catch (error) {
      logger.error('[PaymentForm] Error creating payment intent:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    
    // Merge address line 1 and 2
    const mergedAddress = addressLine2 
      ? `${billingInfo.address}, ${addressLine2}`
      : billingInfo.address;
    
    const finalBillingInfo = {
      ...billingInfo,
      address: mergedAddress
    };
    
    if (selectedPaymentMethod === 'pix') {
      // Handle PIX payment
      const validation = validateBillingInfo(finalBillingInfo);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
      
      onSubmit(finalBillingInfo, 'pix', 'pending');
      return;
    }

    if (!stripe || !elements) {
      setPaymentError('Stripe has not loaded yet. Please try again.');
      logger.warn('[CheckoutForm] handleSubmit: Stripe or Elements not ready.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setPaymentError('Card number element not ready.');
      logger.warn('[CheckoutForm] handleSubmit: CardNumberElement not found.');
      return;
    }
    
    if (processing || isSubmitting) return;
    setProcessing(true);

    try {
      const validation = validateBillingInfo(finalBillingInfo);
      if (!validation.valid) {
        setErrors(validation.errors);
        setProcessing(false);
        logger.info('[CheckoutForm] Billing info validation failed:', validation.errors);
        return;
      }

      let currentClientSecret = clientSecret;
      if (!currentClientSecret) {
        currentClientSecret = await createPaymentIntent();
        if (!currentClientSecret) {
          setPaymentError('Failed to initialize payment. Please try again.');
          setProcessing(false);
          return;
        }
      }
      
      logger.info('[CheckoutForm] Attempting to create PaymentMethod...');
      const { error: createPmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: finalBillingInfo.name,
          email: finalBillingInfo.email,
          phone: finalBillingInfo.phone,
          address: {
            line1: finalBillingInfo.address,
            city: finalBillingInfo.city,
            state: finalBillingInfo.state,
            postal_code: finalBillingInfo.postalCode,
            country: finalBillingInfo.country,
          },
        },
      });

      if (createPmError) {
        logger.error('[CheckoutForm] createPaymentMethod failed:', createPmError);
        setPaymentError(createPmError.message || 'Failed to process payment details.');
        onSubmit(finalBillingInfo, 'card', 'canceled');
        setProcessing(false);
        return;
      }
      logger.info('[CheckoutForm] PaymentMethod created:', paymentMethod.id);

      logger.info('[CheckoutForm] Confirming card payment with clientSecret (first 20 chars):', currentClientSecret.substring(0,20)+'...');
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(currentClientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        logger.error('[CheckoutForm] Payment confirmation failed:', confirmError);
        setPaymentError(confirmError.message || 'Payment failed. Please try again.');
        onSubmit(finalBillingInfo, 'card', 'canceled', paymentIntent ? paymentIntent.id : undefined);
      } else if (paymentIntent) {
        logger.info('[CheckoutForm] Payment intent after confirmation:', paymentIntent.id, 'Status:', paymentIntent.status);
        let status: 'pending' | 'successful' | 'canceled' = 'pending';
        if (paymentIntent.status === 'succeeded') status = 'successful';
        else if (paymentIntent.status === 'canceled') status = 'canceled';
        else if (['requires_action', 'requires_confirmation', 'processing'].includes(paymentIntent.status)) status = 'pending';
        
        onSubmit(finalBillingInfo, 'card', status, paymentIntent.id);
      }
    } catch (err: any) {
      logger.error('[CheckoutForm] Unexpected error during payment submission:', err);
      setPaymentError('An unexpected error occurred. Please try again.');
      
      const mergedAddress = addressLine2 
        ? `${billingInfo.address}, ${addressLine2}`
        : billingInfo.address;
      
      const finalBillingInfo = {
        ...billingInfo,
        address: mergedAddress
      };
      
      onSubmit(finalBillingInfo, 'card', 'canceled');
    } finally {
      setProcessing(false);
    }
  };

  const getDisplayAmount = () => {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: currency.toUpperCase() 
    }).format(amount / 100);
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6b7c93;
          margin-bottom: 8px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: #32325d;
          margin-bottom: 16px;
        }
        
        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          font-size: 16px;
          color: #32325d;
          background: white;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
        }
        
        .form-input::placeholder {
          color: #aab7c4;
        }
        
        .billing-group {
          border: 1px solid #cfd7df;
          border-radius: 4px;
          overflow: hidden;
          background: white;
        }
        
        .billing-group .form-input {
          border: none;
          border-radius: 0;
          width: 100%;
        }
        
        .billing-group .form-input:focus {
          box-shadow: none;
          border-color: transparent;
        }
        
        .billing-group > *:not(:last-child) {
          border-bottom: 1px solid #e6ebf1;
        }
        
        .billing-row {
          display: flex;
        }
        
        .billing-row .form-input {
          border-bottom: none;
        }
        
        .billing-row .form-input:first-child {
          border-right: 1px solid #e6ebf1;
        }
        
        .phone-input {
          position: relative;
        }
        
        .flag-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 15px;
          z-index: 2;
          object-fit: cover;
          border-radius: 2px;
        }
        
        .phone-input .form-input {
          padding-left: 36px;
          padding-right: 40px;
          border: none;
        }
        
        .info-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8898aa;
          font-size: 12px;
          cursor: help;
        }
        
        .payment-methods {
          margin: 20px 0;
        }
        
        .payment-method {
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        
        .payment-method:hover {
          border-color: #cfd7df;
        }
        
        .payment-method.selected {
          border-color: #000;
        }
        
        .payment-method-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          background: #fff;
          transition: background-color 0.15s;
          border: none;
          width: 100%;
          text-align: left;
        }
        
        .payment-method-header:hover {
          background: #f8f9fa;
        }
        
        .payment-radio {
          width: 18px;
          height: 18px;
          border: 2px solid #cfd7df;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }
        
        .payment-radio.checked {
          border-color: #000;
        }
        
        .payment-radio.checked::after {
          content: '';
          width: 8px;
          height: 8px;
          background: #000;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .payment-method-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .payment-method-icon {
          width: 32px;
          height: 20px;
          background: #f7f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #32325d;
          font-weight: 600;
        }
        
        .payment-method-name {
          font-size: 16px;
          font-weight: 500;
          color: #32325d;
        }
        
        .payment-icons {
          display: flex;
          gap: 6px;
        }
        
        .card-brand-icon {
          width: 24px;
          height: 16px;
        }
        
        .payment-details {
          padding: 0 16px 16px;
          border-top: 1px solid #e6ebf1;
          display: none;
        }
        
        .payment-method.selected .payment-details {
          display: block;
        }
        
        .card-group {
          border: 1px solid #cfd7df;
          border-radius: 4px;
          overflow: hidden;
          background: white;
        }
        
        .card-number-input {
          position: relative;
          padding: 12px;
          border-bottom: 1px solid #e6ebf1;
        }
        
        .card-row {
          display: flex;
        }
        
        .card-expiry {
          flex: 1;
          position: relative;
          padding: 12px;
          border-right: 1px solid #e6ebf1;
        }
        
        .card-cvc {
          flex: 1;
          position: relative;
          padding: 12px;
        }
        
        .cvc-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8898aa;
          font-size: 14px;
        }
        
        .billing-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 14px;
          color: #6b7c93;
        }
        
        .billing-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #000;
        }
        
        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e6ebf1;
          border-radius: 4px;
          background: #f7f9fc;
          margin-bottom: 24px;
        }
        
        .checkbox {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          accent-color: #000;
        }
        
        .checkbox-label {
          font-size: 13px;
          color: #32325d;
          line-height: 1.4;
        }
        
        .checkbox-sublabel {
          font-size: 13px;
          color: #8898aa;
          margin-top: 4px;
        }
        
        .pay-button {
          width: 100%;
          padding: 14px;
          background: #0073E6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease;
          margin-bottom: 16px;
        }
        
        .pay-button:hover:not(:disabled) {
          background: #0066CC;
        }
        
        .pay-button:disabled {
          background: #8898aa;
          cursor: not-allowed;
        }
        
        .footer {
          text-align: center;
          margin-top: 24px;
        }
        
        .footer-text {
          font-size: 12px;
          color: #8898aa;
          margin-bottom: 8px;
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .footer-link {
          font-size: 12px;
          color: #8898aa;
          text-decoration: none;
        }
        
        .footer-link:hover {
          text-decoration: underline;
        }
        
        .or-divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
          color: #8898aa;
          font-size: 14px;
        }
        
        .or-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e6ebf1;
        }
        
        .or-divider span {
          background: #fff;
          padding: 0 16px;
          position: relative;
        }
        
        .error-display {
          background: #fdf2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
          color: #dc2626;
          font-size: 14px;
          text-align: center;
        }
        
        .hidden-methods {
          display: none;
        }
      `}</style>

      <form onSubmit={handleSubmit}>
        {/* Pay with Link Button - Hidden for now */}
        <div className="hidden-methods">
          <div className="form-group">
            <button type="button" style={{
              width: '100%',
              padding: '14px',
              background: '#00D924',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Pay with <strong>link</strong>
            </button>
            <div className="or-divider">
              <span>Or</span>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="form-group">
          <div className="section-title">Shipping information</div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              name="email"
              className="form-input" 
              placeholder="email@example.com" 
              value={billingInfo.email}
              onChange={handleInputChange}
              required 
              disabled={isSubmitting || processing}
            />
            {errors.email && <div style={{color: '#dc2626', fontSize: '12px', marginTop: '4px'}}>{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Shipping address</label>
            <div className="billing-group">
              <input 
                type="text" 
                name="name"
                className="form-input" 
                placeholder="Full name" 
                value={billingInfo.name}
                onChange={handleInputChange}
                required 
                disabled={isSubmitting || processing}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              
              <select 
                name="country"
                className="form-input" 
                value={selectedCountry}
                onChange={handleCountryChange}
                required
                disabled={isSubmitting || processing}
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
              
              <input 
                type="text" 
                name="address"
                className="form-input" 
                placeholder="Address line 1" 
                value={billingInfo.address}
                onChange={handleInputChange}
                required 
                disabled={isSubmitting || processing}
              />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              
              <input 
                type="text" 
                className="form-input" 
                placeholder="Address line 2" 
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                disabled={isSubmitting || processing}
              />
              
              <div className="billing-row">
                <input 
                  type="text" 
                  name="city"
                  className="form-input" 
                  placeholder="City" 
                  value={billingInfo.city}
                  onChange={handleInputChange}
                  required 
                  disabled={isSubmitting || processing}
                />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
                <input 
                  type="text" 
                  name="postalCode"
                  className="form-input" 
                  placeholder="ZIP" 
                  value={billingInfo.postalCode}
                  onChange={handleInputChange}
                  required 
                  disabled={isSubmitting || processing}
                />
                {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
              </div>
              
              {states.length > 0 ? (
                <select 
                  name="state"
                  className="form-input" 
                  value={billingInfo.state}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || processing || states.length === 0}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
              ) : selectedCountry ? (
                <input 
                  type="text" 
                  name="state"
                  className="form-input" 
                  placeholder="State / Province (if applicable)" 
                  value={billingInfo.state}
                  onChange={handleInputChange}
                  disabled={isSubmitting || processing}
                />
              ) : null}
              {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
              
              <div className="phone-input">
                <img 
                  src={`https://flagcdn.com/w20/${selectedCountry.toLowerCase()}.png`} 
                  alt={selectedCountry} 
                  className="flag-icon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://flagcdn.com/w20/us.png";
                  }}
                />
                <input 
                  type="tel" 
                  name="phone"
                  className="form-input" 
                  placeholder="Phone number (optional)" 
                  value={billingInfo.phone || ''}
                  onChange={handleInputChange}
                  disabled={isSubmitting || processing}
                />
                <i className="fas fa-info-circle info-icon"></i>
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="form-group">
          <div className="section-title">Payment method</div>
          
          <div className="payment-methods">
            {/* Card Payment */}
            <div className={`payment-method ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}>
              <button 
                type="button" 
                className="payment-method-header" 
                onClick={() => setSelectedPaymentMethod('card')}
              >
                <div className={`payment-radio ${selectedPaymentMethod === 'card' ? 'checked' : ''}`}></div>
                <div className="payment-method-info">
                  <div className="payment-method-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <span className="payment-method-name">Card</span>
                </div>
                <div className="payment-icons">
                  <img src="https://js.stripe.com/v3/fingerprinted/img/visa-365725566f9578a9589553aa9296d178.svg" alt="Visa" className="card-brand-icon" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="card-brand-icon" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="American Express" className="card-brand-icon" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/jcb-271fd06e6e0a5af2601265d1107d8c96.svg" alt="JCB" className="card-brand-icon" />
                </div>
              </button>
              
              <div className="payment-details">
                <div className="form-group">
                  <label className="form-label">Card information</label>
                  <div className="card-group">
                    <div className="card-number-input">
                      <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                    </div>
                    
                    <div className="card-row">
                      <div className="card-expiry">
                        <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                      </div>
                      <div className="card-cvc">
                        <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                        <i className="fas fa-credit-card cvc-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PIX Payment - Only show for BRL */}
            {pixSupported && (
              <div className={`payment-method ${selectedPaymentMethod === 'pix' ? 'selected' : ''}`}>
                <button 
                  type="button" 
                  className="payment-method-header" 
                  onClick={() => setSelectedPaymentMethod('pix')}
                >
                  <div className={`payment-radio ${selectedPaymentMethod === 'pix' ? 'checked' : ''}`}></div>
                  <div className="payment-method-info">
                    <div className="payment-method-icon" style={{background: '#32BCAD', color: '#fff'}}>
                      PIX
                    </div>
                    <span className="payment-method-name">PIX</span>
                  </div>
                </button>
                <div className="payment-details">
                  <div style={{padding: '16px 0', fontSize: '14px', color: '#6b7c93'}}>
                    You will receive PIX payment instructions after clicking "Pay".
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Information Checkbox */}
        <div className="checkbox-group">
          <input type="checkbox" id="save-info" className="checkbox" />
          <label htmlFor="save-info">
            <div className="checkbox-label">Securely save my information for 1-click checkout</div>
            <div className="checkbox-sublabel">Pay faster on our store and everywhere Link is accepted.</div>
          </label>
        </div>

        {/* Error Display */}
        {paymentError && (
          <div className="error-display">
            {paymentError}
          </div>
        )}

        {/* Pay Button */}
        <button 
          type="submit" 
          className="pay-button"
          disabled={isSubmitting || processing || (selectedPaymentMethod === 'card' && (!stripe || !elements))}
        >
          {isSubmitting || processing ? (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Pay ${getDisplayAmount()}`
          )}
        </button>
        
        {selectedPaymentMethod === 'card' && (
          <div style={{textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#8898aa'}}>
            Your payment information is secure and encrypted.
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="footer">
        <div className="footer-text">
          Powered by <strong>Arkus</strong>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Privacy</a>
        </div>
      </div>
    </>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  currency, 
  amount,
  transactionId,
  onSubmit,
  isSubmitting,
  productOwnerId,
  productId,
  productName,
  quantity
}) => {
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    email: '', phone: '', name: '', address: '', city: '', state: '', postalCode: '', country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stripeApiPromise, setStripeApiPromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string>('');

  const pixSupported = isPixSupported(currency);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const countryIsoCode = await getUserCountry();
        logger.info("[PaymentForm] Detected user country:", countryIsoCode);
        setBillingInfo(prev => ({ ...prev, country: countryIsoCode }));
      } catch (error) {
        logger.error('[PaymentForm] Error detecting country:', error);
        setBillingInfo(prev => ({ ...prev, country: 'US' }));
      }
    };
    detectCountry();
  }, []);

  useEffect(() => {
    logger.info('[PaymentForm] Initializing Stripe.js promise.');
    setStripeApiPromise(getStripeInstance());
  }, []);

  if (stripeError) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '6px',
        border: '1px solid #fecaca',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: '#fef2f2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#dc2626'
        }}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style={{fontSize: '16px', fontWeight: '500', color: '#32325d', marginBottom: '8px'}}>
          Payment Unavailable
        </h3>
        <p style={{color: '#6b7c93', marginBottom: '16px', fontSize: '14px'}}>{stripeError}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '8px 16px',
            background: '#0073E6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stripeApiPromise) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '6px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #635bff',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{color: '#6b7c93', fontSize: '14px'}}>Loading payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripeApiPromise}>
      <CheckoutForm
        currency={currency}
        amount={amount}
        transactionId={transactionId}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        billingInfo={billingInfo}
        setBillingInfo={setBillingInfo}
        errors={errors}
        setErrors={setErrors}
        productOwnerId={productOwnerId}
        productId={productId}
        productName={productName}
        quantityParam={quantity}
      />
    </Elements>
  );
};

export default PaymentForm;