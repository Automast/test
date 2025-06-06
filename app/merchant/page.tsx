'use client';

import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { DashLayout } from '@/components/layouts';
import { ListFilter, AlertTriangle, Mail, Shield, RefreshCw } from 'lucide-react'; // Removed ArrowLeft as it's not used
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useVerification } from '@/context/VerificationContext';
import { useApiRequest } from '@/hooks';
import { sendVerificationEmailUrl } from '@/consts/paths';
import Toaster from '@/helpers/Toaster';
import { TooltipProps } from 'recharts';

import 'react-circular-progressbar/dist/styles.css';
import '@/assets/styles/dashboard.css';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Link from 'next/link';
interface CustomTooltipProps extends TooltipProps<any, any> {
   dashboardCurrency: string;
 }
 const CustomTooltip: React.FC<CustomTooltipProps> = ({
   active,
   payload,
   label,
   dashboardCurrency,
 }) => { 
  if (!active || !payload || payload.length === 0) return null;
// put this **before** the return
const symbol = dashboardCurrency === 'BRL' ? 'R$' : 'US$';
return (
  <div style={{ backgroundColor: 'black', color: 'white', padding: '10px', borderRadius: '5px' }}>
    <p className="text-sm">
      {symbol} {Number(payload[0].value).toFixed(2)}
    </p>
    <p className="text-xs">{label}</p>
  </div>
);
};

