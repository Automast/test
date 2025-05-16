'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DashLayout } from '@/components/layouts';

import backIcon from '@/assets/images/icons/back.svg';

const PixelIntegrationPage = () => {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [pixelID, setPixelID] = useState('');
  const [conversionApi, setConversionApi] = useState('');

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
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{title ?? ''} API Integration Keys</div>
        </div>

        <div className="max-w-xl w-full space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={name}
              className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pixel ID</label>
            <input
              type="text"
              placeholder="Enter pixel ID"
              className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pixelID}
              onChange={(e) => setPixelID(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Conversions API</label>
            <input
              type="text"
              placeholder="Enter conversion API"
              className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={conversionApi}
              onChange={(e) => setConversionApi(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button className="bg-blue-50 text-blue-500 font-semibold px-12 py-2 rounded-md hover:bg-blue-100  transition cursor-pointer">
              Cancel
            </button>
            <button className="hover:bg-blue-600 text-white font-semibold px-12 py-2 rounded-md bg-blue-500 transition cursor-pointer">
              Create
            </button>
          </div>
        </div>
      </div>
    </DashLayout>
  );
};

export default PixelIntegrationPage;
