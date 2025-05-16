'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDownIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CountryCode, getCountryCallingCode } from 'libphonenumber-js';
import { getName, getCodes } from 'country-list';
import { useApiRequest } from '@/hooks';
import { emailChangeUrl, mailOTPUrl, passwordChangeUrl, profileOTPUrl, profileUrl } from '@/consts/paths';
import Skeleton from 'react-loading-skeleton';
import { SpinLoading } from 'respinner';
import Toaster from '@/helpers/Toaster';
import OTPModal from './OTPModal';
import { send } from 'process';
import ConfirmModal from './ConfirmModal';

const countries = ['us', 'gb', 'br', 'ca', 'ae'];

const ProfileSlot = () => {
  const [country, setCountry] = useState('us');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [otpModal, setOtpModal] = useState(false);
  const [otpMode, setOtpMode] = useState<'sms' | 'email' | undefined>();
  const [confirmModal, setConfirmModal] = useState(false);

  const {
    response: profileGetResponse,
    error: profileGetError,
    loading: profileGetLoading,
    sendRequest: sendProfileGetRequest,
  } = useApiRequest({
    endpoint: profileUrl,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  const {
    response: profilePostResponse,
    error: profilePostError,
    loading: profilePostLoading,
    sendRequest: sendProfilePostRequest,
  } = useApiRequest({
    endpoint: profileUrl,
    method: 'POST',
    data: {
      name,
      phone,
      country,
    },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  const {
    response: profileOTPResponse,
    error: profileOTPError,
    loading: profileOTPLoading,
    sendRequest: sendProfileOTPRequest,
  } = useApiRequest({
    endpoint: profileOTPUrl,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  const {
    response: mailOTPResponse,
    error: mailOTPError,
    loading: mailOTPLoading,
    sendRequest: sendMailOTPRequest,
  } = useApiRequest({
    endpoint: mailOTPUrl,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  const {
    response: passwordResponse,
    error: passwordError,
    loading: passwordLoading,
    sendRequest: sendPasswordRequest,
  } = useApiRequest({
    endpoint: passwordChangeUrl,
    method: 'POST',
    data: {
      password,
      newPassword,
      confirmPassword,
    },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  const {
    response: mailResponse,
    error: mailError,
    loading: mailLoading,
    sendRequest: sendMailRequest,
  } = useApiRequest({
    endpoint: emailChangeUrl,
    method: 'POST',
    data: {
      email,
      newEmail,
    },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer 124567890`, // this needs to be changed with the local storage key
    },
  });

  useEffect(() => {
    sendProfileGetRequest();
  }, []);

  useEffect(() => {
    if (profileGetResponse) {
      setName(profileGetResponse.data.name);
      setPhone(profileGetResponse.data.phone);
      setCountry(profileGetResponse.data.country);
    }
  }, [profileGetResponse]);

  useEffect(() => {
    if (profileGetError) {
      // needs to handle in production mode
    }
  }, [profileGetError]);

  useEffect(() => {
    if (profilePostResponse && profilePostResponse.success) {
      Toaster.success('Successfully requested, you need to verify OTP');
      setOtpModal(true);
      setOtpMode('sms');
    }
  }, [profilePostResponse]);

  useEffect(() => {
    if (profilePostError) {
      Toaster.error(profilePostError.message);

      // remove these in production mode
      setOtpModal(true);
      setOtpMode('sms');
    }
  }, [profilePostError]);

  useEffect(() => {
    if (mailResponse && mailResponse.success) {
      Toaster.success('Successfully requested, you need to verify OTP');
      setOtpModal(true);
      setOtpMode('email');
    }
  }, [mailResponse]);

  useEffect(() => {
    if (mailError) {
      Toaster.error(mailError.message);

      // remove these in production mode
      setOtpModal(true);
      setOtpMode('email');
    }
  }, [mailError]);

  useEffect(() => {
    if (passwordResponse && passwordResponse.success) {
      Toaster.success('Successfully changed');
      setConfirmModal(true);
      setOtpMode(undefined);
    }
  }, [passwordResponse]);

  useEffect(() => {
    if (passwordError) {
      Toaster.error(passwordError.message);

      // remove these in production mode
      setConfirmModal(true);
      setOtpMode(undefined);
    }
  }, [passwordError]);

  useEffect(() => {
    if (profileOTPResponse && profileOTPResponse.success) {
      Toaster.success('Successfully verified, you can now login with your new phone number');
      setOtpModal(false);
      setConfirmModal(true);
    }
  }, [profileOTPResponse]);

  useEffect(() => {
    if (profileOTPError) {
      Toaster.error(profileOTPError.message);

      // remove these in production mode
      setOtpModal(false);
      setConfirmModal(true);
    }
  }, [profileOTPError]);

  useEffect(() => {
    if (mailOTPResponse && mailOTPResponse.success) {
      Toaster.success('Successfully verified, you can now login with your new email');
      setOtpModal(false);
      setConfirmModal(true);
    }
  }, [mailOTPResponse]);

  useEffect(() => {
    if (mailOTPError) {
      Toaster.error(mailOTPError.message);

      // remove these in production mode
      setOtpModal(false);
      setConfirmModal(true);
    }
  }, [mailOTPError]);

  return (
    <>
      <div className="space-y-7 pb-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">Profile Name & Phone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Here you can change your password. To change password please fill up the form.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Profile Name</label>
              {profileGetLoading && <Skeleton className="w-full" height={35} />}
              {!profileGetLoading && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              {profileGetLoading && <Skeleton className="w-full" height={35} />}
              {!profileGetLoading && (
                <div className="flex">
                  <div className="inline-flex items-center cursor-pointer w-34">
                    <Listbox value={country} onChange={setCountry}>
                      <div className="relative">
                        <ListboxButton className="w-full border cursor-pointer border-r-0 border-gray-300 rounded-l-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <div className="flex items-center justify-start cursor-pointer">
                            <Image
                              src={`https://flagcdn.com/32x24/${country}.png`}
                              alt={`${country} Flag`}
                              width={24}
                              height={18}
                            />
                            <span className="px-3">+{getCountryCallingCode(country.toUpperCase() as CountryCode)}</span>
                          </div>
                          <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-1" />
                        </ListboxButton>
                        <ListboxOptions className="absolute mt-1 max-h-60 w-60 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                          {getCodes().map((c) => (
                            <ListboxOption
                              key={c.toLowerCase()}
                              value={c.toLowerCase()}
                              className={({ active }) =>
                                `cursor-pointer select-none px-4 py-2 ${
                                  active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                }`
                              }
                            >
                              <div className="flex items-center justify-start gap-2">
                                <Image
                                  src={`https://flagcdn.com/32x24/${c.toLowerCase()}.png`}
                                  alt={`${c} Flag`}
                                  width={24}
                                  height={18}
                                />
                                <span className="truncate">{getName(c)}</span>
                              </div>
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                  <input
                    type="text"
                    placeholder="125 568 5896"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-r px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <button
              className={`hover:bg-blue-600 bg-blue-500 transition text-white rounded px-8 py-2 ${
                profilePostLoading ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => sendProfilePostRequest()}
              disabled={profilePostLoading || !name || !phone}
            >
              {profilePostLoading && (
                <div className="flex items-center gap-2">
                  <SpinLoading
                    size={16}
                    count={10}
                    barWidth={3}
                    barHeight={5}
                    borderRadius={1}
                    fill="white"
                    className=""
                  />
                  Saving...
                </div>
              )}
              {!profilePostLoading && 'Save'}
            </button>
          </div>
        </section>
        <hr className="border-gray-300" />
        <section>
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <p className="text-sm text-gray-500 mb-4">
            Here you can change your password. To change password please fill up the form.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Old Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">New Password</label>
              <input
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              className={`hover:bg-blue-600 bg-blue-500 transition text-white rounded px-8 py-2 ${
                passwordLoading ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={passwordLoading || !password || !newPassword || !confirmPassword}
              onClick={() => sendPasswordRequest()}
            >
              {passwordLoading && (
                <div className="flex items-center gap-2">
                  <SpinLoading
                    size={16}
                    count={10}
                    barWidth={3}
                    barHeight={5}
                    borderRadius={1}
                    fill="white"
                    className=""
                  />
                  Updating...
                </div>
              )}
              {!passwordLoading && 'Update Password'}
            </button>
          </div>
        </section>
        <hr className="border-gray-300" />
        <section>
          <h2 className="text-lg font-semibold mb-2">Change Email Address</h2>
          <p className="text-sm text-gray-500 mb-4">
            Here you can change your email address. To change email address, please fill up the form.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Old Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your old email address"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email address"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              className={`hover:bg-blue-600 bg-blue-500 transition text-white rounded px-8 py-2 ${
                mailLoading ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={mailLoading || !email || !newEmail}
              onClick={() => sendMailRequest()}
            >
              {mailLoading && (
                <div className="flex items-center gap-2">
                  <SpinLoading
                    size={16}
                    count={10}
                    barWidth={3}
                    barHeight={5}
                    borderRadius={1}
                    fill="white"
                    className=""
                  />
                  Changing...
                </div>
              )}
              {!mailLoading && 'Change Email Address'}
            </button>
          </div>
        </section>
      </div>
      <OTPModal
        open={otpModal}
        sending={otpMode === 'sms' ? profileOTPLoading : otpMode === 'email' ? mailOTPLoading : false}
        onClose={() => setOtpModal(false)}
        onSend={async (otp) => {
          if (otpMode === 'sms') sendProfileOTPRequest({ otp });
          else if (otpMode === 'email') sendMailOTPRequest({ otp });
        }}
        title={
          otpMode === 'sms'
            ? 'Sent a verification code to your phone via SMS'
            : 'Sent a verification code to your old email address'
        }
        subTitle={
          otpMode === 'sms'
            ? 'Please enter your 6-digit authentication code from SMS'
            : 'Please enter your 6-digit authentication code from email'
        }
      />
      <ConfirmModal
        open={confirmModal}
        onClose={() => setConfirmModal(false)}
        title={
          otpMode === 'sms'
            ? 'Your have successfully changed your name and phone number'
            : otpMode === 'email'
            ? 'Your have successfully changed your email address'
            : 'Your have successfully changed your password'
        }
      />
    </>
  );
};

export default ProfileSlot;
