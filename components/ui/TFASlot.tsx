'use client';

import { useEffect, useState } from 'react';

import { useApiRequest } from '@/hooks';
import { authenticatorCodeUrl, authenticatorVerifyUrl, tfaStatusUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import Image from 'next/image';
import { SpinLoading } from 'respinner';

import checkCircle from '@/assets/images/icons/checkbox-circle-fill.svg';
import TFACodeModal from './TFACodeModal';
import OTPModal from './OTPModal';

const TFASlot = () => {
  const [status, setStatus] = useState({
    app: false,
    key: false,
    sms: false,
  });

  const [qrModal, setQRModal] = useState(false);
  const [otpModal, setOTPModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [appCode, setAppCode] = useState('');

  const {
    response: statusResponse,
    error: statusError,
    loading: statusLoading,
    sendRequest: sendStatusRequest,
  } = useApiRequest({
    endpoint: tfaStatusUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'GET',
  });

  const {
    response: verifyResponse,
    error: verifyError,
    loading: verifyLoading,
    sendRequest: sendVerifyRequest,
  } = useApiRequest({
    endpoint: authenticatorVerifyUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'POST',
  });

  const {
    response: codeResponse,
    error: codeError,
    loading: codeLoading,
    sendRequest: sendCodeRequest,
  } = useApiRequest({
    endpoint: authenticatorCodeUrl,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
    method: 'POST',
  });

  useEffect(() => {
    sendStatusRequest();
  }, []);

  useEffect(() => {
    if (statusResponse) {
      // Handle the response data here
      setStatus(statusResponse.data); // this should be changed according to the response structure, this is the real code
    }
  }, [statusResponse]);

  useEffect(() => {
    if (statusError) {
      Toaster.error(statusError?.message);

      // mock data instead: remove this code in production mode
      setStatus({
        app: true,
        key: false,
        sms: false,
      });
    }
  }, [statusError]);

  useEffect(() => {
    if (codeResponse) {
      // Handle the response data here
      setAppCode(codeResponse.data.code); // this should be changed according to the response structure, this is the real code
    }
  }, [codeResponse]);

  useEffect(() => {
    if (codeError) {
      Toaster.error(codeError?.message);

      // mock data instead: remove this code in production mode
      setAppCode('123456789asdfghhjkl');
    }
  }, [codeError]);

  return (
    <>
      <div className="pb-10">
        <h2 className="text-lg font-semibold mb-3">Two step verification</h2>
        <p className="text-gray-600 mb-3 text-sm">
          ArkusPay two-step authentication in order to keep your account secure. By using either your phone or an
          authenticator app in addition to your password, you ensure that no one else can log in to your account.
        </p>
        <p className="text-gray-600 mb-6 text-sm">
          We encourage you to enable multiple forms of two-step authentication as a backup in case you lose your mobile
          device or lose service.
        </p>

        <div className="space-y-3 flex flex-col">
          <button
            disabled={statusLoading}
            className={`w-80 max-w-full border border-gray-300 rounded-md py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-100 transition ${
              statusLoading ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => {
              setQRModal(true);
              sendCodeRequest();
            }}
          >
            {statusLoading && (
              <SpinLoading size={16} count={10} barWidth={3} barHeight={5} borderRadius={1} fill="gray" className="" />
            )}
            {status.app && <Image src={checkCircle} alt="Check" className="w-5 h-5" />}
            Use an authenticator app
          </button>
          <button
            disabled={statusLoading}
            className={`w-80 max-w-full border border-gray-300 rounded-md py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-100 transition ${
              statusLoading ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {statusLoading && (
              <SpinLoading size={16} count={10} barWidth={3} barHeight={5} borderRadius={1} fill="gray" className="" />
            )}
            {status.key && <Image src={checkCircle} alt="Check" className="w-5 h-5" />}Add a Security Key
          </button>
          <button
            disabled={statusLoading}
            className={`w-80 max-w-full border border-gray-300 rounded-md py-2 flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-100 transition ${
              statusLoading ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {statusLoading && (
              <SpinLoading size={16} count={10} barWidth={3} barHeight={5} borderRadius={1} fill="gray" className="" />
            )}
            {status.sms && <Image src={checkCircle} alt="Check" className="w-5 h-5" />}Use SMS
          </button>
        </div>
      </div>
      <TFACodeModal
        title="Use an authenticator app"
        subTitle={
          <div className="text-sm text-gray-600">
            Download the free{' '}
            <a href="#" className="text-blue-500">
              Google authenticator
            </a>{' '}
            app, add a new account then scan this QR code to set up your account
          </div>
        }
        open={qrModal}
        onClose={() => setQRModal(false)}
        loading={codeLoading}
        onSend={() => {
          setQRModal(false);
          setOTPModal(true);
        }}
        code={appCode}
      />
      <OTPModal
        open={otpModal}
        sending={verifyLoading}
        onClose={() => setOTPModal(false)}
        onSend={async (otp) => {
          sendVerifyRequest({ otp });
        }}
        title={'Use an authenticator app'}
        subTitle={
          <div>
            Please enter your 6-digit authentication code from the{' '}
            <a href="#" className="text-blue-500">
              Google Authenticator
            </a>{' '}
            app.
          </div>
        }
      />
    </>
  );
};

export default TFASlot;
