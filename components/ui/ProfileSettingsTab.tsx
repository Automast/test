'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useState } from 'react';

import Image from 'next/image';

import profileImg from '@/assets/images/icons/profile.svg';
import profileActiveImg from '@/assets/images/icons/profile-active.svg';
import tfaImg from '@/assets/images/icons/2fa.svg';
import tfaActiveImg from '@/assets/images/icons/2fa-active.svg';
import deleteImg from '@/assets/images/icons/delete.svg';
import deleteActiveImg from '@/assets/images/icons/delete-active.svg';
import ProfileSlot from './ProfileSlot';
import DeactivateSlot from './DeactivateSlot';
import TFASlot from './TFASlot';

const ProfileTab = () => {
  const [slot, setSlot] = useState<'profile' | '2fa' | 'delete'>('profile');

  return (
    <div className="flex bg-white py-4 lg:gap-16 gap-4">
      <div className="lg:w-56 w-12 transition-all">
        <div className="">
          <button
            className={`flex items-center w-full text-left px-4 py-2  gap-2 rounded-md font-medium text-[14px] cursor-pointer h-10 ${
              slot === 'profile' ? 'bg-blue-100 text-blue-500' : 'text-gray-900'
            }`}
            onClick={() => setSlot('profile')}
          >
            <Image src={slot === 'profile' ? profileActiveImg : profileImg} alt="Profile" className="w-4 h-4" />
            <span className="lg:inline hidden truncate">Profile settings</span>
          </button>
          <button
            className={`flex items-center w-full text-left px-4 py-2  gap-2 rounded-md font-medium text-[14px] cursor-pointer h-10 ${
              slot === '2fa' ? 'bg-blue-100 text-blue-500' : 'text-gray-900'
            }`}
            onClick={() => setSlot('2fa')}
          >
            <Image src={slot === '2fa' ? tfaActiveImg : tfaImg} alt="Profile" className="w-4 h-4" />
            <span className="lg:inline hidden truncate">2FA Verification</span>
          </button>
          <button
            className={`flex items-center w-full text-left px-4 py-2  gap-2 rounded-md font-medium text-[14px] cursor-pointer h-10 ${
              slot === 'delete' ? 'bg-blue-100 text-blue-500' : 'text-gray-900'
            }`}
            onClick={() => setSlot('delete')}
          >
            <Image src={slot === 'delete' ? deleteActiveImg : deleteImg} alt="Profile" className="w-4 h-4" />
            <span className="lg:inline hidden truncate">Account Deactivation</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {slot === 'profile' && <ProfileSlot />}
        {slot === 'delete' && <DeactivateSlot />}
        {slot === '2fa' && <TFASlot />}
      </div>
    </div>
  );
};

export default ProfileTab;
