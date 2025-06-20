// app/product/payment/PaymentResultComponent.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '../../../productlib/utils'; // Ensure this path is correct

// Define the Transaction interface based on your updated structure
interface Transaction {
  _id: string;
  transactionId: string;
  status: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  saleCurrency: string;
  buyerEmail: string;
  billingName: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string;
  items?: any[];
  metadata?: {
    vat_amount?: number;
    vat_rate?: number;
    vat_country?: string;
    vat_state?: string;
  };
}

const PaymentResultComponent = () => {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true); // This loading state is for data fetching *within* the component
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionStatus = async () => {
    if (!transactionId) {
      setError('No transaction ID provided in the URL.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);
      
      const apiUrl = `${baseUrl.replace(/\/api$/, '')}/api/finance/transactions/by-tx-id/${transactionId}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTransaction(data.data);
          setError(null); // Clear any previous error
        } else {
          // Handle cases where the API returns success: false or data is null
          setError(data.message || 'Transaction not found.');
        }
      } else if (response.status === 404) {
        setError('Transaction not found.');
      } else {
        // Handle other HTTP errors
        setError(`Failed to fetch transaction status: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionStatus();
    
    // Poll for status updates every 3 seconds for pending transactions
    const interval = setInterval(() => {
      // Only poll if transaction exists and is pending
      if (transaction?.status === 'pending') {
         fetchTransactionStatus();
      } else if (transaction?.status && transaction?.status !== 'pending') {
         // If status is no longer pending, clear the interval
         clearInterval(interval);
      }
      // If transaction is null (e.g., initial load or error), polling won't start/continue
    }, 3000);

    // Cleanup interval on component unmount or when transaction status changes
    return () => clearInterval(interval);
  }, [transactionId, transaction?.status]); // Add transaction?.status to dependencies

  // Define UI elements based on status
  const getStatusContent = (status: string) => {
    switch (status) {
      case 'successful':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#10b981', // green-500
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              {/* Font Awesome check icon */}
              <i className="fas fa-check" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment successful',
          message: 'Thank you for your purchase! Your order has been confirmed and you should receive an email receipt shortly.',
          bgColor: '#f0fdf4', // green-50
          borderColor: '#bbf7d0', // green-200
          textColor: '#16a34a' // green-600
        };
      case 'pending':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#f59e0b', // amber-500
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
               {/* Font Awesome clock icon */}
              <i className="fas fa-clock" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment pending',
          message: 'Your payment is being processed. We\'ll send you a confirmation email once the payment is complete.',
          bgColor: '#fffbeb', // amber-50
          borderColor: '#fde68a', // amber-200
          textColor: '#d97706' // amber-600
        };
      case 'canceled':
      case 'cancelled': // Support both spellings
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#ef4444', // red-500
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
               {/* Font Awesome times icon */}
              <i className="fas fa-times" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment canceled',
          message: 'Your payment was canceled. If this was a mistake, you can try again or contact our support team for assistance.',
          bgColor: '#fef2f2', // red-50
          borderColor: '#fecaca', // red-200
          textColor: '#dc2626' // red-600
        };
      case 'failed':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#ef4444', // red-500
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              {/* Font Awesome exclamation triangle icon */}
              <i className="fas fa-exclamation-triangle" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment failed',
          message: 'Your payment could not be processed. Please try again or use a different payment method.',
          bgColor: '#fef2f2', // red-50
          borderColor: '#fecaca', // red-200
          textColor: '#dc2626' // red-600
        };
      default: // For any other unexpected status
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#6b7280', // gray-500
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
               {/* Font Awesome question icon */}
              <i className="fas fa-question" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Unknown status',
          message: 'We\'re checking your payment status. Please wait a moment or contact support if it doesn\'t update.',
          bgColor: '#f9fafb', // gray-50
          borderColor: '#d1d5db', // gray-200
          textColor: '#6b7280' // gray-500
        };
    }
  };

  // This loading state is specifically for the data fetching after the component
  // has been rendered by Suspense.
  if (loading) {
    return (
      <>
        {/* Styles for the loading state *within* the component */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .container {
            min-height: 100vh;
            background-color: #f6f9fc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }
          
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #635bff;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #32325d;
            margin-bottom: 12px;
          }
          
          .message {
            color: #6b7c93;
            font-size: 14px;
          }
        `}</style>
        
        <div className="container">
          <div className="card">
            <div className="spinner"></div>
            <h1 className="title">Checking payment status...</h1>
            <p className="message">Please wait while we verify your payment.</p>
          </div>
        </div>
      </>
    );
  }

  // This error state handles fetching errors or transaction not found after the component loads
  if (error || !transaction) {
    return (
      <>
         {/* Styles for the error state *within* the component */}
         <style jsx>{`
          .container {
            min-height: 100vh;
            background-color: #f6f9fc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }
          
          .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          
          .error-icon {
            width: 64px;
            height: 64px;
            background: #ef4444; /* red-500 */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #32325d;
            margin-bottom: 12px;
          }
          
          .message {
            color: #6b7c93;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          
          .button {
            width: 100%;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.15s;
            border: none;
            margin-bottom: 12px;
          }
          
          .button-primary {
            background: #0073E6; /* Example primary color */
            color: white;
          }
          
          .button-primary:hover {
            background: #0066CC; /* Darker shade on hover */
          }
          
          .button-secondary {
            background: #f8f9fa; /* Light gray */
            color: #32325d; /* Dark gray text */
            border: 1px solid #e6ebf1; /* Light border */
          }
          
          .button-secondary:hover {
            background: #f1f3f4; /* Slightly darker gray on hover */
          }
        `}</style>
        
        <div className="container">
          <div className="card">
            <div className="error-icon">
               {/* Font Awesome exclamation triangle icon */}
              <i className="fas fa-exclamation-triangle" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
            <h1 className="title">Error</h1>
            <p className="message">
              {error || 'An unexpected error occurred.'}
            </p>
            <Link href="/" className="button button-primary" style={{display: 'block', textDecoration: 'none'}}>
              Return to Homepage
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="button button-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </>
    );
  }

  // If not loading and no error, display the transaction result
  const statusContent = getStatusContent(transaction.status);

   // Calculate VAT and other amounts for display if not directly provided
   const vatAmount = transaction.metadata?.vat_amount || 0;
   const vatRate = transaction.metadata?.vat_rate || 0;
   const shipping = transaction.shippingFee || 0;
   // If subtotal is not provided, calculate it by subtracting VAT and shipping from total
   const subtotal = transaction.subtotal ?? (transaction.total - vatAmount - shipping);


  return (
    <>
      {/* Styles for the main transaction result view */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .container {
          min-height: 100vh;
          background-color: #f6f9fc; /* light gray-blue */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #32325d; /* dark purple-blue */
          margin-bottom: 12px;
        }
        
        .message {
          color: #6b7c93; /* medium gray-blue */
          font-size: 16px;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        
        .pending-status {
          margin-bottom: 24px;
          padding: 12px;
          background: #eff6ff; /* blue-50 */
          border: 1px solid #bfdbfe; /* blue-200 */
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #1d4ed8; /* blue-700 */
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #1d4ed8; /* blue-700 */
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .details-card {
          border: 1px solid #e6ebf1; /* light gray */
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }
        
        .details-title {
          font-size: 14px;
          font-weight: 600;
          color: #32325d; /* dark purple-blue */
          margin-bottom: 16px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          color: #6b7c93; /* medium gray-blue */
          display: flex; /* Added for icon alignment */
          align-items: center;
          gap: 8px; /* Space between icon and text */
        }
        
        .detail-value {
          color: #32325d; /* dark purple-blue */
          font-weight: 500;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }
        
        .status-badge {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .status-successful {
          background: #dcfce7; /* green-100 */
          color: #16a34a; /* green-600 */
        }
        
        .status-pending {
          background: #fef3c7; /* amber-100 */
          color: #d97706; /* amber-700 */
        }
        
        .status-failed, .status-canceled {
          background: #fee2e2; /* red-100 */
          color: #dc2626; /* red-600 */
        }

        .total-row {
          border-top: 1px solid #e6ebf1; /* light gray */
          padding-top: 12px;
          margin-top: 12px;
          font-weight: 600;
          font-size: 16px;
          color: #32325d; /* dark purple-blue */
        }

        .vat-row {
          color: #6b7c93; /* medium gray-blue */
        }

        .vat-icon {
          margin-right: 4px;
          font-size: 12px;
        }

        .button {
          width: 100%;
          padding: 14px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
          border: none;
          margin-bottom: 12px;
          text-decoration: none; /* For Link component */
          display: block; /* For Link component */
          text-align: center; /* For Link component */
        }
        
        .button-primary {
          background: #0073E6; /* Example primary color */
          color: white;
        }
        
        .button-primary:hover {
          background: #0066CC; /* Darker shade on hover */
        }
        
        .button-secondary {
          background: #f8f9fa; /* Light gray */
          color: #32325d; /* Dark gray text */
          border: 1px solid #e6ebf1; /* Light border */
        }
        
        .button-secondary:hover {
          background: #f1f3f4; /* Slightly darker gray on hover */
        }
        
        .help-text {
          margin-top: 24px;
          font-size: 14px;
          color: #6b7c93; /* medium gray-blue */
        }
        
        .help-link {
          color: #0073E6; /* Example primary color */
          text-decoration: none;
        }
        
        .help-link:hover {
          text-decoration: underline;
        }
      `}</style>
      
      <div className="container">
        <div className="card">
          {/* Status Icon */}
          {statusContent.icon}
          
          {/* Status Message */}
          <h1 className="title">{statusContent.title}</h1>
          <p className="message">{statusContent.message}</p>
          
          {/* Pending Status Auto-refresh */}
          {transaction.status === 'pending' && (
            <div className="pending-status">
              <div className="spinner-small"></div>
              <span>Auto-refreshing status...</span>
            </div>
          )}
          
          {/* Transaction Details */}
          <div className="details-card" style={{
            background: statusContent.bgColor,
            borderColor: statusContent.borderColor
          }}>
            <h2 className="details-title">Transaction details</h2>
            
            <div className="detail-row">
              <span className="detail-label">Transaction ID</span>
              <span className="detail-value">{transaction.transactionId}</span>
            </div>

            {/* Subtotal */}
            {subtotal > 0 && ( // Only show if subtotal is meaningful
              <div className="detail-row">
                <span className="detail-label">Subtotal</span>
                <span className="detail-value">
                  {new Intl.NumberFormat(undefined, { 
                    style: 'currency', 
                    currency: transaction.saleCurrency 
                  }).format(subtotal)}
                </span>
              </div>
            )}

            {/* VAT */}
            {vatAmount > 0 && (
              <div className="detail-row vat-row">
                <span className="detail-label">
                  <i className="fas fa-receipt vat-icon"></i> {/* Assuming Font Awesome is available */}
                  VAT {vatRate > 0 && `(${(vatRate * 100).toFixed(1)}%)`}
                  {transaction.metadata?.vat_country && (
                    <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                      - {transaction.metadata.vat_country}
                      {transaction.metadata.vat_state && `, ${transaction.metadata.vat_state}`}
                    </span>
                  )}
                </span>
                <span className="detail-value">
                  {new Intl.NumberFormat(undefined, { 
                    style: 'currency', 
                    currency: transaction.saleCurrency 
                  }).format(vatAmount)}
                </span>
              </div>
            )}

            {/* Shipping */}
            {shipping > 0 && ( // Only show if shipping is positive
              <div className="detail-row">
                <span className="detail-label">
                   <i className="fas fa-truck"></i> {/* Assuming Font Awesome is available */}
                   Shipping
                </span>
                <span className="detail-value">
                  {new Intl.NumberFormat(undefined, { 
                    style: 'currency', 
                    currency: transaction.saleCurrency 
                  }).format(shipping)}
                </span>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value" style={{textTransform: 'capitalize'}}>
                {transaction.paymentMethod}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">
                {formatDate(new Date(transaction.createdAt))}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className={`status-badge status-${transaction.status}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>

            {/* Total */}
            <div className="detail-row total-row">
              <span className="detail-label">Total</span>
              <span className="detail-value">
                {new Intl.NumberFormat(undefined, { 
                  style: 'currency', 
                  currency: transaction.saleCurrency 
                }).format(transaction.total)}
              </span>
            </div>
            
            {transaction.buyerEmail && (
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{transaction.buyerEmail}</span>
              </div>
            )}
            
            {transaction.billingName && (
              <div className="detail-row">
                <span className="detail-label">Customer</span>
                <span className="detail-value">{transaction.billingName}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div>
            <Link href="/" className="button button-primary">
              Continue shopping
            </Link>
            
            {transaction.status === 'successful' && (
              <button 
                onClick={() => window.print()}
                className="button button-secondary"
              >
                Print receipt
              </button>
            )}
            
            {(transaction.status === 'canceled' || transaction.status === 'failed') && (
              <button 
                onClick={() => window.history.back()}
                className="button button-secondary"
              >
                Try again
              </button>
            )}

            {transaction.status === 'pending' && (
              <button 
                onClick={fetchTransactionStatus}
                className="button button-secondary"
              >
                Refresh status
              </button>
            )}
          </div>
          
          {/* Help Text */}
          <div className="help-text">
            {transaction.status === 'successful' 
              ? 'Need help with your order? ' 
              : transaction.status === 'pending'
              ? 'Questions about your payment? '
              : 'Having trouble with your payment? '}
            <a href="mailto:support@example.com" className="help-link">
              Contact support
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentResultComponent;