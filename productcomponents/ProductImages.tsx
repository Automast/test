// productcomponents/ProductImages.tsx
'use client';

import { useState } from 'react';
import { IImage } from '../productlib/types';

interface ProductImagesProps {
  images: IImage[];
}

const ProductImages: React.FC<ProductImagesProps> = ({ images }) => {
  // Find main image or use first image as default
  const mainImage = images.find(img => img.isMain) || images[0];
  const [selectedImage, setSelectedImage] = useState<string>(mainImage?.url || '');
  
  if (!images || images.length === 0) {
    return (
      <div className="h-64 bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

// Format the image URL to ensure it starts with /api/uploads if needed
  const formatImageUrl = (url: string): string => {
    // If it's already a full URL, use it as-is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Make sure URLs that start with /uploads have the proper /api prefix
    if (url.startsWith('/uploads') && !url.startsWith('/api/uploads')) {
      return `/api${url}`;
    }
    
    // URLs that already have /api/uploads are good
    if (url.startsWith('/api/uploads')) {
      return url;
    }
    
    // For all other cases, ensure it has the complete path
    return `/api/uploads/${url.replace(/^\//, '')}`;
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Main image display */}
      <div className="relative h-96 bg-white rounded-lg overflow-hidden border border-gray-200">
        <img
          src={formatImageUrl(selectedImage)}
          alt="Product"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto py-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 rounded-md overflow-hidden
                ${selectedImage === image.url ? 'border-blue-500' : 'border-gray-200'}`}
              onClick={() => setSelectedImage(image.url)}
            >
              <img
                src={formatImageUrl(image.url)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;