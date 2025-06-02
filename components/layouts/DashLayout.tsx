'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown } from 'lucide-react';
import { SidebarMerchant } from '../widgets';
import { useApiRequest } from '@/hooks';
import { API_ENDPOINTS } from '@/consts/api';
import { Notification } from '@/types';
import { mockNotiData } from '@/mock';
import Image from 'next/image'; // This import is present but not used. Consider removing if not needed.
import { useRouter } from 'next/navigation';

const DashLayout: React.FC<{ children: ReactNode; titleArea: ReactNode; tools?: ReactNode }> = ({
  children,
  titleArea,
  tools,
}) => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const [notiShow, setNotiShow] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notiList, setNotiList] = useState<Notification[]>([] as Notification[]);
  const [notiRequested, setNotiRequested] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (isClient) {
      fetchUserProfile();
    }
  }, [isClient]);

  const fetchUserProfile = async () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/signin');
        return;
      }

      // Call the auth/me endpoint with correct URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        // Also clear the cookie named 'token' on unauthorized access
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        router.push('/signin');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Extract user and merchant from the response
          setUserInfo(result.data.user);
          setMerchantInfo(result.data.merchant);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Clear local storage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');

      // Clear the cookie named 'token'
      // To delete a cookie, you set its expiration date to a past date.
      // Ensure the path and domain match how the cookie was set.
      // If the cookie was set with a specific path or domain, you'll need to include those here.
      // For a general case, `path=/` should work for cookies set on the root.
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // If you know the specific domain and path the cookie was set with, use them:
        // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/your-path; domain=.yourdomain.com;';
      }

      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still attempt to redirect even if cookie deletion or local storage clearing fails
      router.push('/signin');
    }
  };

  const getInitials = (businessName: string) => {
    if (!businessName) return 'B';
    const words = businessName.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return businessName.substring(0, 2).toUpperCase();
  };

  const {
    response: notiResponse,
    error: notiError,
    loading: notiLoading,
    sendRequest: sendNotiRequest,
  } = useApiRequest({
    endpoint: '/notifications',
    headers: {
      Accept: 'application/json',
      Authorization: isClient ? `Bearer ${localStorage.getItem('jwt_token') || ''}` : '',
    },
    method: 'GET',
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setNotiShow(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fix for notification API excessive calls
  useEffect(() => {
    if (isClient && !notiRequested) {
      sendNotiRequest();
      setNotiRequested(true);
    }
  }, [isClient, notiRequested]); // Removed sendNotiRequest from dependencies

  useEffect(() => {
    if (notiError) {
      setNotiList(mockNotiData);
    }
  }, [notiError]);

  useEffect(() => {
    if (notiResponse) {
      setNotiList(notiResponse.data);
    }
  }, [notiResponse]);

  if (!isClient || loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 text-gray-900">
        <SidebarMerchant />
        <main className="flex-1 p-4 md:p-8 transition-all space-y-6 md:ml-64 transform duration-300 ease-in-out max-w-full md:max-w-[calc(100%-16rem)]">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <SidebarMerchant />
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 transition-all space-y-6 md:ml-64 transform duration-300 ease-in-out max-w-full md:max-w-[calc(100%-16rem)]">
        <div className="flex justify-between items-center ml-12 md:ml-0 h-10">
          <div>{titleArea}</div>
          <div className="flex items-center gap-2 md:gap-4 transition">
            {tools}
            {/* Notifications */}
            <div className="relative" ref={ref}>
              <button
                className="relative block rounded-full border-gray-300 border p-1 cursor-pointer hover:bg-white transition" // Corrected border-1 to border
                onClick={() => setNotiShow(!notiShow)}
              >
                <Bell className="w-5 h-5" />
                {notiList && notiList.length > 0 && ( // Added null check for notiList
                  <span className="absolute top-1 right-[7px] block h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
              {notiShow && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="font-semibold py-2 px-4 border-b border-b-gray-300">Notifications</div>
                  <div className="p-4 text-sm text-gray-700">
                    {(!notiList || notiList.length === 0) && <p>No new notifications</p>} {/* Added null check */}
                    {notiList && notiList.length > 0 &&
                      notiList.map((noti) => (
                        <div key={noti.id} className="flex items-center gap-2 mb-2">
                          <div>
                            <p className="font-medium text-sm truncate">{noti.title}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(noti.date).toLocaleString('en-US', { // Ensure noti.date is a valid Date object or string
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                            <p className="text-gray-500 text-xs h-8">{noti.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 text-sm cursor-pointer"
                onClick={() => setProfileDropdown(!profileDropdown)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                  {merchantInfo?.businessName ? getInitials(merchantInfo.businessName) : 'B'}
                  
                </div>
                <div className="md:flex hidden">
                  <p className="font-medium truncate">{merchantInfo?.businessName || 'Business'}</p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              {profileDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      href="/merchant/settings?tab=security"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdown(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdown(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashLayout;