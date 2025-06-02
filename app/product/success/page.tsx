// app/product/success/page.tsx
'use client';

import { Suspense } from 'react';
import SuccessPageComponent from './SuccessPageComponent';

const LoadingFallback = () => (
  <>
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
    `}</style>
    
    <div className="redirect-container">
      <div className="redirect-card">
        <div className="redirect-spinner"></div>
        <div className="redirect-text">Loading success page...</div>
      </div>
    </div>
  </>
);

const SuccessPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageComponent />
    </Suspense>
  );
};

export default SuccessPage;
