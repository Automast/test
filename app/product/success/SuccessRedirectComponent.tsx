// app/product/success/SuccessRedirectComponent.tsx
'use client';

import { useEffect, useState } from 'react'; // Added useState to manage internal state/UI
import { useSearchParams, useRouter } from 'next/navigation';

const SuccessRedirectComponent = () => {
  const searchParams = useSearchParams(); // This hook requires a client environment
  const router = useRouter(); // This hook requires a client environment
  const transactionId = searchParams.get('transactionId');

  // Optional: Use a state to explicitly show the redirecting message *after* the component loads on the client
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client after hydration
    setIsClientLoaded(true); // Indicate client has loaded and hooks are available

    if (transactionId) {
       // Redirect to the payment result page with the transactionId
       // The payment result page will fetch the actual status based on this ID
       // Add a small timeout to ensure the component renders before redirecting
       const timer = setTimeout(() => {
           router.replace(`/product/payment?transactionId=${transactionId}`);
       }, 50); // A small delay (e.g., 50ms) improves UX

       return () => clearTimeout(timer); // Clean up the timer
    } else {
        // Handle case where transactionId is missing in the URL immediately on client load
         const errorTimer = setTimeout(() => {
             // Redirect to the payment page with an indication of error or missing ID
             // The PaymentResultComponent should handle the 'No transaction ID provided' logic
            router.replace(`/product/payment?error=no-transaction-id`);
         }, 50);
         return () => clearTimeout(errorTimer);
    }

  }, [router, transactionId]); // Depend on router and transactionId

  // Render the visual loading/redirecting state *within* this client component
  // This state is shown *after* the client component hydrates and before the redirect happens.
  // The initial fallback defined in page.tsx is shown before this component hydrates.
  return (
    <>
      {/* Keep styles here as they are part of this component's visual output */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .redirect-container {
          min-height: 100vh;
          background-color: #f6f9fc;
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
          border: 3px solid #10b981;
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        .redirect-text {
          color: #32325d;
          font-size: 16px;
          font-weight: 500;
        }
        
        .redirect-icon {
          width: 48px;
          height: 48px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
      `}</style>
      
      {/* Only show the detailed UI if client has loaded and transactionId is potentially available */}
      {isClientLoaded && (
          <div className="redirect-container">
            <div className="redirect-card">
              <div className="redirect-icon">
                <i className="fas fa-check" style={{color: 'white', fontSize: '20px'}}></i>
              </div>
              <div className="redirect-spinner"></div>
              {/* Show a message indicating the action */}
              <div className="redirect-text">
                 {transactionId ? 'Redirecting to payment summary...' : 'Processing...'}
              </div>
            </div>
          </div>
      )}
       {/* You could optionally render a different minimal state here if !isClientLoaded,
           but the Suspense fallback in page.tsx handles the initial state */}
    </>
  );
};

export default SuccessRedirectComponent;
