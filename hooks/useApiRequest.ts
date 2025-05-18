import { useState } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface UseApiRequestProps {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  immediate?: boolean;
}

interface UseApiRequestResponse<T extends { message?: string; data?: any; [key: string]: any }> {
  response: T | null;
  error: T | null;
  loading: boolean;
  sendRequest: (url?: string, formData?: any) => Promise<void>;
}

export const useApiRequest = <T extends { message?: string; data?: any; [key: string]: any }>({
  endpoint,
  method = 'GET',
  data = null,
  params = null,
  headers = { 'Content-Type': 'application/json' },
  auth = true,
  immediate = true,
}: UseApiRequestProps): UseApiRequestResponse<T> => {
  const [response, setResponse] = useState<T | null>(null);
  const [error, setError] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('jwt_token') || '';
  };

  const sendRequest = async (url = '', formData = {}) => {
    setLoading(true);
    setError(null);

    // Get the API URL from environment
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Build the full URL - remove /api/v1 from our base since it's already in env
    const fullUrl = url ? `${apiBaseUrl}${endpoint}${url}` : `${apiBaseUrl}${endpoint}`;

    // Construct headers, merging provided headers with conditional auth header
    const requestHeaders = {
      ...(formData instanceof FormData ? {} : headers), // Don't set Content-Type for FormData
      ...(auth && { Authorization: `Bearer ${getToken()}` }),
    };

    const config: AxiosRequestConfig = {
      url: fullUrl,
      method,
      headers: requestHeaders,
      data: formData instanceof FormData ? formData : { ...data, ...formData },
      params: {
        ...params,
      },
    };

    try {
      const res: AxiosResponse<T> = await axios(config);
      setResponse(res.data);
return res.data;
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data ?? err);
      } else {
        setError({
          message: err.message ?? 'Something went wrong!',
        } as T);
      }
    } finally {
      setLoading(false);
    }
  };

  return { response, error, loading, sendRequest };
};
