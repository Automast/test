'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, Link, Plus, Trash2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Image from 'next/image';
import Toaster from '@/helpers/Toaster';

// Helper to format image URLs for display (Defined outside the component)
const formatImageUrl = (imageUrl?: string) => {
  if (!imageUrl) {
    return ''; // Return an empty string if the URL is not available
  }
  // If the URL is already absolute (http, https) or a blob URL, return it directly
  if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  // Otherwise, construct the full URL from the backend base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:5000';
  
  // Handle different possible relative path formats
  if (imageUrl.startsWith('/api/uploads/')) {
    return `${baseUrl}${imageUrl}`;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}/api${imageUrl}`; // Add /api if it's missing
  }
  // Prepend the full path if only a filename is stored
  return `${baseUrl}/api/uploads/${imageUrl.replace(/^\//, '')}`;
};

interface ShippingMethod {
  name: string;
  price: string;
  minDays: string;
  maxDays: string;

}

interface Variant {
  name: string;
  values: string[];
  stock: string;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  type: 'Physical' | 'Digital';
  product?: any;
}

export const AddProductModal = ({ open, onClose, type, product }: AddProductModalProps) => {
  const isEditMode = !!product;
  
  // Basic fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState<'active' | 'deactivated'>('active');
  
  // Images
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [removedImageIndices, setRemovedImageIndices] = useState<number[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  // Physical product fields
  const [manageStock, setManageStock] = useState(false);
  const [stock, setStock] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { name: '', price: '', minDays: '', maxDays: '' }
  ]);
  
  // Digital product fields
  const [fileMethod, setFileMethod] = useState<'url' | 'upload'>('url');
  const [fileUrl, setFileUrl] = useState('');
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [hasTrial, setHasTrial] = useState(false);
  const [trialDays, setTrialDays] = useState('');
  const [quantityEnabled, setQuantityEnabled] = useState(true); // New state, default true
  
  const [loading, setLoading] = useState(false);

  // Get all visible images for preview
  const getAllVisibleImages = () => {
    const visibleExisting = existingImages.filter((_, index) => !removedImageIndices.includes(index));
    const newImages = images.map(img => ({ url: URL.createObjectURL(img), isNew: true }));
    return [...visibleExisting, ...newImages];
  };

  const visibleImages = getAllVisibleImages();

  // Initialize form with product data in edit mode
  // Initialize form with product data in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      // Basic Info
      setTitle(product.title || '');
      setShortDescription(product.shortDescription || '');
      setPrice(product.price?.toString() || '');
      setCurrency(product.defaultCurrency || 'USD');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setStatus(product.status || 'active');
      setQuantityEnabled(product.quantityEnabled !== undefined ? product.quantityEnabled : true);

      // Images
      if (product.images && Array.isArray(product.images)) {
        setExistingImages(product.images);
        const mainIdx = product.images.findIndex((img: any) => img.isMain);
        setMainImageIndex(mainIdx >= 0 ? mainIdx : 0);
        setCurrentPreviewIndex(mainIdx >= 0 ? mainIdx : 0); // Also set preview to main
      } else {
        setExistingImages([]);
        setMainImageIndex(0);
        setCurrentPreviewIndex(0);
      }
      setImages([]); // Clear any previously selected new files
      setRemovedImageIndices([]); // Clear removed image indices

      // Type specific data
      if (type === 'Physical') {
        if (product.physical) {
          setManageStock(product.physical.stock !== undefined && product.physical.stock !== null);
          setStock(product.physical.stock?.toString() || '');
          if (product.physical.shippingMethods && product.physical.shippingMethods.length > 0) {
            setShippingMethods(product.physical.shippingMethods.map((method: any) => ({
              name: method.name || '',
              price: method.price?.toString() || '',
              minDays: method.minDays?.toString() || '',
              maxDays: method.maxDays?.toString() || ''
            })));
          } else {
            setShippingMethods([{ name: '', price: '', minDays: '', maxDays: '' }]);
          }
        } else {
          // Defaults if product.physical is undefined
          setManageStock(false);
          setStock('');
          setShippingMethods([{ name: '', price: '', minDays: '', maxDays: '' }]);
        }
      } else if (type === 'Digital') {
        if (product.digital) {
          // File delivery method
          if (product.digital.fileUrl) {
            setFileMethod('url');
            setFileUrl(product.digital.fileUrl);
            setDigitalFile(null); // Clear file if URL is primary
          } else if (product.digital.fileUpload) {
            setFileMethod('upload');
            setFileUrl(''); // Clear URL if file upload is primary
            // We can't pre-fill the file input, but can store/show existing filename if needed
            // setDigitalFile(null); // File input will be empty on edit for existing upload
          } else {
            // Default if product.digital exists but no file info
            setFileMethod('url');
            setFileUrl('');
            setDigitalFile(null);
          }

          // Recurring subscription settings
          if (product.digital.recurring && product.digital.recurring.interval) {
            setIsRecurring(true);
            setRecurringInterval(product.digital.recurring.interval || 'monthly');
            setHasTrial(product.digital.recurring.hasTrial || false);
            setTrialDays(product.digital.recurring.trialDays?.toString() || '');
          } else {
            setIsRecurring(false);
            setRecurringInterval('monthly');
            setHasTrial(false);
            setTrialDays('');
          }
        } else {
          // If product.digital itself is undefined
          setFileMethod('url');
          setFileUrl('');
          setDigitalFile(null);
          setIsRecurring(false);
          setRecurringInterval('monthly');
          setHasTrial(false);
          setTrialDays('');
        }
      }

      // Variants
      if (product.variants && product.variants.length > 0) {
        setHasVariants(true);
        setVariants(product.variants.map((v: any) => ({
          name: v.name || '',
          values: v.values || [],
          stock: v.stock?.toString() || ''
        })));
      } else {
        setHasVariants(false);
        setVariants([]);
      }

    } else if (!isEditMode) {
      // Reset ALL form fields for "Add New Product"
      setTitle('');
      setShortDescription('');
      setPrice('');
      setCurrency('USD');
      setSku('');
      setBarcode('');
      setStatus('active');
      setQuantityEnabled(true); // Default for new product
      
      setExistingImages([]); // No existing images for a new product
      setImages([]);          // Clear any selected new files
      setMainImageIndex(0);
      setRemovedImageIndices([]);
      setCurrentPreviewIndex(0);
      
      // Reset Physical defaults
      setManageStock(false);
      setStock('');
      setHasVariants(false);
      setVariants([]);
      setShippingMethods([{ name: '', price: '', minDays: '', maxDays: '' }]);
      
      // Reset Digital defaults
      setFileMethod('url');
      setFileUrl('');
      setDigitalFile(null);
      setIsRecurring(false);
      setRecurringInterval('monthly');
      setHasTrial(false);
      setTrialDays('');
    }
  }, [isEditMode, product, type, open]); // Added 'open' to dependencies to ensure reset when modal reopens for "Add New"

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + images.length - removedImageIndices.length + files.length;
    
    if (totalImages > 10) {
      Toaster.error('Maximum 10 images allowed per product');
      return;
    }
    
    setImages([...images, ...files]);
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setRemovedImageIndices([...removedImageIndices, index]);
    } else {
      const newImages = [...images];
      newImages.splice(index - existingImages.length + removedImageIndices.length, 1);
      setImages(newImages);
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
    // If it's not already the first in preview, update the preview index too
    setCurrentPreviewIndex(0);
  };

  const nextImage = () => {
    setCurrentPreviewIndex((prev) => (prev + 1) % visibleImages.length);
  };

  const prevImage = () => {
    setCurrentPreviewIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length);
  };

  const addShippingMethod = () => {
    if (shippingMethods.length >= 5) {
      Toaster.error('Maximum 5 shipping methods allowed');
      return;
    }
    setShippingMethods([...shippingMethods, { name: '', price: '', minDays: '', maxDays: '' }]);
  };

  const updateShippingMethod = (index: number, field: keyof ShippingMethod, value: string) => {
    const updated = [...shippingMethods];
    updated[index] = { ...updated[index], [field]: value };
    setShippingMethods(updated);
  };

  const removeShippingMethod = (index: number) => {
    if (shippingMethods.length === 1) {
      Toaster.error('At least one shipping method is required');
      return;
    }
    const updated = shippingMethods.filter((_, i) => i !== index);
    setShippingMethods(updated);
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', values: [], stock: '' }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!title.trim()) {
        Toaster.error('Product title is required');
        return;
      }
      
      if (!price || parseFloat(price) <= 0) {
        Toaster.error('Valid price is required');
        return;
      }
      
      // Physical product validations
      if (type === 'Physical') {
        // Validate shipping methods
        if (shippingMethods.length === 0) {
          Toaster.error('At least one shipping method is required');
          return;
        }
        
        for (let i = 0; i < shippingMethods.length; i++) {
          const method = shippingMethods[i];
          if (!method.name.trim()) {
            Toaster.error(`Shipping method ${i + 1} name is required`);
            return;
          }
          if (!method.minDays || !method.maxDays) {
            Toaster.error(`Shipping method ${i + 1} days are required`);
            return;
          }
        }
        
        // Validate variants if enabled
        if (hasVariants && variants.length === 0) {
          Toaster.error('At least one variant must be added when variants are enabled');
          return;
        }
      }
      
      // Digital product validations
      if (type === 'Digital') {
        if (fileMethod === 'url' && !fileUrl.trim()) {
          Toaster.error('File URL is required');
          return;
        }
        
        if (fileMethod === 'upload' && !digitalFile && !isEditMode) {
          Toaster.error('Digital file is required');
          return;
        }
        
        if (isRecurring && hasTrial && (!trialDays || parseInt(trialDays) <= 0)) {
          Toaster.error('Valid trial days are required');
          return;
        }
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('shortDescription', shortDescription);
      formData.append('price', price);
      formData.append('currency', currency);
      formData.append('type', type.toLowerCase());
      formData.append('sku', sku);
formData.append('barcode', barcode);
formData.append('quantityEnabled', quantityEnabled.toString()); // Append quantityEnabled

if (isEditMode) {
  formData.append('status', status);
}

// Add images
      images.forEach((image) => {
        formData.append(isEditMode ? 'newImages' : 'images', image);
      });
      
      if (isEditMode && removedImageIndices.length > 0) {
        formData.append('removedImages', removedImageIndices.join(','));
      }
      
      formData.append('mainImageIndex', mainImageIndex.toString());
      
      // Physical product data
      if (type === 'Physical') {
        if (manageStock && !hasVariants) {
          formData.append('hasStock', 'true');
          formData.append('stock', stock);
        } else {
          formData.append('hasStock', 'false');
        }
        
        formData.append('shippingMethods', JSON.stringify(shippingMethods));
        
        if (hasVariants) {
          formData.append('hasVariants', 'true');
          formData.append('variants', JSON.stringify(variants.map(v => ({
            ...v,
            stock: manageStock ? parseInt(v.stock) || 0 : 0
          }))));
        } else {
          formData.append('hasVariants', 'false');
        }
      }
      
      // Digital product data
      if (type === 'Digital') {
        formData.append('fileMethod', fileMethod);
        
        if (fileMethod === 'url') {
          formData.append('fileUrl', fileUrl);
        } else if (digitalFile) {
          formData.append('digitalFile', digitalFile);
        }
        
formData.append('isRecurring', isRecurring.toString());

if (isRecurring) {
  formData.append('digital', JSON.stringify({ // This key 'digital' is for recurring details
    recurring: {
      interval: recurringInterval,
      hasTrial: hasTrial,
      trialDays: (hasTrial && trialDays) ? parseInt(trialDays) : undefined
    }
  }));
} 
// If not recurring, the 'digital' field related to recurring settings is not sent.
// The backend will handle `isRecurring: 'false'` and not expect/create `product.digital.recurring`.
// Other digital fields like fileUrl/digitalFile are handled separately above.
      }
      
      // Make API call
      const token = localStorage.getItem('jwt_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = isEditMode ? `${baseUrl}/products/${product._id}` : `${baseUrl}/products`;
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        Toaster.success(`Product ${isEditMode ? 'updated' : 'created'} successfully`);
        onClose();
      } else {
        Toaster.error(result.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Toaster.error('An error occurred while saving the product');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle number inputs
  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Allow empty string for clearing
    if (value === '') {
      setter('');
      return;
    }
    
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setter(cleaned);
  };

  // Helper function to handle integer-only inputs (for days, stock, etc.)
  const handleIntegerInput = (value: string, setter: (value: string) => void) => {
    // Allow empty string for clearing
    if (value === '') {
      setter('');
      return;
    }

    // Helper to format image URLs for display
  const formatImageUrl = (imageUrl?: string) => {
    if (!imageUrl) {
      return ''; // Return an empty string if the URL is not available
    }
    // If the URL is already absolute (http, https) or a blob URL, return it directly
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob:')) {
      return imageUrl;
    }
    // Otherwise, construct the full URL from the backend base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:5000';
    
    // Handle different possible relative path formats
    if (imageUrl.startsWith('/api/uploads/')) {
      return `${baseUrl}${imageUrl}`;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${baseUrl}/api${imageUrl}`; // Add /api if it's missing
    }
    // Prepend the full path if only a filename is stored
    return `${baseUrl}/api/uploads/${imageUrl.replace(/^\//, '')}`;
  };
    
    // Remove non-numeric characters
    const cleaned = value.replace(/[^0-9]/g, '');
    setter(cleaned);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-200">
                      <div className="flex items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {isEditMode ? 'Edit' : 'Add'} {type} Product
                        </h2>
                      </div>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden">
                      {/* Left side - Form */}
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <Transition.Child
                          as={Fragment}
                          enter="transform transition ease-in-out duration-700 delay-300"
                          enterFrom="-translate-x-full opacity-0"
                          enterTo="translate-x-0 opacity-100"
                          leave="transform transition ease-in-out duration-500"
                          leaveFrom="translate-x-0 opacity-100"
                          leaveTo="-translate-x-full opacity-0"
                        >
                          <div className="space-y-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Title *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={title}
                                  onChange={(e) => {
                                    if (e.target.value.length <= 80) {
                                      setTitle(e.target.value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter product title"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                  {title.length}/80
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Short Description
                              </label>
                              <div className="relative">
                                <textarea
                                  value={shortDescription}
                                  onChange={(e) => {
                                    if (e.target.value.length <= 200) {
                                      setShortDescription(e.target.value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Brief description of your product"
                                  rows={3}
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                  {shortDescription.length}/200
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Price *
                                </label>
                                <input
                                  type="text"
                                  value={price}
                                  onChange={(e) => handleNumberInput(e.target.value, setPrice)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0.00"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Currency
                                </label>
                                <select
                                  value={currency}
                                  onChange={(e) => setCurrency(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="USD">USD</option>
                                  <option value="BRL">BRL</option>
                                  <option value="EUR">EUR</option>
                                  <option value="GBP">GBP</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  SKU
                                </label>
                                <input
                                  type="text"
                                  value={sku}
                                  onChange={(e) => setSku(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Stock keeping unit"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Barcode
                                </label>
                                <input
                                  type="text"
                                  value={barcode}
                                  onChange={(e) => setBarcode(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ISBN, UPC, GTIN, etc."
                        />
                      </div>
                    </div>

                    {/* Enable Quantity Selection Checkbox */}
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quantityEnabled}
                          onChange={(e) => setQuantityEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enable Quantity Selection
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 pl-7">
                        If unchecked, customers can only purchase one unit of this product at a time.
                      </p>
                    </div>
                    
                    {isEditMode && ( // Status field
                            
                      
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Status
                                </label>
                                <select
                                  value={status}
                                  onChange={(e) => setStatus(e.target.value as 'active' | 'deactivated')}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="active">Active</option>
                                  <option value="deactivated">Deactivated</option>
                                </select>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Images */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
                            <p className="text-sm text-gray-600">Upload up to 10 images. Click on an image to set it as the main image.</p>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
{existingImages.map((image, index) => (
  !removedImageIndices.includes(index) && (
    <div key={`existing-${index}`} className="relative group">
<img
  src={formatImageUrl(image.url)}
  alt={`Product ${index + 1}`}
        className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all duration-200 ${
          mainImageIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:opacity-80'
        }`}
        onClick={() => setMainImageIndex(index)}
      />
                                    
                                    {/* Set as main button */}
                                    {mainImageIndex !== index && (
                                      <button
                                        onClick={() => setAsMainImage(index)}
                                        className="absolute inset-0 bg-black bg-opacity-50 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                                      >
                                        Set as Main
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => removeImage(index, true)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    {mainImageIndex === index && (
                                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                        Main
                                      </span>
                                    )}
                                  </div>
                                )
                              ))}
                              
                              {images.map((image, index) => {
                                const actualIndex = existingImages.length - removedImageIndices.length + index;
                                return (
                                  <div key={`new-${index}`} className="relative group">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Product ${actualIndex + 1}`}
                                      className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all duration-200 ${
                                        mainImageIndex === actualIndex ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:opacity-80'
                                      }`}
                                      onClick={() => setMainImageIndex(actualIndex)}
                                    />
                                    
                                    {/* Set as main button */}
                                    {mainImageIndex !== actualIndex && (
                                      <button
                                        onClick={() => setAsMainImage(actualIndex)}
                                        className="absolute inset-0 bg-black bg-opacity-50 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                                      >
                                        Set as Main
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => removeImage(actualIndex, false)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    {mainImageIndex === actualIndex && (
                                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                        Main
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              
                              {existingImages.length + images.length - removedImageIndices.length < 10 && (
                                <label className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-200">
                                  <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-500">Add Image</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          
                          {/* Physical Product Fields */}
                          {type === 'Physical' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-medium text-gray-900">Physical Product Details</h3>
                              
                              <div className="space-y-4">
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={manageStock}
                                    onChange={(e) => setManageStock(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Manage Stock
                                  </span>
                                </label>
                                
                                {manageStock && !hasVariants && (
                                  <div>
                                    <input
                                      type="text"
                                      value={stock}
                                      onChange={(e) => handleIntegerInput(e.target.value, setStock)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Stock quantity"
                                    />
                                  </div>
                                )}
                                
                                {!manageStock && !hasVariants && (
                                  <p className="text-sm text-gray-500">
                                    Stock tracking disabled - unlimited inventory
                                  </p>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                <label className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={hasVariants}
                                    onChange={(e) => {
                                      setHasVariants(e.target.checked);
                                      if (!e.target.checked) {
                                        setVariants([]);
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Add Variants
                                  </span>
                                </label>

                                {hasVariants && (
                                  <div className="space-y-3">
                                    {variants.map((variant, index) => (
                                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                          <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Variant name (e.g., Size, Color)"
                                          />
                                          <button
                                            onClick={() => removeVariant(index)}
                                            className="ml-3 text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                        
                                        <input
                                          type="text"
                                          value={variant.values.join(', ')}
                                          onChange={(e) => {
                                            // Allow all characters including commas
                                            const inputValue = e.target.value;
                                            const values = inputValue.split(',').map(v => v.trim());
                                            updateVariant(index, 'values', values);
                                          }}
                                          onKeyDown={(e) => {
                                            // Prevent any restrictions on comma input
                                            if (e.key === ',') {
                                              e.stopPropagation();
                                            }
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Values (comma-separated, e.g., Small, Medium, Large)"
                                        />
                                        
                                        {manageStock && (
                                          <input
                                            type="text"
                                            value={variant.stock}
                                            onChange={(e) => handleIntegerInput(e.target.value, (value) => updateVariant(index, 'stock', value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Stock for this variant"
                                          />
                                        )}
                                      </div>
                                    ))}
                                    
                                    <button
                                      onClick={addVariant}
                                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-colors duration-200"
                                    >
                                      <Plus className="h-5 w-5 mr-2" />
                                      Add Variant
                                    </button>
                                    
                                    {hasVariants && variants.length === 0 && (
                                      <p className="text-sm text-red-600">
                                        At least one variant is required when variants are enabled
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                <h4 className="text-md font-medium text-gray-900">Shipping Methods</h4>
                                <p className="text-sm text-gray-600">Add 1-5 shipping methods for this product.</p>
                                
                                <div className="space-y-3">
                                  {shippingMethods.map((method, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <input
                                          type="text"
                                          value={method.name}
                                          onChange={(e) => updateShippingMethod(index, 'name', e.target.value)}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Shipping method name"
                                        />
                                        {shippingMethods.length > 1 && (
                                          <button
                                            onClick={() => removeShippingMethod(index)}
                                            className="ml-3 text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                                          <input
                                            type="text"
                                            value={method.price}
                                            onChange={(e) => handleNumberInput(e.target.value, (value) => updateShippingMethod(index, 'price', value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="0.00"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Min Days</label>
                                          <input
                                            type="text"
                                            value={method.minDays}
                                            onChange={(e) => handleIntegerInput(e.target.value, (value) => updateShippingMethod(index, 'minDays', value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="1"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Max Days</label>
                                          <input
                                            type="text"
                                            value={method.maxDays}
                                            onChange={(e) => handleIntegerInput(e.target.value, (value) => updateShippingMethod(index, 'maxDays', value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="7"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {shippingMethods.length < 5 && (
                                    <button
                                      onClick={addShippingMethod}
                                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-colors duration-200"
                                    >
                                      <Plus className="h-5 w-5 mr-2" />
                                      Add Shipping Method
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Digital Product Fields */}
                          {type === 'Digital' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-medium text-gray-900">Digital Product Details</h3>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-3">
                                    File Delivery Method
                                  </label>
                                  <div className="flex space-x-6">
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        value="url"
                                        checked={fileMethod === 'url'}
                                        onChange={(e) => setFileMethod('url')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      />
                                      <Link className="h-4 w-4 ml-2 mr-1" />
                                      <span className="text-sm text-gray-700">URL</span>
                                    </label>
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        value="upload"
                                        checked={fileMethod === 'upload'}
                                        onChange={(e) => setFileMethod('upload')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      />
                                      <Upload className="h-4 w-4 ml-2 mr-1" />
                                      <span className="text-sm text-gray-700">Upload</span>
                                    </label>
                                  </div>
                                </div>
                                
                                {fileMethod === 'url' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      File URL *
                                    </label>
                                    <input
                                      type="url"
                                      value={fileUrl}
                                      onChange={(e) => setFileUrl(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="https://example.com/file.pdf"
                                    />
                                  </div>
                                )}
                                
                                {fileMethod === 'upload' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Upload File {!isEditMode && '*'}
                                    </label>
                                    <input
                                      type="file"
                                      onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {digitalFile && (
                                      <p className="text-sm text-gray-500 mt-2">
                                        Selected: {digitalFile.name}
                                      </p>
                                    )}
                                    {isEditMode && product.digital?.fileUpload && (
                                      <p className="text-sm text-gray-500 mt-2">
                                        Current file: {product.digital.fileUpload}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                <div className="space-y-4">
                                  <label className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={isRecurring}
                                      onChange={(e) => setIsRecurring(e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      Recurring Subscription
                                    </span>
                                  </label>
                                  
                                  {isRecurring && (
                                    <div className="space-y-4 pl-7">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Billing Interval
                                        </label>
                                        <select
                                          value={recurringInterval}
                                          onChange={(e) => setRecurringInterval(e.target.value as 'monthly' | 'yearly')}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                          <option value="monthly">Monthly</option>
                                          <option value="yearly">Yearly</option>
                                        </select>
                                      </div>
                                      
                                      <label className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={hasTrial}
                                          onChange={(e) => setHasTrial(e.target.checked)}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                          Free Trial
                                        </span>
                                      </label>
                                      
                                      {hasTrial && (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trial Days
                                          </label>
                                          <input
                                            type="text"
                                            value={trialDays}
                                            onChange={(e) => handleIntegerInput(e.target.value, setTrialDays)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="7"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        </Transition.Child>
                      </div>
                      
                      {/* Right side - Preview */}
                      <div className="hidden lg:block w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                        <Transition.Child
                          as={Fragment}
                          enter="transform transition ease-in-out duration-700 delay-500"
                          enterFrom="translate-x-full opacity-0"
                          enterTo="translate-x-0 opacity-100"
                          leave="transform transition ease-in-out duration-500"
                          leaveFrom="translate-x-0 opacity-100"
                          leaveTo="translate-x-full opacity-0"
                        >
                          <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                            <Eye className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          {/* Product Preview Card */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Image Preview */}
                            <div className="relative">
                              {visibleImages.length > 0 ? (
                                <div className="relative h-64 bg-gray-100">
<img
  src={formatImageUrl(visibleImages[currentPreviewIndex]?.url)}
  alt="Product preview"
  className="w-full h-full object-cover"
/>
                                  
                                  {visibleImages.length > 1 && (
                                    <>
                                      <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-sm"
                                      >
                                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                                      </button>
                                      <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-sm"
                                      >
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                      </button>
                                      
                                      {/* Image indicators */}
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                        {visibleImages.map((_, index) => (
                                          <button
                                            key={index}
                                            onClick={() => setCurrentPreviewIndex(index)}
                                            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                              index === currentPreviewIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="h-64 bg-gray-100 flex items-center justify-center">
                                  <div className="text-center">
                                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No images uploaded</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-4 space-y-3">
                              <h4 className="font-medium text-gray-900 text-lg break-words leading-tight">
                                {title || 'Product Title'}
                              </h4>
                              
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-2xl font-bold text-gray-900 break-words">
                                  {price ? `${currency} ${parseFloat(price).toFixed(2)}` : `${currency} 0.00`}
                                </span>
                                {type && (
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                    type === 'Physical' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {type}
                                  </span>
                                )}
                              </div>
                              
                              {shortDescription && (
                                <p className="text-sm text-gray-600 leading-relaxed break-words">
                                  {shortDescription}
                                </p>
                              )}
                              
                              {/* Additional Info */}
                              <div className="pt-3 border-t border-gray-100 space-y-2">
                                {sku && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">SKU:</span>
                                    <span className="text-gray-900 break-words ml-2 text-right">{sku}</span>
                                  </div>
                                )}
                                
                                {type === 'Physical' && manageStock && !hasVariants && stock && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Stock:</span>
                                    <span className="text-gray-900 break-words ml-2 text-right">{stock} units</span>
                                  </div>
                                )}
                                
                                {hasVariants && variants.length > 0 && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Variants:</span>
                                    <div className="mt-1 space-y-1">
                                      {variants.map((variant, index) => (
                                        variant.name && (
                                          <div key={index} className="text-gray-900 break-words">
                                            <span className="font-medium">{variant.name}:</span>{' '}
                                            <span className="break-words">{variant.values.join(', ')}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {type === 'Digital' && isRecurring && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Billing:</span>
                                    <span className="text-gray-900 capitalize break-words ml-2 text-right">{recurringInterval}</span>
                                  </div>
                                )}
                                
                                {type === 'Digital' && isRecurring && hasTrial && trialDays && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Free Trial:</span>
                                    <span className="text-gray-900 break-words ml-2 text-right">{trialDays} days</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        </Transition.Child>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')} Product
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};