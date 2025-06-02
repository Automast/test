'use client';

import { DashLayout } from '@/components/layouts';
import { BinaryIcon, MoreHorizontal, TagIcon, Eye, Edit, Copy, Trash2, Package } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { Pagination } from '@/components/widgets';
import { ITEMS_PER_PAGE } from '@/consts/vars';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { AddProductModal, ProductViewModal } from '@/components/ui';
import Toaster from '@/helpers/Toaster';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  title: string;
  shortDescription?: string;
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

const ProductsPage = () => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Deactivated'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productType, setProductType] = useState<'Physical' | 'Digital'>('Digital');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const loadProducts = useCallback(async () => {
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
  }, [statusFilter, currentPage, router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshKey]);

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
    setProductType(product.type === 'physical' ? 'Physical' : 'Digital');
    setEditModal(true);
  };

  const handleAddProduct = (type: 'Physical' | 'Digital') => {
    setProductType(type);
    setSelectedProduct(null);
    setAddModal(true);
  };

  const handleModalClose = () => {
    setAddModal(false);
    setEditModal(false);
    setViewModal(false);
    setSelectedProduct(null);
    setRefreshKey(prev => prev + 1); // Force refresh products
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
        setRefreshKey(prev => prev + 1);
      } else {
        Toaster.error(result.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      Toaster.error('Error deleting product');
    }
  };

  const handleCopyLink = (product: Product) => {
    const base = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || window.location.origin;
    const url = `${base}/product/${product.slug ?? product._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => Toaster.success('Product link copied'))
      .catch(() => Toaster.error('Failed to copy link'));
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const newStatus = product.status === 'active' ? 'deactivated' : 'active';
      
      const response = await fetch(`${baseUrl}/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        Toaster.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        setRefreshKey(prev => prev + 1);
      } else {
        Toaster.error(result.message || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      Toaster.error('Error updating product status');
    }
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
              All ({pagination.total})
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
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white ring-1 ring-gray-300 focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                      onClick={() => handleAddProduct('Physical')}
                    >
                      <Package className="w-4 h-4" />
                      Physical
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } text-gray-700 w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                      onClick={() => handleAddProduct('Digital')}
                    >
                      <BinaryIcon className="w-4 h-4" />
                      Digital
                    </button>
                  )}
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
                  Stock
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
                  <td colSpan={8} className="text-center p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3">Loading products...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-6">
                    <div className="text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No products found. Create your first product!</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                products.map((product) => {
                  const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
                  const imageUrl = mainImage ? formatImageUrl(mainImage.url) : '/api/placeholder/50/50';
                  const hasStock = product.type === 'physical' && product.physical?.stock !== undefined;
                  const stockLevel = hasStock ? product.physical.stock : null;
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={imageUrl}
                          alt={product.title}
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
                            {product.title}
                          </div>
                          {product.shortDescription && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.shortDescription}
                            </div>
                          )}
                          {product.sku && (
                            <div className="text-xs text-gray-400">
                              SKU: {product.sku}
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
                        {hasStock ? (
                          <span className={`font-medium ${stockLevel === 0 ? 'text-red-600' : stockLevel < 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                            {stockLevel}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleView(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(product)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Menu as="div" className="relative inline-block text-left">
                            <MenuButton className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50">
                              <MoreHorizontal className="w-4 h-4" />
                            </MenuButton>
                            <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <MenuItem>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleToggleStatus(product)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } text-gray-700 block w-full px-4 py-2 text-sm text-left`}
                                    >
                                      {product.status === 'active' ? 'Deactivate' : 'Activate'} Product
                                    </button>
                                  )}
                                </MenuItem>
                                <MenuItem>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDelete(product)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } text-red-600 block w-full px-4 py-2 text-sm text-left`}
                                    >
                                      Delete Product
                                    </button>
                                  )}
                                </MenuItem>
                              </div>
                            </MenuItems>
                          </Menu>
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
      {(addModal || editModal) && (
        <AddProductModal 
          key={`modal-${selectedProduct?._id || 'new'}-${productType}`}
          open={addModal || editModal} 
          onClose={handleModalClose} 
          type={productType}
          product={editModal ? selectedProduct : undefined}
        />
      )}
      
      {viewModal && selectedProduct && (
        <ProductViewModal
          open={viewModal}
          onClose={handleModalClose}
          product={selectedProduct}
          onEdit={(product) => {
            setViewModal(false);
            setSelectedProduct(product);
            setProductType(product.type === 'physical' ? 'Physical' : 'Digital');
            setEditModal(true);
          }}
        />
      )}
    </DashLayout>
  );
};

export default ProductsPage;