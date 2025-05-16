'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDownIcon, CreditCard, Repeat } from 'lucide-react';
import { useState } from 'react';
import Image, { StaticImageData } from 'next/image';

import rebillImg from '@/assets/images/icons/rebill.svg';
import cardPayImg from '@/assets/images/icons/cardpay.svg';

const FeeCard: React.FC<{
  icon: StaticImageData;
  title: string;
  subtitle: string;
  priceLabel: string;
  priceInfo: string;
}> = ({ icon, title, subtitle, priceLabel, priceInfo }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 items-center border border-gray-500 rounded-lg p-5 hover:shadow-md transition">
    <div className="flex items-center gap-4 py-4 border-b lg:border-b-0 lg:border-r border-gray-500">
      <Image src={icon} alt="icon" className="bg-blue-100 text-blue-500 w-10 h-10 rounded-lg text-xl" />
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-1 py-4 lg:px-6">
      <p className="text-sm font-semibold">{priceLabel}</p>
      <p className="text-xs text-gray-700">{priceInfo}</p>
    </div>
  </div>
);

const FeeTab = () => {
  return (
    <div className="max-w-4xl pb-8">
      <h2 className="text-xl font-semibold mb-1">Account fees</h2>
      <p className="text-sm text-gray-600 mb-6">
        A complete payment platform engineered for growth. Software and infrastructure for e-commerce, marketplaces, and
        more
      </p>

      <div className="space-y-4">
        <FeeCard
          icon={cardPayImg}
          title="Card Payment"
          subtitle="Accepting payments online"
          priceLabel="Pay as you go"
          priceInfo="0.7% of card payment volume"
        />

        <FeeCard
          icon={rebillImg}
          title="Re-Billing"
          subtitle="Create and manage subscriptions"
          priceLabel="Pay every cycle"
          priceInfo="1.7% of re-billing volume"
        />
      </div>
    </div>
  );
};

export default FeeTab;
