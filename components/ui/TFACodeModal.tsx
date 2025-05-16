'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { SpinLoading } from 'respinner';

const TFACodeModal: React.FC<{
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSend: (() => Promise<void>) | (() => void);
  title: string;
  subTitle?: ReactNode;
  code?: string;
}> = ({ open, loading, onClose, onSend, title, subTitle, code }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0008]">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-2">
        <div className="flex text-center items-center justify-center pb-4 font-semibold text-xl">{title}</div>
        <div className="flex items-center justify-center text-center text-gray-500 text-sm">{subTitle}</div>
        <div className="max-w-xl w-full">
          {!loading && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-center text-center text-gray-800 text-md font-semibold">
                <QRCodeSVG value={code ?? ''} />
              </div>
              <div className="flex items-center justify-center text-center text-gray-800 text-md font-semibold ">
                {code}
              </div>
            </div>
          )}
          {loading && (
            <div className="w-full flex justify-center items-center space-y-6 py-4">
              <SpinLoading size={80} count={10} barWidth={5} barHeight={20} borderRadius={2} fill="#CCC" className="" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <button
              className="bg-blue-50 text-blue-500 font-semibold py-2 rounded-md hover:bg-blue-100  transition cursor-pointer"
              onClick={onClose}
            >
              Back
            </button>
            <button
              className={`hover:bg-blue-600 bg-blue-500 transition font-semibold text-white flex justify-center rounded px-8 py-2 cursor-pointer`}
              onClick={() => onSend()}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TFACodeModal;
