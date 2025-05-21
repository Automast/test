'use client';

// app/product/[slug]/page.tsx
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
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Product Not Found'}
          </h1>
          <p className="text-gray-600 mb-8">
            We couldn't find the product you're looking for.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Return to Homepage
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <ProductDisplay product={product} />
    </main>
  );
}