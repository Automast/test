'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

import avatarAddImg from '@/assets/images/icons/avatarAdd.svg';
import Image from 'next/image';

const BusinessTab = () => {
  const [businessType, setBusinessType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  return (
    <div className="max-w-4xl bg-white text-sm pb-8">
      {/* Company Logo */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Company Logo</label>
        <div className="w-32 h-32 border border-dashed border-gray-400 flex flex-col items-center justify-center rounded-md cursor-pointer bg-gray-100 hover:bg-gray-200 transition space-y-3">
          <Image src={avatarAddImg} alt="Company logo" className="w-10 h-10" />
          <span className="text-sm text-center">Upload Company Logo</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">Company Name</label>
          <input
            type="text"
            value={companyName}
            placeholder="Enter your company name"
            className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Business Type</label>
          <Listbox value={businessType} onChange={setBusinessType}>
            <div className="relative">
              <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                {businessType || 'Please select'}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </ListboxButton>
              <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                <ListboxOption
                  value="Shop"
                  className={({ active }) =>
                    `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                  }
                >
                  Shop
                </ListboxOption>
                <ListboxOption
                  value="Data Center"
                  className={({ active }) =>
                    `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                  }
                >
                  Data Center
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>

        <div>
          <label className="block mb-1 font-medium">Industry</label>
          <Listbox value={industry} onChange={setIndustry}>
            <div className="relative">
              <ListboxButton className="w-full border border-gray-200 rounded-md px-4 py-2 text-sm text-gray-500 bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                {industry || 'Please select'}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </ListboxButton>
              <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none z-10">
                <ListboxOption
                  value="Education"
                  className={({ active }) =>
                    `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                  }
                >
                  Education
                </ListboxOption>
                <ListboxOption
                  value="Healthcare"
                  className={({ active }) =>
                    `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                  }
                >
                  Healthcare
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
        </div>
        <div>
          <label className="block mb-1 font-medium">Business Website</label>
          <input
            type="text"
            placeholder="example: www.company.com"
            className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>

      {/* Business Address */}
      <div className="mt-6">
        <h3 className="font-semibold mb-4">Business Address</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 font-medium">Country</label>
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
                      `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                    }
                  >
                    USA
                  </ListboxOption>
                  <ListboxOption
                    value="UK"
                    className={({ active }) =>
                      `cursor-pointer select-none px-4 py-2 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                    }
                  >
                    UK
                  </ListboxOption>
                </ListboxOptions>
              </div>
            </Listbox>
          </div>
          <div>
            <label className="block mb-1 font-medium">Street Address</label>
            <input
              type="text"
              placeholder="Enter your street address"
              className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Town or City</label>
            <input
              type="text"
              placeholder="Enter your town or city"
              className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Postal Code</label>
            <input
              type="text"
              placeholder="Enter your postal code"
              className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button className="hover:bg-blue-600 text-white py-2 px-6 rounded-md bg-blue-500 transition cursor-pointer">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default BusinessTab;
