// productcomponents/VariantSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { IVariant, IVariantSelection } from '../productlib/types';

interface VariantSelectorProps {
  variants: IVariant[];
  onVariantSelect: (selections: IVariantSelection[]) => void;
  selectedQuantity?: number;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({ 
  variants, 
  onVariantSelect, 
  selectedQuantity = 1 
}) => {
  const [selections, setSelections] = useState<IVariantSelection[]>([]);
  
  // Initialize with empty selections
  useEffect(() => {
    if (variants && variants.length > 0) {
      // Create initial selections with empty values
      const initialSelections = variants.map(variant => ({
        name: variant.name,
        value: '',
      }));
      setSelections(initialSelections);
    }
  }, [variants]);
  
  // Update parent component when selections change
  useEffect(() => {
    if (selections.length > 0) {
      onVariantSelect(selections);
    }
  }, [selections, onVariantSelect]);
  
  if (!variants || variants.length === 0) {
    return null;
  }
  
  const handleVariantChange = (variantName: string, value: string) => {
    const newSelections = selections.map(selection => 
      selection.name === variantName 
        ? { ...selection, value } 
        : selection
    );
    setSelections(newSelections);
  };

  // Check if a variant value is available based on stock
  const isVariantValueAvailable = (variant: IVariant, value: string): { 
    available: boolean; 
    stockInfo: string; 
    stockClass: string;
  } => {
    // If variant.stock is undefined, it means stock management is not enabled for this variant
    // In this case, all values are available (unlimited stock)
    if (variant.stock === undefined) {
      return {
        available: true,
        stockInfo: '',
        statusClass: ''
      };
    }

    // If variant.stock is defined, stock management is enabled
    // Check if there's enough stock for the selected quantity
    if (variant.stock === 0) {
      return {
        available: false,
        stockInfo: 'Out of stock',
        stockClass: 'stock-out'
      };
    } else if (variant.stock < selectedQuantity) {
      return {
        available: false,
        stockInfo: `Only ${variant.stock} available`,
        stockClass: 'stock-low'
      };
    } else if (variant.stock < 10) {
      return {
        available: true,
        stockInfo: `${variant.stock} left`,
        stockClass: 'stock-low'
      };
    } else {
      return {
        available: true,
        stockInfo: `${variant.stock} in stock`,
        stockClass: 'stock-good'
      };
    }
  };

  // Get stock status for a variant
  const getVariantStockStatus = (variant: IVariant): {
    available: number;
    statusText: string;
    statusClass: string;
  } => {
    // If variant.stock is undefined, stock management is not enabled (unlimited stock)
    if (variant.stock === undefined) {
      return {
        available: 999,
        statusText: '',
        statusClass: ''
      };
    }

    const stock = variant.stock;
    
    if (stock === 0) {
      return {
        available: 0,
        statusText: 'Out of stock',
        statusClass: 'stock-out'
      };
    } else if (stock < 5) {
      return {
        available: stock,
        statusText: `Only ${stock} left`,
        statusClass: 'stock-low'
      };
    } else {
      return {
        available: stock,
        statusText: `${stock} in stock`,
        statusClass: 'stock-good'
      };
    }
  };
  
  return (
    <>
      <style jsx>{`
        .variants-container {
          margin-bottom: 20px;
        }
        
        .variants-title {
          font-size: 14px;
          font-weight: 600;
          color: #32325d;
          margin-bottom: 16px;
        }
        
        .variant-group {
          margin-bottom: 20px;
        }
        
        .variant-group:last-child {
          margin-bottom: 0;
        }
        
        .variant-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6b7c93;
          margin-bottom: 8px;
        }
        
        .variant-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: white;
        }

        .variant-option:hover:not(.disabled) {
          border-color: #635bff;
          background: #f7f9fc;
        }

        .variant-option.selected {
          border-color: #635bff;
          background: #f7f9fc;
          box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.2);
        }

        .variant-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }

        .variant-radio {
          width: 16px;
          height: 16px;
          border: 2px solid #cfd7df;
          border-radius: 50%;
          margin-right: 12px;
          position: relative;
          flex-shrink: 0;
        }

        .variant-radio.checked {
          border-color: #635bff;
        }

        .variant-radio.checked::after {
          content: '';
          width: 8px;
          height: 8px;
          background: #635bff;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .variant-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .variant-name {
          font-size: 14px;
          font-weight: 500;
          color: #32325d;
        }

        .variant-stock {
          font-size: 12px;
          color: #8898aa;
        }

        .variant-stock.stock-good {
          color: #16a34a;
        }

        .variant-stock.stock-low {
          color: #f59e0b;
        }

        .variant-stock.stock-out {
          color: #ef4444;
        }

        .variant-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .variant-name-header {
          font-size: 13px;
          font-weight: 500;
          color: #6b7c93;
        }

        .variant-stock-summary {
          font-size: 12px;
          color: #8898aa;
        }

        .insufficient-stock-warning {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 12px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
      
      <div className="variants-container">
        <div className="variants-title">Product Options</div>
        {variants.map((variant, index) => {
          const currentSelection = selections.find(s => s.name === variant.name);
          const stockStatus = getVariantStockStatus(variant);
          const isOutOfStock = stockStatus.available === 0;
          const hasInsufficientStock = stockStatus.available > 0 && stockStatus.available < selectedQuantity && variant.stock !== undefined;
          
          return (
            <div key={index} className="variant-group">
              <div className="variant-group-header">
                <div className="variant-name-header">{variant.name}</div>
                {stockStatus.statusText && (
                  <div className="variant-stock-summary">
                    {stockStatus.statusText}
                  </div>
                )}
              </div>
              
              {variant.values.map((value, valueIndex) => {
                const { available, stockInfo, stockClass } = isVariantValueAvailable(variant, value);
                const isSelected = currentSelection?.value === value;
                
                return (
                  <div
                    key={valueIndex}
                    className={`variant-option ${isSelected ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                    onClick={() => available && handleVariantChange(variant.name, value)}
                  >
                    <div className={`variant-radio ${isSelected ? 'checked' : ''}`}></div>
                    <div className="variant-info">
                      <div className="variant-name">{value}</div>
                      {stockInfo && (
                        <div className={`variant-stock ${stockClass}`}>
                          {stockInfo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Insufficient stock warning */}
              {hasInsufficientStock && currentSelection?.value && (
                <div className="insufficient-stock-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>
                    Only {stockStatus.available} available, but you've selected {selectedQuantity}. 
                    Please reduce quantity or choose a different option.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default VariantSelector;

