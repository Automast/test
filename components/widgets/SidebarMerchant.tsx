'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';

import logoImg from '@/assets/images/logo.svg';
import dashIcon from '@/assets/images/icons/dashboard.svg';
import transIcon from '@/assets/images/icons/transactions.svg';
import payLinkIcon from '@/assets/images/icons/paymentLink.svg';
import integIcon from '@/assets/images/icons/integrations.svg';
import balanceIcon from '@/assets/images/icons/balance.svg';
import settingsIcon from '@/assets/images/icons/settings.svg';
import logoutIcon from '@/assets/images/icons/logout.svg';
import { CheckCircle, Menu, X } from 'lucide-react'; // CheckCircle is imported but not used.

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setConfirmModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (pathname) {
      const subpath = pathname.substring(pathname.indexOf('/merchant') + '/merchant'.length);
      if (subpath.startsWith('/transactions')) setCurrentTab('transactions');
      else if (subpath.startsWith('/products')) setCurrentTab('products');
      else if (subpath.startsWith('/integration')) setCurrentTab('integration'); // Assuming this should be 'integrations' to match link
      else if (subpath.startsWith('/finance')) setCurrentTab('finance');
      else if (subpath.startsWith('/settings')) setCurrentTab('settings');
      else setCurrentTab('dashboard');
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Clear local storage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');

      // Clear the cookie named 'token'
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // If the cookie was set with a specific path or domain, include them:
        // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/your-path; domain=.yourdomain.com;';
      }

      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to redirect even if cookie deletion or local storage clearing fails
      router.push('/signin');
    }
  };

  if (!isClient) {
    return null; // Or a loading skeleton for better UX
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          className={`p-2 rounded-full bg-white text-gray-800 cursor-pointer ${
            isOpen ? 'translate-x-64' : 'translate-x-0 border border-gray-300' // Adjusted translate-x for full sidebar width
          } transform transition-transform duration-300 ease-in-out`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white p-4 flex flex-col justify-between z-40 transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:h-screen md:transform-none md:shadow-none shadow-2xl
  `}
      >
        <div>
          {/* Logo */}
          <div className="h-24 px-4 py-3 flex items-center"> {/* Added flex items-center for better logo alignment */}
            <Link href="/merchant"> {/* Changed Link to /merchant as it seems to be the dashboard base */}
              <Image alt="ArkusPay" src={logoImg} className="h-7 w-auto" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <SidebarLink href="/merchant" icon={dashIcon} label="Dashboard" active={currentTab === 'dashboard'} onClick={() => setIsOpen(false)} />
            <SidebarLink
              href="/merchant/transactions"
              icon={transIcon}
              label="Transactions"
              active={currentTab === 'transactions'}
              onClick={() => setIsOpen(false)}
            />
            <SidebarLink
              href="/merchant/integrations" // Corrected path to match label
              icon={integIcon}
              label="Integrations"
              active={currentTab === 'integration'} // Consider changing to 'integrations'
              onClick={() => setIsOpen(false)}
            />
            <SidebarLink
              href="/merchant/products"
              icon={payLinkIcon}
              label="Products"
              active={currentTab === 'products'}
              onClick={() => setIsOpen(false)}
            />
            <SidebarLink
              href="/merchant/finance"
              icon={balanceIcon}
              label="Finance"
              active={currentTab === 'finance'}
              onClick={() => setIsOpen(false)}
            />
          </div>
        </div>

        {/* Settings link at the bottom */}
        <div className="pb-1">
          <SidebarLink
            href="/merchant/settings"
            icon={settingsIcon}
            label="Settings"
            active={currentTab === 'settings'}
            onClick={() => setIsOpen(false)}
          />
          <button
            className="block w-full px-3 py-2 rounded-lg cursor-pointer text-left hover:bg-gray-100 transition-colors" // Added w-full and hover for consistency
            onClick={() => {
              setIsOpen(false); // Close sidebar if open
              setConfirmModal(true);
            }}
          >
            <div className="flex items-center gap-3 text-sm font-medium text-gray-700"> {/* Improved text color consistency */}
              <Image src={logoutIcon} alt={`Logout Icon`} width={16} height={16} /> Log Out
            </div>
          </button>
        </div>
      </aside>
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50" // Higher z-index, standard opacity syntax
          onClick={() => setConfirmModal(false)} // Backdrop click closes modal
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()} // Prevents modal close when clicking inside
          >
            <div className="flex justify-center text-center items-center py-4 font-semibold text-xl text-gray-800"> {/* Adjusted text color */}
              Are you sure you want to log out?
            </div>
            <div className="max-w-xl w-full space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-6">
                <button
                  className="bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-md hover:bg-gray-200 transition cursor-pointer" // Adjusted colors and padding
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-500 text-white font-semibold py-2.5 rounded-md hover:bg-red-600 transition cursor-pointer" // Changed to red for destructive action
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal(false);
                    handleLogout();
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SidebarLink = ({
  href,
  icon,
  label,
  active,
  className,
  onClick, // Added onClick prop
}: {
  href: string;
  icon: StaticImageData;
  label: string;
  active: boolean;
  className?: string;
  onClick?: () => void; // Added onClick prop type
}) => (
  <Link
    href={href}
    className={`block px-3 py-2 rounded-lg cursor-pointer ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'} ${className ?? ''} transition-colors`} // Enhanced active and hover states
    onClick={onClick} // Call onClick when link is clicked
  >
    <div className="flex items-center gap-3 text-sm font-medium">
      <Image src={icon} alt={`${label} Icon`} width={16} height={16} className={active ? 'filter-blue' : ''} /> {label} {/* Example for active icon color if needed via CSS or different icons */}
    </div>
  </Link>
);

export default Sidebar;
