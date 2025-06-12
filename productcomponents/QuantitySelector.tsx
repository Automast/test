// productcomponents/QuantitySelector.tsx
'use client';

import { useState } from 'react';
import { IProduct } from '../productlib/types';

interface QuantitySelectorProps {
  product: IProduct;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  maxQuantity?: number;
  minQuantity?: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  product,
  quantity,
  onQuantityChange,
  maxQuantity = 99,
  minQuantity = 1
}) => {
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  // Determine actual max quantity based on stock if applicable
  let actualMaxQuantity = maxQuantity;
  
  // Only check stock if stock management is enabled (stock is defined)
  if (product.type === 'physical' && product.physical?.stock !== undefined) {
    actualMaxQuantity = Math.min(maxQuantity, product.physical.stock);
  }
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    
    if (isNaN(newQuantity) || newQuantity < minQuantity) {
      onQuantityChange(minQuantity);
    } else if (newQuantity > actualMaxQuantity) {
      onQuantityChange(actualMaxQuantity);
      setShowMaxWarning(true);
      setTimeout(() => setShowMaxWarning(false), 2000);
    } else {
      onQuantityChange(newQuantity);
      setShowMaxWarning(false);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    
    if (isNaN(newQuantity) || newQuantity < minQuantity) {
      onQuantityChange(minQuantity);
    } else if (newQuantity > actualMaxQuantity) {
      onQuantityChange(actualMaxQuantity);
      setShowMaxWarning(true);
      setTimeout(() => setShowMaxWarning(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent entering non-numeric characters
    if (!/[0-9]/.test(e.key) && 
        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > minQuantity) {
      onQuantityChange(quantity - 1);
      setShowMaxWarning(false);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < actualMaxQuantity) {
      onQuantityChange(quantity + 1);
    } else {
      setShowMaxWarning(true);
      setTimeout(() => setShowMaxWarning(false), 2000);
    }
  };
  
  return (
    <>
      <style jsx>{`
        .quantity-container {
          margin-bottom: 16px;
        }
        
        .quantity-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6b7c93;
          margin-bottom: 8px;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          overflow: hidden;
          background: white;
          width: fit-content;
        }
        
        .quantity-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: #f8f9fa;
          color: #32325d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.15s ease;
          user-select: none;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: #e9ecef;
        }
        
        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8f9fa;
        }
        
        .quantity-btn:active:not(:disabled) {
          background: #dee2e6;
        }
        
        .quantity-btn.decrease {
          border-right: 1px solid #e6ebf1;
        }
        
        .quantity-btn.increase {
          border-left: 1px solid #e6ebf1;
        }
        
        .quantity-input {
          width: 60px;
          height: 40px;
          border: none;
          text-align: center;
          font-size: 16px;
          color: #32325d;
          background: white;
          outline: none;
          font-weight: 500;
          -moz-appearance: textfield; /* Firefox */
        }

        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        .quantity-input:focus {
          background: #f8f9fa;
        }

        .quantity-input:invalid {
          color: #ef4444;
        }
        
        .stock-info {
          font-size: 12px;
          color: #8898aa;
          margin-top: 8px;
        }
        
        .stock-warning {
          color: #f59e0b;
        }
        
        .stock-out {
          color: #ef4444;
        }

        .max-warning {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          animation: fadeInOut 2s ease-in-out;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-5px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-5px); }
        }
      `}</style>
      
      <div className="quantity-container">
        <label className="quantity-label">Quantity</label>
        <div className="quantity-controls">
          <button
            type="button"
            className="quantity-btn decrease"
            onClick={decreaseQuantity}
            disabled={quantity <= minQuantity}
          >
            −
          </button>
          <input
            type="number"
            className="quantity-input"
            min={minQuantity}
            max={actualMaxQuantity}
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="quantity-btn increase"
            onClick={increaseQuantity}
            disabled={quantity >= actualMaxQuantity}
          >
            +
          </button>
        </div>
        
        {showMaxWarning && (
          <div className="max-warning">
            Maximum quantity is {actualMaxQuantity}
          </div>
        )}
        
        {/* Only show stock info if stock management is enabled (stock is defined) */}
        {product.type === 'physical' && product.physical?.stock !== undefined && (
          <div className={`stock-info ${
            product.physical.stock === 0 ? 'stock-out' : 
            product.physical.stock < 10 ? 'stock-warning' : ''
          }`}>
            {product.physical.stock === 0 ? 'Out of stock' :
             product.physical.stock < 10 ? `Only ${product.physical.stock} left in stock` :
             `${product.physical.stock} available`}
          </div>
        )}
      </div>
    </>
  );
};

export default QuantitySelector;