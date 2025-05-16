'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  step: number;
}

export default function ProgressBar({ step }: ProgressBarProps) {
  const items = [
    { label: 'Business', index: 0 },
    { label: 'Address', index: 1 },
    { label: 'Selling', index: 2 },
  ];

  return (
    <nav aria-label="Progress" className="flex items-center justify-center gap-8 py-6">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center">
          <span
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              index === step
                ? 'bg-blue-600 text-white'
                : index < step
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
            aria-label={`Step ${index + 1}: ${item.label}`}
          >
            {index < step ? <Check size={16} /> : null}
          </span>
          {index < items.length - 1 && (
            <span className="h-px w-16 bg-gray-300" aria-hidden />
          )}
        </div>
      ))}
    </nav>
  );
}