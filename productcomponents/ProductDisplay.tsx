// productcomponents/ProductDisplay.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct, IVariantSelection, IBillingInfo, ITransactionItem } from '../productlib/types';
import { formatPrice, getUserCurrency, convertPrice, isPixSupported } from '../productlib/currency';
import { isProductInStock, calculateShippingFee, generateTransactionId as generateFrontendTxId } from '../productlib/utils';
import { createTransaction, getIPAddress, getDeviceInfo } from '../productlib/api';
import { calculateVATAmount, getTaxInfo } from '../productlib/tax';
import PaymentForm from './PaymentForm';
import CheckoutSummary from './CheckoutSummary';

interface ProductWithLocalCurrency extends IProduct {
  localPrice?: number;
  localCurrency?: string;
}

interface ProductDisplayProps {
  product: IProduct;
}

const ProductDisplay: React.FC<ProductDisplayProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithLocalCurrency>(initialProduct);
  const [isLoading, setIsLoading] = useState(true);
  const [localCurrency, setLocalCurrency] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<IVariantSelection[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [currentVAT, setCurrentVAT] = useState<number>(0);
  const [taxInfo, setTaxInfo] = useState<{ rate: number; type: string; currency: string }>({ rate: 0, type: 'none', currency: 'USD' });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  useEffect(() => {
    // Generate transaction ID early
    setTransactionId(generateFrontendTxId());
    
    const fetchUserCurrencyAndProductDetails = async () => {
      try {
        setIsLoading(true);
        const currency = await getUserCurrency();
        setLocalCurrency(currency);
        
        if (currency && currency !== initialProduct.defaultCurrency && initialProduct.autoLocalPrice) {
          try {
            const convertedPrice = await convertPrice(initialProduct.price, initialProduct.defaultCurrency, currency);
            setProduct({ ...initialProduct, localPrice: convertedPrice, localCurrency: currency });
          } catch (convError) {
            console.error('[ProductDisplay] Error converting price:', convError);
            setProduct(initialProduct);
          }
        } else {
          setProduct(initialProduct);
        }
      } catch (error) {
        console.error('[ProductDisplay] Error fetching user currency:', error);
        setLocalCurrency(initialProduct.defaultCurrency);
        setProduct(initialProduct);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserCurrencyAndProductDetails();

    if (initialProduct.type === 'physical' && initialProduct.physical?.shippingMethods?.length) {
      setSelectedShipping(initialProduct.physical.shippingMethods[0].name);
    }

    // Initialize variant selections
    if (initialProduct.variants && initialProduct.variants.length > 0) {
      const initialSelections = initialProduct.variants.map(variant => ({
        name: variant.name,
        value: '',
      }));
      setVariantSelections(initialSelections);
    }
  }, [initialProduct]);

  // Fixed VAT calculation with debouncing and stable references
  useEffect(() => {
    const updateVAT = async () => {
      if (!selectedCountry) {
        setCurrentVAT(0);
        setTaxInfo({ rate: 0, type: 'none', currency: 'USD' });
        return;
      }

      try {
        console.log(`[ProductDisplay] Calculating VAT for country: ${selectedCountry}, state: ${selectedState}`);
        
        // Get the actual price to calculate VAT on (including conversion)
        const priceForVAT = product.localPrice || initialProduct.price;
        const subtotal = priceForVAT * quantity;
        
        // Calculate VAT - always enabled now
        const vatAmount = await calculateVATAmount(subtotal, selectedCountry, selectedState);
        console.log(`[ProductDisplay] VAT calculated: ${vatAmount} for subtotal: ${subtotal}`);
        setCurrentVAT(vatAmount);

        // Get tax info for display
        const info = await getTaxInfo(selectedCountry, selectedState);
        console.log(`[ProductDisplay] Tax info:`, info);
        setTaxInfo(info);
      } catch (error) {
        console.error('Error updating VAT:', error);
        setCurrentVAT(0);
        setTaxInfo({ rate: 0, type: 'none', currency: 'USD' });
      }
    };

    // Debounce the VAT calculation to prevent rapid recalculation
    const timeoutId = setTimeout(updateVAT, 200);
    return () => clearTimeout(timeoutId);
  }, [selectedCountry, selectedState, quantity, product.localPrice, initialProduct.price]);

  const paymentDetails = useMemo(() => {
    // Get the display price and currency
    const displayPrice = product.localPrice ?? initialProduct.price;
    const displayCurrency = product.localCurrency || initialProduct.defaultCurrency;
    
    // Calculate components
    const subtotal = displayPrice * quantity;
    const shipping = calculateShippingFee(initialProduct, selectedShipping);
    const vat = currentVAT;
    const total = subtotal + vat + shipping;

    console.log(`[ProductDisplay] Payment details - Subtotal: ${subtotal}, VAT: ${vat}, Shipping: ${shipping}, Total: ${total}`);

    // Amount for Stripe must be in the smallest currency unit (e.g., cents, pence)
    const totalSmallestUnit = Math.round(total * 100);

    return {
      amount: totalSmallestUnit,
      currency: displayCurrency,
      subtotal,
      vat,
      shipping,
      total,
      displayPrice,
      displayCurrency
    };
  }, [product, initialProduct, quantity, selectedShipping, currentVAT]);

  // Check if product can be purchased (stock availability)
  const canPurchase = useMemo(() => {
    // Check if all required variants are selected
    if (initialProduct.variants && initialProduct.variants.length > 0) {
      const allVariantsSelected = variantSelections.every(selection => selection.value);
      if (!allVariantsSelected) {
        return false;
      }
    }

    return isProductInStock(initialProduct, variantSelections, quantity);
  }, [initialProduct, variantSelections, quantity]);

  // Get maximum available quantity
  const maxQuantity = useMemo(() => {
    if (initialProduct.type === 'digital') {
      return 999; // Digital products have no quantity limit
    }

    if (initialProduct.type === 'physical') {
      // Check if stock management is enabled
      let hasStockManagement = false;
      let minStock = 999;

      // If variants exist, check variant stock management
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        const allVariantsSelected = variantSelections.every(selection => selection.value);
        if (!allVariantsSelected) {
          return 1;
        }

        // Check if any variant has stock management enabled
        for (const variant of initialProduct.variants) {
          const selection = variantSelections.find(s => s.name === variant.name);
          if (selection && variant.stock !== undefined) {
            hasStockManagement = true;
            minStock = Math.min(minStock, variant.stock);
          }
        }
      } else {
        // No variants - check product stock management
        if (initialProduct.physical?.stock !== undefined) {
          hasStockManagement = true;
          minStock = initialProduct.physical.stock;
        }
      }

      // If no stock management is enabled, return unlimited (999)
      if (!hasStockManagement) {
        return 999;
      }

      return Math.max(0, minStock);
    }

    return 999;
  }, [initialProduct, variantSelections]);

const handleSubmit = async (
  billingInfo: IBillingInfo,
  paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other',
  statusFromStripe: 'pending' | 'successful' | 'canceled',
  paymentIntentIdFromStripe?: string
) => {
  if (!transactionId) {
    console.error("[ProductDisplay] handleSubmit: transactionId is missing.");
    setErrorMessage("A transaction ID is missing. Please refresh and try again.");
    setIsSubmitting(false);
    return;
  }
  
  console.log(`[ProductDisplay] handleSubmit. PaymentProvider Status: ${statusFromStripe}, PI_ID: ${paymentIntentIdFromStripe}, App TxID: ${transactionId}, Qty: ${quantity}`);
  
  setIsSubmitting(true);
  setErrorMessage('');
    
  try {
    const { deviceInfo, browserInfo } = getDeviceInfo();
    const ipAddress = await getIPAddress();
    
    // Use the calculated payment details which include VAT
    const { subtotal, vat, shipping, total, displayCurrency } = paymentDetails;

    // IMPORTANT: Backend should receive pre-tax total, but payment processor charges full amount
    const backendTotal = subtotal + shipping; // Exclude VAT from backend total
    const chargedTotal = total; // Full amount charged by payment processor

    console.log(`[ProductDisplay] Payment breakdown - Charged: ${chargedTotal}, Backend Total: ${backendTotal}, VAT: ${vat}`);

    // Prepare items array in the format expected by backend
    const items: ITransactionItem[] = [{
      productId: initialProduct._id,
      productSlug: initialProduct.slug,
      productName: initialProduct.title,
      productType: initialProduct.type,
      productOwnerId: initialProduct.merchantId || '',
      quantity: quantity,
      unitPrice: product.localPrice || initialProduct.price,
      totalPrice: subtotal, // This is unitPrice * quantity (pre-tax)
      currency: displayCurrency,
      vatEnabled: true, // Always enabled now
      vatAmount: 0, // Don't include VAT in line item, it goes to metadata
      variants: variantSelections.length > 0 ? variantSelections : undefined,
    }];

    const transactionData = {
      items,
      saleCurrency: displayCurrency,
      total: backendTotal, // Backend gets pre-tax total
      subtotal: subtotal,
      shippingFee: shipping,
      paymentMethod,
      buyerEmail: billingInfo.email,
      buyerPhone: billingInfo.phone || '',
      billingName: billingInfo.name,
      billingAddress: billingInfo.address,
      billingCity: billingInfo.city,
      billingState: billingInfo.state,
      billingPostalCode: billingInfo.postalCode,
      billingCountry: billingInfo.country,
      ipAddress: ipAddress || '127.0.0.1',
      deviceInfo: deviceInfo || 'Unknown Device',
      browserInfo: browserInfo || 'Unknown Browser',
      status: statusFromStripe,
      
      ...(paymentMethod === 'card' && {
        useStripe: true,
        paymentIntentId: paymentIntentIdFromStripe,
      }),
      
      metadata: {
        transactionId: transactionId,
        client_quantity: quantity,
        client_selectedShipping: selectedShipping,
        client_variantSelections: variantSelections,
        client_localCurrencyAttempt: localCurrency,
        stripe_charged_amount_smallest_unit: paymentDetails.amount, // Full amount charged
        stripe_charged_currency: paymentDetails.currency,
        stripe_charged_total_display: chargedTotal, // Full amount including VAT
        vat: vat, // VAT amount charged but not included in backend total
        vat_amount: vat, // Duplicate for backward compatibility
        vat_rate: taxInfo.rate,
        vat_country: selectedCountry,
        vat_state: selectedState,
        vat_type: taxInfo.type,
        backend_total_excluding_vat: backendTotal,
        initial_product_price: initialProduct.price,
        initial_product_currency: initialProduct.defaultCurrency,
        auto_local_price_setting: initialProduct.autoLocalPrice,
        converted_unit_local_price: product.localPrice,
        converted_local_currency: product.localCurrency,
        productSource: initialProduct.productSource || 'hosted',
        // Additional metadata for better transaction tracking
        product_sku: initialProduct.sku,
        product_barcode: initialProduct.barcode,
        product_type: initialProduct.type,
        quantity_enabled: initialProduct.quantityEnabled,
        // Digital product specific metadata
        ...(initialProduct.type === 'digital' && initialProduct.digital?.recurring && {
          subscription_interval: initialProduct.digital.recurring.interval,
          subscription_has_trial: initialProduct.digital.recurring.hasTrial,
          subscription_trial_days: initialProduct.digital.recurring.trialDays,
        }),
        // Physical product specific metadata
        ...(initialProduct.type === 'physical' && {
          shipping_method: selectedShipping,
          has_variants: (initialProduct.variants?.length || 0) > 0,
          selected_variants: variantSelections,
          stock_managed: initialProduct.physical?.stock !== undefined,
          product_weight: initialProduct.physical?.weight,
          product_dimensions: initialProduct.physical?.dimensions,
        }),
      },
    };
      
      console.log('[ProductDisplay] Creating/Updating transaction with data for backend:', JSON.stringify(transactionData, null, 2));
      const response = await createTransaction(transactionData);
      
      if (response.success && response.data?.transactionId) {
        const finalStatus = response.data.transaction?.status || statusFromStripe;
        console.log(`[ProductDisplay] Backend transaction successful. TxID: ${response.data.transactionId}, Final Status: ${finalStatus}`);
        
        // Always redirect to payment status page with our transaction ID
        router.push(`/product/payment?transactionId=${transactionId}&status=${finalStatus}`);
      } else {
        console.error('[ProductDisplay] Failed to process transaction on backend:', response.message, response.errors);
        const backendErrorMsg = response.errors ? 
          (typeof response.errors === 'string' ? response.errors : JSON.stringify(response.errors)) : 
          response.message;
        throw new Error(backendErrorMsg || 'Failed to process transaction on backend.');
      }
    } catch (error) {
      console.error('[ProductDisplay] Error submitting transaction:', error);
      setErrorMessage((error as Error).message || 'An unexpected error occurred during final submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantChange = (variantName: string, value: string) => {
    const newSelections = variantSelections.map(selection => 
      selection.name === variantName 
        ? { ...selection, value } 
        : selection
    );
    setVariantSelections(newSelections);
  };

  const handleQuantityChange = (newQuantity: number) => {
    const maxQty = maxQuantity;
    const finalQuantity = Math.min(Math.max(1, newQuantity), maxQty);
    setQuantity(finalQuantity);
  };

  // Fixed handlers with useCallback to prevent unnecessary re-renders
  const handleCountryChange = useCallback((countryCode: string) => {
    console.log(`[ProductDisplay] Country changed to: ${countryCode}`);
    setSelectedCountry(prevCountry => {
      if (prevCountry !== countryCode) {
        setSelectedState(''); // Reset state when country changes
        return countryCode;
      }
      return prevCountry;
    });
  }, []);

  const handleStateChange = useCallback((stateCode: string) => {
    console.log(`[ProductDisplay] State changed to: ${stateCode}`);
    setSelectedState(prevState => prevState !== stateCode ? stateCode : prevState);
  }, []);

  const formatImageUrl = (url: string): string => {
    // If it's already a full URL, use it as-is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Make sure URLs that start with /uploads have the proper /api prefix
    if (url.startsWith('/uploads') && !url.startsWith('/api/uploads')) {
      return `/api${url}`;
    }
    
    // URLs that already have /api/uploads are good
    if (url.startsWith('/api/uploads')) {
      return url;
    }
    
    // For all other cases, ensure it has the complete path
    return `/api/uploads/${url.replace(/^\//, '')}`;
  };

  const getMainImageUrl = (): string => {
    if (!product.images || product.images.length === 0) return '';
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    return mainImage ? formatImageUrl(mainImage.url) : '';
  };

  // Get available stock text
  const getStockText = (): string => {
    if (initialProduct.type === 'digital') {
      return '';
    }

    // Check if stock management is enabled
    let hasStockManagement = false;
    let stock = 0;

    // If variants exist
    if (initialProduct.variants && initialProduct.variants.length > 0) {
      const allVariantsSelected = variantSelections.every(selection => selection.value);
      if (!allVariantsSelected) {
        return 'Select all options to see availability';
      }

      // Check if any selected variant has stock management
      let minStock = 999;
      for (const variant of initialProduct.variants) {
        const selection = variantSelections.find(s => s.name === variant.name);
        if (selection && variant.stock !== undefined) {
          hasStockManagement = true;
          minStock = Math.min(minStock, variant.stock);
        }
      }
      stock = minStock;
    } else {
      // No variants - check product stock
      if (initialProduct.physical?.stock !== undefined) {
        hasStockManagement = true;
        stock = initialProduct.physical.stock;
      }
    }

    // If no stock management is enabled, it means unlimited stock
    if (!hasStockManagement) {
      return ''; // Don't show any stock info for unlimited stock
    }

    if (stock === 0) {
      return 'Out of stock';
    } else if (stock < 10) {
      return `Only ${stock} left in stock`;
    } else {
      return `${stock} available`;
    }
  };

  // Format recurring subscription text
  const getRecurringText = (): string => {
    if (initialProduct.type !== 'digital' || !initialProduct.digital?.recurring) {
      return '';
    }

    const { interval } = initialProduct.digital.recurring;
    
    let intervalText = '';
    if (interval === 'monthly') {
      intervalText = '/month';
    } else if (interval === 'yearly') {
      intervalText = '/year';
    }

    return intervalText;
  };

  // Get trial text
  const getTrialText = (): string => {
    if (initialProduct.type !== 'digital' || !initialProduct.digital?.recurring?.hasTrial) {
      return '';
    }

    const trialDays = initialProduct.digital.recurring.trialDays || 0;
    if (trialDays > 0) {
      return `${trialDays}-day free trial`;
    } else {
      return 'Free trial';
    }
  };

  const openQuantityModal = () => {
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
  };

if (isLoading || !transactionId) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f6f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#635bff',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite both',
              margin: '0 2px'
            }}></div>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#635bff',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite both',
              animationDelay: '-0.32s',
              margin: '0 2px'
            }}></div>
            <div style={{
              width: '12px',
              height: '12px',
              background: '#635bff',
              borderRadius: '50%',
              animation: 'bounce 1.4s ease-in-out infinite both',
              animationDelay: '-0.16s',
              margin: '0 2px'
            }}></div>
          </div>
          <style jsx>{`
            @keyframes bounce {
              0%, 80%, 100% { 
                transform: scale(0);
                opacity: 0.5;
              } 
              40% { 
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const { subtotal, vat, shipping, total, displayPrice, displayCurrency } = paymentDetails;
  const stockText = getStockText();
  const recurringText = getRecurringText();
  const trialText = getTrialText();

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes enterNoScale {
          0% { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 12px 12px 0 0;
          animation: slideUp 0.3s ease-out;
          max-height: 80vh;
          overflow-y: auto;
        }

        @media (min-width: 768px) {
          .modal-backdrop {
            align-items: center;
          }
          
          .modal-content {
            border-radius: 12px;
            max-height: 600px;
          }
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e6ebf1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #32325d;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #8898aa;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f8f9fa;
          color: #32325d;
        }

        .modal-body {
          padding: 24px;
        }

        .quantity-modal-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .quantity-modal-btn {
          width: 48px;
          height: 48px;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          background: white;
          color: #32325d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.15s;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .quantity-modal-btn:hover:not(:disabled) {
          background: #f8f9fa;
          box-shadow: 0 0 0 1px #635bff, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .quantity-modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-modal-input {
          width: 80px;
          height: 48px;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          text-align: center;
          font-size: 20px;
          font-weight: 600;
          color: #32325d;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .quantity-modal-input:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgba(50,151,211,0.7), 0 1px 1px 0 rgba(0,0,0,0.07), 0 0 0 4px rgba(50,151,211,0.3);
        }

        .stock-info-modal {
          text-align: center;
          font-size: 14px;
          margin-bottom: 24px;
          color: #8898aa;
        }

        .stock-info-modal.low {
          color: #f59e0b;
        }

        .stock-info-modal.out {
          color: #ef4444;
        }

        /* Mobile summary dropdown */
        .mobile-summary-toggle {
          display: none;
        }

        @media (max-width: 991.98px) {
          .mobile-summary-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #32325d;
            cursor: pointer;
            background: none;
            border: none;
            padding: 8px 0;
          }

          .mobile-summary-toggle svg {
            width: 12px;
            height: 12px;
            transition: transform 0.2s;
          }

          .mobile-summary-toggle.open svg {
            transform: rotate(180deg);
          }

          .mobile-summary-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: calc(100vw - 32px);
            max-width: 380px;
            margin-top: 8px;
            animation: slideDown 0.3s ease-out;
            z-index: 100;
          }

          .mobile-summary-content {
            padding: 16px;
          }
        }

        /* Main styles following HTML design */
        * {
          box-sizing: border-box;
        }
        
        .container {
          height: 100vh;
          height: 100dvh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: #f7f7f7;
        }
        
.app {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 0;
          width: 100%;
          padding-top: 16px;
          animation: enterNoScale 0.6s;
          position: relative;
        }
        
        .overview {
          width: 100%;
          padding: 0 16px 16px;
        }
        
        .overview > * {
          margin: 0 auto;
          max-width: 380px;
        }
        
        .payment {
          background-color: white;
          padding-top: 24px;
          transition: background-color 0.4s ease-in-out;
          z-index: 1;
          padding: 0 16px 16px;
          width: 100%;
        }
        
        .payment > * {
          margin: 0 auto;
          max-width: 380px;
        }
        
        /* Header */
        .header {
          min-height: 28px;
          z-index: 12;
          background-color: white;
        }
        
        .header-content {
          margin: auto;
          max-width: 380px;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          position: relative;
        }
        
        .business {
          display: flex;
          align-items: center;
          max-width: 100%;
          min-width: 0;
        }
        
        .business > * {
          flex: 0 1 auto;
          max-width: 100%;
          min-width: 0;
        }
        
        .business-image {
          flex-basis: auto;
          flex-shrink: 0;
        }
        
        .business-icon {
          width: 28px;
          height: 28px;
          border-radius: 100%;
          box-shadow: 0 2px 5px 0 rgba(50,50,93,0.1), 0 1px 1px 0 rgba(0,0,0,0.07);
          margin-right: 8px;
          background: white;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .business-icon svg {
          fill: hsla(0,0%,10%,0.5);
          width: 12px;
          height: 12px;
        }
        
        .business-name {
          color: hsla(0,0%,10%,0.9);
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Product Summary */
        .product-summary {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: default;
          text-align: center;
          margin-bottom: 24px;
        }
        
        .product-summary.no-image {
          margin-bottom: calc(16px + 12.5px);
        }
        
        .product-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
        }
        
        .product-name {
          color: hsla(0,0%,10%,0.6);
          font-size: 16px;
          font-weight: 600;
          margin-right: 20px;
          position: relative;
          word-break: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          max-width: 100%;
        }
        
        .amounts-container {
          position: relative;
        }
        
        .totals-read {
          opacity: 1;
        }
        
        .total-amount-container {
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        
        .total-amount {
          font-size: 28px;
          margin: 0 0 3px;
          font-weight: 600;
          color: hsla(0,0%,10%,0.9);
          font-variant-numeric: tabular-nums;
          
        }

        .subscription-interval {
          font-size: 16px;
          font-weight: 400;
          color: hsla(0,0%,10%,0.6);
          margin-left: 2px;
        }
        
        .amounts-descriptions {
          transition: all 0.3s ease;
        }
        
        .product-description {
          color: hsla(0,0%,10%,0.6);
          font-size: 14px;
          font-weight: 500;
          display: block;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          max-width: 100%;
        }

        /* Product images section */
        .product-images-section {
          margin: 16px 0;
        }

        .product-image-main {
          width: 100%;
          max-width: 200px;
          height: 150px;
          background: #f6f9fc;
          border-radius: 8px;
          margin: 0 auto 12px;
          overflow: hidden;
          border: 1px solid #e6ebf1;
          cursor: pointer;
        }

        .product-image-main img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-image-main:hover img {
          transform: scale(1.05);
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: hsla(0,0%,10%,0.5);
          font-size: 14px;
        }

        .product-image-placeholder svg {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;
          fill: currentColor;
          opacity: 0.5;
        }

        .product-thumbnails {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .product-thumbnail {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f6f9fc;
        }

        .product-thumbnail:hover {
          border-color: #cfd7df;
        }

        .product-thumbnail.active {
          border-color: #635bff;
          box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.2);
        }

        .product-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

/* Quantity selector */
.quantity-section {
  margin: 24px 0;
  display: flex;
  align-items: center;
  justify-content: center; /* This will center the block on all screens */
  gap: 20px; /* Space between text and button */
}

.quantity-text-block {
  text-align: left;
}

     .quantity-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: hsla(0,0%,10%,0.7);
  margin-bottom: 4px;
}

        .quantity-button {
          background: white;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 16px;
          font-weight: 500;
          color: #32325d;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 90px;
        }

        .quantity-button:hover {
          box-shadow: 0 0 0 1px #635bff, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .quantity-button svg {
          width: 12px;
          height: 12px;
          fill: currentColor;
          margin-left: auto;
        }

        .stock-info {
  font-size: 12px;
  margin-top: 0; /* Reset margin as layout is now handled by flex */
  text-align: left;
  color: hsla(0,0%,10%,0.6);
}

        .stock-available {
          color: #16a34a;
        }

        .stock-warning {
          color: #f59e0b;
        }

        .stock-error {
          color: #ef4444;
        }

        /* Product meta section */
        .product-meta {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          font-size: 13px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .meta-row:last-child {
          margin-bottom: 0;
        }

        .meta-label {
          color: #6b7c93;
          font-weight: 500;
        }

.meta-value {
          color: #32325d;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }



        /* Tax information section */
        .tax-info-section {
          background: #f0f7ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          font-size: 13px;
          color: #1e40af;
        }

        .tax-info-title {
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tax-info-title svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }

        .tax-info-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Summary section for desktop */
        .summary-section {
          display: none;
          margin-top: 24px;
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
        }

        /* Responsive Design */
        @media only screen and (min-width: 992px) {
          .container {
            height: 100%;
          }
          
          .app {
            align-items: stretch;
            transform: translateY(max(48px, calc(50vh - 600px)));
            padding-top: 0;
            animation-delay: 0.2s;
            animation-fill-mode: backwards;
            flex-direction: row;
            justify-content: space-between;
            max-width: 920px;
          }
          
          .overview {
            padding-bottom: calc(16px + 12px);
            margin-bottom: 0;
            width: 380px;
            margin: 0;
            padding: 0;
          }
          
          .payment {
            height: 100%;
            padding-top: 0;
            margin: 0;
            padding: 24px 20px 24px 20px;
            width: 400px;
          }
          
          .payment > * {
            max-width: none;
            margin: 0;
          }
          
          .header {
            background-color: inherit;
          }
          
          .product-summary {
            justify-content: left;
            align-items: flex-start;
            margin-top: 48px;
            text-align: left;
          }
          
          .total-amount {
            font-size: 36px;
          }
          
          .total-amount-container {
            justify-content: flex-start;
          }

          .summary-section {
            display: block;
          }

          .quantity-section {
            text-align: left;
          }
        }

        /* Variants styling */
        .variants-section {
          margin: 20px 0;
        }

        .variant-group {
          margin-bottom: 16px;
        }

        .variant-label {
          font-size: 13px;
          font-weight: 500;
          color: hsla(0,0%,10%,0.7);
          margin-bottom: 8px;
          display: block;
        }

        .variant-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .variant-option {
          padding: 8px 16px;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          background: white;
          color: #32325d;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .variant-option:hover:not(.disabled) {
          box-shadow: 0 0 0 1px #635bff, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .variant-option.selected {
          background: #635bff;
          color: white;
          border-color: #635bff;
        }

        .variant-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Shipping methods styling */
        .shipping-section {
          margin: 20px 0;
        }

        .shipping-label {
          font-size: 13px;
          font-weight: 500;
          color: hsla(0,0%,10%,0.7);
          margin-bottom: 8px;
          display: block;
        }

        .shipping-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shipping-option {
          padding: 12px 16px;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 0 0 1px #e0e0e0, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .shipping-option:hover {
          box-shadow: 0 0 0 1px #635bff, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .shipping-option.selected {
          border-color: #635bff;
          box-shadow: 0 0 0 1px #635bff, 0 2px 4px 0 rgba(0,0,0,0.07), 0 1px 1.5px 0 rgba(0,0,0,0.05);
        }

        .shipping-option-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shipping-option-name {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
        }

        .shipping-option-details {
          font-size: 12px;
          color: hsla(0,0%,10%,0.6);
        }

        .shipping-option-price {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
        }

        /* Subscription and trial badges */
        .subscription-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f0f7ff;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          font-size: 12px;
          color: #1d4ed8;
          font-weight: 500;
          margin: 8px 0;
        }

        .subscription-badge svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        .trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f0fdf4;
          border: 1px solid #22c55e;
          border-radius: 6px;
          font-size: 12px;
          color: #166534;
          font-weight: 500;
          margin: 8px 0;
        }

        .trial-badge svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        /* Error message */
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
          color: #dc2626;
          font-size: 14px;
          text-align: center;
        }

        .availability-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
          color: #dc2626;
          font-size: 14px;
          text-align: center;
        }
      `}</style>
      
      <div className="container">
        <div className="app">
          <div className="overview">
            <header className="header">
              <div className="header-content">
                <div style={{ flex: '0 1 auto', maxWidth: '100%', minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  <div className="business">
                    <div className="business-icon business-image">
                      <svg focusable="false" viewBox="0 0 16 16">
                        <path d="M3 7.5V12h10V7.5c.718 0 1.398-.168 2-.468V15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7.032c.602.3 1.282.468 2 .468zM0 3L1.703.445A1 1 0 0 1 2.535 0h10.93a1 1 0 0 1 .832.445L16 3a3 3 0 0 1-5.5 1.659C9.963 5.467 9.043 6 8 6s-1.963-.533-2.5-1.341A3 3 0 0 1 0 3z" fillRule="evenodd"></path>
                      </svg>
                    </div>
                    <h1 className="business-name">Store</h1>
                  </div>
                </div>
                {/* Mobile summary toggle */}
                <button
                  className={`mobile-summary-toggle ${showMobileSummary ? 'open' : ''}`}
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                >
                  Summary
                  <svg viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10.193 3.97a.75.75 0 0 1 1.062 1.062L6.53 9.756a.75.75 0 0 1-1.06 0L.745 5.032A.75.75 0 0 1 1.807 3.97L6 8.163l4.193-4.193z" fillRule="evenodd"></path>
                  </svg>
                </button>
                {showMobileSummary && (
                  <div className="mobile-summary-dropdown">
                    <div className="mobile-summary-content">
                      <CheckoutSummary
                        product={product}
                        quantity={quantity}
                        variantSelections={variantSelections}
                        selectedShipping={selectedShipping}
                        localCurrency={localCurrency}
                        subtotal={subtotal}
                        vat={vat}
                        shipping={shipping}
                        total={total}
                        displayCurrency={displayCurrency}
                        taxRate={taxInfo.rate}
                      />
                    </div>
                  </div>
                )}
              </div>
            </header>

            <div className="product-summary">
              {/* Product Images */}
              <div className="product-images-section">
                {product.images && product.images.length > 0 ? (
                  <>
                    <div className="product-image-main">
                      <img 
                        src={formatImageUrl(product.images[selectedImageIndex]?.url || product.images[0].url)} 
                        alt={product.title} 
                      />
                    </div>
                    
                    {product.images.length > 1 && (
                      <div className="product-thumbnails">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            className={`product-thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                            onClick={() => setSelectedImageIndex(index)}
                            type="button"
                          >
                            <img
                              src={formatImageUrl(image.url)}
                              alt={`Thumbnail ${index + 1}`}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="product-image-main">
                    <div className="product-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
                      </svg>
                      <div>No image available</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="product-info">
                <span className="product-name">
                  <div style={{ WebkitLineClamp: 2 }}>{product.title}</div>
                </span>
                <div className="amounts-container">
                  <div className="totals-read">
                    <div className="total-amount-container">
                      <div>
                        <span className="total-amount">
                          {formatPrice(total, displayCurrency)}
                          {recurringText && (
                            <span className="subscription-interval">{recurringText}</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div>
                        <div className="amounts-descriptions">
                          <span className="product-description">
                            <div>
                              <div>{product.shortDescription}</div>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trial and subscription badges */}
                {trialText && (
                  <div className="trial-badge">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" fill="currentColor"/>
                    </svg>
                    {trialText}
                  </div>
                )}
                {recurringText && (
                  <div className="subscription-badge">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 12.79 17.85 13.54 17.57 14.21L19.07 15.71C19.66 14.71 20 13.39 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 11.21 6.15 10.46 6.43 9.79L4.93 8.29C4.34 9.29 4 10.61 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z" fill="currentColor"/>
                    </svg>
                    Subscription
                  </div>
                )}

                {/* Product Meta Information (SKU, Barcode) */}
                {(initialProduct.sku || initialProduct.barcode) && (
                  <div className="product-meta">
                    {initialProduct.sku && (
                      <div className="meta-row">
                        <span className="meta-label">SKU:</span>
                        <span className="meta-value">{initialProduct.sku}</span>
                      </div>
                    )}
                    {initialProduct.barcode && (
                      <div className="meta-row">
                        <span className="meta-label">Barcode:</span>
                        <span className="meta-value">{initialProduct.barcode}</span>
                      </div>
                    )}
                  </div>
                )}

{/* Quantity and Stock Section */}
{initialProduct.quantityEnabled === true && (
  <div className="quantity-section">
    <div className="quantity-text-block">
      <label className="quantity-label">Quantity</label>
      {stockText && (
        <div className={`stock-info ${
          stockText.includes('Out of stock') ? 'stock-error' : 
          stockText.includes('Only') ? 'stock-warning' : 'stock-available'
        }`}>
          {stockText}
        </div>
      )}
    </div>
    <button className="quantity-button" onClick={openQuantityModal}>
      {quantity}
      <svg viewBox="0 0 12 12" fill="currentColor">
        <path d="M10.193 3.97a.75.75 0 0 1 1.062 1.062L6.53 9.756a.75.75 0 0 1-1.06 0L.745 5.032A.75.75 0 0 1 1.807 3.97L6 8.163l4.193-4.193z" fillRule="evenodd"></path>
      </svg>
    </button>
  </div>
)}



                {/* Tax Information Display 
                {selectedCountry && taxInfo.rate > 0 && (
                  <div className="tax-info-section">
                    <div className="tax-info-title">
                      <svg viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,17H11V15H13V17M13,13H11V7H13V13Z" fill="currentColor"/>
                      </svg>
                      Tax Information
                    </div>
                    <div className="tax-info-details">
                      <div>
                        <svg style={{ width: '12px', height: '12px', marginRight: '4px', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22S19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                        </svg>
                        Location: {selectedCountry}{selectedState ? `, ${selectedState}` : ''}
                      </div>
                      <div>
                        <svg style={{ width: '12px', height: '12px', marginRight: '4px', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z"/>
                        </svg>
                        {taxInfo.type.toUpperCase()} Rate: {(taxInfo.rate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Desktop summary section */}
                <div className="summary-section">
                  <CheckoutSummary
                    product={product}
                    quantity={quantity}
                    variantSelections={variantSelections}
                    selectedShipping={selectedShipping}
                    localCurrency={localCurrency}
                    subtotal={subtotal}
                    vat={vat}
                    shipping={shipping}
                    total={total}
                    displayCurrency={displayCurrency}
                    taxRate={taxInfo.rate}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Section */}
          <div className="payment">
            <main>
              {errorMessage && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}
              
              {!canPurchase && stockText && stockText.includes('Out of stock') ? (
                <div className="availability-message">
                  {stockText}
                </div>
              ) : (
                <>
                  {/* Variants Section */}
                  {initialProduct.variants && initialProduct.variants.length > 0 && (
                    <div className="variants-section">
                      {initialProduct.variants.map((variant, variantIndex) => {
                        const selection = variantSelections.find(s => s.name === variant.name);
                        
                        return (
                          <div key={variantIndex} className="variant-group">
                            <label className="variant-label">{variant.name}</label>
                            <div className="variant-options">
                              {variant.values.map((value, valueIndex) => {
                                // Check if this variant value is available
                                let isAvailable = true;
                                let stockInfo = '';
                                
                                // Only check stock if stock management is enabled (variant.stock is defined)
                                if (variant.stock !== undefined) {
                                  if (variant.stock === 0) {
                                    isAvailable = false;
                                    stockInfo = 'Out of stock';
                                  } else if (variant.stock < quantity) {
                                    isAvailable = false;
                                    stockInfo = `Only ${variant.stock} available`;
                                  } else if (variant.stock < 10) {
                                    stockInfo = `${variant.stock} left`;
                                  }
                                }
                                
                                const isSelected = selection?.value === value;
                                
                                return (
                                  <button
                                    key={valueIndex}
                                    className={`variant-option ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                    onClick={() => isAvailable && handleVariantChange(variant.name, value)}
                                    type="button"
                                  >
                                    {value}
                                    {stockInfo && (
                                      <span style={{ fontSize: '11px', marginLeft: '4px' }}>
                                        ({stockInfo})
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Shipping Section - Only for physical products */}
                  {initialProduct.type === 'physical' && initialProduct.physical?.shippingMethods && initialProduct.physical.shippingMethods.length > 0 && (
                    <div className="shipping-section">
                      <label className="shipping-label">Shipping Method</label>
                      <div className="shipping-options">
                        {initialProduct.physical.shippingMethods.map((method, index) => {
                          const isSelected = selectedShipping === method.name;
                          const shippingPrice = method.price > 0 
                            ? formatPrice(method.price, initialProduct.defaultCurrency)
                            : 'Free';
                          
                          return (
                            <button
                              key={index}
                              className={`shipping-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedShipping(method.name)}
                              type="button"
                            >
                              <div className="shipping-option-info">
                                <div className="shipping-option-name">{method.name}</div>
                                <div className="shipping-option-details">
                                  {method.minDays}-{method.maxDays} business days
                                </div>
                              </div>
                              <div className="shipping-option-price">{shippingPrice}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment Form */}
                  <PaymentForm
                    currency={paymentDetails.currency}
                    amount={paymentDetails.amount}
                    transactionId={transactionId}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    productOwnerId={initialProduct.merchantId || ''}
                    productId={initialProduct._id}
                    productName={initialProduct.title}
                    quantity={quantity}
                    onCountryChange={handleCountryChange}
                    onStateChange={handleStateChange}
                  />
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Quantity Modal */}
      {showQuantityModal && (
        <div className="modal-backdrop" onClick={closeQuantityModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Select Quantity</h3>
              <button className="modal-close" onClick={closeQuantityModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="quantity-modal-controls">
                <button
                  className="quantity-modal-btn"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="quantity-modal-input"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={maxQuantity}
                />
                <button
                  className="quantity-modal-btn"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= maxQuantity}
                >
                  +
                </button>
              </div>
              
              {maxQuantity < 999 && (
                <div className={`stock-info-modal ${maxQuantity < 10 ? 'low' : ''}`}>
                  Maximum available: {maxQuantity}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDisplay;