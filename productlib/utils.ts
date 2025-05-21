// productlib/utils.ts
import { 
    IProduct, 
    IVariant, 
    IVariantSelection, 
    IBillingInfo, 
    ITransactionItem 
  } from './types';
  
  /**
   * Check if a product is in stock
   */
  export const isProductInStock = (
    product: IProduct, 
    variantSelections: IVariantSelection[]
  ): boolean => {
    // Digital products are always in stock
    if (product.type === 'digital') {
      return true;
    }
  
    // If variants exist, check if selected variants are in stock
    if (product.variants && product.variants.length > 0) {
      // If no variant is selected but variants exist, product is not ready for purchase
      if (variantSelections.length === 0) {
        return false;
      }
  
      // Check if all selected variants have stock
      for (const variant of product.variants) {
        const selection = variantSelections.find(s => s.name === variant.name);
        
        // If a variant type doesn't have a selection, product is not ready
        if (!selection) {
          return false;
        }
        
        // Check if the selected variant value is valid
        const valueIndex = variant.values.indexOf(selection.value);
        if (valueIndex === -1) {
          return false;
        }
        
        // Check stock for variants
        if (variant.stock <= 0) {
          return false;
        }
      }
      
      return true;
    }
  
    // If no variants, check product stock if it's available
    if (product.physical && product.physical.stock !== undefined) {
      return product.physical.stock > 0;
    }
  
    // If no stock tracking, assume it's available
    return true;
  };
  
  /**
   * Calculate VAT amount based on price
   */
  export const calculateVAT = (price: number, vatEnabled: boolean): number => {
    if (!vatEnabled) {
      return 0;
    }
    
    // Default VAT rate (could be fetched from backend or config)
    const vatRate = 0.20; // 20% VAT
    return parseFloat((price * vatRate).toFixed(2));
  };
  
  /**
   * Calculate shipping fee
   */
  export const calculateShippingFee = (
    product: IProduct, 
    shippingMethodName?: string
  ): number => {
    if (product.type === 'digital') {
      return 0; // No shipping for digital products
    }
    
    if (!product.physical || !product.physical.shippingMethods || product.physical.shippingMethods.length === 0) {
      return 0; // No shipping methods defined
    }
    
    // If specific shipping method is selected
    if (shippingMethodName) {
      const method = product.physical.shippingMethods.find(m => m.name === shippingMethodName);
      return method ? method.price : 0;
    }
    
    // Default to first shipping method
    return product.physical.shippingMethods[0].price;
  };
  
  /**
   * Calculate total price including quantity, VAT, and shipping
   */
  export const calculateTotalPrice = (
    product: IProduct, 
    quantity: number, 
    shippingMethodName?: string
  ): { subtotal: number; vat: number; shipping: number; total: number } => {
    const subtotal = product.price * quantity;
    const vat = calculateVAT(subtotal, product.vatEnabled);
    const shipping = calculateShippingFee(product, shippingMethodName);
    
    return {
      subtotal,
      vat,
      shipping,
      total: subtotal + vat + shipping,
    };
  };
  
  /**
   * Validate billing information
   */
  export const validateBillingInfo = (billingInfo: IBillingInfo): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // Basic email validation
    if (!billingInfo.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Required fields
    if (!billingInfo.name) errors.name = 'Name is required';
    if (!billingInfo.address) errors.address = 'Address is required';
    if (!billingInfo.city) errors.city = 'City is required';
    if (!billingInfo.state) errors.state = 'State is required';
    if (!billingInfo.postalCode) errors.postalCode = 'Postal code is required';
    if (!billingInfo.country) errors.country = 'Country is required';
    
    // Phone validation (simplified)
    if (billingInfo.phone && !/^[+]?[\d\s()-]{8,20}$/.test(billingInfo.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  };
  
  /**
   * Prepare transaction item from product and selections
   */
  export const prepareTransactionItem = (
    product: IProduct,
    quantity: number,
    variantSelections: IVariantSelection[],
    subtotal: number,
    vatAmount: number
  ): ITransactionItem => {
    return {
      productId: product._id,
      productSlug: product.slug,
      productName: product.title,
      productType: product.type,
      productOwnerId: product.merchantId || '',
      quantity,
      unitPrice: product.price,
      subtotal,
      productCurrency: product.defaultCurrency,
      vatEnabled: product.vatEnabled,
      vatAmount: vatAmount,
      variants: variantSelections.length > 0 ? variantSelections : undefined,
    };
  };
  
  /**
   * Get main image URL from product
   */
  export const getMainImageUrl = (product: IProduct): string => {
    const mainImage = product.images.find(img => img.isMain);
    return mainImage ? mainImage.url : (product.images[0]?.url || '');
  };
  
  /**
   * Format date in a readable format
   */
  export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  /**
   * Generate a random transaction ID (for demo)
   */
  export const generateTransactionId = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };