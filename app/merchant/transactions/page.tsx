'use client';

import { DashLayout } from '@/components/layouts';
import { MoreHorizontal } from 'lucide-react';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import mastercardImage from '@/assets/images/mastercard.svg';
import visaImage from '@/assets/images/visa.svg';
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
import { useRouter } from 'next/navigation';
import { txStatusStyles } from '@/consts/styles';

const cardIcons: Record<Transaction['card'], string> = {
  mastercard: mastercardImage,
  visa: visaImage,
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const TransactionPage = () => {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Success' | 'Failed' | 'Pending' | 'Chargeback' | 'Refunded'
  >('All');
  const [cardType, setCardType] = useState();
  const [dateFilter, setDateFilter] = useState();
  const [amountFilter, setAmountFilter] = useState();
  const [orderField, setOrderField] = useState<'createdAt' | 'txid' | 'card' | 'status' | 'amount'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [txData, setTxData] = useState<TransactionData>({
    pagination: {
      totalLength: 0,
      itemsPerPage: 0,
      pageCount: 0,
      currentPage: 1,
    },
    data: [] as Transaction[],
  });

  const {
    response: txResponse,
    error: txError,
    loading: txLoading,
    sendRequest: sendTxRequest,
  } = useApiRequest({
    endpoint: transactionsUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
    params: {
      status: statusFilter,
      cardType,
      date: dateFilter,
      amount: amountFilter,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      orderField,
      order,
    },
  });

  const selectStatusFilter = (status: 'All' | 'Success' | 'Failed' | 'Pending' | 'Chargeback' | 'Refunded') => {
    setStatusFilter(status);
  };

  useEffect(() => {
    sendTxRequest();
  }, [statusFilter, cardType, dateFilter, amountFilter, currentPage, ITEMS_PER_PAGE, order, orderField]);

  useEffect(() => {
    if (txResponse) {
      // Handle the response data here
      setTxData(txResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [txResponse]);

  useEffect(() => {
    if (txError) {
      Toaster.error(txError?.message);

      // mock data instead: remove this code in production mode
      setTxData(txDataMock);
    }
  }, [txError]);

  useEffect(() => {
    sendTxRequest();
  }, []);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">All Transaction</h2>
        </>
      }
    >
      <div className="p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-b-gray-200 pb-2 mb-3">
          <div className="flex space-x-4 text-sm font-medium text-gray-900">
            <div
              className={`${
                statusFilter === 'All' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('All')}
            >
              All
            </div>
            <div
              className={`${
                statusFilter === 'Success' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Success')}
            >
              Success
            </div>
            <div
              className={`${
                statusFilter === 'Failed' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Failed')}
            >
              Failed
            </div>
            <div
              className={`${
                statusFilter === 'Pending' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Pending')}
            >
              Pending
            </div>
            <div
              className={`${
                statusFilter === 'Chargeback' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Chargeback')}
            >
              Chargeback
            </div>
            <div
              className={`${
                statusFilter === 'Refunded' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Refunded')}
            >
              Refunded
            </div>
          </div>
          {/* <button className="flex items-center gap-2 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded-full cursor-pointer transition-colors duration-200 ease-in-out hover:bg-blue-400">
            <Image src={excelIcon} alt="Export" className="h-4 w-4" />
            Export
          </button> */}
        </div>

        <div className="flex gap-4 flex-wrap text-sm mb-3">
          {['Date', 'Amount', 'Status', 'Card Type'].map((filter, idx) => (
            <button
              key={idx}
              className="border border-dashed border-gray-400 px-1 py-1 rounded-full flex items-center gap-1 text-gray-500 cursor-pointer"
            >
              <span className="bg-gray-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold">
                +
              </span>
              <span className="text-sm font-medium">{filter}</span>
            </button>
          ))}
        </div>
        <div className="h-12 bg-gray-100 -mx-4" style={{ width: 'calc(100% + var(--spacing) * 8)' }} />

        <div className="max-w-full overflow-auto -mt-12">
          <table className="table-auto w-full">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 mb-2">
              <tr className="h-12">
                <th className="text-left w-8">
                  <input type="checkbox" className="align-middle" />
                </th>
                <th
                  className="p-2 text-left cursor-pointer"
                  onClick={() =>
                    orderField !== 'createdAt' ? setOrderField('createdAt') : setOrder(order === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <div className="flex items-center">
                    <span>Date/Time</span>
                    <Image
                      src={
                        orderField !== 'createdAt' ? orderNormalIcon : order === 'asc' ? orderAscIcon : orderDescIcon
                      }
                      alt="order"
                    />
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer"
                  onClick={() =>
                    orderField !== 'txid' ? setOrderField('txid') : setOrder(order === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <div className="flex items-center">
                    <span>Transaction ID</span>
                    <Image
                      src={orderField !== 'txid' ? orderNormalIcon : order === 'asc' ? orderAscIcon : orderDescIcon}
                      alt="order"
                    />
                  </div>
                </th>
                <th className="p-2 text-left">Customer</th>
                <th
                  className="p-2 text-left cursor-pointer"
                  onClick={() =>
                    orderField !== 'card' ? setOrderField('card') : setOrder(order === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <div className="flex items-center">
                    <span>Card Type</span>
                    <Image
                      src={orderField !== 'card' ? orderNormalIcon : order === 'asc' ? orderAscIcon : orderDescIcon}
                      alt="order"
                    />
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer"
                  onClick={() =>
                    orderField !== 'status' ? setOrderField('status') : setOrder(order === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    <Image
                      src={orderField !== 'status' ? orderNormalIcon : order === 'asc' ? orderAscIcon : orderDescIcon}
                      alt="order"
                    />
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer"
                  onClick={() =>
                    orderField !== 'amount' ? setOrderField('amount') : setOrder(order === 'asc' ? 'desc' : 'asc')
                  }
                >
                  <div className="flex items-center">
                    <span>Amount</span>
                    <Image
                      src={orderField !== 'amount' ? orderNormalIcon : order === 'asc' ? orderAscIcon : orderDescIcon}
                      alt="order"
                    />
                  </div>
                </th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {txLoading && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    Loading Transactions...
                  </td>
                </tr>
              )}
              {!txLoading &&
                txData?.data?.length > 0 &&
                txData?.data.map((t, i) => (
                  <tr
                    key={i}
                    className="h-10 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => {
                      router.push(`/merchant/transactions/${t.id}`); // this needs to be changed with the local storage key
                    }}
                  >
                    <td className="border-b border-b-gray-200">
                      <input type="checkbox" className="align-middle" />
                    </td>
                    {/* <td className="pl-4 w-8 h-full">
                    <div className="border-b border-b-gray-200 flex items-center h-full w-full">
                      <input type="checkbox" style={{ verticalAlign: 'middle' }} />
                    </div>
                  </td> */}
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">
                      {t.date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">{t.id}</td>
                    <td className="p-2 whitespace-nowrap border-b border-b-gray-200">{t.customer}</td>
                    <td className="p-2 border-b border-b-gray-200">
                      <Image src={cardIcons[t.card]} alt={t.card} className="h-5 inline" />
                    </td>
                    <td className="p-2 border-b border-b-gray-200">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${txStatusStyles[t.status]} rounded-full`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2 font-semibold border-b border-b-gray-200">{`$${formatter.format(t.amount)}`}</td>
                    <td className="p-2 text-gray-500 border-b border-b-gray-200">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <MenuButton
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors duration-200 ease-in-out cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </MenuButton>
                        </div>
                        <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-300 focus:outline-none cursor-pointer">
                          <div className="py-1">
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Archive
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Refund
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                Checkout URL
                              </button>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Menu>
                    </td>
                  </tr>
                ))}
              {!txLoading && txData?.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    No Transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-12">
          <Pagination
            totalLength={txData.pagination.totalLength}
            limit={txData.pagination.itemsPerPage}
            pageCount={txData.pagination.pageCount}
            page={txData.pagination.currentPage}
            pageClick={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
    </DashLayout>
  );
};

export default TransactionPage;
