// productcomponents/ProductDisplay.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IProduct, IVariantSelection, IBillingInfo, ITransaction } from '../productlib/types';
import { formatPrice, getUserCurrency, convertPrice } from '../productlib/currency';
import { isProductInStock, calculateTotalPrice, prepareTransactionItem } from '../productlib/utils';
import { createTransaction, getIPAddress, getDeviceInfo } from '../productlib/api';
import ProductImages from './ProductImages';
import VariantSelector from './VariantSelector';
import QuantitySelector from './QuantitySelector';
import CheckoutSummary from './CheckoutSummary';
import PaymentForm from './PaymentForm';
// Define an extended product type that explicitly includes our local currency properties
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
  
  // Fetch user's local currency on component mount
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        setIsLoading(true);
        const currency = await getUserCurrency();
        setLocalCurrency(currency);
        
        if (currency && currency !== initialProduct.defaultCurrency && initialProduct.autoLocalPrice) {
          console.log(`Converting product price from ${initialProduct.defaultCurrency} to ${currency}`);
          try {
            // Convert the price for display
            const convertedPrice = await convertPrice(initialProduct.price, initialProduct.defaultCurrency, currency);
            
            // Create a modified product with converted price for display only
            const productWithLocalPrice = {
              ...initialProduct,
              localPrice: convertedPrice,
              localCurrency: currency
            };
            
            console.log(`Converted price: ${convertedPrice} ${currency}`);
            setProduct(productWithLocalPrice);
          } catch (convError) {
            console.error('Error converting price:', convError);
            // Keep the original product if conversion fails
            setProduct(initialProduct);
          }
        } else {
          // No conversion needed
          setProduct(initialProduct);
        }
      } catch (error) {
        console.error('Error fetching user currency:', error);
        // Default to product currency
        setLocalCurrency(initialProduct.defaultCurrency);
        setProduct(initialProduct);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserCurrency();
    
    // Initialize shipping method if product is physical and has shipping methods
    if (
      initialProduct.type === 'physical' && 
      initialProduct.physical?.shippingMethods && 
      initialProduct.physical.shippingMethods.length > 0
    ) {
      setSelectedShipping(initialProduct.physical.shippingMethods[0].name);
    }
  }, [initialProduct]);
  
  // Check if product can be purchased
  const canPurchase = isProductInStock(product, variantSelections);
  
  // Handle form submission
  const handleSubmit = async (
    billingInfo: IBillingInfo,
    paymentMethod: 'card' | 'pix' | 'paypal' | 'wallet' | 'other',
    status: 'pending' | 'successful' | 'canceled'
  ) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Get device info
      const { deviceInfo, browserInfo } = getDeviceInfo();
      
      // Get IP address
      const ipAddress = await getIPAddress();
      
      // Use the original product price for the actual transaction
      const originalProduct = initialProduct;
      
      // Calculate totals using original price
      const { subtotal: originalSubtotal, vat: originalVat, shipping: originalShipping, total: originalTotal } = calculateTotalPrice(
        originalProduct, 
        quantity, 
        selectedShipping
      );
      
      // Prepare original currency transaction item
      const item = prepareTransactionItem(
        originalProduct,
        quantity,
        variantSelections,
        originalSubtotal,
        originalVat
      );
      
      // Need to convert amounts to local currency if different
      const useLocalCurrency = product.localCurrency && 
                              product.localCurrency !== originalProduct.defaultCurrency && 
                              product.autoLocalPrice;
                            
      // If using local currency, convert all price components
      let localSubtotal = originalSubtotal;
      let localVat = originalVat;
      let localShipping = originalShipping;
      let localTotal = originalTotal;
      
      if (useLocalCurrency && product.localPrice) {
        // Calculate conversion rate based on unit price
        const conversionRate = product.localPrice / originalProduct.price;
        
        // Convert all price components
        localSubtotal = parseFloat((originalSubtotal * conversionRate).toFixed(2));
        localVat = parseFloat((originalVat * conversionRate).toFixed(2));
        localShipping = parseFloat((originalShipping * conversionRate).toFixed(2));
        localTotal = parseFloat((localSubtotal + localVat + localShipping).toFixed(2));
        
        console.log(`Converted prices - Subtotal: ${localSubtotal}, VAT: ${localVat}, Shipping: ${localShipping}, Total: ${localTotal}`);
      }
      
      // NEW ⇣ — puts personal & technical info into metadata 
