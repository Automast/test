'use client';

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import { ChevronDownIcon, MoreHorizontal, Upload, X, Plus, Minus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '@/types';
import Toaster from '@/helpers/Toaster';

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'JPY', symbol: '¥' },
];

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Simple Rich Text Editor Component
const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCommand = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    switch (command) {
      case 'bold':
        replacement = `<strong>${selectedText || 'text'}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText || 'text'}</em>`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'text'}</u>`;
        break;
      case 'list':
        replacement = selectedText ? `<ul>\n  <li>${selectedText}</li>\n</ul>` : '<ul>\n  <li>List item</li>\n</ul>';
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          replacement = `<a href="${url}" target="_blank">${selectedText || url}</a>`;
        }
        break;
    }

    if (replacement) {
      const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the replacement
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + replacement.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div>
      <div className="toolbar border border-gray-300 border-b-0 rounded-t-md p-2 bg-gray-50 flex gap-2">
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => handleCommand('underline')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => handleCommand('list')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleCommand('link')}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Insert Link"
        >
          🔗 Link
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-b-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={6}
      />
    </div>
  );
};

interface ShippingMethod {
  name: string;
  price: number;
}

interface Variant {
  name: string;
  values: string;
  stock: number;
}

interface ImagePreview {
  file?: File;
  url: string;
  isMain: boolean;
  isExisting?: boolean;
  originalUrl?: string; // Store original URL for existing images
}

const AddProductModal: React.FC<{
  open: boolean;
  onClose: () => void;
  type: 'Physical' | 'Digital';
  product?: Product;
}> = ({ open, onClose, type: initialType, product }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic fields - Initialize with empty strings to avoid controlled/uncontrolled issues
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [price, setPrice] = useState(''); // Use string to allow empty state
  const [currency, setCurrency] = useState('USD');
  const [autoLocalPrice, setAutoLocalPrice] = useState(true);
  const [productType] = useState(initialType); // Remove setter, use initial type only
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');

  // Image handling
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital product fields
  const [fileMethod, setFileMethod] = useState<'url' | 'upload'>('url');
  const [fileUrl, setFileUrl] = useState('');
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [hasTrial, setHasTrial] = useState(false);
  const [trialDays, setTrialDays] = useState('14'); // Use string

  // Physical product fields
  const [hasStock, setHasStock] = useState(true);
  const [stock, setStock] = useState('0'); // Use string
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([{ name: '', price: 0 }]);

  // Status (for editing)
  const [status, setStatus] = useState<'active' | 'deactivated'>('active');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to format image URLs consistently
  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || 'http://localhost:5000';
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/api/uploads/')) {
      return `${baseUrl}${imageUrl}`;
    }
    return `${baseUrl}/uploads/${imageUrl}`;
  };

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setTitle(product.title || product.name || '');
      setShortDescription(product.shortDescription || '');
      setLongDescription(product.longDescription || product.description || '');
      setPrice(product.price?.toString() || '');
      setCurrency(product.defaultCurrency || 'USD');
      setAutoLocalPrice(product.autoLocalPrice !== false);
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setStatus(product.status === 'active' ? 'active' : 'deactivated');

      // Handle existing images with proper URL formatting
      if (product.images && product.images.length > 0) {
        const existingImages: ImagePreview[] = product.images.map(img => ({
          url: formatImageUrl(img.url),
          originalUrl: img.url, // Store original URL for reference
          isMain: img.isMain,
          isExisting: true
        }));
        setImages(existingImages);
      }

      // Digital product fields
      if (product.digital) {
        setIsRecurring(product.digital.isRecurring || false);
        if (product.digital.fileUrl) {
          setFileMethod('url');
          setFileUrl(product.digital.fileUrl);
        } else if (product.digital.fileUpload) {
          setFileMethod('upload');
        }
        
        if (product.digital.recurring) {
          setBillingInterval(product.digital.recurring.interval || 'monthly');
          setHasTrial(product.digital.recurring.hasTrial || false);
          setTrialDays(product.digital.recurring.trialDays?.toString() || '14');
        }
      }

      // Physical product fields
      if (product.physical) {
        setHasStock(product.physical.stock !== undefined);
        setStock(product.physical.stock?.toString() || '0');
        
        if (product.physical.shippingMethods) {
          setShippingMethods(product.physical.shippingMethods);
        }
      }

      if (product.variants && product.variants.length > 0) {
        setHasVariants(true);
        setVariants(product.variants.map(v => ({
          name: v.name,
          values: v.values.join(','),
          stock: v.stock
        })));
      }
    }
  }, [product]);

  const handleImageUpload = (files: FileList) => {
    const newImages: ImagePreview[] = [];
    const remainingSlots = 10 - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      newImages.push({
        file,
        url: URL.createObjectURL(file),
        isMain: images.length === 0 && i === 0
      });
    }

    setImages(prev => [...prev, ...newImages]);

    if (files.length > remainingSlots) {
      Toaster.warning(`Only ${filesToProcess} images were added. Maximum 10 images allowed.`);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.isExisting && imageToRemove.originalUrl) {
      setRemovedImageUrls(prev => [...prev, imageToRemove.originalUrl!]);
    }

    const newImages = images.filter((_, i) => i !== index);
    
    // If the removed image was main and there are other images, make the first one main
    if (imageToRemove.isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    
    setImages(newImages);
  };

  const setMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index
    })));
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { name: '', values: '', stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const addShippingMethod = () => {
    setShippingMethods(prev => [...prev, { name: '', price: 0 }]);
  };

  const removeShippingMethod = (index: number) => {
    setShippingMethods(prev => prev.filter((_, i) => i !== index));
  };

  const updateShippingMethod = (index: number, field: keyof ShippingMethod, value: string | number) => {
    setShippingMethods(prev => prev.map((method, i) => 
      i === index ? { ...method, [field]: value } : method
    ));
  };

  const handlePriceChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || !isNaN(Number(value))) {
      setPrice(value);
    }
  };

  const handleStockChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setStock(value);
    }
  };

  const handleTrialDaysChange = (value: string) => {
    // Allow empty string and valid numbers
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
      setTrialDays(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      Toaster.error('Product title is required');
      return;
    }
    
    if (!price || Number(price) <= 0) {
      Toaster.error('Price must be greater than 0');
      return;
    }

    if (images.length === 0) {
      Toaster.error('At least one product image is required');
      return;
    }

    // Digital product validations
    if (productType === 'Digital') {
      if (fileMethod === 'url' && !fileUrl.trim()) {
        Toaster.error('File URL is required for digital products');
        return;
      }
      if (fileMethod === 'upload' && !digitalFile && !product) {
        Toaster.error('Please upload a digital file');
        return;
      }
    }

    // Physical product validations
    if (productType === 'Physical') {
      if (hasVariants && variants.some(v => !v.name.trim() || !v.values.trim())) {
        Toaster.error('Variant name and values are required');
        return;
      }
      if (shippingMethods.some(s => s.name.trim() && (isNaN(s.price) || s.price < 0))) {
        Toaster.error('Invalid shipping method price');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Basic fields
      formData.append('title', title.trim());
      formData.append('shortDescription', shortDescription.trim());
      formData.append('longDescription', longDescription.trim());
      formData.append('description', shortDescription.trim()); // Backwards compatibility
      formData.append('price', price);
      formData.append('currency', currency);
      formData.append('defaultCurrency', currency);
      formData.append('autoLocalPrice', autoLocalPrice.toString());
      formData.append('type', productType.toLowerCase());
      if (sku.trim()) formData.append('sku', sku.trim());
      if (barcode.trim()) formData.append('barcode', barcode.trim());
      
      // Status for editing
      if (product) {
        formData.append('status', status);
      }

      // Generate slug for new products
      if (!product) {
        const slug = generateSlug();
        formData.append('slug', slug);
      }

      // Handle new images
      const newImages = images.filter(img => img.file);
      newImages.forEach(img => {
        if (img.file) formData.append('images', img.file);
      });

      // Handle main image
      const mainImageIndex = images.findIndex(img => img.isMain);
      if (mainImageIndex >= 0) {
        const mainImage = images[mainImageIndex];
        if (mainImage.file) {
          // New image is main
          const newImageIndex = newImages.findIndex(img => img.file === mainImage.file);
          formData.append('mainImageIndex', newImageIndex.toString());
        } else if (mainImage.isExisting) {
          // Existing image is main - use original URL for comparison
          const existingIndex = product?.images?.findIndex(img => img.url === mainImage.originalUrl) || 0;
          formData.append('mainImageIsNew', 'false');
          formData.append('mainImageIndex', existingIndex.toString());
        }
      }

      // Handle removed images for edits
      if (product && removedImageUrls.length > 0) {
        formData.append('removedImageUrls', removedImageUrls.join(','));
      }

      // Digital product fields
      if (productType === 'Digital') {
        formData.append('isRecurring', isRecurring.toString());
        formData.append('fileMethod', fileMethod);
        
        if (fileMethod === 'url') {
          formData.append('fileUrl', fileUrl.trim());
        } else if (digitalFile) {
          formData.append('digitalFile', digitalFile);
        }
        
        if (isRecurring) {
          const digitalData = {
            recurring: {
              interval: billingInterval,
              hasTrial,
              trialDays: hasTrial ? Number(trialDays) || 0 : 0
            }
          };
          formData.append('digital', JSON.stringify(digitalData));
        }
      }

      // Physical product fields
      if (productType === 'Physical') {
        formData.append('hasStock', hasStock.toString());
        if (hasStock && !hasVariants) {
          formData.append('stock', stock);
        }
        
        formData.append('hasVariants', hasVariants.toString());
        if (hasVariants && variants.length > 0) {
          const processedVariants = variants.map(v => ({
            name: v.name.trim(),
            values: v.values.split(',').map(val => val.trim()).filter(val => val),
            stock: v.stock
          }));
          formData.append('variants', JSON.stringify(processedVariants));
        }
        
        // Shipping methods
        const validShippingMethods = shippingMethods.filter(s => s.name.trim());
        if (validShippingMethods.length > 0) {
          formData.append('shippingMethods', JSON.stringify(validShippingMethods));
        }
      }

      // Make API call
      const token = localStorage.getItem('jwt_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const endpoint = product ? `/products/${product._id}` : '/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        Toaster.success(product ? 'Product updated successfully' : 'Product created successfully');
        onClose();
        // Trigger a page refresh or update the product list
        window.location.reload();
      } else {
        Toaster.error(result.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Toaster.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  // Generate a random slug
  const generateSlug = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 10; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-6xl h-full bg-white shadow-xl p-6 flex flex-col overflow-hidden transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 mb-6 pb-4">
          <h2 className="text-2xl font-bold">
            {product ? 'Edit Product' : `Add ${productType} Product`}
          </h2>
          <button
            className="rounded-full hover:bg-gray-100 transition p-2"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex gap-8 overflow-hidden">
          {/* Left Panel - Form Fields */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Short Description
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    maxLength={200}
                    placeholder="Brief description for listings (max 200 chars)"
                  />
                  <small className="text-gray-500 text-xs">
                    {shortDescription.length}/200 characters
                  </small>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Long Description
                  </label>
                  <RichTextEditor
                    value={longDescription}
                    onChange={setLongDescription}
                    placeholder="Detailed product description with basic formatting"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Default Currency <span className="text-red-500">*</span>
                    </label>
                    <Listbox value={currency} onChange={setCurrency}>
                      <div className="relative">
                        <ListboxButton className="w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {currency}
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </ListboxButton>
                        <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {currencies.map((curr) => (
                            <ListboxOption
                              key={curr.code}
                              value={curr.code}
                              className={({ active }) =>
                                `cursor-pointer select-none px-3 py-2 ${
                                  active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                }`
                              }
                            >
                              {curr.code}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoLocalPrice"
                    checked={autoLocalPrice}
                    onChange={(e) => setAutoLocalPrice(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoLocalPrice" className="text-sm">
                    Auto-convert price for shoppers (Currency-Switch)
                  </label>
                </div>
                <small className="text-gray-500 text-xs">
                  If checked, shoppers see prices in their local currency. If unchecked, they see the Default Product Currency.
                </small>

                {/* Hidden product type - removed from form UI */}
                <input type="hidden" value={productType} />

                {product && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Listbox value={status} onChange={setStatus}>
                      <div className="relative">
                        <ListboxButton className="w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {status === 'active' ? 'Active' : 'Deactivated'}
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </ListboxButton>
                        <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                          <ListboxOption
                            value="active"
                            className={({ active }) =>
                              `cursor-pointer select-none px-3 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            Active
                          </ListboxOption>
                          <ListboxOption
                            value="deactivated"
                            className={({ active }) =>
                              `cursor-pointer select-none px-3 py-2 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            Deactivated
                          </ListboxOption>
                        </ListboxOptions>
                      </div>
                    </Listbox>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Stock Keeping Unit"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Barcode</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ISBN, UPC, GTIN, etc."
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Images */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Images</h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Images <span className="text-red-500">*</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 10 images (JPEG, PNG, WebP)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {images.length}/10 images selected
                </div>

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            console.log('Image error:', image.url);
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/150/150';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setMainImage(index)}
                            className={`px-2 py-1 text-xs rounded ${
                              image.isMain
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {image.isMain ? 'Main' : 'Set as Main'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Digital Product Options */}
            {productType === 'Digital' && (
              <section>
                <h3 className="text-lg font-semibold mb-4">Digital Product Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">File Method</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="url"
                          checked={fileMethod === 'url'}
                          onChange={(e) => setFileMethod(e.target.value as 'url' | 'upload')}
                          className="mr-2"
                        />
                        File URL
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="upload"
                          checked={fileMethod === 'upload'}
                          onChange={(e) => setFileMethod(e.target.value as 'url' | 'upload')}
                          className="mr-2"
                        />
                        File Upload
                      </label>
                    </div>
                  </div>

                  {fileMethod === 'url' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">File URL</label>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/your-file.zip"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Upload Digital File</label>
                      <input
                        type="file"
                        onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {product && product.digital?.fileUpload && (
                        <small className="text-gray-500 text-xs mt-1">
                          Current file: {product.digital.fileUpload.split('/').pop()}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm">
                      Recurring Subscription
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Billing Interval</label>
                        <Listbox value={billingInterval} onChange={setBillingInterval}>
                          <div className="relative">
                            <ListboxButton className="w-full border border-gray-300 rounded-md px-3 py-2 text-left bg-white flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                              {billingInterval === 'monthly' ? 'Monthly' : 'Yearly'}
                              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                            </ListboxButton>
                            <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                              <ListboxOption
                                value="monthly"
                                className={({ active }) =>
                                  `cursor-pointer select-none px-3 py-2 ${
                                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                Monthly
                              </ListboxOption>
                              <ListboxOption
                                value="yearly"
                                className={({ active }) =>
                                  `cursor-pointer select-none px-3 py-2 ${
                                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                Yearly
                              </ListboxOption>
                            </ListboxOptions>
                          </div>
                        </Listbox>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasTrial"
                          checked={hasTrial}
                          onChange={(e) => setHasTrial(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="hasTrial" className="text-sm">
                          Offer Free Trial
                        </label>
                      </div>

                      {hasTrial && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Trial Days</label>
                          <input
                            type="text"
                            value={trialDays}
                            onChange={(e) => handleTrialDaysChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="14"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Physical Product Options */}
            {productType === 'Physical' && (
              <section>
                <h3 className="text-lg font-semibold mb-4">Physical Product Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasStock"
                      checked={hasStock}
                      onChange={(e) => setHasStock(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasStock" className="text-sm">
                      Manage Stock
                    </label>
                  </div>

                  {hasStock && !hasVariants && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                      <input
                        type="text"
                        value={stock}
                        onChange={(e) => handleStockChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasVariants"
                      checked={hasVariants}
                      onChange={(e) => {
                        setHasVariants(e.target.checked);
                        if (e.target.checked) {
                          setHasStock(true);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="hasVariants" className="text-sm">
                      Add Variants (e.g., Size, Color)
                    </label>
                  </div>

                  {hasVariants && (
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Product Variants</h4>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Variant
                        </button>
                      </div>
                      <small className="text-gray-600">
                        If you add variants, stock will be managed per variant.
                      </small>

                      {variants.map((variant, index) => (
                        <div key={index} className="bg-white p-4 rounded-md border space-y-3">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium">Variant {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Variant Name</label>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Size"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Values (comma-separated)</label>
                              <input
                                type="text"
                                value={variant.values}
                                onChange={(e) => updateVariant(index, 'values', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Small,Medium,Large"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shipping Methods */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Shipping Methods</h4>
                      <button
                        type="button"
                        onClick={addShippingMethod}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Method
                      </button>
                    </div>
                    <small className="text-gray-600 mb-3 block">
                      Add shipping methods for this product. Set price to 0 for free shipping.
                    </small>

                    {shippingMethods.map((method, index) => (
                      <div key={index} className="flex items-center space-x-3 mb-3">
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => updateShippingMethod(index, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Method name (e.g., Standard Shipping)"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={method.price}
                          onChange={(e) => updateShippingMethod(index, 'price', Number(e.target.value))}
                          className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Price"
                        />
                        {shippingMethods.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeShippingMethod(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="w-80 bg-gray-50 p-6 rounded-lg space-y-4 overflow-y-auto">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="bg-white p-4 rounded-md border">
              {/* Product Image */}
              <div className="w-full h-48 bg-gray-200 rounded-md mb-3 overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images.find(img => img.isMain)?.url || images[0].url}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/300/300';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Upload className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <h4 className="font-semibold text-lg mb-2">{title || 'Product Title'}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {shortDescription || 'Product description...'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">
                  {currencies.find(c => c.code === currency)?.symbol}
                  {price ? Number(price).toFixed(2) : '0.00'}
                </span>
                <span className="text-sm text-gray-500">{currency}</span>
              </div>
              
              {sku && (
                <div className="mt-2 text-xs text-gray-500">
                  SKU: {sku}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddProductModal;