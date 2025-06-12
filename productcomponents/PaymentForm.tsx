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
  // Add country and state change handlers for VAT calculation
  onCountryChange?: (countryCode: string) => void;
  onStateChange?: (stateCode: string) => void;
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
  onCountryChange?: (countryCode: string) => void;
  onStateChange?: (stateCode: string) => void;
}

// Initialize Stripe immediately when module loads
let stripePromiseSingleton: Promise<Stripe | null> | null = null;

const initializeStripe = () => {
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

// Start loading Stripe immediately
const getStripeInstance = () => {
  if (!stripePromiseSingleton) {
    initializeStripe();
  }
  return stripePromiseSingleton!;
};

// Initialize immediately when this module loads
initializeStripe();

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      lineHeight: '24px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  showIcon: true,
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
  onCountryChange,
  onStateChange,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>(billingInfo.country || '');
  const [countryLocked, setCountryLocked] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'pix'>('card');
  const [addressLine2, setAddressLine2] = useState<string>('');
  const [saveInfo, setSaveInfo] = useState(true);

  const pixSupported = isPixSupported(currency);

  // Auto-detect and lock country on component mount
  useEffect(() => {
    const detectAndLockCountry = async () => {
      if (!selectedCountry || selectedCountry === '') {
        try {
          const countryIsoCode = await getUserCountry();
          logger.info("[CheckoutForm] Detected user country:", countryIsoCode);
          if (countryIsoCode) {
            setSelectedCountry(countryIsoCode);
            setBillingInfo(prev => ({ ...prev, country: countryIsoCode }));
            setCountryLocked(true);
            if (onCountryChange) {
              onCountryChange(countryIsoCode);
            }
          }
        } catch (error) {
          logger.error('[CheckoutForm] Error detecting country, defaulting to US:', error);
          setSelectedCountry('US');
          setBillingInfo(prev => ({ ...prev, country: 'US' }));
          setCountryLocked(true);
          if (onCountryChange) {
            onCountryChange('US');
          }
        }
      } else {
        // If country is already set, just lock it
        setCountryLocked(true);
      }
    };

    detectAndLockCountry();
  }, []); // Only run once on mount

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Fixed useEffect hooks to prevent loops
  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
    } else {
      setStates([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (billingInfo.country && billingInfo.country !== selectedCountry) {
      setSelectedCountry(billingInfo.country);
    }
  }, [billingInfo.country, selectedCountry]);

  // Single effect for notifying parent about location changes
  useEffect(() => {
    // Only notify if we have a complete location change and avoid rapid calls
    const timeoutId = setTimeout(() => {
      if (onCountryChange && selectedCountry) {
        onCountryChange(selectedCountry);
      }
      if (onStateChange && billingInfo.state) {
        onStateChange(billingInfo.state);
      }
    }, 100); // Small delay to prevent rapid calls

    return () => clearTimeout(timeoutId);
  }, [selectedCountry, billingInfo.state]); // Remove callback functions from dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    setBillingInfo(prev => ({ ...prev, country: newCountry, state: '' }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setBillingInfo(prev => ({ ...prev, state: newState }));
  };
  
  const handlePaymentMethodChange = (method: 'card' | 'pix') => {
    setSelectedPaymentMethod(method);
    setPaymentError(''); // Clear errors when switching
  }

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

  const getFlagIcon = (countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  };

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Ubuntu", sans-serif;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-size: 16px;
          line-height: 1.3;
          color: hsla(0,0%,10%,0.9);
          -webkit-font-smoothing: antialiased;
          touch-action: manipulation;
        }
        
        fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }

        .error-message {
          color: #dc2727;
          font-size: 13px;
          margin-top: 6px;
          width: 100%; /* Ensure it takes full width in flex container */
        }

        .payment-error-display {
          color: #fff;
          background-color: #dc2727;
          border-radius: 6px;
          padding: 12px;
          margin: 16px 0;
          font-size: 14px;
          text-align: center;
        }
        
        /* Forms */
        .form-section {
          margin-bottom: 8px;
        }
        
        .form-heading {
          margin-top: 24px;
          margin-bottom: 16px;
          color: hsla(0,0%,10%,0.9);
          font-size: 16px;
          font-weight: 500;
        }
        
        .field-group {
          margin: 4px 0 0 0;
        }
        
        .field-label-container {
          overflow-wrap: anywhere;
          position: relative;
          display: flex;
          justify-content: space-between;
        }
        
        .field-label {
          color: hsla(0,0%,10%,0.7);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
          display: block;
        }
        
        .field-container {
          display: flex;
          flex-wrap: wrap;
          position: relative;
        }
        
        .field-child {
          box-sizing: border-box;
          flex: 0 1 auto;
          max-width: 100%;
          min-width: 0;
          transform-origin: 0%;
        }
        
        .field-child--width-12 {
          width: 100%;
        }
        
        .field-child--width-6 {
          width: 50%;
        }
        
        .input-wrapper {
          display: block;
          margin: 0;
          padding: 0;
          position: relative;
        }
        
        .input-container {
          position: relative;
          height: 44px; /* Ensure consistent height */
        }
        
        .input, .select {
          appearance: none;
          background: white;
          border: 0;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
          color: hsla(0,0%,10%,0.9);
          font-size: 16px;
          height: 44px;
          line-height: 1.5;
          padding: 8px 12px;
          position: relative;
          transition: box-shadow 0.08s ease-in, color 0.08s ease-in;
          width: 100%;
          border-radius: 6px;
        }

        /* Stripe Elements Styling - Key Addition */
        .stripe-element-wrapper {
            background: white;
            box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
            color: hsla(0,0%,10%,0.9);
            height: 44px;
            padding: 10px 12px;
            transition: box-shadow 0.08s ease-in, color 0.08s ease-in;
            width: 100%;
            border-radius: 6px;
            display: flex;
            align-items: center;
        }
        
        .stripe-element-wrapper:focus-within {
            box-shadow: 0 0 0 1px rgba(50,151,211,0.7), 0 1px 1px 0 rgba(0,0,0,0.07), 0 0 0 4px rgba(50,151,211,0.3);
            outline: none;
            z-index: 2;
        }
        
        .StripeElement {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
        }


