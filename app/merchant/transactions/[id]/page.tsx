'use client';

import { DashLayout } from '@/components/layouts';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { txStatusStyles } from '@/consts/styles';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  LocateIcon,
  Mail,
  MapPin,
  MonitorSmartphone,
  Network,
  Phone,
  UserIcon,
} from 'lucide-react';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { transactionDetailUrl } from '@/consts/paths';
import { integrations, txDetailMock } from '@/mock';
import { TransactionDetail } from '@/types';

import backIcon from '@/assets/images/icons/back.svg';
import mastercardImage from '@/assets/images/mastercard.svg';
import visaImage from '@/assets/images/visa.svg';
import { SpinnerCircular } from 'spinners-react';

const TransactionDetailPage = () => {
  const { id } = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [txDetail, setTxDetail] = useState<TransactionDetail | null>(null);

  const {
    response: txResponse,
    error: txError,
    loading: txLoading,
    sendRequest: sendTxRequest,
  } = useApiRequest({
    endpoint: `${transactionDetailUrl}/${id}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
  });

  useEffect(() => {
    if (id) {
      sendTxRequest();
    }
  }, [id]);

  useEffect(() => {
    if (txResponse) {
      // Handle the response data here
      setTxDetail(txResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [txResponse]);

  useEffect(() => {
    if (txError) {
      Toaster.error(txError?.message);

      // mock data instead: remove this code in production mode
      setTxDetail(txDetailMock);
    }
  }, [txError]);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Transaction #{id}</h2>
        </>
      }
    >
      <div className="p-4 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <Link href="/merchant/transactions" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
            <Image src={backIcon} alt="Back" className="w-4 h-4" />
            Back
          </Link>
        </div>
        {txLoading && (
          <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
            <SpinnerCircular color="#006aff" secondaryColor="#66AAFF" />
            <div className="text-gray-600">Loading...</div>
          </div>
        )}
        {!txLoading && (
          <>
            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="flex items-center justify-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{txDetail?.customer?.name}</h2>
                    <p className="text-sm text-gray-500">{txDetail?.customer?.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      txStatusStyles[txDetail?.status ?? 'Succeeded']
                    } rounded-full`}
                  >
                    {txDetail?.status}
                  </span>
                </div>
              </div>
              <div className="">
                <button
                  className="hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  Action {menuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {menuOpen && (
                  <div className="absolute right-12 w-32 bg-white border border-gray-300 rounded-md z-10 py-1">
                    <ul className="text-sm text-gray-700">
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Archive</li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Refund</li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Checkout URL</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                {txDetail?.products &&
                  txDetail.products.length > 0 &&
                  txDetail.products.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border border-gray-300 p-4 rounded-lg">
                      <div className="flex items-center gap-4 lg:w-[40%]">
                        <div className="w-14 min-w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Image src={item.imageUrl} alt="Product" width={50} height={50} className="w-14 h-14" />
                        </div>
                        <div className="w-full">
                          <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-600 truncate">#{item.id}</p>
                        </div>
                      </div>
                      <div className="text-center hidden lg:block">
                        <p className="text-sm">
                          ${item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right hidden lg:block">
                        <p className="text-sm text-gray-500 font-semibold">{`$${item.price * item.quantity}`}</p>
                      </div>
                      <div className="block lg:hidden">
                        <p className="text-sm text-right">
                          ${item.price} × {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500 font-semibold text-right">{`$${
                          item.price * item.quantity
                        }`}</p>
                      </div>
                    </div>
                  ))}
                <div className="border border-gray-300 p-4 rounded-lg space-y-3">
                  <h3 className="font-bold text-gray-800 text-lg mb-4">Payment Resume</h3>
                  <div className="flex justify-between items-start gap-4">
                    <div className="max-w-[20%] truncate text-sm hidden lg:block">Subtotal</div>
                    <div className="flex-1 lg:max-w-[50%] space-y-2">
                      {txDetail?.products &&
                        txDetail.products.length > 0 &&
                        txDetail.products.map((item, idx) => (
                          <div className="flex justify-between text-sm" key={idx}>
                            <span>{item.quantity} item (s)</span>
                            <span className="text-right">${item.price * item.quantity}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <hr className="text-gray-300" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${txDetail?.amount}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
                <div>
                  <p className="text-sm flex items-center">
                    ID <span className="text-gray-800 ml-3">{id}</span>
                    <span
                      className="p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(id?.toString() ?? '');
                        Toaster.success('Transaction ID copied to clipboard');
                      }}
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Triggered on{' '}
                    {txDetail?.createdAt.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-gray-800">Contact Information</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {txDetail?.contact?.email}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {txDetail?.contact?.phone}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-gray-800">Billing Address</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5" />
                    {txDetail?.billing.name}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {txDetail?.billing.address}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-gray-800">Technical Details</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Network className="w-3.5 h-3.5" />
                    {txDetail?.technical.ip}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    {txDetail?.technical.device}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Generated By</h3>
                  <Image
                    className="text-sm text-gray-500 flex items-center gap-2 w-12 h-12 mt-1"
                    src={
                      integrations
                        .find((e) => e.items.find((i) => i.name === txDetail?.generatedBy) !== null)
                        ?.items.find((i) => i.name === txDetail?.generatedBy)?.icon ??
                      `https://ui-avatars.com/api/?name=${txDetail?.generatedBy}`
                    }
                    alt="Integration"
                    width={50}
                    height={50}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Payment Method</h3>
                  <Image
                    src={txDetail?.paymentMethod === 'Mastercard' ? mastercardImage : visaImage}
                    alt="payment"
                    className="w-16 h-10 rounded-md mt-1"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashLayout>
  );
};

export default TransactionDetailPage;
