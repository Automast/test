// productcomponents/CheckoutSummary.tsx
'use client';

import { IProduct, IVariantSelection } from '../productlib/types';
import { formatPrice } from '../productlib/currency';
import { calculateTotalPrice } from '../productlib/utils';

interface CheckoutSummaryProps {
  product: IProduct;
  quantity: number;
  variantSelections: IVariantSelection[];
  selectedShipping?: string;
  localCurrency?: string;
}

// Define an extended product type that explicitly includes our local currency properties
interface ProductWithLocalCurrency extends IProduct {
  localPrice?: number;
  localCurrency?: string;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  product,
  quantity,
  variantSelections,
  selectedShipping,
  localCurrency
}) => {
  // Cast product to our extended type to avoid TypeScript errors
  const productWithLocal = product as ProductWithLocalCurrency;
  
  // Use product local price if available, or fall back to original price
  const displayPrice = productWithLocal.localPrice !== undefined ? productWithLocal.localPrice : product.price;
  
  // Use product local currency if available, or fall back to default currency
  const displayCurrency = productWithLocal.localCurrency || 
    (localCurrency && product.autoLocalPrice ? localCurrency : product.defaultCurrency);
  
  // Determine if we need to convert prices
  const needsConversion = 
    productWithLocal.localPrice !== undefined && 
    productWithLocal.localCurrency !== undefined && 
    productWithLocal.localCurrency !== product.defaultCurrency;
  
  // Calculate with original price first
  const originalPrices = calculateTotalPrice(
    product,  // Using the original product
    quantity, 
    selectedShipping
  );
  
  // If conversion is needed, apply the same conversion rate to all components
  let { subtotal, vat, shipping, total } = originalPrices;
  
  if (needsConversion && productWithLocal.localPrice !== undefined) {
    // Calculate conversion rate based on single item price
    const conversionRate = productWithLocal.localPrice / product.price;
    
    // Apply conversion to all price components
    subtotal = parseFloat((originalPrices.subtotal * conversionRate).toFixed(2));
    vat = parseFloat((originalPrices.vat * conversionRate).toFixed(2));
    shipping = parseFloat((originalPrices.shipping * conversionRate).toFixed(2));
    total = parseFloat((subtotal + vat + shipping).toFixed(2));
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span>{formatPrice(displayPrice, displayCurrency)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Quantity:</span>
          <span>{quantity}</span>
        </div>
        
        {/* Show selected variants if any */}
        {variantSelections.length > 0 && variantSelections.every(v => v.value) && (
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Selected Options:</h4>
            {variantSelections.map((selection, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{selection.name}:</span>
                <span className="font-medium">{selection.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-2 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>{formatPrice(subtotal, displayCurrency)}</span>
        </div>
        
        {vat > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">VAT:</span>
            <span>{formatPrice(vat, displayCurrency)}</span>
          </div>
        )}
        
        {shipping > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span>{formatPrice(shipping, displayCurrency)}</span>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 mt-2 pt-2">
        <div className="flex justify-between font-semibold">
          <span>Total:</span>
          <span>{formatPrice(total, displayCurrency)}</span>
        </div>
        
        {/* Show original price if converted */}
        {displayCurrency !== product.defaultCurrency && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            Original price: {formatPrice(product.price * quantity, product.defaultCurrency)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSummary;