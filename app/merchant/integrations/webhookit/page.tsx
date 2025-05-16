'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DashLayout } from '@/components/layouts';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Webhook } from '@/types';
import { useApiRequest } from '@/hooks';
import { webhooksUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { webhookMockData } from '@/mock/hook';
import { MoreHorizontal, PlusIcon } from 'lucide-react';

import fileCopyIcon from '@/assets/images/icons/file-copy-2-fill.svg';
import backIcon from '@/assets/images/icons/back.svg';

const WebhookIntegrationPage = () => {
  const [hookData, setHookData] = useState<Webhook[]>([] as Webhook[]);
  const [showModal, setShowModal] = useState(false);
  const [event, setEvent] = useState('');
  const [type, setType] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleCopy = (str: string) => {
    navigator.clipboard
      .writeText(str)
      .then(() => {
        Toaster.success('Copied to clipboard');
      })
      .catch((err) => {
        Toaster.error('Failed to copy');
      });
  };

  const {
    response: webhookResponse,
    error: webhookError,
    loading: webhookLoading,
    sendRequest: sendWebhookRequest,
  } = useApiRequest({
    endpoint: webhooksUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
  });

  useEffect(() => {
    if (webhookResponse) {
      // Handle the response data here
      setHookData(webhookResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [webhookResponse]);

  useEffect(() => {
    if (webhookError) {
      Toaster.error(webhookError?.message);

      // mock data instead: remove this code in production mode
      setHookData(webhookMockData);
    }
  }, [webhookError]);

  useEffect(() => {
    sendWebhookRequest();
  }, []);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">System Integrations</h2>
        </>
      }
    >
      <div className="p-6 bg-white rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <Link href="/merchant/integrations" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
            <Image src={backIcon} alt="Back" className="w-4 h-4" />
            Back
          </Link>
          <button
            className="flex items-center gap-2 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md bg-blue-500 transition cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <PlusIcon className="w-4 h-4" />
            Add New Webhook
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Webhooks</div>
        </div>
        <div className="h-12 bg-gray-100 -mx-6" style={{ width: 'calc(100% + var(--spacing) * 12)' }} />
        <div className="max-w-full overflow-auto -mt-16">
          <table className="table-auto w-full mb-16">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 mb-2">
              <tr className="h-12">
                <th className="p-2 text-left">Created On</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">URL</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {webhookLoading && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    Loading Webhooks...
                  </td>
                </tr>
              )}
              {!webhookLoading &&
                hookData?.length > 0 &&
                hookData?.map((t, i) => (
                  <tr key={i} className="h-10">
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">
                      {t.createdAt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">{t.type}</td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">
                      <div className="flex items-center gap-2">
                        <span>{t.url}</span>
                        <button
                          title="Copy"
                          className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
                          onClick={() => handleCopy(t.url)}
                        >
                          <Image alt="Copy" src={fileCopyIcon} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2 border-b border-b-gray-200">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full text-gray-600 ${
                          t.isActive ? 'bg-[#CBFCCB]' : 'bg-gray-200'
                        }`}
                      >
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 text-gray-500 border-b border-b-gray-200">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <MenuButton className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors duration-200 ease-in-out cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </MenuButton>
                        </div>
                        <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-300 focus:outline-none cursor-pointer">
                          <div className="py-1">
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={() => {}}
                              >
                                Activate
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={() => {}}
                              >
                                Deactivate
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={() => {}}
                              >
                                Edit
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-red-600 text-red-500 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={() => {}}
                              >
                                Delete
                              </button>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </td>
                  </tr>
                ))}
              {!webhookLoading && hookData?.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    No Webhooks
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg space-y-4"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold">Webhook Setup</h2>
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-2xl hover:bg-gray-100 transition-colors duration-200 ease-in-out cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="max-w-xl w-full space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="w-full">
                  <Listbox value={type} onChange={setType}>
                    <div className="relative">
                      <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {type || 'Please select'}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                        <ListboxOption
                          value="success"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          success
                        </ListboxOption>
                        <ListboxOption
                          value="failed"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          failed
                        </ListboxOption>
                        <ListboxOption
                          value="pending"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          pending
                        </ListboxOption>
                        <ListboxOption
                          value="refund"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          refund
                        </ListboxOption>
                        <ListboxOption
                          value="chargeback"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          chargeback
                        </ListboxOption>
                        <ListboxOption
                          value="dispute"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          dispute
                        </ListboxOption>
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Event</label>
                <div className="w-full">
                  <Listbox value={event} onChange={setEvent}>
                    <div className="relative">
                      <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {event || 'Please select'}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                        <ListboxOption
                          value="Payment"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Payment
                        </ListboxOption>
                        <ListboxOption
                          value="Subscription"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Subscription
                        </ListboxOption>
                        <ListboxOption
                          value="Order"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Order
                        </ListboxOption>
                        <ListboxOption
                          value="Payout"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Payout & Settlement
                        </ListboxOption>
                        <ListboxOption
                          value="Customer"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Customer
                        </ListboxOption>
                        <ListboxOption
                          value="Merchant"
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-2 ${
                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          Merchant
                        </ListboxOption>
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL</label>
                <input
                  type="text"
                  placeholder="HTTPS URL is recommended"
                  className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-6 justify-center">
                <button className="bg-blue-50 text-blue-500 font-semibold w-42 py-2 rounded-md hover:bg-blue-100  transition cursor-pointer">
                  Cancel
                </button>
                <button className="hover:bg-blue-600 text-white font-semibold w-42 py-2 rounded-md bg-blue-500 transition cursor-pointer">
                  Save Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default WebhookIntegrationPage;
