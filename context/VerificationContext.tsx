'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { apiBaseUrl, verificationStatusUrl, verificationSubmitUrl } from '@/consts/paths';
import { useApiRequest } from '@/hooks';
import Toaster from '@/helpers/Toaster';

// Types
interface VerificationStatus {
  status: 'pending' | 'verified' | 'rejected';
  verification: any;
  country: string;
  paymentRates: any[];
  requirements: any;
}

interface VerificationContextType {
  status: string;
  isLoading: boolean;
  verificationData: any;
  countryRequirements: any;
  paymentRates: any[];
  fetchStatus: () => Promise<void>;
  submitDocuments: (formData: FormData) => Promise<boolean>;
  rejectedFields: string[];
  rejectionReasons: Record<string, string>;
}

// Create context
const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

// Helper to clean display values (remove PLAIN: prefix)
const cleanDisplayValue = (value: string): string => {
  if (value && typeof value === 'string' && value.startsWith('PLAIN:')) {
    return value.substring(6);
  }
  return value;
};

// Provider component
export const VerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [countryRequirements, setCountryRequirements] = useState<any>(null);
  const [paymentRates, setPaymentRates] = useState<any[]>([]);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  
  // Setup polling
  const [shouldPoll, setShouldPoll] = useState<boolean>(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Check if we're on the dashboard page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDashboard = window.location.pathname === '/merchant';
      setShouldPoll(isDashboard);
      
      // Clean up polling interval when component unmounts
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, []);

  const { sendRequest: fetchStatusRequest } = useApiRequest({
    endpoint: verificationStatusUrl,
    method: 'GET',
  });

  const { sendRequest: submitDocumentsRequest } = useApiRequest({
    endpoint: verificationSubmitUrl,
    method: 'POST',
  });

  // Fetch verification status
  // We're using useRef to make this stable
  const stableFetchStatusRequest = useRef(fetchStatusRequest).current;
  
  const fetchStatus = useCallback(async () => {
    // Throttle requests - don't make a request if the last one was less than 5 seconds ago
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      return;
    }
    
    lastFetchTimeRef.current = now;
    
    try {
      setIsLoading(true);
      
      // Use type assertion to tell TypeScript to trust that the response has the structure we expect
      const response = await stableFetchStatusRequest() as any;
      
      if (response?.success) {
        const data = response.data as VerificationStatus;
        setStatus(data.status);
        
        // Clean sensitive data before setting
        if (data.verification) {
          if (data.verification.businessDocument?.number) {
            data.verification.businessDocument.number = cleanDisplayValue(data.verification.businessDocument.number);
          }
          
          if (data.verification.personalDocument?.number) {
            data.verification.personalDocument.number = cleanDisplayValue(data.verification.personalDocument.number);
          }
          
          if (data.verification.bankDetails?.accountNumber) {
            data.verification.bankDetails.accountNumber = cleanDisplayValue(data.verification.bankDetails.accountNumber);
          }
        }
        
        setVerificationData(data.verification);
        setCountryRequirements(data.requirements);
        setPaymentRates(data.paymentRates || []);
        
        // Process rejection information
        const rejected: string[] = [];
        const reasons: Record<string, string> = {};
        
        if (data.verification) {
          if (data.verification.businessDocument?.status === 'rejected') {
            rejected.push('businessDocument');
            reasons.businessDocument = data.verification.businessDocument.rejectionReason || 'Business document was rejected';
          }
          
          if (data.verification.personalDocument?.status === 'rejected') {
            rejected.push('personalDocument');
            reasons.personalDocument = data.verification.personalDocument.rejectionReason || 'Personal document was rejected';
          }
          
          if (data.verification.bankDetails?.status === 'rejected') {
            rejected.push('bankDetails');
            reasons.bankDetails = data.verification.bankDetails.rejectionReason || 'Bank details were rejected';
          }
          
          // Include overall rejection note if it exists
          if (data.verification.rejectionNote) {
            reasons.overall = data.verification.rejectionNote;
          }
        }
        
        setRejectedFields(rejected);
        setRejectionReasons(reasons);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      Toaster.error('Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  }, [stableFetchStatusRequest]);

  // Setup polling if on the dashboard
  useEffect(() => {
    // Get user data from local storage
    const userData = localStorage.getItem('user_data');
    const hasUser = !!userData;
    
    // Only setup polling if on dashboard and authenticated
    if (shouldPoll && hasUser) {
      // Initial fetch
      fetchStatus();
      
      // Setup polling interval at 60 seconds
      pollingIntervalRef.current = window.setInterval(() => {
        fetchStatus();
      }, 60000); // 60 seconds
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
    
    // If not on dashboard but authenticated, just fetch once
    if (hasUser && !shouldPoll) {
      fetchStatus();
    }
  }, [fetchStatus, shouldPoll]);

  // Submit verification documents
  const submitDocuments = useCallback(async (formData: FormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use type assertion here too
      const response = await submitDocumentsRequest('', formData) as any;
      
      if (response?.success) {
        setStatus('pending');
        Toaster.success('Verification documents submitted successfully');
        await fetchStatus(); // Refresh status
        return true;
      } else {
        Toaster.error(response?.message || 'Failed to submit verification');
        return false;
      }
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      Toaster.error('An error occurred while submitting verification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [submitDocumentsRequest, fetchStatus]);

  return (
    <VerificationContext.Provider
      value={{
        status,
        isLoading,
        verificationData,
        countryRequirements,
        paymentRates,
        fetchStatus,
        submitDocuments,
        rejectedFields,
        rejectionReasons,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};

// Custom hook to use the verification context
export const useVerification = (): VerificationContextType => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};