// productcomponents/VariantSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { IVariant, IVariantSelection } from '../productlib/types';

interface VariantSelectorProps {
  variants: IVariant[];
  onVariantSelect: (selections: IVariantSelection[]) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({ variants, onVariantSelect }) => {
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
          margin-bottom: 16px;
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
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238898aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        }
        
        .variant-select:focus {
          outline: none;
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.2);
        }
        
        .variant-select:hover {
          border-color: #aab7c4;
        }
        
        .variant-select option {
          color: #32325d;
          background: white;
          padding: 8px;
        }
        
        .variant-select option:disabled {
          color: #8898aa;
        }
        
        .variant-select:invalid {
          color: #aab7c4;
        }
        
        .stock-indicator {
          font-size: 12px;
          color: #8898aa;
          margin-top: 4px;
        }
        
        .stock-low {
          color: #f59e0b;
        }
        
        .stock-out {
          color: #ef4444;
        }
      `}</style>
      
      <div className="variants-container">
        <div className="variants-title">Product Options</div>
        {variants.map((variant, index) => {
          const currentSelection = selections.find(s => s.name === variant.name);
          
          return (
            <div key={index} className="variant-group">
              <label className="variant-label">{variant.name}</label>
              <select
                className="variant-select"
                value={currentSelection?.value || ''}
                onChange={(e) => handleVariantChange(variant.name, e.target.value)}
              >
                <option value="" disabled>
                  Select {variant.name}
                </option>
                {variant.values.map((value, valueIndex) => (
                  <option key={valueIndex} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              
              {/* Stock indicator for variant */}
              {variant.stock !== undefined && (
                <div className={`stock-indicator ${
                  variant.stock === 0 ? 'stock-out' : 
                  variant.stock < 5 ? 'stock-low' : ''
                }`}>
                  {variant.stock === 0 ? 'Out of stock' :
                   variant.stock < 5 ? `Only ${variant.stock} left` :
                   `${variant.stock} in stock`}
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