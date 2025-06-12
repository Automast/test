// app/product/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProductBySlug } from '../../../productlib/api';
import ProductDisplay from '../../../productcomponents/ProductDisplay';
import { IProduct } from '../../../productlib/types';

// --- Skeleton Component ---
// This component renders a placeholder UI that mimics the final ProductDisplay layout.
// It's displayed while the product data is being fetched.
function ProductSkeleton() {
  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .skeleton-container {
          max-width: 1200px;
          margin: 40px auto;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        .skeleton-box {
          background-color: #e0e0e0;
          border-radius: 8px;
          background-image: linear-gradient(to right, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%);
          background-repeat: no-repeat;
          background-size: 2000px 100%;
          animation: shimmer 1.5s linear infinite;
        }
        .skeleton-image {
          width: 100%;
          height: 450px;
          border-radius: 12px;
        }
        .skeleton-details {
          display: flex;
          flex-direction: column;
        }
        .skeleton-title {
          width: 80%;
          height: 36px;
          margin-bottom: 16px;
        }
        .skeleton-price {
          width: 40%;
          height: 28px;
          margin-bottom: 24px;
        }
        .skeleton-description-line {
          width: 100%;
          height: 16px;
          margin-bottom: 12px;
        }
        .skeleton-description-line.short {
          width: 60%;
        }
        .skeleton-button {
          width: 100%;
          height: 48px;
          margin-top: auto; /* Pushes the button to the bottom */
        }

        /* Responsive layout for smaller screens */
        @media (max-width: 768px) {
          .skeleton-container {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .skeleton-image {
            height: 300px;
          }
        }
      `}</style>

      <div className="skeleton-container">
        {/* Left Column: Image Placeholder */}
        <div className="skeleton-image-wrapper">
          <div className="skeleton-box skeleton-image"></div>
        </div>
        
        {/* Right Column: Details Placeholder */}
        <div className="skeleton-details">
          <div className="skeleton-box skeleton-title"></div>
          <div className="skeleton-box skeleton-price"></div>
          
          <div className="skeleton-description">
            <div className="skeleton-box skeleton-description-line"></div>
            <div className="skeleton-box skeleton-description-line"></div>
            <div className="skeleton-box skeleton-description-line short"></div>
          </div>
          
          <div className="skeleton-box skeleton-button"></div>
        </div>
      </div>
    </>
  );
}


export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      // Keep loading as true initially
      setLoading(true);
      setError(null);
      setProduct(null);

      try {
        const slug = params?.slug as string;
        
        if (!slug) {
          setError('Product slug is missing.');
          setLoading(false); // Stop loading immediately on this type of error
          return;
        }

        const fetchedProduct = await getProductBySlug(slug);
        
        // This is the artificial delay. We wait 2 seconds AFTER fetching the data.
        // This ensures the skeleton animation is visible even on very fast connections.
        setTimeout(() => {
          if (!fetchedProduct) {
            setError('Product not found');
          } else {
            setProduct(fetchedProduct);
          }
          // We set loading to false only after the delay, for both success and 'not found' cases.
          setLoading(false);
        }, 2000); // 2000ms = 2 seconds

      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product details.');
        // If the API call itself fails, stop loading immediately.
        setLoading(false);
      }
      // NOTE: We remove the `finally` block because we now control `setLoading(false)`
      // inside a setTimeout for the successful fetch path.
    }

    if (params?.slug) {
        loadProduct();
    }
  }, [params]);

  // --- RENDER LOGIC ---

  // 1. Display the Skeleton Loader while loading is true
  if (loading) {
    return <ProductSkeleton />;
  }

  // 2. Display an error message if something went wrong or the product wasn't found
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
              {/* You might need to add Font Awesome for this icon to work, or use an SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
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

  // 3. Display the actual product content when data is successfully loaded
  return <ProductDisplay product={product} />;
}