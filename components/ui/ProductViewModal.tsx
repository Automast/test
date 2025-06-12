'use client';

import { X, Edit, Copy, Calendar, Package, Tag, Globe, DollarSign, FileText, Archive } from 'lucide-react';
import Toaster from '@/helpers/Toaster';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

// Keep your existing Product interface - ensure it matches what the backend sends
interface Product {
  _id: string;
  title: string;
  name?: string; // Potentially legacy, title is primary
  shortDescription?: string;
  description?: string; // Potentially legacy, prefer short/long
  longDescription?: string;
  price: number;
  defaultCurrency?: string;
  type: 'physical' | 'digital';
  status: 'active' | 'deactivated';
  sku?: string;
  barcode?: string;
  autoLocalPrice?: boolean;
  quantityEnabled?: boolean; // Added for consistency
  images?: Array<{
    url: string;
    isMain: boolean;
  }>;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
  digital?: {
    // isRecurring?: boolean; // We will infer this from the 'recurring' object
    fileUrl?: string;
    fileUpload?: string;
    recurring?: { // This object's presence (and content) indicates it's recurring
      interval: string;
      hasTrial: boolean;
      trialDays?: number;
    };
  };
  physical?: {
    stock?: number;
    shippingMethods?: Array<{
      name: string;
      price: number;
      // Assuming minDays and maxDays might also be part of shipping method object
      minDays?: number; 
      maxDays?: number;
    }>;
  };
  variants?: Array<{
    name: string;
    values: string[];
    stock: number;
  }>;
}

