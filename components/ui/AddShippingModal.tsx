'use client';

import { CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const AddShippingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  id?: string;
}> = ({ open, onClose, id }) => {
  const [name, setName] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [price, setPrice] = useState('');

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-300 pb-2">
          <div className="text-lg font-semibold">Add Shipping</div>
          <button className="rounded-full hover:bg-gray-100 transition p-2 cursor-pointer" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Minimum Days of Shipping</label>
            <input
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Maximum Days of Shipping</label>
            <input
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-6">
          <button className="hover:bg-blue-600 text-white font-semibold py-2 rounded-md bg-blue-500 transition cursor-pointer">
            Add
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddShippingModal;
