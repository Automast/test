'use client';

import { DashLayout } from '@/components/layouts';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { productDetailUrl, transactionDetailUrl } from '@/consts/paths';
import { integrations, prDetailMock, txDetailMock } from '@/mock';
import { ProductDetail, TransactionDetail } from '@/types';
import { SpinnerCircular } from 'spinners-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

import backIcon from '@/assets/images/icons/back.svg';
import { AddProductModal } from '@/components/ui';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ProductDetailPage = () => {
  const { id } = useParams();
  const [prDetail, setPrDetail] = useState<ProductDetail | null>(null);
  const [editModal, setEditModal] = useState(false);

  const {
    response: prResponse,
    error: prError,
    loading: prLoading,
    sendRequest: sendPrRequest,
  } = useApiRequest({
    endpoint: `${productDetailUrl}/${id}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
  });

  useEffect(() => {
    if (id) {
      sendPrRequest();
    }
  }, [id]);

  useEffect(() => {
    if (prResponse) {
      // Handle the response data here
      setPrDetail(prResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [prResponse]);

  useEffect(() => {
    if (prError) {
      Toaster.error(prError?.message);

      // mock data instead: remove this code in production mode
      setPrDetail(prDetailMock);
    }
  }, [prError]);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Product #{id}</h2>
        </>
      }
    >
      <div className="p-6 bg-white rounded-lg">
        <div className="flex items-center justify-between pb-6">
          <Link href="/merchant/products" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
            <Image src={backIcon} alt="Back" className="w-4 h-4" />
            Back
          </Link>
        </div>
        {prLoading && (
          <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
            <SpinnerCircular color="#006aff" secondaryColor="#66AAFF" />
            <div className="text-gray-600">Loading...</div>
          </div>
        )}
        {!prLoading && prDetail && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-lg font-semibold">Product Name</h1>
                <p className="text-gray-500 text-sm">Copy and share to start accepting payment with this link</p>
                <div className="flex mt-4 space-x-2">
                  <Link
                    href={prDetail.url}
                    className="border border-gray-300 p-1 rounded w-80 h-7 text-sm truncate flex items-center"
                  >
                    {prDetail.url}
                  </Link>
                  <button
                    className="hover:bg-blue-600 bg-blue-500 text-white px-4 h-7 rounded-lg text-sm cursor-pointer"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(prDetail.url);
                        Toaster.success('URL is copied to clipboard');
                      } catch (err) {
                        Toaster.error(err instanceof Error ? err.message : 'Something went wrong');
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  className="border border-gray-100 shadow-lg px-4 py-1 font-semibold rounded-lg text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => setEditModal(true)}
                >
                  Edit Product
                </button>
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <MenuButton
                      className="flex items-center justify-center w-8 h-7.5 rounded-md shadow-lg bg-gray-300 hover:bg-gray-200 transition-colors duration-200 ease-in-out cursor-pointer"
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
                          Deactivate Product
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {/* Left side */}
              <div className="md:col-span-2 space-y-6">
                {/* Product */}
                <div className="rounded-lg bg-white">
                  <h2 className="text-lg font-semibold border-b border-gray-300">Product</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 text-gray-500 text-left">
                        <th className="py-2 max-w-16 w-16"></th>
                        <th className="py-2">Name</th>
                        <th className="py-2">Quantity</th>
                        <th className="py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="">
                        <td className="py-2">
                          <Image src={prDetail.image} alt="product" className="w-12 h-12" width={48} height={48} />
                        </td>
                        <td className="">
                          <div>
                            <div className="font-semibold text-black">{prDetail.name}</div>
                            <div className="text-gray-500 text-xs">{prDetail.description}</div>
                          </div>
                        </td>
                        <td>{prDetail.quantity}</td>
                        <td className="font-medium">US$ {formatter.format(prDetail.price)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Cross-selling */}
                <div className="">
                  <h2 className="text-lg font-semibold">Cross-selling</h2>
                  <p className="text-sm text-gray-500">
                    Suggest a related product for customer to add to their order, right at Checkout.
                  </p>
                  <div className="flex items-center mt-4 gap-4">
                    <div className="text-sm">Cross-selling to</div>
                    <input
                      type="text"
                      placeholder="Find a product…"
                      className="flex-1 border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right side - Insights & Details */}
              <div className="space-y-6">
                <div className="bg-white space-y-2">
                  <h2 className="text-lg font-semibold border-b border-gray-300">Insights</h2>
                  <div>
                    <div className="text-gray-500 text-sm">MRR</div>
                    <div className="font-medium text-sm">US$ {formatter.format(prDetail.mrr)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">
                      {prDetail.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white space-y-2">
                  <h2 className="text-lg font-semibold border-b border-gray-300">Details</h2>
                  <div className="space-y-1">
                    <div className="text-black font-semibold">Product ID</div>
                    <div className="text-sm text-gray-600">{prDetail.id}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-black font-semibold">Description</div>
                    <div className="text-sm text-gray-600">{prDetail.description}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-black font-semibold">Product Type</div>
                    <div className="text-sm text-gray-600">{prDetail.type}</div>
                  </div>
                  {prDetail.type === 'Physical' && (
                    <div className="space-y-1">
                      <div className="text-black font-semibold">Shipping</div>
                      <table className="w-full text-sm">
                        <tbody>
                          {prDetail.shipping &&
                            prDetail.shipping.map((s, i) => (
                              <tr className="h-6 text-gray-600" key={i}>
                                <td className="">{s.name}</td>
                                <td className="text-center">{`${s.minDay}-${s.maxDay} days`}</td>
                                <td className="font-medium text-end">US$ {formatter.format(s.fee)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddProductModal open={editModal} onClose={() => setEditModal(false)} type={prDetail?.type ?? 'Digital'} />
    </DashLayout>
  );
};

export default ProductDetailPage;
