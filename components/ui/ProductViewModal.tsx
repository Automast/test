'use client';

import { X, Edit, Calendar, Package, Tag, Globe, DollarSign, FileText, Archive } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface Product {
  _id: string;
  title: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  longDescription?: string;
  price: number;
  defaultCurrency?: string;
  type: 'physical' | 'digital';
  status: 'active' | 'deactivated';
  sku?: string;
  barcode?: string;
  autoLocalPrice?: boolean;
  images?: Array<{
    url: string;
    isMain: boolean;
  }>;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
  digital?: {
    isRecurring?: boolean;
    fileUrl?: string;
    fileUpload?: string;
    recurring?: {
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

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product]);

  if (!mounted || !open || !product) return null;

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/api/placeholder/200/200';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:5000';
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/api/uploads/')) {
      return `${baseUrl}${imageUrl}`;
    }
    return `${baseUrl}/uploads/${imageUrl}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const locales = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-full max-h-[95vh] bg-white rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(product)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </button>
            <button
              onClick={onClose}
              className="rounded-full hover:bg-gray-100 transition p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div className="lg:col-span-1">
              {/* Images Gallery */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                {product.images && product.images.length > 0 ? (
                  <div className="space-y-3">
                    {/* Main Image */}
                    <div className="relative">
                      <img
                        src={formatImageUrl(product.images[selectedImageIndex].url)}
                        alt="Product image"
                        className="w-full h-80 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/400';
                        }}
                      />
                      {product.images[selectedImageIndex].isMain && (
                        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                    
                    {/* Thumbnail Images */}
                    {product.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {product.images.map((image, index) => (
                          <div 
                            key={index} 
                            className={`relative cursor-pointer rounded border-2 overflow-hidden ${
                              selectedImageIndex === index 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <img
                              src={formatImageUrl(image.url)}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-20 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/80/80';
                              }}
                            />
                            {image.isMain && selectedImageIndex !== index && (
                              <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No images</span>
                  </div>
                )}
              </div>

              {/* Basic Info Card */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Quick Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="capitalized">
                      {product.type === 'physical' ? 'Physical' : 'Digital'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Price:</span>
                    <span className="font-bold">
                      {formatCurrency(product.price, product.defaultCurrency)}
                    </span>
                  </div>
                  {product.sku && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                  )}
                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Barcode:</span>
                      <span>{product.barcode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Product Information */}
                <section>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Product Information
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <table className="w-full">
                      <tbody className="space-y-3">
                        <tr>
                          <td className="font-medium text-gray-900 w-1/3 py-2">ID:</td>
                          <td className="text-gray-700 py-2">{product._id}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-900 py-2">Name:</td>
                          <td className="text-gray-700 py-2">{product.title || product.name}</td>
                        </tr>
                        {product.shortDescription && (
                          <tr>
                            <td className="font-medium text-gray-900 py-2">Short Description:</td>
                            <td className="text-gray-700 py-2">{product.shortDescription}</td>
                          </tr>
                        )}
                        {(product.longDescription || product.description) && (
                          <tr>
                            <td className="font-medium text-gray-900 py-2 align-top">Long Description:</td>
                            <td className="text-gray-700 py-2">
                              <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ 
                                  __html: product.longDescription || product.description || ''
                                }}
                              />
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="font-medium text-gray-900 py-2">Default Currency:</td>
                          <td className="text-gray-700 py-2">{product.defaultCurrency || 'USD'}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-900 py-2">Auto-local Price:</td>
                          <td className="text-gray-700 py-2">
                            {product.autoLocalPrice !== false ? 'Yes' : 'No'}
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-900 py-2">Created:</td>
                          <td className="text-gray-700 py-2">{formatDate(product.createdAt)}</td>
                        </tr>
                        {product.updatedAt && (
                          <tr>
                            <td className="font-medium text-gray-900 py-2">Last Updated:</td>
                            <td className="text-gray-700 py-2">{formatDate(product.updatedAt)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Digital Product Details */}
                {product.type === 'digital' && product.digital && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Archive className="w-5 h-5 mr-2" />
                      Digital Product Details
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="font-medium text-gray-900 w-1/3 py-2">Recurring:</td>
                            <td className="text-gray-700 py-2">
                              {product.digital.isRecurring ? 'Yes' : 'No'}
                            </td>
                          </tr>
                          {product.digital.isRecurring && product.digital.recurring && (
                            <>
                              <tr>
                                <td className="font-medium text-gray-900 py-2">Interval:</td>
                                <td className="text-gray-700 py-2">
                                  {product.digital.recurring.interval}
                                </td>
                              </tr>
                              <tr>
                                <td className="font-medium text-gray-900 py-2">Trial:</td>
                                <td className="text-gray-700 py-2">
                                  {product.digital.recurring.hasTrial ? 'Yes' : 'No'}
                                </td>
                              </tr>
                              {product.digital.recurring.hasTrial && (
                                <tr>
                                  <td className="font-medium text-gray-900 py-2">Trial Days:</td>
                                  <td className="text-gray-700 py-2">
                                    {product.digital.recurring.trialDays || 0}
                                  </td>
                                </tr>
                              )}
                            </>
                          )}
                          {product.digital.fileUrl && (
                            <tr>
                              <td className="font-medium text-gray-900 py-2">File URL:</td>
                              <td className="text-gray-700 py-2">
                                <a
                                  href={product.digital.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View File
                                </a>
                              </td>
                            </tr>
                          )}
                          {product.digital.fileUpload && (
                            <tr>
                              <td className="font-medium text-gray-900 py-2">Uploaded File:</td>
                              <td className="text-gray-700 py-2">
                                {product.digital.fileUpload.split('/').pop()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Physical Product Details */}
                {product.type === 'physical' && product.physical && (
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2" />
                      Physical Product Details
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="font-medium text-gray-900 w-1/3 py-2">Has Stock:</td>
                            <td className="text-gray-700 py-2">
                              {product.physical.stock !== undefined ? 'Yes' : 'No'}
                            </td>
                          </tr>
                          {product.physical.stock !== undefined && (
                            <tr>
                              <td className="font-medium text-gray-900 py-2">Stock:</td>
                              <td className="text-gray-700 py-2">{product.physical.stock}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="font-medium text-gray-900 py-2">Has Variants:</td>
                            <td className="text-gray-700 py-2">
                              {product.variants && product.variants.length > 0 ? 'Yes' : 'No'}
                            </td>
                          </tr>
                          {product.variants && product.variants.length > 0 && (
                            <tr>
                              <td className="font-medium text-gray-900 py-2 align-top">Variants:</td>
                              <td className="text-gray-700 py-2">
                                <div className="space-y-2">
                                  {product.variants.map((variant, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border">
                                      <div className="font-medium">{variant.name}</div>
                                      <div className="text-sm text-gray-600">
                                        Values: {variant.values.join(', ')}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Stock: {variant.stock}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="font-medium text-gray-900 py-2 align-top">Shipping Methods:</td>
                            <td className="text-gray-700 py-2">
                              {product.physical.shippingMethods && product.physical.shippingMethods.length > 0 ? (
                                <div className="space-y-2">
                                  {product.physical.shippingMethods.map((method, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border">
                                      <div className="font-medium">{method.name}</div>
                                      <div className="text-sm text-gray-600">
                                        {formatCurrency(method.price, product.defaultCurrency)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                'No shipping methods defined'
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductViewModal;