// app/merchant/finance/accounts/page.tsx
'use client';

import { DashLayout } from '@/components/layouts';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { ChevronDownIcon, PencilLine, PlusIcon, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import bankIcon from '@/assets/images/icons/bank.svg';
import cryptoIcon from '@/assets/images/icons/crypto.svg';
import Image from 'next/image';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

interface Account {
  id: string;
  type: 'bank' | 'crypto';
  holder: string;
  address: string;
  where: string;
  isActive: boolean;
  updatedAt: Date;
  currency?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    branch?: string;
  };
  cryptoDetails?: {
    asset: 'USDT' | 'USDC';
    network: string;
    address: string;
  };
}

const cryptoNetworks = [
  { value: 'bep20-usdt', label: 'BEP20 - USDT', asset: 'USDT', network: 'BEP20' },
  { value: 'erc20-usdt', label: 'ERC20 - USDT', asset: 'USDT', network: 'ERC20' },
  { value: 'trc20-usdt', label: 'TRC20 - USDT', asset: 'USDT', network: 'TRC20' },
  { value: 'solana-usdc', label: 'Solana - USDC', asset: 'USDC', network: 'SOLANA' },
];

const bankCountries = [
  { value: 'US', label: 'United States', currency: 'USD' },
  { value: 'BR', label: 'Brazil', currency: 'BRL' },
];

