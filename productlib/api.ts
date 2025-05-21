// productlib/api.ts
import { ITransaction, IApiResponse, IProduct } from './types';

// Always use the full backend URL from NEXT_PUBLIC_API_URL (or default to localhost:5000/api)
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
    .replace(/\/$/, '');  // trim trailing slash if any

export const getApiUrl = (path: string): string => {
  // Ensure path starts with a single '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Fetch a product by slug
 */
export const getProductBySlug = async (slug: string): Promise<IProduct | null> => {
  try {
    if (!slug) {
      console.error('Invalid slug provided to getProductBySlug');
      return null;
    }
    
    // Ensure slug is properly encoded for URLs
    const encodedSlug = encodeURIComponent(slug);
    const url = getApiUrl(`/products/public/${encodedSlug}`);
    
    console.log(`Fetching product with slug: ${encodedSlug} from URL: ${url}`);
    
    // Use Next.js fetch with only one caching strategy
    const response = await fetch(url, { 
      // Using only next.revalidate instead of both no-store and revalidate
      next: { revalidate: 60 }
    });
    
    // Try to get more information about the error
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Product not found for slug: ${slug}`);
        return null; // Product not found
      }
      
      // For 500 errors, try to get more details from the response
      if (response.status === 500) {
        try {
          // Try to parse the error response
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          
          // Return null instead of throwing to avoid breaking the page
          console.error(`Server error (500) for slug ${slug}: ${JSON.stringify(errorData)}`);
          return null;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          // Return null instead of throwing
          return null;
        }
      }
      
      // For other errors, log but don't throw
      console.error(`Error fetching product (${response.status}): ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data?.product) {
      console.log(`API returned success: ${data.success}, but no product data`);
      return null;
    }
    
    console.log(`Successfully fetched product: ${data.data.product.title}`);
    return data.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    // Instead of re-throwing, return null to fail gracefully
    return null;
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (transaction: ITransaction): Promise<IApiResponse<any>> => {
  try {
    const url = getApiUrl('/finance/transactions');
    
    // Log transaction data for debugging (omitting sensitive info)
    console.log('Creating transaction:', {
      ...transaction,
      buyerEmail: transaction.buyerEmail ? '***@***.com' : undefined,
    });
    
    // No authentication token required for public payments
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(transaction),
    });
    
    // Log response status for debugging
    console.log('Transaction API response status:', response.status);
    
    // Better error handling for non-2xx responses
    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.message || 'Failed to create transaction';
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorDetails);
    }

    const data: IApiResponse<any> = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Get IP Address (using a public API)
 */
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return '';
  }
};

/**
 * Get device and browser information
 */
export const getDeviceInfo = (): { deviceInfo: string; browserInfo: string } => {
  const userAgent = navigator.userAgent;
  
  let deviceInfo = 'Unknown Device';
  let browserInfo = 'Unknown Browser';
  
  // Simple device detection
  if (/Android/i.test(userAgent)) {
    const match = userAgent.match(/Android\s([0-9.]+)/);
    deviceInfo = `Mobile (Android ${match ? match[1] : ''})`;
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const match = userAgent.match(/OS\s([0-9_]+)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    deviceInfo = `Mobile (iOS ${version})`;
  } else if (/Windows/i.test(userAgent)) {
    const match = userAgent.match(/Windows NT\s([0-9.]+)/);
    deviceInfo = `Desktop (Windows ${match ? match[1] : ''})`;
  } else if (/Mac OS X/i.test(userAgent)) {
    const match = userAgent.match(/Mac OS X\s([0-9_.]+)/);
    const version = match ? match[1].replace(/_/g, '.') : '';
    deviceInfo = `Desktop (macOS ${version})`;
  } else if (/Linux/i.test(userAgent)) {
    deviceInfo = 'Desktop (Linux)';
  }
  
  // Simple browser detection
  if (/Chrome/i.test(userAgent) && !/Chromium|Edge/i.test(userAgent)) {
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browserInfo = `Chrome ${match ? match[1] : ''}`;
  } else if (/Firefox/i.test(userAgent)) {
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browserInfo = `Firefox ${match ? match[1] : ''}`;
  } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium/i.test(userAgent)) {
    const match = userAgent.match(/Safari\/([0-9.]+)/);
    browserInfo = `Safari ${match ? match[1] : ''}`;
  } else if (/Edge/i.test(userAgent)) {
    const match = userAgent.match(/Edge\/([0-9.]+)/);
    browserInfo = `Edge ${match ? match[1] : ''}`;
  } else if (/MSIE|Trident/i.test(userAgent)) {
    const match = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/);
    browserInfo = `Internet Explorer ${match ? match[1] : ''}`;
  }
  
  return { deviceInfo, browserInfo };
};
