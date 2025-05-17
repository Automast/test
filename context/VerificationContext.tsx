'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
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

  const { sendRequest: fetchStatusRequest } = useApiRequest({
    endpoint: verificationStatusUrl,
    method: 'GET',
  });

  const { sendRequest: submitDocumentsRequest } = useApiRequest({
    endpoint: verificationSubmitUrl,
    method: 'POST',
  });

  // Fetch verification status
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetchStatusRequest();
      
      if (response?.success) {
        const data: VerificationStatus = response.data;
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
  }, [fetchStatusRequest]);

  // Submit verification documents
  const submitDocuments = useCallback(async (formData: FormData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await submitDocumentsRequest('', formData);
      
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