const AccountsPage = () => {
  const [typeFilter, setTypeFilter] = useState<'bank' | 'crypto'>('bank');
  const [accountData, setAccountData] = useState<Account[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [currentBank, setCurrentBank] = useState<{ id?: string }>({});
  const [currentCrypto, setCurrentCrypto] = useState<{ id?: string }>({});
  const [userCountry, setUserCountry] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Bank form fields
  const [bankCountry, setBankCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountNumberConf, setAccountNumberConf] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [isBankPolicy, setIsBankPolicy] = useState(false);

  // Crypto form fields
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoAddressConf, setCryptoAddressConf] = useState('');
  const [isCryptoPolicy, setIsCryptoPolicy] = useState(false);

  // API requests
  const {
    response: userResponse,
    sendRequest: sendUserRequest,
  } = useApiRequest({
    endpoint: '/auth/me',
    method: 'GET',
    auth: true,
  });

  const {
    response: accountsResponse,
    error: accountsError,
    loading: accountsLoading,
    sendRequest: sendAccountsRequest,
  } = useApiRequest({
    endpoint: '/finance/accounts',
    method: 'GET',
    auth: true,
  });

  const {
    loading: savingBank,
    sendRequest: sendBankRequest,
  } = useApiRequest({
    endpoint: '/finance/accounts/bank',
    method: 'POST',
    auth: true,
  });

  const {
    loading: savingCrypto,
    sendRequest: sendCryptoRequest,
  } = useApiRequest({
    endpoint: '/finance/accounts/crypto',
    method: 'POST',
    auth: true,
  });

  // Fetch user and accounts data
  useEffect(() => {
    sendUserRequest();
    sendAccountsRequest();
  }, []);

  // Set user country
  useEffect(() => {
    if (userResponse && userResponse.success) {
      const country = userResponse.data.merchant.country;
      setUserCountry(country);
      setBankCountry(country);
    }
  }, [userResponse]);

  // Process accounts response
  useEffect(() => {
    if (accountsResponse && accountsResponse.success) {
      const accounts: Account[] = [];
      
      if (accountsResponse.data.bank) {
        const bank = accountsResponse.data.bank;
        accounts.push({
          id: bank.id,
          type: 'bank',
          holder: userResponse?.data?.merchant?.businessName || 'Business Account',
          address: bank.accountNumber,
          where: bank.bankName,
          isActive: true,
          updatedAt: new Date(bank.updatedAt || Date.now()),
          currency: bank.currency,
          bankDetails: bank,
        });
      }

      if (accountsResponse.data.crypto) {
        const crypto = accountsResponse.data.crypto;
        accounts.push({
          id: crypto.id,
          type: 'crypto',
          holder: userResponse?.data?.merchant?.businessName || 'Crypto Wallet',
          address: crypto.address,
          where: `${crypto.asset} - ${crypto.network}`,
          isActive: crypto.isActive,
          updatedAt: new Date(crypto.updatedAt || Date.now()),
          cryptoDetails: {
            asset: crypto.asset,
            network: crypto.network,
            address: crypto.address,
          },
        });
      }

      setAccountData(accounts);
    }
  }, [accountsResponse, userResponse]);

  useEffect(() => {
    if (accountsError) {
      Toaster.error(accountsError?.message || 'Failed to load accounts');
    }
  }, [accountsError]);

  // Reset forms when modals close
  useEffect(() => {
    if (!showBankModal) {
      setBankName('');
      setAccountNumber('');
      setAccountNumberConf('');
      setRoutingNumber('');
      setBranch('');
      setIsBankPolicy(false);
    }
  }, [showBankModal]);

  useEffect(() => {
    if (!showCryptoModal) {
      setCryptoNetwork('');
      setCryptoAddress('');
      setCryptoAddressConf('');
      setIsCryptoPolicy(false);
    }
  }, [showCryptoModal]);

  // Check if user already has accounts
  const hasBank = accountData.some(a => a.type === 'bank' && a.isActive);
  const hasCrypto = accountData.some(a => a.type === 'crypto' && a.isActive);

  // Get available countries based on user's location
  const getAvailableBankCountries = () => {
    if (userCountry === 'BR') {
      return bankCountries.filter(c => c.value === 'BR');
    }
    return bankCountries.filter(c => c.value === 'US');
  };

  // Validate bank form
  const validateBankForm = () => {
    if (!bankName.trim()) return 'Bank name is required';
    if (!accountNumber.trim()) return 'Account number is required';
    if (accountNumber !== accountNumberConf) return 'Account numbers do not match';
    if (bankCountry === 'US' && !routingNumber.trim()) return 'Routing number is required for US banks';
    if (bankCountry === 'BR' && !branch.trim()) return 'Branch is required for Brazilian banks';
    if (!isBankPolicy) return 'Please accept the terms';
    return null;
  };

  // Validate crypto form
  const validateCryptoForm = () => {
    if (!cryptoNetwork) return 'Please select a crypto network';
    if (!cryptoAddress.trim()) return 'Wallet address is required';
    if (cryptoAddress !== cryptoAddressConf) return 'Wallet addresses do not match';
    if (!isCryptoPolicy) return 'Please accept the terms';
    return null;
  };

  // Handle bank save
  const handleBankSave = async () => {
    const validation = validateBankForm();
    if (validation) {
      Toaster.error(validation);
      return;
    }

    try {
      const bankData = {
        bankName,
        accountNumber,
        routingNumber: bankCountry === 'US' ? routingNumber : undefined,
        branch: bankCountry === 'BR' ? branch : undefined,
        country: bankCountry,
      };

      await sendBankRequest('', bankData);
      setShowBankModal(false);
      Toaster.success('Bank account saved successfully');
      sendAccountsRequest(); // Refresh accounts
    } catch (error: any) {
      Toaster.error(error.message || 'Failed to save bank account');
    }
  };

  // Handle crypto save
  const handleCryptoSave = async () => {
    const validation = validateCryptoForm();
    if (validation) {
      Toaster.error(validation);
      return;
    }

    try {
      const selectedNetwork = cryptoNetworks.find(n => n.value === cryptoNetwork);
      if (!selectedNetwork) return;

      const cryptoData = {
        asset: selectedNetwork.asset,
        network: selectedNetwork.network,
        address: cryptoAddress,
      };

      await sendCryptoRequest('', cryptoData);
      setShowCryptoModal(false);
      Toaster.success('Crypto wallet saved successfully');
      sendAccountsRequest(); // Refresh accounts
    } catch (error: any) {
      Toaster.error(error.message || 'Failed to save crypto wallet');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Toaster.success('Copied to clipboard');
  };

  // Mask account number
  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  return (
    <DashLayout titleArea={<h2 className="text-xl font-semibold truncate">Manage Payout Accounts</h2>}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex space-x-6">
            <button
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                typeFilter === 'bank'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setTypeFilter('bank')}
            >
              Bank Accounts
            </button>
            <button
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                typeFilter === 'crypto'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setTypeFilter('crypto')}
            >
              Crypto Wallets
            </button>
          </div>

          {/* Add Account Button */}
          {typeFilter === 'bank' && (
            <button
              disabled={hasBank}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                hasBank
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
              }`}
              onClick={() => {
                if (hasBank) return;
                setCurrentBank({});
                setShowBankModal(true);
              }}
            >
              <PlusIcon className="w-4 h-4" />
              {hasBank ? 'Bank account already added' : 'Add Bank Account'}
            </button>
          )}

          {typeFilter === 'crypto' && (
            <button
              disabled={hasCrypto}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                hasCrypto
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
              }`}
              onClick={() => {
                if (hasCrypto) return;
                setCurrentCrypto({});
                setShowCryptoModal(true);
              }}
            >
              <PlusIcon className="w-4 h-4" />
              {hasCrypto ? 'Crypto wallet already added' : 'Add Crypto Wallet'}
            </button>
          )}
        </div>

        {/* Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {typeFilter === 'bank' ? 'Account Number' : 'Wallet Address'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {typeFilter === 'bank' ? 'Bank' : 'Network'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountsLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!accountsLoading &&
                accountData
                  .filter(account => account.type === typeFilter)
                  .map((account, i) => (
                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Image
                              src={typeFilter === 'bank' ? bankIcon : cryptoIcon}
                              alt="icon"
                              className="w-10 h-10"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{account.holder}</div>
                            {account.currency && (
                              <div className="text-sm text-gray-500">{account.currency}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono">
                            {typeFilter === 'bank'
                              ? showAccountNumber
                                ? account.address
                                : maskAccountNumber(account.address)
                              : `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                          </span>
                          {typeFilter === 'bank' && (
                            <button
                              onClick={() => setShowAccountNumber(!showAccountNumber)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(account.address)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.where}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.isActive
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {account.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.updatedAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            if (typeFilter === 'bank') {
                              setCurrentBank({ id: account.id });
                              // Pre-fill form with existing data
                              if (account.bankDetails) {
                                setBankName(account.bankDetails.bankName);
                                setAccountNumber(account.bankDetails.accountNumber);
                                setAccountNumberConf(account.bankDetails.accountNumber);
                                setRoutingNumber(account.bankDetails.routingNumber || '');
                                setBranch(account.bankDetails.branch || '');
                              }
                              setShowBankModal(true);
                            } else {
                              setCurrentCrypto({ id: account.id });
                              // Pre-fill form with existing data
                              if (account.cryptoDetails) {
                                setCryptoNetwork(`${account.cryptoDetails.network.toLowerCase()}-${account.cryptoDetails.asset.toLowerCase()}`);
                                setCryptoAddress(account.cryptoDetails.address);
                                setCryptoAddressConf(account.cryptoDetails.address);
                              }
                              setShowCryptoModal(true);
                            }
                          }}
                        >
                          <PencilLine className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}

              {!accountsLoading &&
                accountData.filter(account => account.type === typeFilter).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <Image
                          src={typeFilter === 'bank' ? bankIcon : cryptoIcon}
                          alt="No accounts"
                          className="w-12 h-12 opacity-30"
                        />
                        <div className="text-gray-500">
                          No {typeFilter === 'bank' ? 'bank accounts' : 'crypto wallets'} added yet
                        </div>
                        <button
                          onClick={() => {
                            if (typeFilter === 'bank') {
                              setCurrentBank({});
                              setShowBankModal(true);
                            } else {
                              setCurrentCrypto({});
                              setShowCryptoModal(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Add your first {typeFilter === 'bank' ? 'bank account' : 'crypto wallet'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-auto shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-6 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentBank?.id ? 'Edit Bank Account' : 'Add Bank Account'}
              </h2>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setShowBankModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <Listbox value={bankCountry} onChange={setBankCountry}>
                  <div className="relative">
                    <ListboxButton className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {getAvailableBankCountries().find(c => c.value === bankCountry)?.label || 'Select country'}
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </ListboxButton>
                    <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                      {getAvailableBankCountries().map((country) => (
                        <ListboxOption
                          key={country.value}
                          value={country.value}
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-3 ${
                              active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          {country.label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter bank name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                {/* Confirm Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Confirm account number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={accountNumberConf}
                    onChange={(e) => setAccountNumberConf(e.target.value)}
                  />
                </div>

                {/* US-specific fields */}
                {bankCountry === 'US' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter routing number"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                    />
                  </div>
                )}

                {/* Brazil-specific fields */}
                {bankCountry === 'BR' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter branch"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  id="bank-policy"
                  type="checkbox"
                  checked={isBankPolicy}
                  onChange={(e) => setIsBankPolicy(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="bank-policy" className="text-sm text-gray-700">
                  I confirm that the bank account details are accurate and I consent to submitting this information through the platform.
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowBankModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBankSave}
                disabled={savingBank || !isBankPolicy}
                className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingBank ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Bank Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg mx-auto shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-6 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentCrypto?.id ? 'Edit Crypto Wallet' : 'Add Crypto Wallet'}
              </h2>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                onClick={() => setShowCryptoModal(false)}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crypto Network <span className="text-red-500">*</span>
                </label>
                <Listbox value={cryptoNetwork} onChange={setCryptoNetwork}>
                  <div className="relative">
                    <ListboxButton className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {cryptoNetworks.find(n => n.value === cryptoNetwork)?.label || 'Select network'}
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </ListboxButton>
                    <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                      {cryptoNetworks.map((network) => (
                        <ListboxOption
                          key={network.value}
                          value={network.value}
                          className={({ active }) =>
                            `cursor-pointer select-none px-4 py-3 ${
                              active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                            }`
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{network.label}</span>
                            <span className="text-xs text-gray-500">
                              {network.network} Network • {network.asset}
                            </span>
                          </div>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
                <p className="mt-1 text-xs text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Gas fees may apply for crypto withdrawals</span>
                </p>
              </div>

                            {/* Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter wallet address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                />
              </div>

              {/* Confirm Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Confirm wallet address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={cryptoAddressConf}
                  onChange={(e) => setCryptoAddressConf(e.target.value)}
                />
              </div>

              {/* Warning message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Ensure the wallet address is correct for the selected network</li>
                      <li>• Only stable coins (USDT/USDC) are supported</li>
                      <li>• Wrong network selection may result in permanent loss of funds</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  id="crypto-policy"
                  type="checkbox"
                  checked={isCryptoPolicy}
                  onChange={(e) => setIsCryptoPolicy(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="crypto-policy" className="text-sm text-gray-700">
                  I confirm that the wallet address is correct and I understand the risks involved with crypto transactions.
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowCryptoModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCryptoSave}
                disabled={savingCrypto || !isCryptoPolicy}
                className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingCrypto ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Crypto Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default AccountsPage;
