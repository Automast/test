'use client';

import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { SpinLoading } from 'respinner';

const OTPModal: React.FC<{
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (arg0: string) => Promise<void>;
  title: string;
  subTitle: string | ReactNode;
}> = ({ open, sending, onClose, onSend, title, subTitle }) => {
  const [otp, setOtp] = useState('');

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0008]"
      onKeyDown={async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          const text = await navigator.clipboard.readText();
          setOtp(text);
        }
      }}
    >
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <div className="flex text-center items-center justify-center pb-4 font-semibold text-xl">{title}</div>
        <div className="flex items-center justify-center text-center text-gray-500 text-sm">{subTitle}</div>
        <div className="max-w-xl w-full space-y-4">
          <div className="flex items-center justify-center text-center font-semibold text-gray-900 text-xl">OTP</div>
          <div className="flex gap-2 justify-center items-center">
            {Array.from({ length: 6 }, (_, i) => i).map((_, i) => (
              <input
                readOnly
                type="text"
                key={i}
                className="border border-gray-400 rounded-md p-2 w-12 h-12 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                value={otp[i] ?? ''}
              />
            ))}
          </div>
          <div className="flex items-center justify-center text-center text-green-400 text-xs">
            You can copy OTP code to any inputs in the above.
          </div>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <button
              className="bg-blue-50 text-blue-500 font-semibold py-2 rounded-md hover:bg-blue-100  transition cursor-pointer"
              onClick={onClose}
            >
              Back
            </button>
            <button
              className={`hover:bg-blue-600 bg-blue-500 transition font-semibold text-white flex justify-center rounded px-8 py-2 ${
                sending ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => onSend(otp)}
              disabled={sending || !otp}
            >
              {sending && (
                <div className="flex items-center gap-2">
                  <SpinLoading
                    size={16}
                    count={10}
                    barWidth={3}
                    barHeight={5}
                    borderRadius={1}
                    fill="white"
                    className=""
                  />
                  Sending...
                </div>
              )}
              {!sending && 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OTPModal;