const Dashboard = () => {
  const [period, setPeriod] = useState<number>(0); // 0 = today, 1 = yesterday, 7 = week, etc.
  const [dateLabel, setDateLabel] = useState<string>(''); // ← new
  const [userData, setUserData] = useState<any>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [orderOverview, setOrderOverview] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardCurrency, setDashboardCurrency] = useState<string>('USD');
  const [isClient, setIsClient] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [initialEmailResent, setInitialEmailResent] = useState(false);

  // Verification context
  const {
    fetchStatus,
    status,
    rejectedFields,
    verificationData
  } = useVerification();

  // Email verification
  const { sendRequest: resendVerificationEmail, loading: emailLoading } = useApiRequest({
    endpoint: sendVerificationEmailUrl,
    method: 'POST',
  });

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /* utilities */
  const labelForPoint = (d: any) => 
    period <= 1 // 0=today, 1=yesterday
      ? `${String(d.hour).padStart(2, '0')}:00`
      : new Date(d.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Authentication check and load dashboard
  useEffect(() => {
    if (isClient) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          window.location.href = '/signin';
          return;
        }
        loadDashboard();
      }
    }
  }, [period, isClient]);

  // Initialize verification context
  useEffect(() => {
    if (isClient && userData) {
      fetchStatus();
    }
  }, [isClient, userData, fetchStatus]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      /* ---------------------------------------------------------
       * 1.  Profile   (who am I? + which currency do I think in?)
       * --------------------------------------------------------*/
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      if (!meRes.success) throw new Error('Failed to load user data');
      const { user, merchant } = meRes.data;
      setUserData(user);
      setMerchantData(merchant);
      localStorage.setItem('user_data', JSON.stringify(merchant));
      const dashCur = merchant.country === 'BR' ? 'BRL' : 'USD';
      setDashboardCurrency(dashCur);
      /* ---------------------------------------------------------
       * 2.  Balances
       * --------------------------------------------------------*/
      const balRes = await fetch(`${baseUrl}/finance/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
      if (balRes.success) setBalances(balRes.data.balances);
      /* ---------------------------------------------------------
       * 3.  KPIs – one ready-made endpoint does everything
       * --------------------------------------------------------*/
      const rangeMap: Record<number, string> = {
        0: 'today',
        1: 'yesterday',
        7: 'last7',
        30: 'last30',
      };
      const range = rangeMap[period] ?? 'today';
      const kpiRes = await fetch(
        `${baseUrl}/finance/dashboard-metrics?range=${range}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((r) => r.json());
      if (!kpiRes.success) throw new Error('Failed to load metrics');
      const m = kpiRes.data;
      setDateLabel(m.rangeLabel); // ← new
      /* ---------- top cards ---------- */
      setOrderOverview({
        gross: {
          amount: m.grossRevenue.value,
          delta: m.grossRevenue.changePct,
        },
        paidOrder: {
          amount: m.paidOrders.value,
          delta: m.paidOrders.changePct,
        },
        averageSucceedOrder: {
          amount: m.cardAcceptance.value,
          delta: m.cardAcceptance.changePct,
        },
      });
      /* ---------- account-status ring ---------- */
      const total =
        m.statusCounts.paid +
        m.statusCounts.refunded +
        m.statusCounts.chargebacks;
      const pct = (v: number) =>
        total ? Math.round((v / total) * 100) : 0;
      setOrderStatus({
        paid:       { amount: m.statusCounts.paid,        percent: pct(m.statusCounts.paid) },
        chargeback: { amount: m.statusCounts.chargebacks, percent: pct(m.statusCounts.chargebacks) },
        refunded:   { amount: m.statusCounts.refunded,    percent: pct(m.statusCounts.refunded) },
      });
      
      /* ---------- sales overview chart ---------- */
      // Transform chart data properly handling both hourly and daily formats
      const formattedChartData = m.chart.map((item: any) => {
        // Format x-axis label
        let label = '';
        
        if ('hour' in item) {
          // Hourly data (for today/yesterday)
          label = `${String(item.hour).padStart(2, '0')}:00`;
          return {
            xLabel: label,
            value: item.grossRevenue || 0,
            // Keep original properties for reference
            hour: item.hour,
            grossRevenue: item.grossRevenue || 0
          };
        } else {
          // Daily data (for week/month)
          const dateObj = new Date(item.date);
          label = dateObj.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });
          return {
            xLabel: label,
            value: item.grossRevenue || 0,
            // Keep original properties for reference
            date: item.date,
            grossRevenue: item.grossRevenue || 0
          };
        }
      });
      
      setSalesData(formattedChartData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      Toaster.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerificationEmail = async () => {
    try {
      const response = await resendVerificationEmail();
      if (response?.success) {
        if (response.data && response.data.token) {
          setVerificationLink(
            `${window.location.origin}/verify-email?token=${response.data.token}`,
          );
        }
        Toaster.success(
          'Verification email sent! (link displayed below for demo)',
        );
      } else {
        Toaster.error(response?.message || 'Failed to send verification email');
      }
    } catch (err) {
      console.error("Error in handleResendVerificationEmail:", err);
      Toaster.error('An error occurred while trying to send the verification email.');
    }
  };

  // Determine verification status
  const getVerificationStatus = () => {
    if (!userData) return null;

    // Already verified server-side
    if (userData.idVerified || userData.idCheckStatus === 'verified') {
      return 'verified';
    }

    // If we've submitted docs and the server tells us a status
    if (verificationData?.status) {
      return verificationData.status;
    }

    // If backend says the submission was rejected
    if (userData.idCheckStatus === 'rejected') {
      return 'rejected';
    }

    // Otherwise, no submission yet
    return 'not_started';
  };

  const verificationStatus = getVerificationStatus();
  const isVerified      = verificationStatus === 'verified';
  const isRejected      = verificationStatus === 'rejected' || (rejectedFields && rejectedFields.length > 0);
  // ONLY treat "pending" when the server actually returned pending
  const isPending       = verificationData?.status === 'pending';
  // Show "start verification" when truly not started
  const needsVerification = !isVerified && !isRejected && !isPending && verificationStatus === 'not_started';

  const periods = [
    { value: 0, label: 'Today' },
    { value: 1, label: 'Yesterday' },
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' }
  ];

  const formatCurrency = (amount: number | null, currency: string = dashboardCurrency) => {
    if (amount === null) return 'N/A';
    const locales = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A';
    const arrow = value >= 0 ? '▲' : '▼';
    return `${arrow} ${Math.abs(value)}%`;
  };

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <DashLayout titleArea={<h2 className="text-xl font-semibold">Loading...</h2>}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </DashLayout>
    );
  }

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">
          Hello, {(merchantData?.firstName || merchantData?.businessName || 'Merchant')
  .replace(/^./, (c) => c.toUpperCase())}
          </h2>
          <p className="text-sm text-gray-500">
            {dateLabel}
          </p>
        </>
      }
      tools={
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <MenuButton className="inline-flex items-center gap-2 border border-gray-400 px-3 py-1 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
              <ListFilter className="w-4 h-4 text-indigo-900" />
              {periods.find(p => p.value === period)?.label || 'Today'}
            </MenuButton>
          </div>
          <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-300 focus:outline-none cursor-pointer">
            <div className="py-1">
              {periods.map((p) => (
                <MenuItem key={p.value}>
                  <button
                    className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer"
                    onClick={() => setPeriod(p.value)}
                  >
                    {p.label}
                  </button>
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Menu>
      }
    >
      {/* Alerts Section */}
      <div className="mb-6 space-y-4">
        {/* Email verification alert */}
        {userData && !userData.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <Mail className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Email verification required
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  Please verify your email address to unlock all features.
                </p>

                {/* Demo verification link */}
                {verificationLink && (
                  <div className="mt-2 p-2 bg-amber-100 rounded text-xs break-all overflow-auto">
                    <p className="text-amber-800 font-medium mb-1">Demo verification link:</p>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline"
                    >
                      {verificationLink}
                    </a>
                  </div>
                )}

                <button
                  onClick={handleResendVerificationEmail}
                  disabled={emailLoading}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {emailLoading ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3 mr-1" />
                  )}
                  {emailLoading ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ID verification alerts */}
        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Identity verification update required
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  Some of your verification documents were rejected. Please update them.
                </p>
                <Link
                  href="/merchant/verify-identity"
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Update verification
                </Link>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Identity verification in progress
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  Your identity verification is in progress. We will notify you when it is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {needsVerification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Identity verification required
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  For security reasons, we need to verify your identity before you can access all payment features.
                </p>
                <Link
                  href="/merchant/verify-identity"
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Start identity verification
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 bg-white px-4 py-2 rounded-2xl">
            <div className="mt-4 mb-4 pl-4 pr-2 border-r-none lg:border-r border-gray-200">
              <p className="text-[#777B84] font-semibold text-sm mb-2 truncate overflow-hidden whitespace-nowrap">
                Gross Revenue
              </p>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold">{formatCurrency(orderOverview?.gross?.amount || 0)}</h3>
                {orderOverview?.gross?.delta !== null && (
                  <p className={`text-xs px-2 rounded-xl truncate overflow-hidden whitespace-nowrap ${
                    orderOverview?.gross?.delta >= 0 ? 'text-[#309147] bg-[#E9FFE1]' : 'text-red-500 bg-red-100'
                  }`}>
                    {formatPercentage(orderOverview?.gross?.delta)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 mb-4 pl-4 pr-2 lg:pl-10 border-r-none lg:border-r border-gray-200">
              <p className="text-[#777B84] font-semibold text-sm mb-2 truncate overflow-hidden whitespace-nowrap">
                Paid Order
              </p>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold">{orderOverview?.paidOrder?.amount || 0}</h3>
                {orderOverview?.paidOrder?.delta !== null && (
                  <p className={`text-xs px-2 rounded-xl truncate overflow-hidden whitespace-nowrap ${
                    orderOverview?.paidOrder?.delta >= 0 ? 'text-[#309147] bg-[#E9FFE1]' : 'text-red-500 bg-red-100'
                  }`}>
                    {formatPercentage(orderOverview?.paidOrder?.delta)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 mb-4 pl-4 pr-2 lg:pl-10">
              <p className="text-[#777B84] font-semibold text-sm mb-2 truncate overflow-hidden whitespace-nowrap">
                Card Acceptance
              </p>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold">{orderOverview?.averageSucceedOrder?.amount?.toFixed(1) || 0}%</h3>
                {orderOverview?.averageSucceedOrder?.delta !== null && (
                  <p className={`text-xs px-2 rounded-xl truncate overflow-hidden whitespace-nowrap ${
                    orderOverview?.averageSucceedOrder?.delta >= 0 ? 'text-[#309147] bg-[#E9FFE1]' : 'text-red-500 bg-red-100'
                  }`}>
                    {formatPercentage(orderOverview?.averageSucceedOrder?.delta)}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Sale Overview*/}
          <div className="bg-white p-6 rounded-2xl">
            <h4 className="font-semibold mb-2 text-[#777B84] text-xl">Sales Overview</h4>
            <p className="text-sm text-[#BEBEBE] mb-4">Track your company daily volume</p>
            <ResponsiveContainer width="100%" height={338}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006AFF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#006AFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="xLabel" 
                  stroke="#9FA6B2" 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                  height={40}
                  minTickGap={0}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9FA6B2"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value === 0) return value;
                    return dashboardCurrency === 'BRL' ? `R$ ${value}` : `$ ${value}`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <CartesianGrid stroke="#D2D6DC33" vertical={false} />
                <Tooltip
   content={(props) => ( 
     <CustomTooltip {...props} dashboardCurrency={dashboardCurrency} /> 
   )} 
 />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#006AFF" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-3 lg:col-span-1 space-y-4 w-full text-sm text-black">
          {/* Balance Section */}
          <div className="p-4 bg-white rounded-xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[#777B84] font-semibold my-1">Available Balance (USD)</h4>
                <p className={`text-xl font-semibold my-2 ${ (balances?.USD?.available || 0) < 0 ? 'text-red-500' : '' }`}>
                  {formatCurrency(balances?.USD?.available || 0, 'USD')}
                </p>
                <p className="text-[#BEBEBE] my-1 truncate overflow-hidden whitespace-nowrap text-sm">
                  Available balance in USD
                </p>
              </div>
              <Link
                href="/merchant/finance"
                className="font-normal text-gray-600 hover:underline truncate overflow-hidden whitespace-nowrap"
              >
                See Details
              </Link>
            </div>

            <hr className="border-gray-200" />

            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[#777B84] font-semibold my-1">Available Balance (BRL)</h4>
                <p className={`text-xl font-semibold my-2 ${ (balances?.BRL?.available || 0) < 0 ? 'text-red-500' : '' }`}>
                  {formatCurrency(balances?.BRL?.available || 0, 'BRL')}
                </p>
                <p className="text-[#BEBEBE] my-1 truncate overflow-hidden whitespace-nowrap text-sm">
                  Available balance in BRL
                </p>
              </div>
              <Link
                href="/merchant/finance"
                className="font-normal text-gray-600 hover:underline truncate overflow-hidden whitespace-nowrap"
              >
                See Details
              </Link>
            </div>
          </div>

          {/* Account Status Section ... */}
          <div className="p-4 bg-white rounded-xl">
            <h4 className="font-semibold text-[#090E18] mb-1 text-base">Account status</h4>
            <p className="text-sm text-[#BEBEBE] mb-4 truncate overflow-hidden whitespace-nowrap">
              Paid Orders, Chargebacks, Refunded
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={orderStatus?.paid?.percent || 0}
                    text={`${orderStatus?.paid?.percent || 0}%`}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: '#006aff',
                      textColor: '#2E3033',
                      trailColor: '#E5E5FD',
                      textSize: '20px',
                    })}
                  />
                </div>
                <div>
                  <p className="font-semibold text-base text-[#090E18] truncate overflow-hidden whitespace-nowrap">
                    Paid Orders
                  </p>
                  <p className="text-sm text-[#BEBEBE] truncate overflow-hidden whitespace-nowrap">
                    {orderStatus?.paid?.amount || 0} in this period
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={orderStatus?.chargeback?.percent || 0}
                    text={`${orderStatus?.chargeback?.percent || 0}%`}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: '#DE0707',
                      textColor: '#2E3033',
                      trailColor: '#FBF3F4',
                      textSize: '20px',
                    })}
                  />
                </div>
                <div>
                  <p className="font-semibold text-base text-[#090E18] truncate overflow-hidden whitespace-nowrap">
                    Chargebacks
                  </p>
                  <p className="text-sm text-[#BEBEBE] truncate overflow-hidden whitespace-nowrap">
                    {orderStatus?.chargeback?.amount || 0} in this period
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={orderStatus?.refunded?.percent || 0}
                    text={`${orderStatus?.refunded?.percent || 0}%`}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: '#808080',
                      textColor: '#2E3033',
                      trailColor: '#EFEFEF',
                      textSize: '20px',
                    })}
                  />
                </div>
                <div>
                  <p className="font-semibold text-base text-[#090E18] truncate overflow-hidden whitespace-nowrap">
                    Refunded
                  </p>
                  <p className="text-sm text-[#BEBEBE] truncate overflow-hidden whitespace-nowrap">
                    {orderStatus?.refunded?.amount || 0} in this period
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashLayout>
  );
};

export default Dashboard;