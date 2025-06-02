// app/product/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProductBySlug } from '../../../productlib/api';
import ProductDisplay from '../../../productcomponents/ProductDisplay';
import { IProduct } from '../../../productlib/types';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const slug = params?.slug as string;
        
        if (!slug) {
          setError('Product not found');
          setLoading(false);
          return;
        }

        const fetchedProduct = await getProductBySlug(slug);
        
        if (!fetchedProduct) {
          setError('Product not found');
        } else {
          setProduct(fetchedProduct);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params]);

  if (loading) {
    return (
      <>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-container {
            min-height: 100vh;
            background-color: #f6f9fc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }
          
          .loading-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #635bff;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          .loading-text {
            color: #32325d;
            font-size: 16px;
            font-weight: 500;
          }
        `}</style>
        
        <div className="loading-container">
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading product...</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style jsx>{`
          .error-container {
            min-height: 100vh;
            background-color: #f6f9fc;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }
          
          .error-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 500px;
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
          
          .error-title {
            font-size: 24px;
            font-weight: 600;
            color: #32325d;
            margin-bottom: 12px;
          }
          
          .error-message {
            color: #6b7c93;
            font-size: 16px;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          
          .error-button {
            display: inline-block;
            width: 100%;
            padding: 14px 20px;
            background: #0073E6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.15s;
            text-decoration: none;
            text-align: center;
          }
          
          .error-button:hover {
            background: #0066CC;
          }
        `}</style>
        
        <div className="error-container">
          <div className="error-card">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle" style={{color: 'white', fontSize: '24px'}}></i>
            </div>
            
            <h1 className="error-title">
              {error || 'Product Not Found'}
            </h1>
            <p className="error-message">
              We couldn't find the product you're looking for. It may have been removed or is temporarily unavailable.
            </p>
            
            <a href="/" className="error-button">
              Return to Homepage
            </a>
          </div>
        </div>
      </>
    );
  }

  return <ProductDisplay product={product} />;
}