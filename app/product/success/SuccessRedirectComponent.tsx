// app/product/success/SuccessRedirectComponent.tsx
'use client'; // This is where the client-side hooks and logic live

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SuccessRedirectComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId');

  useEffect(() => {
    // Redirect to the payment result page with the transactionId
    // The payment result page will fetch the actual status based on this ID
    // Add a small timeout to ensure the component renders before redirecting
    const timer = setTimeout(() => {
        router.replace(`/product/payment?transactionId=${transactionId || ''}`);
    }, 50); // A small delay (e.g., 50ms) improves UX

    return () => clearTimeout(timer); // Clean up the timer
  }, [router, transactionId]); // Depend on router and transactionId

  // Return the minimal loading/redirecting state while the redirect happens
  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .redirect-container {
          min-height: 100vh;
          background-color: #f6f9fc; /* light gray-blue */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        
        .redirect-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 40px;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        
        .redirect-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #10b981; /* green-500 */
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        .redirect-text {
          color: #32325d; /* dark purple-blue */
          font-size: 16px;
          font-weight: 500;
        }
        
        .redirect-icon {
          width: 48px;
          height: 48px;
          background: #10b981; /* green-500 */
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
      `}</style>
      
      <div className="redirect-container">
        <div className="redirect-card">
          <div className="redirect-icon">
             {/* Assuming Font Awesome is available - adjust if using a different icon library */}
            <i className="fas fa-check" style={{color: 'white', fontSize: '20px'}}></i>
          </div>
          {/* Keep the spinner as a visual indicator */}
          <div className="redirect-spinner"></div>
          <div className="redirect-text">Redirecting to payment summary...</div>
        </div>
      </div>
    </>
  );
};

export default SuccessRedirectComponent;