// Create the transaction payload – now with all required root fields
const transaction: ITransaction = {
  /* ---------- ledger data ---------- */
  type: 'sale',
  originAmount: originalTotal,
  originCurrency: originalProduct.defaultCurrency,

  items: [item],
  productSource: originalProduct.productSource || 'hosted',
  saleCurrency: product.localCurrency || originalProduct.defaultCurrency,

  subtotal:  useLocalCurrency ? localSubtotal  : originalSubtotal,
  shippingFee: useLocalCurrency ? localShipping : originalShipping,
  total:    useLocalCurrency ? localTotal     : originalTotal,

  /* ---------- required purchaser / tech info ---------- */
  paymentMethod,
  buyerEmail:  billingInfo.email,
  buyerPhone:  billingInfo.phone,
  billingName: billingInfo.name,
  billingAddress: billingInfo.address,
  billingCity:   billingInfo.city,
  billingState:  billingInfo.state,
  billingPostalCode: billingInfo.postalCode,
  billingCountry: billingInfo.country,
  status,
  ipAddress,
  deviceInfo,
  browserInfo,

  /* ---------- everything else lives in metadata ---------- */
  metadata: {
    localCurrency:  product.localCurrency,
    localPrice:     product.localPrice,
    localSubtotal:  useLocalCurrency ? localSubtotal  : undefined,
    localShipping:  useLocalCurrency ? localShipping : undefined,
    localTotal:     useLocalCurrency ? localTotal     : undefined,

    originalCurrency:  originalProduct.defaultCurrency,
    originalPrice:     originalProduct.price,
    originalSubtotal,
    originalTotal,
  },
};

    
      // Submit transaction
      const response = await createTransaction(transaction);
      
      if (response.success) {
        // Navigate to payment page with transaction ID and status
        router.push(`/product/payment?transactionId=${response.data.transactionId}&status=${status}`);
      } else {
        throw new Error(response.message || 'Failed to process transaction');
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setErrorMessage((error as Error).message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display out of stock message if applicable
  const renderAvailabilityMessage = () => {
    if (product.type === 'digital') {
      return (
        <div className="text-green-600 flex items-center">
          <span className="mr-2">●</span>
          <span>Digital Product • Instant Delivery</span>
        </div>
      );
    }
    
    if (product.variants && product.variants.length > 0) {
      // If the product has variants, availability depends on selections
      return (
        <div className="text-gray-600">
          Please select options to check availability
        </div>
      );
    }
    
    // Check physical product stock
    if (product.physical?.stock !== undefined) {
      if (product.physical.stock <= 0) {
        return (
          <div className="text-red-600 flex items-center">
            <span className="mr-2">●</span>
            <span>Out of Stock</span>
          </div>
        );
      }
      
      if (product.physical.stock < 10) {
        return (
          <div className="text-yellow-600 flex items-center">
            <span className="mr-2">●</span>
            <span>Low Stock • Only {product.physical.stock} left</span>
          </div>
        );
      }
      
      return (
        <div className="text-green-600 flex items-center">
          <span className="mr-2">●</span>
          <span>In Stock • Ready to Ship</span>
        </div>
      );
    }
    
    // Default for physical products without stock tracking
    return (
      <div className="text-green-600 flex items-center">
        <span className="mr-2">●</span>
        <span>In Stock</span>
      </div>
    );
  };
  
  // Render shipping options if available
  const renderShippingOptions = () => {
    if (
      product.type === 'physical' && 
      product.physical?.shippingMethods && 
      product.physical.shippingMethods.length > 0
    ) {
      return (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Method
          </label>
          <select
            value={selectedShipping}
            onChange={(e) => setSelectedShipping(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
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
      );
    }
    
    return null;
  };
  
  // Display currency conversion message if applicable
  const renderCurrencyInfo = () => {
    if (
      !isLoading && 
      product.localCurrency && 
      product.localCurrency !== product.defaultCurrency && 
      product.autoLocalPrice
    ) {
      return (
        <div className="text-sm text-gray-500 mt-1">
          Price shown in {product.localCurrency} based on current exchange rates.
          Original price: {formatPrice(product.price, product.defaultCurrency)}
        </div>
      );
    }
    
    return null;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
        {renderAvailabilityMessage()}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Images */}
        <div>
          <ProductImages images={product.images} />
        </div>
        
        {/* Right column - Product details and checkout */}
        <div>
          {/* Price */}
          <div className="mb-6">
            <div className="text-2xl font-bold">
              {formatPrice(
                product.localPrice || product.price, 
                product.localCurrency || product.defaultCurrency
              )}
            </div>
            {renderCurrencyInfo()}
          </div>
          
          {/* Short description */}
          <div className="mb-6">
            <p className="text-gray-600">{product.shortDescription}</p>
          </div>
          
          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <VariantSelector
                variants={product.variants}
                onVariantSelect={setVariantSelections}
              />
            </div>
          )}
          
          {/* Quantity selector */}
          <div className="mb-6">
            <QuantitySelector
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </div>
          
          {/* Shipping options */}
          {renderShippingOptions()}
          
          {/* Order summary */}
          <div className="mb-6">
            <CheckoutSummary
              product={product}
              quantity={quantity}
              variantSelections={variantSelections}
              selectedShipping={selectedShipping}
              localCurrency={product.localCurrency}
            />
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          {/* Out of stock message */}
          {!canPurchase && product.type === 'physical' && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              This product is currently out of stock or unavailable with the selected options.
            </div>
          )}
          
          {/* Payment form */}
          <div className="mt-8 border-t border-gray-200 pt-8">
          <PaymentForm
  currency={localCurrency || product.localCurrency || product.defaultCurrency}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>
          </div>
        </div>
      </div>
      
      {/* Long description */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold mb-4">Product Details</h2>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.longDescription }} />
      </div>
    </div>
  );
};
export default ProductDisplay;