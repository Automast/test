// app/product/payment/page.tsx
'use client';

import { Suspense } from 'react';
import PaymentResultComponent from './PaymentResultComponent';

const LoadingFallback = () => (
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
        <h1 className="title">Loading payment page...</h1>
        <p className="message">Please wait while we load your payment information.</p>
      </div>
    </div>
  </>
);

const PaymentResultPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentResultComponent />
    </Suspense>
  );
};

export default PaymentResultPage;
