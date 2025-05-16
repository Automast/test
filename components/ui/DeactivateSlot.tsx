'use client';

import Link from 'next/link';
import { useState } from 'react';

const reasons = [
  'I don’t want to keep processing my orders with Arkus',
  'I found a better payment processor',
  'I stopped my business',
  'Other',
];

const DeactivateSlot = () => {
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  return (
    <div className="">
      <h2 className="font-semibold mb-2 text-lg">Deactivate account</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Everyone needs a break once in awhile. <br />
        Deactivate your account is the best option if you&apos;d like to temporarily hide your merchant profile and
        activity.
      </p>

      <h3 className="text-base font-medium mb-2">Tell us why you want to deactivate your account (optional)</h3>

      <div className="mb-4 space-y-2">
        {reasons.map((item, idx) => (
          <label key={idx} className="flex items-center text-sm space-x-2 cursor-pointer">
            <input
              type="radio"
              name="reason"
              value={item}
              checked={reason === item}
              onChange={() => setReason(item)}
              className="accent-blue-600 cursor-pointer"
            />
            <span className="text-gray-700">{item}</span>
          </label>
        ))}
      </div>

      <p className="text-gray-600 mb-2 text-sm">
        We value your feedback, but please note that we aren’t able to respond to comments about your account submitted
        in this form. If you have a question or request about your account that requires attention, please contact us{' '}
        <Link href="/contact-us" className="text-blue-500 underline">
          here
        </Link>
        .
      </p>

      <textarea
        rows={4}
        placeholder=""
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-3 border border-gray-300 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
      />

      <button className="hover:bg-blue-600 text-white py-2 rounded-md bg-blue-500 transition cursor-pointer px-8">
        Deactivate Account
      </button>
    </div>
  );
};

export default DeactivateSlot;
