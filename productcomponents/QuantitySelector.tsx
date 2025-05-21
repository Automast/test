// productcomponents/QuantitySelector.tsx
'use client';

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
  // Determine actual max quantity based on stock if applicable
  let actualMaxQuantity = maxQuantity;
  
  if (product.type === 'physical' && product.physical?.stock !== undefined) {
    actualMaxQuantity = Math.min(maxQuantity, product.physical.stock);
  }
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    
    if (isNaN(newQuantity)) {
      onQuantityChange(minQuantity);
    } else {
      const clampedQuantity = Math.max(
        minQuantity,
        Math.min(newQuantity, actualMaxQuantity)
      );
      onQuantityChange(clampedQuantity);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > minQuantity) {
      onQuantityChange(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < actualMaxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };
  
  return (
    <div className="flex items-center space-x-1">
      <label className="text-sm font-medium text-gray-700 mr-2">Quantity:</label>
      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
        <button
          type="button"
          className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          onClick={decreaseQuantity}
          disabled={quantity <= minQuantity}
        >
          -
        </button>
        <input
          type="number"
          min={minQuantity}
          max={actualMaxQuantity}
          value={quantity}
          onChange={handleQuantityChange}
          className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
        />
        <button
          type="button"
          className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          onClick={increaseQuantity}
          disabled={quantity >= actualMaxQuantity}
        >
          +
        </button>
      </div>
      
      {product.type === 'physical' && product.physical?.stock !== undefined && (
        <span className="text-sm text-gray-500 ml-2">
          {product.physical.stock} available
        </span>
      )}
    </div>
  );
};

export default QuantitySelector;