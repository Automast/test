'use client';

import { DashLayout } from '@/components/layouts';
import { payoutAccountsUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { accountsMock } from '@/mock';
import { Account } from '@/types';
import { ChevronDownIcon, PencilLine, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import bankIcon from '@/assets/images/icons/bank.svg';
import cryptoIcon from '@/assets/images/icons/crypto.svg';
import Image from 'next/image';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

const AccountsPage = () => {
  const [typeFilter, setTypeFilter] = useState<'bank' | 'crypto'>('bank');
  const [accountData, setAccountData] = useState<Account[]>([] as Account[]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [currentBank, setCurrentBank] = useState<{
    id?: string;
  }>({});
  const [currentCrypto, setCurrentCrypto] = useState<{ id?: string }>({});

  const [currency, setCurrency] = useState('');
  const [country, setCountry] = useState('');
  const [accNum, setAccNum] = useState('');
  const [iban, setIban] = useState('');
  const [accNumConf, setAccNumConf] = useState('');
  const [swift, setSwift] = useState('');
  const [routing, setRouting] = useState('');
  const [isPolicy, setPolicy] = useState(false);

  const [crAccount, setCrAccount] = useState('');
  const [crChannel, setCrChannel] = useState('');
  const [crAddress, setCrAddress] = useState('');
  const [crAddressConf, setCrAddressConf] = useState('');
  const [isCrPolicy, setCrPolicy] = useState(false);

  const {
    response: accountsResponse,
    error: accountsError,
    loading: accountsLoading,
    sendRequest: sendAccountsRequest,
  } = useApiRequest({
    endpoint: payoutAccountsUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
    params: {
      type: typeFilter,
    },
  });

  useEffect(() => {
    if (accountsResponse) {
      // Handle the response data here
      setAccountData(accountsResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [accountsResponse]);

  useEffect(() => {
    if (accountsError) {
      Toaster.error(accountsError?.message);

      // mock data instead: remove this code in production mode
      setAccountData(accountsMock);
    }
  }, [accountsError]);

  useEffect(() => {
    if (!showBankModal) {
      setCurrency('');
      setCountry('');
      setAccNum('');
      setAccNumConf('');
      setIban('');
      setSwift('');
      setRouting('');
      setPolicy(false);
    }
  }, [showBankModal]);

  useEffect(() => {
    if (!showCryptoModal) {
      setCrAccount('');
      setCrChannel('');
      setCrAddress('');
      setCrAddressConf('');
      setCrPolicy(false);
    }
  }, [showCryptoModal]);

  useEffect(() => {
    sendAccountsRequest();
  }, [typeFilter]);

  return (
    <DashLayout titleArea={<h2 className="text-xl font-semibold truncate">Manage Payout Accounts</h2>}>
      <div className="p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-b-gray-200 pb-2 mb-3 mx-2">
          <div className="flex space-x-4 text-sm font-medium text-gray-900">
            <div
              className={`${
                typeFilter === 'bank' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out truncate`}
              onClick={() => setTypeFilter('bank')}
            >
              Bank Accounts
            </div>
            <div
              className={`${
                typeFilter === 'crypto' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out truncate`}
              onClick={() => setTypeFilter('crypto')}
            >
              Crypto Wallets
            </div>
          </div>
          {typeFilter === 'bank' && (
            <button
              className="flex items-center gap-2 hover:bg-blue-600 text-white px-3 py-2 ml-2 text-sm rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-blue-400 truncate"
              onClick={() => {
                setCurrentBank({});
                setShowBankModal(true);
              }}
            >
              <PlusIcon className="w-4 h-4" />
              Add New Bank Account
            </button>
          )}
          {typeFilter === 'crypto' && (
            <button
              className="flex items-center gap-2 hover:bg-blue-600 text-white px-3 py-2 ml-2 text-sm rounded-md cursor-pointer transition-colors duration-200 ease-in-out hover:bg-blue-400 truncate"
              onClick={() => setShowCryptoModal(true)}
            >
              <PlusIcon className="w-4 h-4" />
              Add New Crypto Wallet
            </button>
          )}
        </div>
        {/* <div className="flex gap-4 flex-wrap mb-3 px-2 items-center justify-between">
          {typeFilter === 'bank' && <div className="text-lg font-semibold">Payout Bank Accounts</div>}
          {typeFilter === 'crypto' && <div className="text-lg font-semibold">Payout Crypto Wallets</div>}
        </div> */}
        <div className="h-12 bg-gray-100 -mx-6" style={{ width: 'calc(100% + var(--spacing) * 12)' }} />

        <div className="max-w-full overflow-auto -mt-12">
          <table className="table-auto w-full mb-16">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 mb-2">
              <tr className="h-12">
                <th className="p-2 text-left">Account Holder</th>
                <th className="p-2 text-left">
                  {typeFilter === 'bank' && 'Account Number'}
                  {typeFilter === 'crypto' && 'Wallet Address'}
                </th>
                <th className="p-2 text-left">
                  {typeFilter === 'bank' && 'Bank Name'}
                  {typeFilter === 'crypto' && 'Crypto Channel'}
                </th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Updated On</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {accountsLoading && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    {typeFilter === 'bank' && 'Loading Bank Accounts...'}
                    {typeFilter === 'crypto' && 'Loading Wallet Addresses...'}
                  </td>
                </tr>
              )}
              {!accountsLoading &&
                accountData?.length > 0 &&
                accountData?.map((t, i) => (
                  <tr key={i} className="h-10">
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200 min-w-30">
                      <div className="flex items-center gap-2">
                        <Image src={typeFilter === 'bank' ? bankIcon : cryptoIcon} alt="icon" className="w-8 h-8" />
                        {t.holder}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">{t.address}</td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">{t.where}</td>
                    <td className="p-2 border-b border-b-gray-200">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full text-gray-600 ${
                          t.isActive ? 'bg-[#CBFCCB]' : 'bg-gray-200'
                        }`}
                      >
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">
                      {t.updatedAt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-2 text-gray-500 border-b border-b-gray-200">
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition cursor-pointer"
                        onClick={() => {
                          if (typeFilter === 'bank') {
                            setCurrentBank({ id: t.id });
                            setShowBankModal(true);
                          } else {
                            setCurrentCrypto({ id: t.id });
                            setShowCryptoModal(true);
                          }
                        }}
                      >
                        <PencilLine
                          fill="gray"
                          className="w-4 h-4 text-gray-700 hover:text-gray-500 cursor-pointer transition"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              {!accountsLoading && accountData?.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    {typeFilter === 'bank' && 'No Bank Accounts'}
                    {typeFilter === 'crypto' && 'No Crypto Wallets'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showBankModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]"
          onClick={() => setShowBankModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold">
                {currentBank?.id ? 'Edit Bank Details' : 'Add New Bank Details'}
              </h2>
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-2xl hover:bg-gray-100 transition-colors duration-200 ease-in-out cursor-pointer"
                onClick={() => setShowBankModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="max-w-xl w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Currency</label>
                  <div className="w-full">
                    <Listbox value={currency} onChange={setCurrency}>
                      <div className="relative">
                        <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {currency?.toUpperCase() || 'Please select'}
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                          <ListboxOption
                            value="usd"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            USD
                          </ListboxOption>
                          <ListboxOption
                            value="euro"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            EURO
                          </ListboxOption>
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Country of Bank Account</label>
                  <div className="w-full">
                    <Listbox value={country} onChange={setCountry}>
                      <div className="relative">
                        <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {country || 'Please select'}
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                          <ListboxOption
                            value="USA"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            United States
                          </ListboxOption>
                          <ListboxOption
                            value="UK"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            United Kingdom
                          </ListboxOption>
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter Account Number"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accNum}
                    onChange={(e) => setAccNum(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm Account Number</label>
                  <input
                    type="text"
                    placeholder="Retype Account Number"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={accNumConf}
                    onChange={(e) => setAccNumConf(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">IBAN</label>
                  <input
                    type="text"
                    placeholder="Enter IBAN Number"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Swift Code</label>
                  <input
                    type="text"
                    placeholder="Enter Swift Code"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={swift}
                    onChange={(e) => setSwift(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Routing Code</label>
                  <input
                    type="text"
                    placeholder="Enter Routing Code"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={isPolicy}
                    onChange={(e) => setPolicy(e.target.checked)}
                    className="
                      appearance-none
                      h-4 w-4
                      border-2 border-gray-300
                      rounded
                      cursor-pointer
                      peer
                      checked:border-black
                      checked:bg-black"
                  />
                  <span
                    className="
                      absolute
                      left-1/2 top-1/2
                      -translate-x-1/2 -translate-y-1/2
                      text-white
                      opacity-0
                      peer-checked:opacity-100"
                  >
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </label>
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Submitting this bank details though our platform with your concern
                </label>
              </div>
              <div className="flex gap-4 pt-6 justify-center">
                <button className="bg-blue-50 text-blue-500 font-semibold w-42 py-2 rounded-md hover:bg-blue-100  transition cursor-pointer">
                  Cancel
                </button>
                <button className="hover:bg-blue-600 text-white font-semibold w-42 py-2 rounded-md bg-blue-500 transition cursor-pointer">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCryptoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]"
          onClick={() => setShowCryptoModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold">
                {currentCrypto?.id ? 'Edit Crypto Wallet Details' : 'Add New Crypto Wallet'}
              </h2>
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-2xl hover:bg-gray-100 transition-colors duration-200 ease-in-out cursor-pointer"
                onClick={() => setShowCryptoModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="max-w-xl w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter Account Number"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={crAccount}
                    onChange={(e) => setCrAccount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Account Number</label>
                  <div className="w-full">
                    <Listbox value={crChannel} onChange={setCrChannel}>
                      <div className="relative">
                        <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {crChannel?.toUpperCase() || 'Please select'}
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                          <ListboxOption
                            value="erc20-usdt"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            ERC20-USDT
                          </ListboxOption>
                          <ListboxOption
                            value="trc20-usdt"
                            className={({ active }) =>
                              `cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            TRC20-USDT
                          </ListboxOption>
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter Wallet Address"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={crAddress}
                    onChange={(e) => setCrAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Retype Wallet Address"
                    className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={crAddressConf}
                    onChange={(e) => setCrAddressConf(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <label className="relative flex items-center cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={isCrPolicy}
                    onChange={(e) => setCrPolicy(e.target.checked)}
                    className="
                      appearance-none
                      h-4 w-4
                      border-2 border-gray-300
                      rounded
                      cursor-pointer
                      peer
                      checked:border-black
                      checked:bg-black"
                  />
                  <span
                    className="
                      absolute
                      left-1/2 top-1/2
                      -translate-x-1/2 -translate-y-1/2
                      text-white
                      opacity-0
                      peer-checked:opacity-100"
                  >
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </label>
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Submitting this bank details though our platform with your concern
                </label>
              </div>
              <div className="flex gap-4 pt-6 justify-center">
                <button className="bg-blue-50 text-blue-500 font-semibold w-42 py-2 rounded-md hover:bg-blue-100  transition cursor-pointer">
                  Cancel
                </button>
                <button className="hover:bg-blue-600 text-white font-semibold w-42 py-2 rounded-md bg-blue-500 transition cursor-pointer">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default AccountsPage;
