'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CreditCard,
  Building,
  User,
  Lock,
  Check,
  AlertTriangle,
  X,
  Wallet,
  Info,
  ArrowLeft,
  Landmark,
  Upload as UploadIcon,
  FileCheck,
  HelpCircle,
} from 'lucide-react';
import { useVerification } from '@/context/VerificationContext';
import Link from 'next/link';

// US states
const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Brazilian states
const brStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

// ID Position info tooltip component
interface IDPositionInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const IDPositionInfo = ({ isOpen, onClose }: IDPositionInfoProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-medium mb-2">How to take your selfie with ID</h3>
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="w-full h-48 bg-gray-300 flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-gray-500" />
            <span className="mx-2 text-gray-500">+</span>
            <FileText className="h-12 w-12 text-gray-500" />
          </div>
          <p className="text-sm text-gray-700">
            Hold your ID card next to your face. Make sure both your face and all details on the ID
            are clearly visible. Take the photo in good lighting and ensure there are no reflections
            on the ID.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function VerifyIdentityPage() {
  const router = useRouter();
  const {
    status,
    isLoading,
    verificationData,
    countryRequirements,
    paymentRates,
    fetchStatus,
    submitDocuments,
    rejectedFields,
    rejectionReasons,
  } = useVerification();

  // Get merchant info from localStorage (your existing auth system)
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  useEffect(() => {
    // Get merchant info from your existing auth system
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setMerchantInfo(parsed);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  // Form state
  const [formData, setFormData] = useState<{
    businessDocType: string;
    businessDocNumber: string;
    personalDocType: string;
    personalDocNumber: string;
    businessName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    bankAccountName: string;
    bankAccountNumber: string;
    routingNumber: string;
    bankName: string;
    bankBranch: string;
    receiptTime: string;
    paymentMethods: string[];
  }>({
    businessDocType: '',
    businessDocNumber: '',
    personalDocType: '',
    personalDocNumber: '',
    businessName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    bankAccountName: '',
    bankAccountNumber: '',
    routingNumber: '',
    bankName: '',
    bankBranch: '',
    receiptTime: '14',
    paymentMethods: ['creditCard', 'paypal', 'wallets', 'pix'],
  });

  // File state
  const [files, setFiles] = useState<{
    businessDocImage: File | null;
    personalDocFront: File | null;
    personalDocBack: File | null;
    personalSelfie: File | null;
    bankStatement: File | null;
  }>({
    businessDocImage: null,
    personalDocFront: null,
    personalDocBack: null,
    personalSelfie: null,
    bankStatement: null,
  });

  // Preview state
  const [previews, setPreviews] = useState<{
    businessDocImage: string;
    personalDocFront: string;
    personalDocBack: string;
    personalSelfie: string;
    bankStatement: string;
  }>({
    businessDocImage: '',
    personalDocFront: '',
    personalDocBack: '',
    personalSelfie: '',
    bankStatement: '',
  });

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Information states
  const [showSelfieInfo, setShowSelfieInfo] = useState(false);
  
  // Highlight rejected fields
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Derived state - determine country from merchant info
  const country = merchantInfo?.country || 'US';
  const states = country === 'US' ? usStates : brStates;
  const needsBack = formData.personalDocType !== 'passport';
  const selectedRate = paymentRates?.find(
    (rate: any) => rate.receiptDays === parseInt(formData.receiptTime)
  );

  // Mark rejected fields on load
  useEffect(() => {
    if (rejectedFields.length > 0) {
      const fieldsToHighlight: string[] = [];
      
      if (rejectedFields.includes('businessDocument')) {
        fieldsToHighlight.push('businessDocType', 'businessDocNumber', 'businessDocImage');
      }
      
      if (rejectedFields.includes('personalDocument')) {
        fieldsToHighlight.push('personalDocType', 'personalDocNumber', 'personalDocFront', 'personalDocBack', 'personalSelfie');
      }
      
      if (rejectedFields.includes('bankDetails')) {
        fieldsToHighlight.push('bankAccountName', 'bankAccountNumber', 'routingNumber', 'bankName', 'bankBranch', 'bankStatement');
      }
      
      setHighlightedFields(fieldsToHighlight);
    }
  }, [rejectedFields]);

  // Fetch verification status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Populate form with merchant data
  useEffect(() => {
    if (merchantInfo) {
      setFormData(prev => ({
        ...prev,
        businessName: merchantInfo.businessName || '',
      }));
    }
  }, [merchantInfo]);

  // Populate form with verification data for editing
  useEffect(() => {
    if (verificationData && (status === 'rejected' || status === 'pending')) {
      setFormData(prev => ({
        ...prev,
        businessDocType: verificationData.businessDocument?.type || prev.businessDocType,
        businessDocNumber: verificationData.businessDocument?.number || prev.businessDocNumber,
        personalDocType: verificationData.personalDocument?.type || prev.personalDocType,
        personalDocNumber: verificationData.personalDocument?.number || prev.personalDocNumber,
        bankAccountName: verificationData.bankDetails?.accountName || prev.bankAccountName,
        bankAccountNumber: verificationData.bankDetails?.accountNumber || prev.bankAccountNumber,
        routingNumber: verificationData.bankDetails?.routingNumber || prev.routingNumber,
        bankName: verificationData.bankDetails?.bankName || prev.bankName,
        bankBranch: verificationData.bankDetails?.bankBranch || prev.bankBranch,
        receiptTime: verificationData.paymentSettings?.receiptTime.toString() || prev.receiptTime,
        paymentMethods: getActiveMethods(verificationData.paymentSettings?.methods) || prev.paymentMethods,
      }));
    }
  }, [verificationData, status]);

  // Helper to extract active payment methods
  const getActiveMethods = (methods: any) => {
    if (!methods) return ['creditCard', 'paypal', 'wallets', 'pix'];
    
    const active: string[] = [];
    if (methods.creditCard) active.push('creditCard');
    if (methods.paypal) active.push('paypal');
    if (methods.wallets) active.push('wallets');
    if (methods.pix) active.push('pix');
    
    return active;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle file changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target;
    
    if (inputFiles && inputFiles[0]) {
      const file = inputFiles[0];
      
      // Validate file size - max 10MB
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          [name]: 'File size must be less than 10MB' 
        }));
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          [name]: 'Only images (JPEG, PNG, GIF) and PDF files are allowed' 
        }));
        return;
      }
      
      // Update files state
      setFiles(prev => ({ ...prev, [name]: file }));
      
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      
      // Clear errors
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  // Handle payment method toggle
  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => {
      const methods = [...prev.paymentMethods];
      
      if (methods.includes(method)) {
        // Remove method if already included (unless it's the last one)
        if (methods.length > 1) {
          return {
            ...prev,
            paymentMethods: methods.filter(m => m !== method),
          };
        }
        return prev;
      } else {
        // Add method if not included
        return {
          ...prev,
          paymentMethods: [...methods, method],
        };
      }
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic required field validation
    if (!formData.businessDocType) newErrors.businessDocType = 'Please select a document type';
    if (!formData.businessDocNumber) newErrors.businessDocNumber = 'Document number is required';
    if (!formData.personalDocType) newErrors.personalDocType = 'Please select a document type';
    if (!formData.personalDocNumber) newErrors.personalDocNumber = 'ID number is required';
    if (!formData.bankAccountName) newErrors.bankAccountName = 'Account name is required';
    if (!formData.bankAccountNumber) newErrors.bankAccountNumber = 'Account number is required';
    if (!formData.bankName) newErrors.bankName = 'Bank name is required';
    if (!formData.receiptTime) newErrors.receiptTime = 'Payment receipt time is required';
    
    // Country-specific validation
    if (country === 'US' && !formData.routingNumber) {
      newErrors.routingNumber = 'Routing number is required';
    }
    
    if (country === 'BR' && !formData.bankBranch) {
      newErrors.bankBranch = 'Bank branch is required';
    }
    
    // File validation
    if ((status !== 'rejected' && !previews.personalDocFront) || 
        (rejectedFields.includes('personalDocument') && !files.personalDocFront && !previews.personalDocFront)) {
      newErrors.personalDocFront = 'Document front image is required';
    }
    
    if (needsBack && 
        ((status !== 'rejected' && !previews.personalDocBack) || 
        (rejectedFields.includes('personalDocument') && !files.personalDocBack && !previews.personalDocBack))) {
      newErrors.personalDocBack = 'Document back image is required';
    }
    
    if ((status !== 'rejected' && !previews.personalSelfie) || 
        (rejectedFields.includes('personalDocument') && !files.personalSelfie && !previews.personalSelfie)) {
      newErrors.personalSelfie = 'Selfie with document is required';
    }
    
    if ((status !== 'rejected' && !previews.bankStatement) || 
        (rejectedFields.includes('bankDetails') && !files.bankStatement && !previews.bankStatement)) {
      newErrors.bankStatement = 'Bank statement is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Scroll to first error
  const scrollToFirstError = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const element = document.getElementsByName(firstErrorField)[0];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 500);
    }, 100);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) {
      setGeneralError('Please fix the errors in the form before submitting');
      scrollToFirstError();
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create form data for the API request
      const apiFormData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'paymentMethods') {
          apiFormData.append(key, JSON.stringify(value));
        } else {
          apiFormData.append(key, value.toString());
        }
      });
      
      // Add files - only add files that are newly selected
      if (files.businessDocImage) {
        apiFormData.append('businessDocImage', files.businessDocImage);
      }
      
      if (files.personalDocFront) {
        apiFormData.append('personalDocFront', files.personalDocFront);
      }
      
      if (needsBack && files.personalDocBack) {
        apiFormData.append('personalDocBack', files.personalDocBack);
      }
      
      if (files.personalSelfie) {
        apiFormData.append('personalSelfie', files.personalSelfie);
      }
      
      if (files.bankStatement) {
        apiFormData.append('bankStatement', files.bankStatement);
      }
      
      // Submit form
      const success = await submitDocuments(apiFormData);
      
      if (success) {
        router.push('/merchant');
      } else {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setGeneralError('An error occurred while submitting the form');
      scrollToFirstError();
      setSubmitting(false);
    }
  };

  // Render status message if already verified
  if (status === 'verified') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link href="/merchant" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
              <div className="flex items-center mt-1">
                <span className="text-sm text-blue-600 font-medium">ArkusPay</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
            <div className="flex">
              <Check className="h-6 w-6 text-green-500" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">Verification Complete</h3>
                <p className="mt-2 text-sm text-green-700">
                  Your identity has been verified successfully. You now have full access to all features.
                </p>
                <div className="mt-4">
                  <Link
                    href="/merchant"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show pending message after successful submission
  if (status === 'pending' && !rejectedFields.length && submitting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link href="/merchant" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
              <div className="flex items-center mt-1">
                <span className="text-sm text-blue-600 font-medium">ArkusPay</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mb-6">
            <div className="flex">
              <Info className="h-6 w-6 text-blue-500" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">Verification in Progress</h3>
                <p className="mt-2 text-sm text-blue-700">
                  Your verification documents have been submitted and are being reviewed. This process usually takes 1-2 business days.
                </p>
                <div className="mt-4">
                  <Link
                    href="/merchant"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to display processing fee
  function getProcessingFeeDisplay(days: string): string {
    const rate = paymentRates?.find((r: any) => r.receiptDays === parseInt(days));
    
    if (!rate) {
      return 'N/A';
    }
    
    if (rate.rateType === 'percentage') {
      return `${rate.rateValue}%`;
    } else if (rate.rateType === 'fixed') {
      // Display based on country currency
      if (country === 'BR') {
        // Handle possibility of either direct rateValue or currencies.BRL
        if (rate.currencies && rate.currencies.BRL) {
          return `BRL ${Number(rate.currencies.BRL).toFixed(2)}`;
        } else {
          return `BRL ${Number(rate.rateValue).toFixed(2)}`;
        }
      } else {
        // Default to USD
        if (rate.currencies && rate.currencies.USD) {
          return `$${Number(rate.currencies.USD).toFixed(2)}`;
        } else {
          return `$${Number(rate.rateValue).toFixed(2)}`;
        }
      }
    } else if (rate.rateType === 'both') {
      // Handle both percentage and fixed amount
      let percentPart = rate.rateValue ? `${rate.rateValue}%` : '';
      let fixedPart = '';
      
      if (country === 'BR' && rate.currencies && rate.currencies.BRL) {
        fixedPart = `BRL ${Number(rate.currencies.BRL).toFixed(2)}`;
      } else if (rate.currencies && rate.currencies.USD) {
        fixedPart = `$${Number(rate.currencies.USD).toFixed(2)}`;
      }
      
      if (percentPart && fixedPart) {
        return `${percentPart} + ${fixedPart}`;
      } else {
        return percentPart || fixedPart || 'N/A';
      }
    }
    
    return 'N/A';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/merchant" className="mr-4">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm text-blue-600 font-medium">ArkusPay</span>
            </div>
          </div>
        </div>
        
        {/* Rejected notice */}
        {status === 'rejected' && rejectedFields.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Verification Rejected</h3>
                <p className="mt-2 text-sm text-red-700">
                  Some of your verification documents were rejected. Please update the highlighted sections below.
                </p>
                
                {/* Display rejected document types with their specific reasons */}
                <div className="mt-3 space-y-2">
                  {rejectedFields.includes('businessDocument') && (
                    <div className="bg-red-100 p-2 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">Business Document:</h4>
                      <p className="text-sm text-red-700">{rejectionReasons.businessDocument || 'Business document was rejected'}</p>
                    </div>
                  )}
                  
                  {rejectedFields.includes('personalDocument') && (
                    <div className="bg-red-100 p-2 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">Personal Document:</h4>
                      <p className="text-sm text-red-700">{rejectionReasons.personalDocument || 'Personal document was rejected'}</p>
                    </div>
                  )}
                  
                  {rejectedFields.includes('bankDetails') && (
                    <div className="bg-red-100 p-2 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">Bank Details:</h4>
                      <p className="text-sm text-red-700">{rejectionReasons.bankDetails || 'Bank details were rejected'}</p>
                    </div>
                  )}

                  {rejectionReasons.overall && (
                    <div className="bg-red-100 p-2 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">Additional Notes:</h4>
                      <p className="text-sm text-red-700">{rejectionReasons.overall}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* General error */}
        {generalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex">
              <X className="h-6 w-6 text-red-500" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{generalError}</h3>
                
                {Object.keys(errors).length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-800">Please fix the following issues:</p>
                    <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field}>
                          <button 
                            onClick={() => {
                              const element = document.getElementsByName(field)[0];
                              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="text-red-700 underline"
                          >
                            {message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details Section */}
          <div className={`p-6 bg-white rounded-lg shadow-sm border ${
            rejectedFields.includes('businessDocument') ? 'border-red-300' : 'border-gray-200'
          }`}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <Building className="mr-2 h-5 w-5 text-gray-500" />
              Company Details
            </h2>
            <p className="text-sm text-gray-500 mb-4">Fill in your company details and provide business identification.</p>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Business Name */}
              <div className="sm:col-span-3">
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="businessName"
                    id="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    disabled={true}
                    className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">From your merchant profile (cannot be changed)</p>
                </div>
              </div>
              
              {/* Document Type */}
              <div className="sm:col-span-3">
                <label htmlFor="businessDocType" className="block text-sm font-medium text-gray-700">
                  Document Type
                </label>
                <div className="mt-1">
                  <select
                    id="businessDocType"
                    name="businessDocType"
                    value={formData.businessDocType}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.businessDocType ? 'border-red-300 bg-red-50' : highlightedFields.includes('businessDocType') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select document type</option>
                    {countryRequirements?.businessDocTypes.map((type: { value: string; label: string }) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessDocType && (
                    <p className="mt-1 text-xs text-red-600">{errors.businessDocType}</p>
                  )}
                </div>
              </div>
              
              {/* Document Number */}
              <div className="sm:col-span-3">
                <label htmlFor="businessDocNumber" className="block text-sm font-medium text-gray-700">
                  Document Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="businessDocNumber"
                    id="businessDocNumber"
                    value={formData.businessDocNumber}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.businessDocNumber ? 'border-red-300 bg-red-50' : highlightedFields.includes('businessDocNumber') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.businessDocNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.businessDocNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Owner Data Section */}
          <div className={`p-6 bg-white rounded-lg shadow-sm border ${
            rejectedFields.includes('personalDocument') ? 'border-red-300' : 'border-gray-200'
          }`}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <User className="mr-2 h-5 w-5 text-gray-500" />
              Owner Data
            </h2>
            <p className="text-sm text-gray-500 mb-4">Submit business owner details and identification documents.</p>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Document Type */}
              <div className="sm:col-span-3">
                <label htmlFor="personalDocType" className="block text-sm font-medium text-gray-700">
                  Document Type
                </label>
                <div className="mt-1">
                  <select
                    id="personalDocType"
                    name="personalDocType"
                    value={formData.personalDocType}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.personalDocType ? 'border-red-300 bg-red-50' : highlightedFields.includes('personalDocType') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select document type</option>
                    {countryRequirements?.personalDocTypes.map((type: { value: string; label: string }) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.personalDocType && (
                    <p className="mt-1 text-xs text-red-600">{errors.personalDocType}</p>
                  )}
                </div>
              </div>
              
              {/* Document Number */}
              <div className="sm:col-span-3">
                <label htmlFor="personalDocNumber" className="block text-sm font-medium text-gray-700">
                  ID Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="personalDocNumber"
                    id="personalDocNumber"
                    value={formData.personalDocNumber}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.personalDocNumber ? 'border-red-300 bg-red-50' : highlightedFields.includes('personalDocNumber') ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.personalDocNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.personalDocNumber}</p>
                  )}
                </div>
              </div>
              
              {/* Document Front */}
              <div className="sm:col-span-3">
                <label htmlFor="personalDocFront" className="block text-sm font-medium text-gray-700">
                  Document Front
                </label>
                <div className="mt-1">
                  <div className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    errors.personalDocFront ? 'border-red-300 bg-red-50' : 
                    highlightedFields.includes('personalDocFront') ? 'border-yellow-300 bg-yellow-50' :
                    previews.personalDocFront ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}>
                    <div className="space-y-1 text-center">
                      {previews.personalDocFront ? (
                        <div className="flex flex-col items-center">
                          {previews.personalDocFront.startsWith('data:image') ? (
                            <img 
                              src={previews.personalDocFront} 
                              alt="Document preview" 
                              className="h-32 object-contain mb-2"
                            />
                          ) : (
                            <FileCheck className="h-12 w-12 text-green-500 mb-2" />
                          )}
                          <p className="text-sm text-gray-700">{files.personalDocFront?.name || "Document uploaded"}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFiles(prev => ({ ...prev, personalDocFront: null }));
                              setPreviews(prev => ({ ...prev, personalDocFront: '' }));
                            }}
                            className="mt-2 text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="personalDocFront"
                              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="personalDocFront"
                                name="personalDocFront"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif,application/pdf"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">JPEG, PNG, GIF, PDF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.personalDocFront && (
                    <p className="mt-1 text-xs text-red-600">{errors.personalDocFront}</p>
                  )}
                </div>
              </div>
              
              {/* Document Back (only if not passport) */}
              {needsBack && (
                <div className="sm:col-span-3">
                  <label htmlFor="personalDocBack" className="block text-sm font-medium text-gray-700">
                    Document Back
                  </label>
                  <div className="mt-1">
                    <div className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                      errors.personalDocBack ? 'border-red-300 bg-red-50' : 
                      highlightedFields.includes('personalDocBack') ? 'border-yellow-300 bg-yellow-50' :
                      previews.personalDocBack ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}>
                      <div className="space-y-1 text-center">
                        {previews.personalDocBack ? (
                          <div className="flex flex-col items-center">
                            {previews.personalDocBack.startsWith('data:image') ? (
                              <img 
                                src={previews.personalDocBack} 
                                alt="Document preview" 
                                className="h-32 object-contain mb-2"
                              />
                            ) : (
                              <FileCheck className="h-12 w-12 text-green-500 mb-2" />
                            )}
                            <p className="text-sm text-gray-700">{files.personalDocBack?.name || "Document uploaded"}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setFiles(prev => ({ ...prev, personalDocBack: null }));
                                setPreviews(prev => ({ ...prev, personalDocBack: '' }));
                              }}
                              className="mt-2 text-xs font-medium text-red-600 hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="personalDocBack"
                                className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="personalDocBack"
                                  name="personalDocBack"
                                  type="file"
                                  className="sr-only"
                                  accept="image/jpeg,image/png,image/gif,application/pdf"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">JPEG, PNG, GIF, PDF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.personalDocBack && (
                      <p className="mt-1 text-xs text-red-600">{errors.personalDocBack}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selfie with ID */}
              <div className="sm:col-span-6">
                <label htmlFor="personalSelfie" className="flex items-center text-sm font-medium text-gray-700">
                  Selfie with ID
                  <button 
                    type="button"
                    onClick={() => setShowSelfieInfo(true)}
                    className="ml-1 text-gray-400 hover:text-gray-500"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Please upload a photo of yourself holding your ID document
                </p>
                <div className="mt-1">
                  <div className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    errors.personalSelfie ? 'border-red-300 bg-red-50' : 
                    highlightedFields.includes('personalSelfie') ? 'border-yellow-300 bg-yellow-50' :
                    previews.personalSelfie ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}>
                    <div className="space-y-1 text-center">
                      {previews.personalSelfie ? (
                        <div className="flex flex-col items-center">
                          {previews.personalSelfie.startsWith('data:image') ? (
                            <img 
                              src={previews.personalSelfie} 
                              alt="Selfie preview" 
                              className="h-32 object-contain mb-2"
                            />
                          ) : (
                            <FileCheck className="h-12 w-12 text-green-500 mb-2" />
                          )}
                          <p className="text-sm text-gray-700">{files.personalSelfie?.name || "Selfie uploaded"}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFiles(prev => ({ ...prev, personalSelfie: null }));
                              setPreviews(prev => ({ ...prev, personalSelfie: '' }));
                            }}
                            className="mt-2 text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="personalSelfie"
                              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="personalSelfie"
                                name="personalSelfie"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">JPEG, PNG, GIF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.personalSelfie && (
                    <p className="mt-1 text-xs text-red-600">{errors.personalSelfie}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className={`p-6 bg-white rounded-lg shadow-sm border ${
            rejectedFields.includes('bankDetails') ? 'border-red-300' : 'border-gray-200'
          }`}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <Landmark className="mr-2 h-5 w-5 text-gray-500" />
              Bank Details
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              It is important to register a bank account owned by the company or person registered above.
            </p>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Account Name */}
              <div className="sm:col-span-3">
                <label htmlFor="bankAccountName" className="block text-sm font-medium text-gray-700">
                  Account Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="bankAccountName"
                    id="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.bankAccountName ? 'border-red-300 bg-red-50' : 
                      highlightedFields.includes('bankAccountName') ? 'border-yellow-300 bg-yellow-50' : 
                      'border-gray-300'
                    }`}
                  />
                  {errors.bankAccountName && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankAccountName}</p>
                  )}
                </div>
              </div>
              
              {/* Account Number */}
              <div className="sm:col-span-3">
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="bankAccountNumber"
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.bankAccountNumber ? 'border-red-300 bg-red-50' : 
                      highlightedFields.includes('bankAccountNumber') ? 'border-yellow-300 bg-yellow-50' : 
                      'border-gray-300'
                    }`}
                  />
                  {errors.bankAccountNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankAccountNumber}</p>
                  )}
                </div>
              </div>
              
              {/* Routing Number (US only) */}
              {country === 'US' && (
                <div className="sm:col-span-3">
                  <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
                    Routing Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="routingNumber"
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={handleInputChange}
                      className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.routingNumber ? 'border-red-300 bg-red-50' : 
                        highlightedFields.includes('routingNumber') ? 'border-yellow-300 bg-yellow-50' : 
                        'border-gray-300'
                      }`}
                    />
                    {errors.routingNumber && (
                      <p className="mt-1 text-xs text-red-600">{errors.routingNumber}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Bank Name */}
              <div className="sm:col-span-3">
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="bankName"
                    id="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                      errors.bankName ? 'border-red-300 bg-red-50' : 
                      highlightedFields.includes('bankName') ? 'border-yellow-300 bg-yellow-50' : 
                      'border-gray-300'
                    }`}
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>
                  )}
                </div>
              </div>
              
              {/* Bank Branch (BR only) */}
              {country === 'BR' && (
                <div className="sm:col-span-3">
                  <label htmlFor="bankBranch" className="block text-sm font-medium text-gray-700">
                    Bank Branch
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="bankBranch"
                      id="bankBranch"
                      value={formData.bankBranch}
                      onChange={handleInputChange}
                      className={`block w-full h-10 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                        errors.bankBranch ? 'border-red-300 bg-red-50' : 
                        highlightedFields.includes('bankBranch') ? 'border-yellow-300 bg-yellow-50' : 
                        'border-gray-300'
                      }`}
                    />
                    {errors.bankBranch && (
                      <p className="mt-1 text-xs text-red-600">{errors.bankBranch}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="sm:col-span-6">
                <label htmlFor="bankStatement" className="block text-sm font-medium text-gray-700">
                  Bank Statement
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Please upload a recent bank statement that shows your account details
                </p>
                <div className="mt-1">
                  <div className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    errors.bankStatement ? 'border-red-300 bg-red-50' : 
                    highlightedFields.includes('bankStatement') ? 'border-yellow-300 bg-yellow-50' :
                    previews.bankStatement ? 'border-green-300 bg-green-50' : 'border-gray-300'
                  }`}>
                    <div className="space-y-1 text-center">
                      {previews.bankStatement ? (
                        <div className="flex flex-col items-center">
                          {previews.bankStatement.startsWith('data:image') ? (
                            <img 
                              src={previews.bankStatement} 
                              alt="Statement preview" 
                              className="h-32 object-contain mb-2"
                            />
                          ) : (
                            <FileCheck className="h-12 w-12 text-green-500 mb-2" />
                          )}
                          <p className="text-sm text-gray-700">{files.bankStatement?.name || "Statement uploaded"}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFiles(prev => ({ ...prev, bankStatement: null }));
                              setPreviews(prev => ({ ...prev, bankStatement: '' }));
                            }}
                            className="mt-2 text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="bankStatement"
                              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="bankStatement"
                                name="bankStatement"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif,application/pdf"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">JPEG, PNG, GIF, PDF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.bankStatement && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankStatement}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Settings Section */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
              Payment Settings
            </h2>
            <p className="text-sm text-gray-500 mb-4">Configure your payment processing settings and methods.</p>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Payment Receipt Time */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Receipt Time
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Set the time for receiving your payment proceeds. Shorter receipt times have higher processing fees.
                </p>
                
                <div className="mt-1 space-y-4">
                  {/* 14 Days */}
                  <div 
                    className={`flex items-center p-4 rounded-md cursor-pointer ${
                      formData.receiptTime === '14' ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, receiptTime: '14' }))}
                  >
                    <input
                      id="receiptTime-14"
                      name="receiptTime"
                      type="radio"
                      checked={formData.receiptTime === '14'}
                      onChange={() => setFormData(prev => ({ ...prev, receiptTime: '14' }))}
                      className="h-4 w-4 accent-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label 
                      htmlFor="receiptTime-14" 
                      className="ml-3 block w-full text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      14 days ({getProcessingFeeDisplay('14')})
                    </label>
                  </div>

                  {/* 5 Days */}
                  <div 
                    className={`flex items-center p-4 rounded-md cursor-pointer ${
                      formData.receiptTime === '5' ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, receiptTime: '5' }))}
                  >
                    <input
                      id="receiptTime-5"
                      name="receiptTime"
                      type="radio"
                      checked={formData.receiptTime === '5'}
                      onChange={() => setFormData(prev => ({ ...prev, receiptTime: '5' }))}
                      className="h-4 w-4 accent-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label 
                      htmlFor="receiptTime-5" 
                      className="ml-3 block w-full text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      5 days ({getProcessingFeeDisplay('5')})
                    </label>
                  </div>
                </div>
                {errors.receiptTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.receiptTime}</p>
                )}
              </div>
              
              {/* Payment Methods */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Methods
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Activate the payment methods you want to accept from customers.
                </p>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Credit Card */}
                  <div className={`rounded-lg border p-4 flex items-start ${
                    formData.paymentMethods.includes('creditCard') ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex h-6 items-center">
                      <input
                        id="creditCard"
                        name="creditCard"
                        type="checkbox"
                        checked={formData.paymentMethods.includes('creditCard')}
                        onChange={() => handlePaymentMethodToggle('creditCard')}
                        className="h-4 w-4 rounded accent-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="creditCard" className="font-medium text-gray-700 cursor-pointer">Credit Card</label>
                      <p className="text-gray-500">Accept payments via Visa, Mastercard, Amex, etc.</p>
                    </div>
                  </div>
                  
                  {/* PayPal */}
                  <div className={`rounded-lg border p-4 flex items-start ${
                    formData.paymentMethods.includes('paypal') ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex h-6 items-center">
                      <input
                        id="paypal"
                        name="paypal"
                        type="checkbox"
                        checked={formData.paymentMethods.includes('paypal')}
                        onChange={() => handlePaymentMethodToggle('paypal')}
                        className="h-4 w-4 rounded accent-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="paypal" className="font-medium text-gray-700 cursor-pointer">PayPal</label>
                      <p className="text-gray-500">Accept payments from PayPal accounts.</p>
                    </div>
                  </div>
                  
                  {/* Digital Wallets */}
                  <div className={`rounded-lg border p-4 flex items-start ${
                    formData.paymentMethods.includes('wallets') ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex h-6 items-center">
                      <input
                        id="wallets"
                        name="wallets"
                        type="checkbox"
                        checked={formData.paymentMethods.includes('wallets')}
                        onChange={() => handlePaymentMethodToggle('wallets')}
                        className="h-4 w-4 rounded accent-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="wallets" className="font-medium text-gray-700 cursor-pointer">Digital Wallets</label>
                      <p className="text-gray-500">Accept Apple Pay, Google Pay, etc.</p>
                    </div>
                  </div>
                  
                  {/* PIX (BR only) */}
                  <div className={`rounded-lg border p-4 flex items-start ${
                    formData.paymentMethods.includes('pix') ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex h-6 items-center">
                      <input
                        id="pix"
                        name="pix"
                        type="checkbox"
                        checked={formData.paymentMethods.includes('pix')}
                        onChange={() => handlePaymentMethodToggle('pix')}
                        className="h-4 w-4 rounded accent-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="pix" className="font-medium text-gray-700 cursor-pointer">PIX</label>
                      <p className="text-gray-500">
                        Accept instant payments via Brazilian PIX system.
                        {country !== 'BR' && " (Only available for Brazilian merchants)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-5">
            <div className="flex justify-end">
              <Link
                href="/merchant"
                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Documents'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Selfie Info Modal */}
      <IDPositionInfo 
        isOpen={showSelfieInfo}
        onClose={() => setShowSelfieInfo(false)}
      />
    </div>
  );
}