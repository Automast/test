export type Product = {
  _id: string;
  id?: string;
  name?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  amount?: number;
  currency?: string;
  defaultCurrency?: string;
  type: 'physical' | 'digital';
  status: 'active' | 'inactive' | 'deactivated' | 'draft';
  sku?: string;
  barcode?: string;
  autoLocalPrice?: boolean;
  images?: Array<{
    url: string;
    isMain: boolean;
  }>;
  date?: string;
  createdAt: string;
  updatedAt?: string;
  url?: string;
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
};

export type ProductData = {
  pagination: {
    totalLength: number;
    itemsPerPage: number;
    pageCount: number;
    currentPage: number;
  };
  data: Product[];
};

export type ProductDetail = Product;

// Add additional product-related types for API responses
export type ProductsResponse = {
  success: boolean;
  message?: string;
  data: {
    products: Product[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
};

export type ProductResponse = {
  success: boolean;
  message?: string;
  data: {
    product: Product;
  };
};

export type CreateProductRequest = {
  title: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  price: number;
  currency: string;
  defaultCurrency: string;
  autoLocalPrice: boolean;
  type: 'digital' | 'physical';
  sku?: string;
  barcode?: string;
  slug: string;
  images?: File[];
  mainImageIndex?: string;
  fileMethod?: 'url' | 'upload';
  fileUrl?: string;
  digitalFile?: File;
  isRecurring?: boolean;
  digital?: string; // JSON string
  hasStock?: boolean;
  stock?: string;
  hasVariants?: boolean;
  variants?: string; // JSON string
  shippingMethods?: string; // JSON string
};

export type UpdateProductRequest = CreateProductRequest & {
  status?: 'active' | 'deactivated';
  removedImageUrls?: string;
  newImages?: File[];
  mainImageIsNew?: string;
  mainImageNewIndex?: string;
};