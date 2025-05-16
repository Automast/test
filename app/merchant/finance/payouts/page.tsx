'use client';

import { Suspense, useEffect, useState } from 'react';
import { DashLayout } from '@/components/layouts';
import { payoutDetailUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { useApiRequest } from '@/hooks';
import { payoutDetailMock } from '@/mock';
import { PayoutDetail } from '@/types'; // Assuming PayoutDetail is correctly defined in your types
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SpinnerCircular } from 'spinners-react';

import backIcon from '@/assets/images/icons/back.svg';
import pendingImg from '@/assets/images/pending-state.png';
import approvedImg from '@/assets/images/approved-state.png';
import failedImg from '@/assets/images/failed-state.png';
import successImg from '@/assets/images/success-state.png';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PayoutPage = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [detail, setDetail] = useState<PayoutDetail | undefined>();

  const {
    response: payoutResponse,
    error: payoutError,
    loading: payoutLoading,
    sendRequest: sendPayoutRequest,
  } = useApiRequest({
    endpoint: id ? `${payoutDetailUrl}/${id}` : undefined, // Prevent request if id is null
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
  });

  useEffect(() => {
    // Only send request if id is available
    if (id) {
      sendPayoutRequest();
    }
  }, [id, sendPayoutRequest]); // Depend on id and sendPayoutRequest

  useEffect(() => {
    if (payoutResponse) {
      // Handle the response data here
      setDetail(payoutResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [payoutResponse]);

  useEffect(() => {
    if (payoutError) {
      // **FIXED LINE BELOW**
      Toaster.error(payoutError.message || 'An error occurred while fetching payout details.');

      // mock data instead: remove this code in production mode
      setDetail(payoutDetailMock);
    }
  }, [payoutError]);

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Payout Details</h2>
        </>
      }
    >
      {payoutLoading && (
        <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
          <SpinnerCircular color="#006aff" secondaryColor="#66AAFF" />
          <div className="text-gray-600">Loading...</div>
        </div>
      )}
      {!payoutLoading && !detail && !payoutError && id && ( // Case where loading is done, no detail, no error, but ID was present (implies failed fetch not caught by payoutError or empty data)
         <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
            <Image src={failedImg} alt="Failed to load" width={64} height={64} />
            <div className="text-gray-600">Could not load payout details.</div>
         </div>
      )}
      {!payoutLoading && !id && ( // Case where ID is missing from URL
         <div className="flex items-center justify-center flex-col p-6 bg-white rounded-lg space-y-6 h-[240px]">
            <Image src={failedImg} alt="No ID" width={64} height={64} />
            <div className="text-gray-600">Payout ID is missing.</div>
            <Link href="/merchant/finance" className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              Go back to Finance
            </Link>
         </div>
      )}
      {!payoutLoading && detail && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 bg-white rounded-lg space-y-1">
              <div className="flex items-center justify-between pb-2">
                <Link href="/merchant/finance" className="text-sm text-gray-800 cursor-pointer flex items-center gap-1">
                  <Image src={backIcon} alt="Back" className="w-4 h-4" />
                  Back
                </Link>
              </div>
              <div className="text-sm text-gray-800">Payout Details</div>
              <div className="flex my-4 mx-2 gap-4">
                <Image
                  src={
                    detail?.status === 'Approved'
                      ? approvedImg
                      : detail?.status === 'Pending'
                      ? pendingImg
                      : detail?.status === 'Failed'
                      ? failedImg
                      : pendingImg // Default to pending or an 'unknown' image if status is unexpected
                  }
                  alt={detail?.status || "Status"}
                  className="w-16 h-16"
                />
                <div className="flex flex-col justify-between">
                  <p className="text-lg font-semibold">{`$${formatter.format(
                    (detail?.amount.total ?? 0) - (detail?.amount.tax ?? 0) - (detail?.amount.fee ?? 0)
                  )}`}</p>
                  <p className="text-sm text-gray-500">
                    Created on{' '}
                    {detail?.createdAt ? new Date(detail.createdAt).toLocaleString('en-US', { // Ensure createdAt is valid before toLocaleString
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-white rounded-lg flex flex-col">
              <div className="flex justify-between py-2">
                <div className="text-gray-700">Total Payout</div>
                <div className="font-bold">{`$${formatter.format(detail?.amount.total ?? 0)}`}</div>
              </div>
              <div className="flex justify-between py-2">
                <div className="text-gray-700">Tax</div>
                <div className="font-bold">{`$${formatter.format(detail?.amount.tax ?? 0)}`}</div>
              </div>
              <div className="flex justify-between py-2">
                <div className="text-gray-700">Fee</div>
                <div className="font-bold">{`$${formatter.format(detail?.amount.fee ?? 0)}`}</div>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <div className="text-gray-700">You Received</div>
                <div className="font-bold">{`$${formatter.format(
                  (detail?.amount.total ?? 0) - (detail?.amount.tax ?? 0) - (detail?.amount.fee ?? 0)
                )}`}</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="p-6 bg-white rounded-lg flex flex-col">
              <div className="font-semibold text-base">Timeline</div>
              <div className="mt-4 ">
                {/* Payout Created At */}
                <div className="flex items-start relative pb-8">
                  <div className="flex flex-col items-center mr-4">
                    <div className="text-green-500">
                      <Image
                        src={detail?.createdAt ? successImg : pendingImg} // Or failedImg if appropriate for no createdAt
                        alt="state-created"
                        width={24} // Standardized icon size for timeline
                        height={24}
                        className="w-6 h-6 rounded-full" // Ensure w-6 h-6 if width/height are 24
                      />
                    </div>
                    {detail?.processedAt && ( // Line should connect if next step exists
                      <div className="h-full border-l-2 border-[#CBFCCB] absolute left-3 top-6 bottom-0"></div>
                    )}
                  </div>
                  <div className="pl-2 space-y-1">
                    <h4 className="font-semibold text-gray-900">Payout Created</h4>
                    <div className="text-sm text-gray-600">
                      {detail?.createdAt ? new Date(detail.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }) : 'Not available'}
                    </div>
                  </div>
                </div>

                {/* Payout Processed At - Conditionally render if processedAt exists */}
                {detail?.processedAt && (
                  <div className="flex items-start relative pb-8">
                    <div className="flex flex-col items-center mr-4">
                      <div className="text-green-500">
                        <Image
                          src={successImg} // Always success if processedAt exists
                          alt="state-processed"
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                      </div>
                      {detail?.status === 'Approved' && ( // Line to next step if applicable
                         <div className="h-full border-l-2 border-[#CBFCCB] absolute left-3 top-6 bottom-0"></div>
                      )}
                    </div>
                    <div className="pl-2 space-y-1">
                      <h4 className="font-semibold text-gray-900">Payout Processed</h4>
                      <div className="text-sm text-gray-600">
                        <div>{`Processed on ${new Date(detail.processedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}`}</div>
                        <div>
                          {`We have successfully processed the payout request. It may take 2-3 hours for funds reflect in
                          your bank account. If the money has still not been deposited after this time, please contact
                          your bank using the Payout Number (`}
                          <span className="font-semibold text-black">{detail?.txid}</span>
                          {')'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Money Deposited At - Conditionally render based on status 'Approved' */}
                {detail?.status === 'Approved' && (
                  <div className="flex items-start relative"> {/* No pb-8 if last item */}
                    <div className="flex flex-col items-center mr-4">
                      <div className="text-green-500">
                        <Image
                          src={successImg}
                          alt="state-deposited"
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="pl-2 space-y-1">
                      <h4 className="font-semibold text-gray-900">Money Deposited</h4>
                      <div className="text-sm text-gray-600">
                        <div>
                          Net Amount:{' '}
                          <span className="text-black font-semibold">{`$${formatter.format(
                            (detail?.amount.total ?? 0) - (detail?.amount.tax ?? 0) - (detail?.amount.fee ?? 0)
                          )}`}</span>
                        </div>
                        <div>
                          Payout Number: <span className="text-black font-semibold">{`${detail?.txid}`}</span>
                        </div>
                         {/* You might want a depositedAt date here if available */}
                      </div>
                    </div>
                  </div>
                )}
                 {/* Handling for Pending status */}
                 {detail?.status === 'Pending' && !detail?.processedAt && (
                    <div className="flex items-start relative">
                        <div className="flex flex-col items-center mr-4">
                            <Image
                                src={pendingImg}
                                alt="state-pending"
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full"
                            />
                        </div>
                        <div className="pl-2 space-y-1">
                            <h4 className="font-semibold text-gray-900">Payout Pending</h4>
                            <div className="text-sm text-gray-600">This payout is currently awaiting processing.</div>
                        </div>
                    </div>
                )}
                 {/* Handling for Failed status */}
                 {detail?.status === 'Failed' && (
                    <div className="flex items-start relative">
                        <div className="flex flex-col items-center mr-4">
                            <Image
                                src={failedImg}
                                alt="state-failed"
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full"
                            />
                        </div>
                        <div className="pl-2 space-y-1">
                            <h4 className="font-semibold text-gray-900">Payout Failed</h4>
                            <div className="text-sm text-gray-600">This payout attempt failed. Please check the details or contact support.</div>
                            {/* Optionally show detail.failureReason if available */}
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  );
};

export default function PayoutDetailPage() {
  return (
    // Suspense is good for data fetching components that might suspend.
    // Ensure PayoutPage handles its own loading states or uses React.lazy if code-splitting.
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><SpinnerCircular color="#006aff" /></div>}>
      <PayoutPage />
    </Suspense>
  );
}
