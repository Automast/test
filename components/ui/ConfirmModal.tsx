'use client';

import { CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

const ConfirmModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subTitle?: string;
}> = ({ open, onClose, title, subTitle }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <div className="flex text-center justify-center items-center pt-4 font-semibold text-xl">
          <CheckCircle className="text-green-600 text-lg font-bold" strokeWidth={3} />
        </div>
        <div className="flex text-center items-center font-semibold text-xl">{title}</div>
        {subTitle && (
          <div className="flex items-center justify-center text-center text-gray-500 text-sm">{subTitle}</div>
        )}
        <div className="max-w-xl w-full space-y-4">
          <div className="grid grid-cols-1 gap-4 pt-6">
            <button
              className="hover:bg-blue-600 text-white font-semibold py-2 rounded-md bg-blue-500 transition cursor-pointer"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
