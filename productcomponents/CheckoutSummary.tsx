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
  
  return (
    <>
      <style jsx>{`
        .product-details {
          background: #f8f9fa;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
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
        
        .product-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e6ebf1;
        }
        
        .product-image {
          width: 48px;
          height: 48px;
          background: #f6f9fc;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-text {
          flex: 1;
          min-width: 0;
        }
        
        .product-title {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
          margin-bottom: 4px;
          word-wrap: break-word;
        }
        
        .product-variants {
          font-size: 12px;
          color: #8898aa;
          margin-bottom: 4px;
        }
        
        .product-quantity {
          font-size: 12px;
          color: #8898aa;
        }
        
        .product-price {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
          flex-shrink: 0;
        }
        
        .original-price {
          font-size: 12px;
          color: #8898aa;
          margin-top: 12px;
          text-align: right;
        }
        
        .free-badge {
          color: #00d924;
          font-weight: 500;
        }
      `}</style>
      
      <div className="product-details">
        {/* Product Info */}
        <div className="product-info">
          {/* Product Image */}
          {product.images && product.images.length > 0 && (
            <div className="product-image">
              <img
                src={formatImageUrl(product.images[0].url)}
                alt={product.title}
              />
            </div>
          )}
          
          {/* Product Details */}
          <div className="product-text">
            <div className="product-title">{product.title}</div>
            
            {/* Selected variants */}
            {variantSelections.length > 0 && variantSelections.every(v => v.value) && (
              <div className="product-variants">
                {variantSelections.map((selection, index) => (
                  <div key={index}>
                    {selection.name}: {selection.value}
                  </div>
                ))}
              </div>
            )}
            
            <div className="product-quantity">Qty: {quantity}</div>
          </div>
          
          {/* Price */}
          <div className="product-price">
            {formatPrice(displayPrice * quantity, displayCurrency)}
          </div>
        </div>
        
        {/* Price Breakdown */}
        <div className="detail-row">
          <span className="detail-label">Subtotal</span>
          <span className="detail-value">{formatPrice(subtotal, displayCurrency)}</span>
        </div>
        
        {vat > 0 && (
          <div className="detail-row">
            <span className="detail-label">VAT</span>
            <span className="detail-value">{formatPrice(vat, displayCurrency)}</span>
          </div>
        )}
        
        {shipping > 0 && (
          <div className="detail-row">
            <span className="detail-label">Shipping</span>
            <span className="detail-value">{formatPrice(shipping, displayCurrency)}</span>
          </div>
        )}
        
        {shipping === 0 && selectedShipping && (
          <div className="detail-row">
            <span className="detail-label">Shipping</span>
            <span className="detail-value free-badge">Free</span>
          </div>
        )}
        
        {/* Total */}
        <div className="detail-row total-row">
          <span className="detail-label">Total</span>
          <span className="detail-value">
            {formatPrice(total, displayCurrency)}
          </span>
        </div>
        
        {/* Show original price if converted */}
        {displayCurrency !== product.defaultCurrency && (
          <div className="original-price">
            Original: {formatPrice(product.price * quantity, product.defaultCurrency)}
          </div>
        )}
      </div>
    </>
  );
};

export default CheckoutSummary;