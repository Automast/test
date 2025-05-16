'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@headlessui/react';
import { InfoIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashLayout } from '@/components/layouts';

import fileCopyIcon from '@/assets/images/icons/file-copy-2-fill.svg';
import eyeFillIcon from '@/assets/images/icons/eye-fill.svg';
import arrowRightIcon from '@/assets/images/icons/arrow-right-line.svg';
import backIcon from '@/assets/images/icons/back.svg';

const ApiKeyIntegrationPage = () => {
  const pathname = usePathname();

  const [viewingTestData, setViewingTestData] = useState(true);
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTitle(params.get('title'));
  }, [pathname]);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">System Integrations</h2>
        </>
      }
    >
      <div className="p-6 bg-white rounded-lg space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <Link href="/merchant/integrations" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
            <Image src={backIcon} alt="Back" className="w-4 h-4" />
            Back
          </Link>
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="text-base font-semibold">{title ?? ''} API Integration Keys</div>
          <Link
            href="/merchant/help"
            className="flex items-center gap-1 text-sm text-blue-500 font-medium cursor-pointer lg:justify-end"
          >
            Learn more about API authentication <Image src={arrowRightIcon} alt="to" className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 items-center justify-between bg-gray-100 p-4 rounded-lg gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 px-2">
            <InfoIcon fill="#777" stroke="white" className="w-5 h-5 rounded-full border-0" />
            Viewing test API Keys. Toggle to view live Keys
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 lg:justify-end">
            <Switch
              checked={!viewingTestData}
              onChange={() => setViewingTestData(!viewingTestData)}
              className={`${
                viewingTestData ? 'bg-gray-200' : 'bg-blue-500'
              } relative inline-flex h-5 w-10 items-center rounded-full transition cursor-pointer`}
            >
              <span
                className={`${
                  viewingTestData ? 'translate-x-1' : 'translate-x-5'
                } inline-block h-4 w-4 transform bg-white rounded-full transition`}
              />
            </Switch>
            Viewing test data
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Standard Key</h2>
          <p className="text-sm text-gray-600">
            These keys will allow you to authenticate API request.{' '}
            <Link href="/merchant/help" className="text-blue-500 cursor-pointer">
              Learn more
            </Link>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-gray-800 font-medium border-b border-gray-200">
                <th className="py-1">Name</th>
                <th className="py-1">Token</th>
                <th className="py-1">Last Used</th>
                <th className="py-1">Created</th>
                <th className="py-1">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {[
                { name: 'Publishable Key', token: 'pk_test_1234567890abcdefghijklmnopqrstuvwxyz', date: 'Feb 6, 2025' },
                { name: 'Secret Key', token: 'sk_test_1234567890abcdefghijklmnopqrstuvwxyz', date: 'Feb 6, 2025' },
              ].map((key, i) => (
                <tr key={key.name} className="">
                  <td className="pt-4 font-bold pr-2 min-w-30">{key.name}</td>
                  <td className="pt-4 truncate pr-2 max-w-xs">{key.token}</td>
                  <td className="pt-4 min-w-30 pr-2 ">{key.date}</td>
                  <td className="pt-4 min-w-30 pr-2">Jan 6, 2025</td>
                  <td className="pt-4 flex gap-2">
                    <button title="Copy" className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                      <Image alt="Copy" src={fileCopyIcon} className="w-4 h-4" />
                    </button>
                    <button title="Show" className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                      <Image alt="Show" src={eyeFillIcon} className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-4">
          <button className="hover:bg-blue-600 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer">
            Reset Publishable Key
          </button>
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer">
            Reset Secret Key
          </button>
        </div>
      </div>
    </DashLayout>
  );
};

export default ApiKeyIntegrationPage;