interface ProductViewModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  open,
  onClose,
  product,
  onEdit
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset selected image when product changes or modal opens
  useEffect(() => {
    if (open && product) {
      const mainImageIdx = product.images?.findIndex(img => img.isMain) ?? 0;
      setSelectedImageIndex(mainImageIdx >= 0 ? mainImageIdx : 0);
    } else if (!open) {
      setSelectedImageIndex(0); // Reset when modal closes
    }
  }, [product, open]);

  if (!mounted || !open || !product) return null;

  const productUrl = 
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || window.location.origin
      : '') 
    + `/product/${product.slug || product._id}`; // Fallback to _id if slug is missing

  const formatImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '/api/placeholder/200/200'; // Default placeholder
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:5000';
    // Handle both /uploads/ and /api/uploads/, and just filenames
    if (imageUrl.startsWith('/api/uploads/')) return `${baseUrl}${imageUrl}`;
    if (imageUrl.startsWith('/uploads/')) return `${baseUrl}/api${imageUrl}`; // Add /api if missing
    return `${baseUrl}/api/uploads/${imageUrl.replace(/^\//, '')}`; // Prepend full path for just filename
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return 'N/A';
    const displayCurrency = currency || 'USD';
    const locales = displayCurrency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: displayCurrency
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Determine if the product is recurring based on the presence and content of product.digital.recurring
  const isProductRecurring = !!(product.digital && product.digital.recurring && product.digital.recurring.interval);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-full max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 truncate" title={product.title || product.name}>
              {product.title || product.name || 'Product Details'}
            </h2>
            <div className="flex items-center mt-1.5 space-x-1">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex items-center bg-gray-100 rounded border border-gray-200 overflow-hidden text-xs max-w-xs">
                <input 
                  type="text" 
                  readOnly 
                  value={productUrl} 
                  className="flex-1 px-2 py-0.5 text-gray-600 bg-transparent outline-none truncate"
                  title={productUrl}
                />
                <button 
                  onClick={() => 
                    navigator.clipboard
                      .writeText(productUrl)
                      .then(() => Toaster.success('Product link copied'))
                      .catch(() => Toaster.error('Failed to copy link'))
                  }
                  className="p-1.5 hover:bg-gray-200 border-l border-gray-200" 
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onEdit(product)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Images and Basic Info */}
            <div className="md:col-span-1 space-y-5">
              {/* Images Gallery */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-semibold text-gray-700 mb-3">Images</h3>
                {product.images && product.images.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="relative aspect-square">
                      <img
                        src={formatImageUrl(product.images[selectedImageIndex]?.url)}
                        alt="Product image"
                        className="w-full h-full object-cover rounded-md border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/300/300'; // Placeholder for main image
                        }}
                      />
                      {product.images[selectedImageIndex]?.isMain && (
                        <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-sm font-medium">
                          Main
                        </span>
                      )}
                    </div>
                    
                    {product.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {product.images.map((image, index) => (
                          <button
                            key={index} 
                            className={`relative aspect-square cursor-pointer rounded border-2 overflow-hidden focus:outline-none ${
                              selectedImageIndex === index 
                                ? 'border-blue-500 ring-1 ring-blue-500' 
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                            title={`View image ${index + 1}`}
                          >
                            <img
                              src={formatImageUrl(image.url)}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/80/80'; // Placeholder for thumbnails
                              }}
                            />
                            {image.isMain && selectedImageIndex !== index && (
                              <span className="absolute top-0.5 left-0.5 bg-blue-500 text-white text-[0.6rem] px-1 rounded-sm font-medium">
                                Main
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No images</span>
                  </div>
                )}
              </div>

              {/* Quick Info Card */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-base font-semibold text-gray-700 mb-3">Quick Info</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-gray-800 font-medium capitalize">
                      {product.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-gray-800 font-bold">
                      {formatCurrency(product.price, product.defaultCurrency)}
                    </span>
                  </div>
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <span className="text-gray-800 font-mono">{product.sku}</span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Barcode:</span>
                      <span className="text-gray-800 font-mono">{product.barcode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="md:col-span-2 space-y-5">
              <section className="bg-white border border-gray-200 rounded-lg">
                <h3 className="text-base font-semibold text-gray-700 p-4 border-b border-gray-200 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  Product Information
                </h3>
                <div className="p-4">
                  <dl className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">ID:</dt>
                      <dd className="col-span-2 text-gray-700 font-mono break-all">{product._id}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Name:</dt>
                      <dd className="col-span-2 text-gray-700 font-medium">{product.title || product.name}</dd>
                    </div>
                    {product.shortDescription && (
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Short Desc:</dt>
                        <dd className="col-span-2 text-gray-700">{product.shortDescription}</dd>
                      </div>
                    )}
                    
                     <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Currency:</dt>
                      <dd className="col-span-2 text-gray-700">{product.defaultCurrency || 'USD'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Auto Local Price:</dt>
                      <dd className="col-span-2 text-gray-700">{product.autoLocalPrice !== false ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Quantity Enabled:</dt>
                      <dd className="col-span-2 text-gray-700">{product.quantityEnabled !== false ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Created:</dt>
                      <dd className="col-span-2 text-gray-700">{formatDate(product.createdAt)}</dd>
                    </div>
                    {product.updatedAt && (
                       <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Updated:</dt>
                        <dd className="col-span-2 text-gray-700">{formatDate(product.updatedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </section>

              {product.type === 'digital' && (
                <section className="bg-white border border-gray-200 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-700 p-4 border-b border-gray-200 flex items-center">
                    <Archive className="w-4 h-4 mr-2 text-gray-400" />
                    Digital Product Details
                  </h3>
                  <div className="p-4">
                    <dl className="space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Recurring:</dt>
                        <dd className="col-span-2 text-gray-700">{isProductRecurring ? 'Yes' : 'No'}</dd>
                      </div>
                      {isProductRecurring && product.digital?.recurring && (
                        <>
                          <div className="grid grid-cols-3 gap-2">
                            <dt className="text-gray-500">Interval:</dt>
                            <dd className="col-span-2 text-gray-700 capitalize">{product.digital.recurring.interval}</dd>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <dt className="text-gray-500">Trial:</dt>
                            <dd className="col-span-2 text-gray-700">{product.digital.recurring.hasTrial ? 'Yes' : 'No'}</dd>
                          </div>
                          {product.digital.recurring.hasTrial && (
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Trial Days:</dt>
                              <dd className="col-span-2 text-gray-700">{product.digital.recurring.trialDays ?? 0}</dd>
                            </div>
                          )}
                        </>
                      )}
                      {product.digital?.fileUrl && (
                        <div className="grid grid-cols-3 gap-2">
                          <dt className="text-gray-500">File URL:</dt>
                          <dd className="col-span-2">
                            <a
                              href={product.digital.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              title={product.digital.fileUrl}
                            >
                              {product.digital.fileUrl.substring(0, 50) + (product.digital.fileUrl.length > 50 ? '...' : '')}
                            </a>
                          </dd>
                        </div>
                      )}
                      {product.digital?.fileUpload && (
                        <div className="grid grid-cols-3 gap-2">
                          <dt className="text-gray-500">Uploaded File:</dt>
                          <dd className="col-span-2 text-gray-700 truncate" title={product.digital.fileUpload}>
                            {product.digital.fileUpload.split('/').pop()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </section>
              )}

              {product.type === 'physical' && (
                <section className="bg-white border border-gray-200 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-700 p-4 border-b border-gray-200 flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-gray-400" />
                    Physical & Inventory
                  </h3>
                  <div className="p-4">
                    <dl className="space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Stock Managed:</dt>
                        <dd className="col-span-2 text-gray-700">{product.physical?.stock !== undefined ? 'Yes' : 'No'}</dd>
                      </div>
                      {product.physical?.stock !== undefined && (
                        <div className="grid grid-cols-3 gap-2">
                          <dt className="text-gray-500">Stock:</dt>
                          <dd className="col-span-2 text-gray-700">{product.physical.stock}</dd>
                        </div>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          <dt className="text-gray-500 pt-0.5">Variants:</dt>
                          <dd className="col-span-2 text-gray-700">
                            {product.variants.map((variant, index) => (
                              <div key={index} className={`py-1.5 ${index < product.variants!.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div className="font-medium">{variant.name}</div>
                                <div className="text-gray-600">Values: {variant.values.join(', ')}</div>
                                <div className="text-gray-600">Stock: {variant.stock}</div>
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                      {product.physical?.shippingMethods && product.physical.shippingMethods.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          <dt className="text-gray-500 pt-0.5">Shipping:</dt>
                          <dd className="col-span-2 text-gray-700">
                            {product.physical.shippingMethods.map((method, index) => (
                              <div key={index} className={`py-1.5 ${index < product.physical!.shippingMethods!.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <span className="font-medium">{method.name}:</span> {formatCurrency(method.price, product.defaultCurrency)}
                                {method.minDays && method.maxDays && ` (${method.minDays}-${method.maxDays} days)`}
                              </div>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductViewModal;