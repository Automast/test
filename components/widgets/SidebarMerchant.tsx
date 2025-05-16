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
import { CheckCircle, Menu, X } from 'lucide-react';

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
      else if (subpath.startsWith('/integration')) setCurrentTab('integration');
      else if (subpath.startsWith('/finance')) setCurrentTab('finance');
      else if (subpath.startsWith('/settings')) setCurrentTab('settings');
      else setCurrentTab('dashboard');
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Just clear local storage and redirect (no logout API in your HTML code)
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/signin');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          className={`p-2 rounded-full bg-white text-gray-800 cursor-pointer ${
            isOpen ? 'translate-x-48' : 'translate-0 border border-gray-300'
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
          <div className="h-24 px-4 py-3">
            <Link href="/">
              <Image alt="ArkusPay" src={logoImg} className="h-7 w-auto" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <SidebarLink href="/merchant" icon={dashIcon} label="Dashboard" active={currentTab === 'dashboard'} />
            <SidebarLink
              href="/merchant/transactions"
              icon={transIcon}
              label="Transactions"
              active={currentTab === 'transactions'}
            />
            <SidebarLink
              href="/merchant/integrations"
              icon={integIcon}
              label="Integrations"
              active={currentTab === 'integration'}
            />
            <SidebarLink
              href="/merchant/products"
              icon={payLinkIcon}
              label="Products"
              active={currentTab === 'products'}
            />
            <SidebarLink
              href="/merchant/finance"
              icon={balanceIcon}
              label="Finance"
              active={currentTab === 'finance'}
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
          />
          <button className="block px-3 py-2 rounded-lg cursor-pointer" onClick={() => setConfirmModal(true)}>
            <div className="flex items-center gap-3 text-sm font-medium">
              <Image src={logoutIcon} alt={`Logout Icon`} width={16} height={16} /> Log Out
            </div>
          </button>
        </div>
      </aside>
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0008]"
          onClick={() => setConfirmModal(false)}
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4">
            <div className="flex justify-center text-center items-center py-4 font-semibold text-xl">
              Are you sure to log out?
            </div>
            <div className="max-w-xl w-full space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-6">
                <button
                  className="bg-blue-100 text-blue-500 font-semibold py-2 rounded-md hover:bg-blue-200 transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal(false);
                  }}
                >
                  Back
                </button>
                <button
                  className="hover:bg-blue-600 text-white font-semibold py-2 rounded-md bg-blue-500 transition cursor-pointer"
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
}: {
  href: string;
  icon: StaticImageData;
  label: string;
  active: boolean;
  className?: string;
}) => (
  <Link
    href={href}
    className={`block px-3 py-2 rounded-lg cursor-pointer ${active ? 'bg-blue-100' : ''} ${className ?? ''}`}
  >
    <div className="flex items-center gap-3 text-sm font-medium">
      <Image src={icon} alt={`${label} Icon`} width={16} height={16} /> {label}
    </div>
  </Link>
);

export default Sidebar;