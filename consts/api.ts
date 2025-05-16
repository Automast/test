// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    REGISTER: '/auth/register'
  },
  FINANCE: {
    BALANCE: '/finance/balance',
    TRANSACTIONS: '/finance/transactions'
  }
};