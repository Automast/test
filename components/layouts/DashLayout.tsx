// components/layouts/DashLayout.tsx
'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown } from 'lucide-react';
import { SidebarMerchant } from '../widgets';
import { useApiRequest } from '@/hooks';
import { API_ENDPOINTS } from '@/consts/api'; // Assuming API_ENDPOINTS.AUTH.ME exists
import { Notification } from '@/types';
import { mockNotiData } from '@/mock';
import Image from 'next/image';
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

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (isClient) {
      fetchUserProfile();
    }
  }, [isClient]); // Added router to dependencies

  const fetchUserProfile = async () => {
    if (typeof window === 'undefined') return;
    setLoading(true); // Ensure loading is true at the start

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/signin'); // Redirect to signin if no token
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}${API_ENDPOINTS.AUTH.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If response is not OK (e.g., 401, 403, 500)
      if (!response.ok) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        router.push('/signin'); // Redirect to signin on any fetch error or non-successful auth
        return;
      }

      const result = await response.json();

      // If API call was successful but indicates an issue (e.g., result.success is false)
      if (!result.success) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        router.push('/signin'); // Treat as an authentication failure
        return;
      }
      
      // Successfully fetched user data
      setUserInfo(result.data.user);
      setMerchantInfo(result.data.merchant);

      // CRITICAL CHECK: If user is in merchant area but onboarding is NOT complete, redirect to onboarding
      if (!result.data.user.onboardingComplete) {
          router.push('/onboarding/business'); // Or the correct current onboarding step
          // setLoading(false) will be called in finally, no need to return setLoading here
          return;
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      router.push('/signin'); // Redirect to signin on any exception during fetch
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      // Clear cookie for middleware if it exists
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/signin'); // Fallback redirect
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

  // Notification fetching logic (remains the same)
  const {
    response: notiResponse,
    error: notiError,
    loading: notiLoading, // This is a separate loading state for notifications
    sendRequest: sendNotiRequest,
  } = useApiRequest({
    endpoint: '/notifications', // Assuming this is a defined constant or full path
    headers: {
      Accept: 'application/json',
      // Authorization header will be added by useApiRequest if auth=true (default)
    },
    method: 'GET',
  });

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

  useEffect(() => {
    if (isClient && userInfo) { // Fetch notifications only after user profile is loaded
      sendNotiRequest();
    }
  }, [isClient, userInfo, sendNotiRequest]); // sendNotiRequest added to dependency array

  useEffect(() => {
    if (notiError) {
      setNotiList(mockNotiData); // Fallback to mock data on error
    }
  }, [notiError]);

  useEffect(() => {
    if (notiResponse) {
      setNotiList(notiResponse.data);
    }
  }, [notiResponse]);

  // Render loading state for the whole layout until user profile is fetched
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 text-gray-900">
        <SidebarMerchant /> {/* Render sidebar even during loading for structure */}
        <main className="flex-1 p-4 md:p-8 transition-all space-y-6 md:ml-64 transform duration-300 ease-in-out max-w-full md:max-w-[calc(100%-16rem)]">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading dashboard...</div>
            {/* You can add a spinner here */}
          </div>
        </main>
      </div>
    );
  }
  
  // If not loading and userInfo is still null (e.g. redirect is in progress), render minimal or null
  if (!userInfo) {
      return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">
           <SidebarMerchant />
           <main className="flex-1 p-4 md:p-8 md:ml-64">
             {/* Optional: A more specific loading/redirecting message */}
             <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading user data or redirecting...</div>
             </div>
           </main>
        </div>
      );
  }


  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <SidebarMerchant />
      <main className="flex-1 p-4 md:p-8 transition-all space-y-6 md:ml-64 transform duration-300 ease-in-out max-w-full md:max-w-[calc(100%-16rem)]">
        <div className="flex justify-between items-center ml-12 md:ml-0 h-10">
          <div>{titleArea}</div>
          <div className="flex items-center gap-2 md:gap-4 transition">
            {tools}
            <div className="relative" ref={ref}>
              <button
                className="relative block rounded-full border-gray-300 border-1 p-1 cursor-pointer hover:bg-white transition"
                onClick={() => setNotiShow(!notiShow)}
              >
                <Bell className="w-5 h-5" />
                {notiList.length > 0 && (
                  <span className="absolute top-1 right-[7px] block h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
              {notiShow && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="font-semibold py-2 px-4 border-b border-b-gray-300">Notifications</div>
                  <div className="p-4 text-sm text-gray-700">
                    {notiList.length === 0 && <p>No new notifications</p>}
                    {notiList.length > 0 &&
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
