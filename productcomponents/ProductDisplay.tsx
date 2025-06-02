// productcomponents/ProductDisplay.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct, IVariantSelection, IBillingInfo, ITransactionItem } from '../productlib/types';
import { formatPrice, getUserCurrency, convertPrice, isPixSupported } from '../productlib/currency';
import { isProductInStock, calculateTotalPrice, generateTransactionId as generateFrontendTxId } from '../productlib/utils';
import { createTransaction, getIPAddress, getDeviceInfo } from '../productlib/api';
import PaymentForm from './PaymentForm';

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
  const [showProductDetails, setShowProductDetails] = useState(false);

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

  const paymentDetails = useMemo(() => {
    // Calculate total in the original product's default currency first
    const originalPrices = calculateTotalPrice(
      initialProduct, // Always use initialProduct for base calculation
      quantity,
      selectedShipping
    );

    // Determine the currency to be used for display and payment
    const displayCurrencyCode = product.localCurrency || initialProduct.defaultCurrency;
    let finalTotalMainUnit = originalPrices.total;
    let finalCurrencyCode = initialProduct.defaultCurrency;

    // Check if conversion to a local currency is applicable and desired
    if (
      displayCurrencyCode !== initialProduct.defaultCurrency &&
      product.localPrice !== undefined && // This is the converted unit price
      product.localCurrency === displayCurrencyCode && // Ensure product's localCurrency is set and matches display
      initialProduct.autoLocalPrice // Check if auto conversion is enabled
    ) {
      // Calculate conversion rate based on the single item's converted price
      const conversionRate = product.localPrice / initialProduct.price;
      
      // Apply conversion to all components of the price
      const convertedSubtotal = originalPrices.subtotal * conversionRate;
      const convertedVat = originalPrices.vat * conversionRate;
      const convertedShipping = originalPrices.shipping * conversionRate;
      
      finalTotalMainUnit = parseFloat((convertedSubtotal + convertedVat + convertedShipping).toFixed(2));
      finalCurrencyCode = displayCurrencyCode;
    } else {
      // If no conversion, use the total calculated in the product's default currency
      finalTotalMainUnit = originalPrices.total;
      finalCurrencyCode = initialProduct.defaultCurrency;
    }

    // Amount for Stripe must be in the smallest currency unit (e.g., cents, pence)
    const finalTotalSmallestUnit = Math.round(finalTotalMainUnit * 100);

    return {
      amount: finalTotalSmallestUnit,
      currency: finalCurrencyCode,
      prices: originalPrices,
      conversionRate: product.localPrice ? product.localPrice / initialProduct.price : 1,
    };
  }, [product, initialProduct, quantity, selectedShipping]);

  const canPurchase = isProductInStock(product, variantSelections);

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
      
      const originalPrices = calculateTotalPrice(
        initialProduct,
        quantity,
        selectedShipping
      );

      let txUnitPrice = initialProduct.price;
      let txSaleCurrency = initialProduct.defaultCurrency;
      let lineItemSubtotalWithoutVat = originalPrices.subtotal; // This is unitPrice * quantity in default currency
      let lineItemVat = originalPrices.vat; // VAT on that subtotal

      const useLocalForTx = product.localCurrency &&
        product.localCurrency !== initialProduct.defaultCurrency &&
        initialProduct.autoLocalPrice &&
        product.localPrice !== undefined;

      if (useLocalForTx && product.localPrice) {
        const conversionRate = product.localPrice / initialProduct.price;
        txUnitPrice = product.localPrice;
        txSaleCurrency = product.localCurrency!;
        lineItemSubtotalWithoutVat = parseFloat((originalPrices.subtotal * conversionRate).toFixed(2));
        lineItemVat = parseFloat((originalPrices.vat * conversionRate).toFixed(2));
      }
      
      // Grand total calculations (for the top-level transaction document)
      let txGrandSubtotal = lineItemSubtotalWithoutVat; // For a single product line, this is the same
      let txGrandVat = lineItemVat;
      let txGrandShipping = originalPrices.shipping; // Assuming shipping is for the whole order
      
      if (useLocalForTx && product.localPrice) {
         const conversionRate = product.localPrice / initialProduct.price;
         txGrandShipping = parseFloat((originalPrices.shipping * conversionRate).toFixed(2));
      }
      let txGrandTotal = parseFloat((txGrandSubtotal + txGrandVat + txGrandShipping).toFixed(2));

      // Prepare items array in the format expected by backend
      const items: ITransactionItem[] = [{ // Ensure ITransactionItem matches the modified type
        productId: initialProduct._id,
        productSlug: initialProduct.slug,
        productName: initialProduct.title,
        productType: initialProduct.type,
        productOwnerId: initialProduct.merchantId || '',
        quantity: quantity,
        unitPrice: txUnitPrice, // Unit price in the sale currency
        totalPrice: lineItemSubtotalWithoutVat, // Total for this line item (unitPrice * quantity) in sale currency
        currency: txSaleCurrency, // Currency for this line item
        vatEnabled: initialProduct.vatEnabled,
        vatAmount: lineItemVat, // VAT for this line item
        variants: variantSelections.length > 0 ? variantSelections : undefined,
      }];

      const transactionData = {
        items,
        saleCurrency: txSaleCurrency, // Overall sale currency
        total: txGrandTotal,         // Overall total for the transaction
        subtotal: txGrandSubtotal,   // Overall subtotal for the transaction
        shippingFee: txGrandShipping,  // Overall shipping
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
          transactionId: transactionId, // The TX_... ID
          client_quantity: quantity,
          client_selectedShipping: selectedShipping,
          client_variantSelections: variantSelections,
          client_localCurrencyAttempt: localCurrency, // The currency the user saw
          stripe_charged_amount_smallest_unit: paymentDetails.amount, // Amount sent to Stripe (cents)
          stripe_charged_currency: paymentDetails.currency, // Currency sent to Stripe
          initial_product_price: initialProduct.price,
          initial_product_currency: initialProduct.defaultCurrency,
          auto_local_price_setting: initialProduct.autoLocalPrice,
          converted_unit_local_price: product.localPrice,
          converted_local_currency: product.localCurrency,
          productSource: initialProduct.productSource || 'hosted',
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
    setQuantity(newQuantity);
  };

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

  const getConvertedPrices = () => {
    const originalPrices = calculateTotalPrice(initialProduct, quantity, selectedShipping);
    
    if (product.localPrice && product.localCurrency && product.localCurrency !== initialProduct.defaultCurrency) {
      const conversionRate = product.localPrice / initialProduct.price;
      return {
        subtotal: parseFloat((originalPrices.subtotal * conversionRate).toFixed(2)),
        vat: parseFloat((originalPrices.vat * conversionRate).toFixed(2)),
        shipping: parseFloat((originalPrices.shipping * conversionRate).toFixed(2)),
        total: parseFloat(((originalPrices.subtotal + originalPrices.vat + originalPrices.shipping) * conversionRate).toFixed(2)),
        currency: product.localCurrency,
      };
    }
    
    return {
      ...originalPrices,
      currency: initialProduct.defaultCurrency,
    };
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
            width: '32px',
            height: '32px',
            border: '3px solid #635bff',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <div style={{ color: '#32325d', fontSize: '16px' }}>Loading product...</div>
        </div>
      </div>
    );
  }

  const prices = getConvertedPrices();
  const displayPrice = product.localPrice ?? product.price;
  const displayCurrency = product.localCurrency || product.defaultCurrency;

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .checkout-container {
          min-height: 100vh;
          background-color: #f6f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          color: #32325d;
          line-height: 1.4;
        }
        
        .checkout-wrapper {
          display: flex;
          max-width: 920px;
          width: 100%;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .product-section {
          flex: 1;
          padding: 40px;
          background: #fbfcfd;
          border-right: 1px solid #e6ebf1;
        }
        
        .payment-section {
          flex: 1;
          padding: 40px;
        }
        
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
        }
        
        .business-icon {
          width: 28px;
          height: 28px;
          background: #f6f9fc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          border: 1px solid #e6ebf1;
          color: #8898aa;
        }
        
        .business-name {
          font-size: 16px;
          font-weight: 500;
          color: #32325d;
        }
        
        .product-image {
          width: 100%;
          max-width: 200px;
          height: 150px;
          background: #f6f9fc;
          border-radius: 8px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-title {
          font-size: 18px;
          font-weight: 500;
          color: #8898aa;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .product-price {
          font-size: 32px;
          font-weight: 600;
          color: #32325d;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .product-description {
          font-size: 14px;
          color: #8898aa;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .view-details-btn {
          background: none;
          border: none;
          color: #635bff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 auto 20px;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.15s;
        }
        
        .view-details-btn:hover {
          background: #f7f9fc;
        }
        
        .view-details-icon {
          transition: transform 0.15s;
          transform: ${showProductDetails ? 'rotate(180deg)' : 'rotate(0deg)'};
        }
        
        .product-details {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
          display: ${showProductDetails ? 'block' : 'none'};
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .detail-label {
          color: #8898aa;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .detail-value {
          color: #32325d;
          font-weight: 500;
        }
        
        .total-row {
          border-top: 1px solid #e6ebf1;
          padding-top: 12px;
          margin-top: 12px;
          font-weight: 600;
          font-size: 16px;
        }
        
        .variant-section {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .variant-group {
          margin-bottom: 16px;
        }
        
        .variant-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7c93;
          margin-bottom: 8px;
          display: block;
        }
        
        .variant-select {
          width: 100%;
          padding: 12px;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          font-size: 16px;
          color: #32325d;
          background: white;
          appearance: none;
          cursor: pointer;
        }
        
        .variant-select:focus {
          outline: none;
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
        }
        
        .quantity-section {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .quantity-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          background: white;
          color: #32325d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: background-color 0.15s;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: #f8f9fa;
        }
        
        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .quantity-input {
          width: 60px;
          height: 36px;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          text-align: center;
          font-size: 16px;
          color: #32325d;
        }
        
        .quantity-input:focus {
          outline: none;
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
        }
        
        .shipping-section {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .shipping-select {
          width: 100%;
          padding: 12px;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          font-size: 16px;
          color: #32325d;
          background: white;
          appearance: none;
          cursor: pointer;
        }
        
        .shipping-select:focus {
          outline: none;
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
        }
        
        .error-message {
          background: #fdf2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin-top: 20px;
          color: #dc2626;
          font-size: 14px;
        }
        
        .availability-message {
          background: #fdf2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin-top: 20px;
          color: #dc2626;
          font-size: 14px;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .checkout-wrapper {
            flex-direction: column;
            max-width: 400px;
          }
          
          .product-section {
            border-right: none;
            border-bottom: 1px solid #e6ebf1;
            padding: 30px 20px;
          }
          
          .payment-section {
            padding: 30px 20px;
          }
          
          .product-image {
            max-width: 150px;
            height: 120px;
          }
          
          .product-price {
            font-size: 28px;
          }
        }
      `}</style>
      
      <div className="checkout-container">
        <div className="checkout-wrapper">
          {/* Product Section */}
          <div className="product-section">
            <div className="header">
              <div className="business-icon">
                <svg width="14" height="14" viewBox="0 0 576 512" fill="currentColor">
                  <path d="M547.6 103.8L490.3 13.1C485.2 5 476.1 0 466.4 0H109.6C99.9 0 90.8 5 85.7 13.1L28.3 103.8c-29.6 46.8-3.4 111.9 51.9 119.4c4 .5 8.1 .8 12.1 .8c26.1 0 49.3-11.4 65.2-29c15.9 17.6 39.1 29 65.2 29c26.1 0 49.3-11.4 65.2-29c15.9 17.6 39.1 29 65.2 29c26.2 0 49.3-11.4 65.2-29c16 17.6 39.1 29 65.2 29c4.1 0 8.1-.3 12.1-.8c55.5-7.4 81.8-72.5 52.1-119.4zM512 224c-17.7 0-32 14.3-32 32V448c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32V256c0-17.7-14.3-32-32-32s-32 14.3-32 32V448c0 53 43 96 96 96H448c53 0 96-43 96-96V256c0-17.7-14.3-32-32-32z"/>
                </svg>
              </div>
              <div className="business-name">Store</div>
            </div>
            
            <div className="product-image">
              {getMainImageUrl() ? (
                <img src={getMainImageUrl()} alt={product.title} />
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8898aa',
                  fontSize: '14px',
                }}>
                  No image
                </div>
              )}
            </div>
            
            <div className="product-title">{product.title}</div>
            <div className="product-price">
              {formatPrice(displayPrice * quantity, displayCurrency)}
            </div>
            <div className="product-description">{product.shortDescription}</div>
            
            {/* Variants Section */}
            {product.variants && product.variants.length > 0 && (
              <div className="variant-section">
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#32325d', marginBottom: '16px' }}>
                  Product Options
                </h4>
                {product.variants.map((variant, index) => (
                  <div key={index} className="variant-group">
                    <label className="variant-label">{variant.name}</label>
                    <select
                      className="variant-select"
                      value={variantSelections.find(s => s.name === variant.name)?.value || ''}
                      onChange={(e) => handleVariantChange(variant.name, e.target.value)}
                    >
                      <option value="">Select {variant.name}</option>
                      {variant.values.map((value, valueIndex) => (
                        <option key={valueIndex} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quantity Section */}
            <div className="quantity-section">
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#32325d', marginBottom: '16px' }}>
                Quantity
              </h4>
              <div className="quantity-controls">
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  min="1"
                  max={product.physical?.stock || 99}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  type="button"
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={product.physical?.stock ? quantity >= product.physical.stock : false}
                >
                  +
                </button>
              </div>
              {product.physical?.stock && (
                <div style={{ fontSize: '12px', color: '#8898aa', marginTop: '8px' }}>
                  {product.physical.stock} available
                </div>
              )}
            </div>
            
            {/* Shipping Section */}
            {product.type === 'physical' && product.physical?.shippingMethods && product.physical.shippingMethods.length > 0 && (
              <div className="shipping-section">
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#32325d', marginBottom: '16px' }}>
                  Shipping Method
                </h4>
                <select
                  className="shipping-select"
                  value={selectedShipping}
                  onChange={(e) => setSelectedShipping(e.target.value)}
                >
                  {product.physical.shippingMethods.map((method, index) => (
                    <option key={index} value={method.name}>
                      {method.name} {method.price > 0 
                        ? `(${formatPrice(method.price, product.defaultCurrency)})` 
                        : '(Free)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              type="button"
              className="view-details-btn"
              onClick={() => setShowProductDetails(!showProductDetails)}
            >
              <span>{showProductDetails ? 'Hide details' : 'View details'}</span>
              <i className={`fas fa-chevron-down view-details-icon`}></i>
            </button>
            
            <div className="product-details">
              <div className="detail-row">
                <span className="detail-label">{product.title}</span>
                <span className="detail-value">
                  {formatPrice(displayPrice * quantity, displayCurrency)}
                </span>
              </div>
              
              {variantSelections.length > 0 && variantSelections.every(v => v.value) && (
                <div style={{ marginBottom: '12px' }}>
                  {variantSelections.map((selection, index) => (
                    <div key={index} style={{ fontSize: '12px', color: '#8898aa', marginBottom: '4px' }}>
                      {selection.name}: {selection.value}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Subtotal</span>
                <span className="detail-value">
                  {formatPrice(prices.subtotal, prices.currency)}
                </span>
              </div>
              
              {prices.vat > 0 && (
                <div className="detail-row">
                  <span className="detail-label">VAT</span>
                  <span className="detail-value">
                    {formatPrice(prices.vat, prices.currency)}
                  </span>
                </div>
              )}
              
              {prices.shipping > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Shipping</span>
                  <span className="detail-value">
                    {formatPrice(prices.shipping, prices.currency)}
                  </span>
                </div>
              )}
              
              {prices.shipping === 0 && selectedShipping && (
                <div className="detail-row">
                  <span className="detail-label">Shipping</span>
                  <span className="detail-value" style={{ color: '#00d924' }}>Free</span>
                </div>
              )}
              
              <div className="detail-row total-row">
                <span className="detail-label">Total</span>
                <span className="detail-value">
                  {formatPrice(prices.total, prices.currency)}
                </span>
              </div>
              
              {/* Show original price if converted */}
              {displayCurrency !== product.defaultCurrency && (
                <div style={{ fontSize: '12px', color: '#8898aa', marginTop: '12px' }}>
                  Original: {formatPrice(initialProduct.price * quantity, initialProduct.defaultCurrency)}
                </div>
              )}
            </div>
            
            {product.longDescription && (
              <div style={{ marginTop: '30px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#32325d', marginBottom: '12px' }}>
                  Description
                </h4>
                <div style={{ fontSize: '13px', color: '#8898aa', lineHeight: '1.6' }}
                     dangerouslySetInnerHTML={{ __html: product.longDescription }} />
              </div>
            )}
          </div>
          
          {/* Payment Section */}
          <div className="payment-section">
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
            
            {!canPurchase && product.type === 'physical' ? (
              <div className="availability-message">
                This product is currently out of stock or unavailable with the selected options.
              </div>
            ) : canPurchase && !isLoading && transactionId && initialProduct ? (
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
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDisplay;