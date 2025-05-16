'use client';

import { DashLayout } from '@/components/layouts';
import { MoreHorizontal } from 'lucide-react';

import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';

import { Pagination } from '@/components/widgets';
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { useApiRequest } from '@/hooks';
import { transactionsUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { Transaction, TransactionData } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { txDataMock } from '@/mock';

import excelIcon from '@/assets/images/icons/excel-export.svg';
import orderNormalIcon from '@/assets/images/icons/order-normal.svg';
import orderAscIcon from '@/assets/images/icons/order-asc.svg';
import orderDescIcon from '@/assets/images/icons/order-desc.svg';
import { useRouter, useSearchParams } from 'next/navigation';
import { txStatusStyles } from '@/consts/styles';
import { BusinessSettingsTab, FeeSettingsTab, ProfileSettingsTab } from '@/components/ui';
import Link from 'next/link';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const tabs: Record<'business' | 'security' | 'fee', string> = {
  business: 'Business Details',
  security: 'Login & Security',
  fee: 'Account Fees',
};

const RawSettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'business' | 'security' | 'fee'>('business');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['business', 'security', 'fee'].includes(tab)) {
      setActiveTab(tab as 'business' | 'security' | 'fee');
    }
  }, [searchParams]);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Settings</h2>
        </>
      }
    >
      <div className="px-2 py-4 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-b-gray-200 mx-2 mb-3 pb-2">
          <div className="flex space-x-4 text-sm font-medium text-gray-900">
            {['business', 'security', 'fee'].map((tab) => (
              <Link
                key={tab}
                className={`${
                  activeTab === tab ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
                } transition-colors duration-200 ease-in-out`}
                href={`/merchant/settings?tab=${tab}`}
              >
                {tabs[tab as 'business' | 'security' | 'fee']}
              </Link>
            ))}
          </div>
        </div>
        <div className="max-w-5xl px-2">
          {activeTab === 'business' && <BusinessSettingsTab />}
          {activeTab === 'fee' && <FeeSettingsTab />}
          {activeTab === 'security' && <ProfileSettingsTab />}
        </div>
      </div>
    </DashLayout>
  );
};

export default function SettingsPage() {
  return (
    <Suspense>
      <RawSettingsPage />
    </Suspense>
  );
}
