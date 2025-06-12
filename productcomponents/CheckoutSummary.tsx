// productcomponents/CheckoutSummary.tsx
'use client';

import { IProduct, IVariantSelection } from '../productlib/types';
import { formatPrice } from '../productlib/currency';

interface CheckoutSummaryProps {
  product: IProduct;
  quantity: number;
  variantSelections: IVariantSelection[];
  selectedShipping?: string;
  localCurrency?: string;
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  displayCurrency: string;
  taxRate?: number;
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
  localCurrency,
  subtotal,
  vat,
  shipping,
  total,
  displayCurrency,
  taxRate = 0
}) => {
  // Cast product to our extended type to avoid TypeScript errors
  const productWithLocal = product as ProductWithLocalCurrency;
  
  // Use product local price if available, or fall back to original price
  const displayPrice = productWithLocal.localPrice !== undefined ? productWithLocal.localPrice : product.price;

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

  // Get recurring text for digital products
  const getRecurringText = (): string => {
    if (product.type === 'digital' && product.digital?.recurring) {
      const { interval } = product.digital.recurring;
      if (interval === 'monthly') return '/mo';
      if (interval === 'yearly') return '/yr';
    }
    return '';
  };

  // Get trial text for digital products
  const getTrialText = (): string => {
    if (product.type === 'digital' && product.digital?.recurring?.hasTrial) {
      const trialDays = product.digital.recurring.trialDays || 0;
      if (trialDays > 0) {
        return `${trialDays}-day trial`;
      }
      return 'Free trial';
    }
    return '';
  };

  const recurringText = getRecurringText();
  const trialText = getTrialText();
  
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
          border: 1px solid #e6ebf1;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8898aa;
          font-size: 12px;
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

        .product-meta {
          font-size: 12px;
          color: #8898aa;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
        }

        .product-subscription {
          font-size: 12px;
          color: #2563eb;
          margin-bottom: 4px;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .product-trial {
          font-size: 11px;
          color: #16a34a;
          background: #f0fdf4;
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .product-price {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .price-main {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .price-recurring {
          font-size: 11px;
          color: #6b7280;
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

        .vat-row {
          color: #6b7c93;
        }

        .vat-icon {
          margin-right: 4px;
          font-size: 12px;
        }

        .shipping-row {
          color: #6b7c93;
        }

        .shipping-icon {
          margin-right: 4px;
          font-size: 12px;
        }

.icon-prefix {
          margin-right: 6px;
          width: 14px;
          height: 14px;
          text-align: center;
          flex-shrink: 0;
        }

        .vat-icon, .shipping-icon {
          flex-shrink: 0;
        }
      `}</style>
      
      <div className="product-details">
        {/* Product Info */}
        <div className="product-info">
          {/* Product Image */}
          <div className="product-image">
            {product.images && product.images.length > 0 ? (
              <img
                src={formatImageUrl(product.images.find(img => img.isMain)?.url || product.images[0].url)}
                alt={product.title}
              />
            ) : (
              <div className="product-image-placeholder">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="product-text">
            <div className="product-title">{product.title}</div>
            
{/* Product Type */}
<div className="product-meta">
  {product.type === 'digital' ? (
    <>
      <svg className="icon-prefix" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 2v2H7V2H5v2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2zM3 8h18v12H3V8z"/>
        <path d="M7 10h10v2H7zM7 14h7v2H7z"/>
      </svg>
      Digital Product
    </>
  ) : (
    <>
      <svg className="icon-prefix" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3 3h4v14H5V5h4l3-3zm0 3L9 8H7v11h10V8h-2L12 5z"/>
      </svg>
      Physical Product
    </>
  )}
</div>

{/* SKU and Barcode - Only show if they exist */}
{product.sku && (
  <div className="product-meta">SKU: {product.sku}</div>
)}
{product.barcode && (
  <div className="product-meta">Barcode: {product.barcode}</div>
)}

{/* Subscription Info */}
{recurringText && (
  <div className="product-subscription">
    <svg className="icon-prefix" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 12.79 17.85 13.54 17.57 14.21L19.07 15.71C19.66 14.71 20 13.39 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 11.21 6.15 10.46 6.43 9.79L4.93 8.29C4.34 9.29 4 10.61 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z"/>
    </svg>
    Subscription{recurringText}
  </div>
)}

{/* Trial Info */}
{trialText && (
  <div className="product-trial">
    <svg className="icon-prefix" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
    </svg>
    {trialText}
  </div>
)}
            
            {/* Selected variants - Only show if variants are selected */}
            {variantSelections.length > 0 && variantSelections.every(v => v.value) && (
              <div className="product-variants">
                {variantSelections.map((selection, index) => (
                  <div key={index}>
                    {selection.name}: {selection.value}
                  </div>
                ))}
              </div>
            )}

{/* Shipping Method for Physical Products - Only show if selected */}
{product.type === 'physical' && selectedShipping && (
  <div className="product-meta">
    <svg className="icon-prefix" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
    Shipping: {selectedShipping}
  </div>
)}
            
            {/* Quantity - Only show if quantity enabled OR quantity > 1 */}
            {(product.quantityEnabled !== false || quantity > 1) && (
              <div className="product-quantity">Qty: {quantity}</div>
            )}
          </div>
          
          {/* Price */}
          <div className="product-price">
            <div className="price-main">
              {formatPrice(displayPrice * quantity, displayCurrency)}
              {recurringText && quantity === 1 && (
                <span className="price-recurring">{recurringText}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Price Breakdown */}
        <div className="detail-row">
          <span className="detail-label">Subtotal</span>
          <span className="detail-value">{formatPrice(subtotal, displayCurrency)}</span>
        </div>
        
{/* VAT - Only show if there is VAT */}
{vat > 0 && (
  <div className="detail-row vat-row">
    <span className="detail-label">
      <svg className="vat-icon" viewBox="0 0 24 24" fill="currentColor" style={{width: '14px', height: '14px', marginRight: '4px'}}>
        <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19Z"/>
        <path d="M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z"/>
      </svg>
      VAT{taxRate > 0 && ` (${(taxRate * 100).toFixed(1)}%)`}
    </span>
    <span className="detail-value">{formatPrice(vat, displayCurrency)}</span>
  </div>
)}

{/* Shipping - Show if there is shipping cost */}
{shipping > 0 && (
  <div className="detail-row shipping-row">
    <span className="detail-label">
      <svg className="shipping-icon" viewBox="0 0 24 24" fill="currentColor" style={{width: '14px', height: '14px', marginRight: '4px'}}>
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
      Shipping
    </span>
    <span className="detail-value">{formatPrice(shipping, displayCurrency)}</span>
  </div>
)}

{/* Free Shipping - Show if shipping is selected but free */}
{shipping === 0 && selectedShipping && (
  <div className="detail-row shipping-row">
    <span className="detail-label">
      <svg className="shipping-icon" viewBox="0 0 24 24" fill="currentColor" style={{width: '14px', height: '14px', marginRight: '4px'}}>
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
      Shipping
    </span>
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
        
        {/* Show original price if converted - Only if currencies are different */}
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