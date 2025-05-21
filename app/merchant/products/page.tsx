'use client';

import { DashLayout } from '@/components/layouts';
import { BinaryIcon, MoreHorizontal, TagIcon, Eye, Edit, Copy, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/widgets';
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { AddProductModal, ProductViewModal } from '@/components/ui';
import Toaster from '@/helpers/Toaster';
import { useRouter } from 'next/navigation';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface Product {
  _id: string;
  title: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  defaultCurrency?: string;
  type: 'physical' | 'digital';
  status: 'active' | 'deactivated';
  sku?: string;
  barcode?: string;
  images?: Array<{
    url: string;
    isMain: boolean;
  }>;
  createdAt: string;
  updatedAt?: string;
  slug?: string;
  autoLocalPrice?: boolean;
  digital?: any;
  physical?: any;
  variants?: any[];
}

interface ProductsData {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

const ProductsPage = () => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Deactivated'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [type, setType] = useState<'Physical' | 'Digital' | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: ITEMS_PER_PAGE
  });

  const selectStatusFilter = (status: 'All' | 'Active' | 'Deactivated') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/signin');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (statusFilter !== 'All') {
        params.append('status', statusFilter.toLowerCase());
      }

      const response = await fetch(`${baseUrl}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        router.push('/signin');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProducts(result.data.products || []);
          setPagination({
            total: result.data.total || 0,
            page: result.data.page || 1,
            pages: result.data.pages || 1,
            limit: result.data.limit || ITEMS_PER_PAGE
          });
        } else {
          Toaster.error(result.message || 'Failed to load products');
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Toaster.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [statusFilter, currentPage]);

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/api/placeholder/100/100';
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

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewModal(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setType(product.type === 'physical' ? 'Physical' : 'Digital');
    setEditModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Are you sure you want to delete this product? This action can be undone by an admin.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${baseUrl}/products/${product._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        Toaster.success('Product deleted successfully');
        loadProducts();
      } else {
        Toaster.error(result.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      Toaster.error('Error deleting product');
    }
  };

  /** Copy full public product URL to clipboard */
  const handleCopyLink = (product: Product) => {
    const base =
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || window.location.origin; // set NEXT_PUBLIC_PUBLIC_SITE_URL in .env for production
    const url = `${base}/product/${product.slug ?? product._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => Toaster.success('Product link copied'))
      .catch(() => Toaster.error('Failed to copy link'));
  };

  return (
    <DashLayout
      titleArea={
        <>
          <h2 className="text-xl font-semibold">Products</h2>
        </>
      }
    >
      <div className="p-6 bg-white rounded-lg">
        <div className="flex items-center justify-between border-b border-b-gray-200 pb-2 mb-3">
          <div className="flex space-x-4 text-sm font-medium text-gray-900">
            <div
              className={`${
                statusFilter === 'All' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('All')}
            >
              All
            </div>
            <div
              className={`${
                statusFilter === 'Active' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Active')}
            >
              Active
            </div>
            <div
              className={`${
                statusFilter === 'Deactivated' ? 'text-blue-500' : 'cursor-pointer hover:text-gray-500'
              } transition-colors duration-200 ease-in-out`}
              onClick={() => selectStatusFilter('Deactivated')}
            >
              Deactivated
            </div>
          </div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <MenuButton className="flex items-center gap-2 hover:bg-blue-600 text-white px-3 py-1.5 text-sm rounded-sm cursor-pointer transition-colors duration-200 ease-in-out bg-blue-500">
                {'+ '}
                Add Product
              </MenuButton>
            </div>
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-300 focus:outline-none cursor-pointer">
              <div className="py-1">
                <MenuItem>
                  <button
                    className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer flex items-center justify-start gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setType('Physical');
                      setSelectedProduct(null);
                      setAddModal(true);
                    }}
                  >
                    <TagIcon className="w-4 h-4" />
                    Physical
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    className="hover:bg-gray-100 hover:text-black text-gray-700 w-full px-4 py-2 text-left text-sm cursor-pointer flex items-center justify-start gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setType('Digital');
                      setSelectedProduct(null);
                      setAddModal(true);
                    }}
                  >
                    <BinaryIcon className="w-4 h-4" />
                    Digital
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center p-6">
                    Loading products...
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-6">
                    No products found. Create your first product!
                  </td>
                </tr>
              )}
              {!loading &&
                products.map((product) => {
                  const mainImage = product.images?.find(img => img.isMain);
                  const imageUrl = mainImage ? formatImageUrl(mainImage.url) : '/api/placeholder/50/50';
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={imageUrl}
                          alt={product.title || 'Product'}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/50/50';
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.title || product.name}
                          </div>
                          {product.shortDescription && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.shortDescription}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.price, product.defaultCurrency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.type === 'physical' ? 'Physical' : 'Digital'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.status === 'active' ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          {/* View */}
                          <button
                            onClick={() => handleView(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Copy link — NEW */}
                          <button
                            onClick={() => handleCopyLink(product)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              totalLength={pagination.total}
              limit={pagination.limit}
              page={pagination.page}
              pageCount={pagination.pages}
              pageClick={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal 
        open={addModal || editModal} 
        onClose={() => {
          setAddModal(false);
          setEditModal(false);
          setSelectedProduct(null);
          loadProducts();
        }} 
        type={type || 'Digital'}
        product={editModal ? selectedProduct : undefined}
      />
      
      <ProductViewModal
        open={viewModal}
        onClose={() => {
          setViewModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onEdit={(product) => {
          setViewModal(false);
          setSelectedProduct(product);
          setType(product.type === 'physical' ? 'Physical' : 'Digital');
          setEditModal(true);
        }}
      />
    </DashLayout>
  );
};

export default ProductsPage;