.card-group {
  border-radius: 6px;
  overflow: hidden;
  background: white;
  box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
}

.card-number-input {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  height: 44px;
  display: block; /* Changed from flex */
}

.card-row {
  display: flex;
  height: 44px;
}

.card-expiry {
  flex: 1;
  position: relative;
  padding: 10px 12px;
  border-right: 1px solid #e0e0e0;
  display: block; /* Changed from flex */
}

.card-cvc {
  flex: 1;
  position: relative;
  padding: 10px 12px;
  display: block; /* Changed from flex */
}

        .input::placeholder, .select::placeholder {
          color: hsla(0,0%,10%,0.5);
        }
        
        .input:focus, .select:focus {
          box-shadow: 0 0 0 1px rgba(50,151,211,0.7), 0 1px 1px 0 rgba(0,0,0,0.07), 0 0 0 4px rgba(50,151,211,0.3);
          outline: none;
          z-index: 2;
        }
        
        .input-with-icon {
          text-indent: 24px;
        }
        
        .input-icon {
          left: 12px;
          pointer-events: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
        }
        
        .input-icon svg {
          fill: hsla(0,0%,10%,0.5);
        }
        
        /* Form Groups - Remove square borders for grouped fields */
        .field-container .field-child .input,
        .field-container .field-child .select,
        .field-container .field-child .stripe-element-wrapper {
            border-radius: 0;
            height: 44px;
        }
        
        .field-top.field-left .input,
        .field-top.field-left .select,
        .field-top.field-left .stripe-element-wrapper {
          border-top-left-radius: 6px;
        }
        
        .field-top.field-right .input,
        .field-top.field-right .select,
        .field-top.field-right .stripe-element-wrapper {
          border-top-right-radius: 6px;
        }
        
        .field-bottom.field-left .input,
        .field-bottom.field-left .select,
        .field-bottom.field-left .stripe-element-wrapper {
          border-bottom-left-radius: 6px;
        }
        
        .field-bottom.field-right .input,
        .field-bottom.field-right .select,
        .field-bottom.field-right .stripe-element-wrapper {
          border-bottom-right-radius: 6px;
        }
        
        /* Phone Input */
        .phone-wrapper {
          position: relative;
        }
        
        .phone-input {
          padding-right: 26px;
        }

        .flag-icon-wrapper {
            cursor: pointer;
            height: 16px;
            width: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .flag-icon {
          height: 16px;
          width: auto;
          max-width: 22px;
          border-radius: 2px;
        }
        
        /* Select */
        .select-wrapper {
          display: flex;
          position: relative;
          height: 100%;
        }
        
        .select {
          padding-right: 48px;
        }
        
        .select-arrow {
          height: 12px;
          margin-top: -6px;
          pointer-events: none;
          position: absolute;
          right: 12px;
          top: 50%;
          width: 12px;
          z-index: 3;
        }
        
        /* Payment Methods Accordion */
        .accordion {
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
          margin: 4px 0 0 0;
        }
        
        .accordion-item {
          border-top: 1px solid #e0e0e0;
          transition: height 0.3s cubic-bezier(0.19,1,0.22,1);
        }
        
        .accordion-item:first-child {
          border-top: none;
        }
        
        .accordion-header {
          position: relative;
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .payment-title-inner {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
        }
        
        .radio-btn {
            appearance: none;
            background-clip: content-box;
            background-color: white;
            border-radius: 50%;
            box-shadow: inset 0 0 0 1px hsla(0,0%,10%,0.4);
            display: inline-block;
            height: 16px;
            width: 16px;
            min-width: 16px;
            transition: 0.2s ease;
            cursor: pointer;
        }

        .radio-btn:checked {
            box-shadow: inset 0 0 0 5px black;
        }

        .payment-icon {
          height: 16px;
          text-align: center;
          width: 24px;
        }
        
        .payment-icon img {
            border-radius: 2px;
            height: 16px;
            max-width: 24px;
            width: auto;
        }

        .pix-icon {
            background: #32BCAD;
            color: #fff;
            font-weight: bold;
            font-size: 10px;
            line-height: 16px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
        }

        .payment-title-text {
            color: hsla(0,0%,10%,0.9);
            font-size: 14px;
            font-weight: 500;
        }

        .brand-icons-container {
            margin-left: auto;
            display: flex;
            gap: 4px;
        }

        .brand-icon {
            height: 16px;
            width: auto;
        }

        .accordion-content {
          padding: 0 12px 12px;
          width: 100%;
        }

        /* Checkbox */
        .signup-form {
            margin-top: 24px;
        }
        .signup-header {
            background-color: white;
            border-radius: 6px;
            box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
            display: flex;
            flex-direction: row;
            padding: 12px;
        }
        .checkbox-field {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            cursor: pointer;
            width: 100%;
        }
        .checkbox-input {
            appearance: none;
            width: 16px;
            height: 16px;
            margin-top: 2px;
            min-width: 16px;
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }
        .checkbox-styled {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          min-width: 16px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 0 0 1px #e0e0e0, 0 1px 1px 0 rgba(0,0,0,0.05);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .checkbox-input:checked + .checkbox-styled {
          background-color: #32325d;
          box-shadow: 0 0 0 1px #32325d;
        }
        .checkbox-tick {
          display: none;
          color: white;
          width: 10px;
          height: 10px;
        }
        .checkbox-input:checked + .checkbox-styled .checkbox-tick {
          display: block;
        }
        .checkbox-label {
            color: hsla(0,0%,10%,0.9);
            font-size: 14px;
            font-weight: 400;
            user-select: none;
        }
        .signup-label-header {
            font-weight: 500;
        }
        .signup-sub-label {
            color: hsla(0,0%,10%,0.7);
            font-size: 13px;
            margin-top: 4px;
        }

        /* Submit Button */
        .submit-btn {
            background-color: #0074d4;
            border: 0;
            border-radius: 6px;
            box-shadow: inset 0 0 0 1px rgba(50,50,93,0.1), 0 2px 5px 0 rgba(50,50,93,0.1), 0 1px 1px 0 rgba(0,0,0,0.07);
            color: white;
            cursor: pointer;
            height: 44px;
            margin-top: 24px;
            outline: none;
            padding: 0;
            position: relative;
            transition: all 0.2s ease, box-shadow 0.08s ease-in;
            width: 100%;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .submit-btn:disabled {
            cursor: default;
            background-color: #aab7c4;
        }
        .submit-btn:hover:not(:disabled) {
            background-color: rgb(0,94,187);
        }
        .spinner {
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-left-color: #ffffff;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .footer {
            text-align: center;
            color: hsla(0,0%,10%,0.7);
            font-size: 13px;
            margin-top: 16px;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 8px;
        }
        .footer-link {
            cursor: pointer;
            text-decoration: none;
            color: hsla(0,0%,10%,0.7);
        }
        .footer-link:hover {
            text-decoration: underline dotted hsla(0,0%,10%,0.7);
        }

        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-wrap { flex-wrap: wrap; }
        .width-12 { width: 100%; }
        .gap-16 { gap: 16px; }
      `}</style>

      <main>
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-16">
            
            {/* Contact Information */}
            <div>
              <h2 className="form-heading">Contact information</h2>
              <div className="field-group">
                <fieldset className="field-container">
                  <div className="field-child field-child--width-12 field-left field-right field-top">
                    <div className="input-wrapper">
                      <div className="input-container">
                        <div className="input-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M16 3.6C16 2.72 15.28 2 14.4 2H1.6C0.72 2 0 2.72 0 3.6L0 12.4C0 13.28 0.72 14 1.6 14H14.4C15.28 14 16 13.28 16 12.4V3.6ZM14.4 3.6L8 7.6L1.6 3.6H14.4ZM14.4 12.4H1.6V5.2L8 9.2L14.4 5.2V12.4Z"></path>
                          </svg>
                        </div>
                        <input
                          className="input input-with-icon"
                          type="email"
                          name="email"
                          placeholder="email@example.com"
                          value={billingInfo.email}
                          onChange={handleInputChange}
                          required
                          disabled={isSubmitting || processing}
                        />
                      </div>
                    </div>
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>
                  
                  <div className="field-child field-child--width-12 field-left field-right field-bottom">
                    <div className="input-wrapper">
                      <div className="input-container phone-wrapper">
                         <div className="input-icon">
                            <div className="flag-icon-wrapper">
                              {selectedCountry && <img className="flag-icon" src={getFlagIcon(selectedCountry)} alt={selectedCountry} />}
                            </div>
                         </div>
                        <input
                          className="input phone-input input-with-icon"
                          type="tel"
                          name="phone"
                          placeholder="Phone (optional)"
                          value={billingInfo.phone || ''}
                          onChange={handleInputChange}
                          disabled={isSubmitting || processing}
                        />
                      </div>
                    </div>
                    {errors.phone && <p className="error-message">{errors.phone}</p>}
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="form-heading">Payment method</h2>
              <div className="accordion">
                {/* Card Payment Method */}
                <div className="accordion-item">
                  <div className="accordion-header" onClick={() => handlePaymentMethodChange('card')}>
                    <input
                      id="payment-method-card"
                      name="payment-method"
                      type="radio"
                      className="radio-btn"
                      value="card"
                      checked={selectedPaymentMethod === 'card'}
                      onChange={() => handlePaymentMethodChange('card')}
                    />
                    <div className="payment-title-inner">
                        <div className="payment-icon">
                            <img src="https://js.stripe.com/v3/fingerprinted/img/card-ce24697297bd3c6a00fdd2fb6f760f0d.svg" alt="Card" />
                        </div>
                        <div className="payment-title-text">Card</div>
                    </div>
                    <div className="brand-icons-container">
                        <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="brand-icon"/>
                        <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="brand-icon"/>
                        <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="brand-icon"/>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <div className="accordion-content">
                      <div className="flex flex-col gap-16">
                        {/* Card Information */}
                        <div className="field-group">
                          <label className="field-label">Card information</label>
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
    </div>
  </div>
</div>
                        </div>

                        {/* Billing Details */}
                        <div className="field-group">
                           <label className="field-label">Billing address</label>
                           <fieldset>
                             <div className="field-container">
                               <div className="field-child field-child--width-12 field-left field-right field-top">
                                 <div className="input-container">
                                   <input className="input" name="name" placeholder="Cardholder name" value={billingInfo.name} onChange={handleInputChange} required />
                                 </div>
                                 {errors.name && <p className="error-message">{errors.name}</p>}
                               </div>

<div className="field-child field-child--width-12 field-left field-right">
  <div className="input-wrapper">
      <div className="select-wrapper">
          <select 
            name="country" 
            className="select" 
            value={selectedCountry} 
            onChange={handleCountryChange} 
            required
            disabled={countryLocked}
            style={{
              backgroundColor: countryLocked ? '#f8f9fa' : 'white',
              cursor: countryLocked ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="" disabled>
              {countryLocked ? 'Auto-detected location' : 'Country or region'}
            </option>
            {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
          </select>
          {!countryLocked && <svg className="select-arrow" focusable="false" viewBox="0 0 12 12"><path d="M10.193 3.97a.75.75 0 0 1 1.062 1.062L6.53 9.756a.75.75 0 0 1-1.06 0L.745 5.032A.75.75 0 0 1 1.807 3.97L6 8.163l4.193-4.193z" fillRule="evenodd"></path></svg>}
      </div>
  </div>
  {errors.country && <p className="error-message">{errors.country}</p>}

</div>

                               <div className="field-child field-child--width-12 field-left field-right">
                                 <div className="input-container"><input className="input" name="address" placeholder="Address line 1" value={billingInfo.address} onChange={handleInputChange} required /></div>
                                 {errors.address && <p className="error-message">{errors.address}</p>}
                               </div>

                               <div className="field-child field-child--width-12 field-left field-right">
                                 <div className="input-container"><input className="input" name="addressLine2" placeholder="Address line 2 (optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} /></div>
                               </div>

                               {/* START: Added City Field */}
                               <div className="field-child field-child--width-12 field-left field-right">
                                 <div className="input-container">
                                   <input
                                     className="input"
                                     name="city"
                                     placeholder="City"
                                     value={billingInfo.city}
                                     onChange={handleInputChange}
                                     required
                                   />
                                 </div>
                                 {errors.city && <p className="error-message">{errors.city}</p>}
                               </div>
                               {/* END: Added City Field */}

                               <div className="field-child field-child--width-6 field-left field-bottom">
                                 {states.length > 0 ? (
                                   <div className="input-wrapper">
                                    <div className="select-wrapper">
                                      <select name="state" className="select" value={billingInfo.state} onChange={handleStateChange} required>
                                        <option value="" disabled>State</option>
                                        {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                                      </select>
                                      <svg className="select-arrow" focusable="false" viewBox="0 0 12 12"><path d="M10.193 3.97a.75.75 0 0 1 1.062 1.062L6.53 9.756a.75.75 0 0 1-1.06 0L.745 5.032A.75.75 0 0 1 1.807 3.97L6 8.163l4.193-4.193z" fillRule="evenodd"></path></svg>
                                    </div>
                                   </div>
                                 ) : (
                                   <div className="input-container"><input className="input" name="state" placeholder="State / Province" value={billingInfo.state} onChange={handleInputChange} /></div>
                                 )}
                                 {errors.state && <p className="error-message">{errors.state}</p>}
                               </div>

                               <div className="field-child field-child--width-6 field-right field-bottom">
                                 <div className="input-container"><input className="input" name="postalCode" placeholder="ZIP / Postal code" value={billingInfo.postalCode} onChange={handleInputChange} required /></div>
                                 {errors.postalCode && <p className="error-message">{errors.postalCode}</p>}
                               </div>
                             </div>
                           </fieldset>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PIX Payment Method */}
                {pixSupported && (
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => handlePaymentMethodChange('pix')}>
                      <input
                        id="payment-method-pix"
                        name="payment-method"
                        type="radio"
                        className="radio-btn"
                        value="pix"
                        checked={selectedPaymentMethod === 'pix'}
                        onChange={() => handlePaymentMethodChange('pix')}
                      />
                      <div className="payment-title-inner">
                        <div className="payment-icon pix-icon">PIX</div>
                        <div className="payment-title-text">PIX</div>
                      </div>
                    </div>
                    {selectedPaymentMethod === 'pix' && (
                       <div className="accordion-content">
                         <p style={{fontSize: '14px', color: 'hsla(0,0%,10%,0.7)'}}>You will receive PIX payment instructions after clicking "Pay".</p>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Information */}
            <div className="signup-form">
              <div className="signup-header">
                <label htmlFor="save-info-checkbox" className="checkbox-field">
                  <input
                    id="save-info-checkbox"
                    name="saveInfo"
                    type="checkbox"
                    className="checkbox-input"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                  />
                  <span className="checkbox-styled">
                    <svg className="checkbox-tick" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                  <div className="checkbox-label">
                      <div className="signup-label-header">Save my info for 1-click checkout with Link</div>
                      <div className="signup-sub-label">Securely pay on this site and everywhere Link is accepted.</div>
                  </div>
                </label>
              </div>
            </div>

            {paymentError && <div className="payment-error-display">{paymentError}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || processing || (selectedPaymentMethod === 'card' && (!stripe || !elements))}
            >
              {isSubmitting || processing ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                `Pay ${getDisplayAmount()}`
              )}
            </button>
          </div>
        </form>

        <footer className="footer">
          <div>Your payment information is secure.</div>
          <div className="footer-links">
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Privacy</a>
          </div>
        </footer>
      </main>
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
  quantity,
  onCountryChange,
  onStateChange
}) => {
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    email: '', phone: '', name: '', address: '', city: '', state: '', postalCode: '', country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Use the already initialized Stripe promise
  const [stripeApiPromise] = useState<Promise<Stripe | null> | null>(() => {
    logger.info('[PaymentForm] Using pre-initialized Stripe.js promise.');
    return getStripeInstance();
  });
  const [stripeError, setStripeError] = useState<string>('');

  // Remove the country detection useEffect from here since it's now handled in CheckoutForm

  // Monitor stripe promise for errors
  useEffect(() => {
    if (stripeApiPromise) {
      stripeApiPromise.catch(err => {
        setStripeError('Could not connect to payment processor. Please check the configuration and try again.');
      });
    }
  }, [stripeApiPromise]);

  if (stripeError) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '6px',
        border: '1px solid #fecaca',
        padding: '20px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Ubuntu", sans-serif'
      }}>
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
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Ubuntu", sans-serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 20px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            background: '#635bff',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite',
            margin: '0 3px'
          }}></div>
          <div style={{
            width: '20px',
            height: '20px',
            background: '#635bff',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite 0.2s',
            margin: '0 3px'
          }}></div>
          <div style={{
            width: '20px',
            height: '20px',
            background: '#635bff',
            borderRadius: '50%',
            animation: 'pulse 1.5s ease-in-out infinite 0.4s',
            margin: '0 3px'
          }}></div>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 80%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
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
        onCountryChange={onCountryChange}
        onStateChange={onStateChange}
      />
    </Elements>
  );
};

export default PaymentForm;