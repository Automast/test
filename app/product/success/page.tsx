// app/product/success/page.tsx
'use client';

import { Suspense } from 'react';
import SuccessRedirectComponent from './SuccessRedirectComponent'; // Import the client component

// Define a minimal loading fallback for the Suspense boundary
const MinimalLoadingFallback = () => (
  <>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .minimal-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        color: #6b7c93;
      }
      
      .minimal-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #635bff;
        border-top: 3px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }
    `}</style>
    <div className="minimal-container">
      <div className="minimal-spinner"></div>
      <div>Loading...</div>
    </div>
  </>
);


// The main page component wraps the client component in Suspense
const SuccessPage = () => {
  return (
    // Wrap the client component (which uses client hooks) with Suspense
    // The fallback is shown during the initial server render/hydration
    <Suspense fallback={<MinimalLoadingFallback />}>
      <SuccessRedirectComponent />
    </Suspense>
  );
};

export default SuccessPage;