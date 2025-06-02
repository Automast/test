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
      <>
        <style jsx>{`
          .no-image-container {
            width: 100%;
            max-width: 200px;
            height: 150px;
            background: #f6f9fc;
            border-radius: 8px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e6ebf1;
          }
          
          .no-image-content {
            text-align: center;
            color: #8898aa;
          }
          
          .no-image-icon {
            font-size: 32px;
            margin-bottom: 8px;
            opacity: 0.5;
          }
          
          .no-image-text {
            font-size: 14px;
          }
        `}</style>
        
        <div className="no-image-container">
          <div className="no-image-content">
            <div className="no-image-icon">
              <i className="fas fa-image"></i>
            </div>
            <div className="no-image-text">No images available</div>
          </div>
        </div>
      </>
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
    <>
      <style jsx>{`
        .images-container {
          width: 100%;
        }
        
        .main-image {
          width: 100%;
          max-width: 200px;
          height: 150px;
          background: #f6f9fc;
          border-radius: 8px;
          margin: 0 auto 20px;
          overflow: hidden;
          border: 1px solid #e6ebf1;
          cursor: pointer;
        }
        
        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .main-image:hover img {
          transform: scale(1.05);
        }
        
        .thumbnails {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 0 10px;
        }
        
        .thumbnail {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f6f9fc;
        }
        
        .thumbnail:hover {
          border-color: #cfd7df;
        }
        
        .thumbnail.active {
          border-color: #635bff;
          box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.2);
        }
        
        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        @media (max-width: 768px) {
          .main-image {
            max-width: 150px;
            height: 120px;
          }
          
          .thumbnail {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
      
      <div className="images-container">
        {/* Main image display */}
        <div className="main-image">
          <img
            src={formatImageUrl(selectedImage)}
            alt="Product"
          />
        </div>
        
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="thumbnails">
            {images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${selectedImage === image.url ? 'active' : ''}`}
                onClick={() => setSelectedImage(image.url)}
                type="button"
              >
                <img
                  src={formatImageUrl(image.url)}
                  alt={`Thumbnail ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductImages;
