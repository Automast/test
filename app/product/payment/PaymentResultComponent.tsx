// app/product/payment/PaymentResultComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '../../../productlib/utils';

interface Transaction {
  _id: string;
  transactionId: string;
  status: string;
  total: number;
  saleCurrency: string;
  buyerEmail: string;
  billingName: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string;
  items?: any[];
}

const PaymentResultComponent = () => {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionStatus = async () => {
    if (!transactionId) {
      setError('No transaction ID provided');
      setLoading(false);
      return;
    }

    try {
      // Try to fetch by transactionId first
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                      (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : window.location.origin);
      
      const apiUrl = `${baseUrl.replace(/\/api$/, '')}/api/finance/transactions/by-tx-id/${transactionId}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTransaction(data.data);
          setError(null);
        } else {
          setError('Transaction not found');
        }
      } else if (response.status === 404) {
        setError('Transaction not found');
      } else {
        setError('Failed to fetch transaction status');
      }
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Failed to fetch transaction status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionStatus();
    
    // Poll for status updates every 3 seconds for pending transactions
    const interval = setInterval(() => {
      if (transaction?.status === 'pending') {
        fetchTransactionStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transactionId, transaction?.status]);

  // Define UI elements based on status
  const getStatusContent = (status: string) => {
    switch (status) {
      case 'successful':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <i className="fas fa-check" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment successful',
          message: 'Thank you for your purchase! Your order has been confirmed and you should receive an email receipt shortly.',
          bgColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          textColor: '#16a34a'
        };
      case 'pending':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <i className="fas fa-clock" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment pending',
          message: 'Your payment is being processed. We\'ll send you a confirmation email once the payment is complete.',
          bgColor: '#fffbeb',
          borderColor: '#fde68a',
          textColor: '#d97706'
        };
      case 'canceled':
      case 'cancelled':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <i className="fas fa-times" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment canceled',
          message: 'Your payment was canceled. If this was a mistake, you can try again or contact our support team for assistance.',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          textColor: '#dc2626'
        };
      case 'failed':
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Payment failed',
          message: 'Your payment could not be processed. Please try again or use a different payment method.',
          bgColor: '#fef2f2',
          borderColor: '#fecaca',
          textColor: '#dc2626'
        };
      default:
        return {
          icon: (
            <div style={{
              width: '64px',
              height: '64px',
              background: '#6b7280',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <i className="fas fa-question" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
          ),
          title: 'Unknown status',
          message: 'We\'re checking your payment status. Please wait a moment.',
          bgColor: '#f9fafb',
          borderColor: '#d1d5db',
          textColor: '#6b7280'
        };
    }
  };

  if (loading) {
    return (
      <>
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

  if (error || !transaction) {
    return (
      <>
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
            background: #ef4444;
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
            background: #0073E6;
            color: white;
          }
          
          .button-primary:hover {
            background: #0066CC;
          }
          
          .button-secondary {
            background: #f8f9fa;
            color: #32325d;
            border: 1px solid #e6ebf1;
          }
          
          .button-secondary:hover {
            background: #f1f3f4;
          }
        `}</style>
        
        <div className="container">
          <div className="card">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
            <h1 className="title">Transaction not found</h1>
            <p className="message">
              {error || 'We couldn\'t find the transaction you\'re looking for.'}
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

  const statusContent = getStatusContent(transaction.status);

  return (
    <>
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
          max-width: 500px;
          width: 100%;
        }
        
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #32325d;
          margin-bottom: 12px;
        }
        
        .message {
          color: #6b7c93;
          font-size: 16px;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        
        .pending-status {
          margin-bottom: 24px;
          padding: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #1d4ed8;
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #1d4ed8;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .details-card {
          border: 1px solid #e6ebf1;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }
        
        .details-title {
          font-size: 14px;
          font-weight: 600;
          color: #32325d;
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
          color: #6b7c93;
        }
        
        .detail-value {
          color: #32325d;
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
          background: #dcfce7;
          color: #16a34a;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #d97706;
        }
        
        .status-failed, .status-canceled {
          background: #fee2e2;
          color: #dc2626;
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
          text-decoration: none;
          display: block;
          text-align: center;
        }
        
        .button-primary {
          background: #0073E6;
          color: white;
        }
        
        .button-primary:hover {
          background: #0066CC;
        }
        
        .button-secondary {
          background: #f8f9fa;
          color: #32325d;
          border: 1px solid #e6ebf1;
        }
        
        .button-secondary:hover {
          background: #f1f3f4;
        }
        
        .help-text {
          margin-top: 24px;
          font-size: 14px;
          color: #6b7c93;
        }
        
        .help-link {
          color: #0073E6;
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
            
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value">
                {new Intl.NumberFormat(undefined, { 
                  style: 'currency', 
                  currency: transaction.saleCurrency 
                }).format(transaction.total)}
              </span>
            </div>
            
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
