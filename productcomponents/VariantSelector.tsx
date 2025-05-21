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
    <div className="space-y-4">
      {variants.map((variant, index) => (
        <div key={index} className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {variant.name}
          </label>
          <select
            className="border border-gray-300 rounded-md p-2"
            value={selections.find(s => s.name === variant.name)?.value || ''}
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
  );
};

export default VariantSelector;