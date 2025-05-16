'use client';

import { DashLayout } from '@/components/layouts';
import { integrations } from '@/mock';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const IntegrationPage = () => {
  const router = useRouter();

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold truncate">Integrations</h2>
        </>
      }
    >
      <div className="p-6 bg-white rounded-lg space-y-10">
        {integrations.map((group) => (
          <div key={group.section}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{group.section}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col p-4 border border-gray-100 rounded-lg transition cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    if (group.section === 'Store Platforms')
                      router.push(`/merchant/integrations/apikeyit?title=${item.name}`);
                    else if (item.name === 'API Integration')
                      router.push(`/merchant/integrations/apikeyit?title=Custom`);
                    else if (group.section === 'Tracking Pixels')
                      router.push(`/merchant/integrations/pixelit?title=${item.name}`);
                    else if (item.name === 'Webhook') router.push(`/merchant/integrations/webhookit`);
                  }}
                >
                  <Image src={item.icon} alt={item.name} width={48} height={48} className="mb-3" />
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-3 mt-1">{item.description}</p>
                    </div>
                    <button className="text-blue-500 text-sm font-semibold flex items-center gap-1 cursor-pointer">
                      Connect Now <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashLayout>
  );
};

export default IntegrationPage;
