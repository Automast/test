// productlib/utils.ts
import { 
    IProduct, 
    IVariant, 
    IVariantSelection, 
    IBillingInfo, 
    ITransactionItem 
  } from './types';
  import { calculateVATAmount } from './tax';
  
  /**
   * Check if a product is in stock and available for purchase
   */
  export const isProductInStock = (
    product: IProduct, 
    variantSelections: IVariantSelection[],
    requestedQuantity: number = 1
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
  
      // Check if all required variants are selected
      for (const variant of product.variants) {
        const selection = variantSelections.find(s => s.name === variant.name);
        
        // If a variant type doesn't have a selection, product is not ready
        if (!selection || !selection.value) {
          return false;
        }
        
        // Check if the selected variant value is valid
        const valueIndex = variant.values.indexOf(selection.value);
        if (valueIndex === -1) {
          return false;
        }
        
        // Only check stock if stock management is enabled for this variant (variant.stock is defined)
        if (variant.stock !== undefined) {
          if (variant.stock < requestedQuantity) {
            return false;
          }
        }
        // If variant.stock is undefined, it means unlimited stock, so no stock check needed
      }
      
      return true;
    }
  
    // If no variants, check product stock only if stock management is enabled
    if (product.physical && product.physical.stock !== undefined) {
      return product.physical.stock >= requestedQuantity;
    }
  
    // If no stock tracking (stock is undefined), assume it's available (unlimited stock)
    return true;
  };

  /**
   * Get maximum available quantity for a product
   */
  export const getMaxAvailableQuantity = (
    product: IProduct,
    variantSelections: IVariantSelection[]
  ): number => {
    // Digital products have no quantity limit
    if (product.type === 'digital') {
      return 999;
    }

    // If variants exist
    if (product.variants && product.variants.length > 0) {
      // Check if all variants are selected
      const allVariantsSelected = variantSelections.every(selection => selection.value);
      if (!allVariantsSelected) {
        return 1; // Can't determine stock until all variants are selected
      }

      // Get minimum stock across selected variants (only for variants with stock management enabled)
      let minStock = 999;
      let hasStockManagement = false;
      
      for (const variant of product.variants) {
        const selection = variantSelections.find(s => s.name === variant.name);
        // Only check stock if stock management is enabled for this variant (variant.stock is defined)
        if (selection && variant.stock !== undefined) {
          hasStockManagement = true;
          minStock = Math.min(minStock, variant.stock);
        }
      }

      // If no variant has stock management enabled, return unlimited (999)
      if (!hasStockManagement) {
        return 999;
      }

      return Math.max(0, minStock);
    }

    // No variants - check product stock only if stock management is enabled
    if (product.physical?.stock !== undefined) {
      return Math.max(0, product.physical.stock);
    }

    // No stock management enabled = unlimited stock
    return 999;
  };

  /**
   * Get stock status text for display
   */
  export const getStockStatusText = (
    product: IProduct,
    variantSelections: IVariantSelection[]
  ): string => {
    if (product.type === 'digital') {
      return '';
    }

    const maxQuantity = getMaxAvailableQuantity(product, variantSelections);

    // If variants exist but not all are selected
    if (product.variants && product.variants.length > 0) {
      const allVariantsSelected = variantSelections.every(selection => selection.value);
      if (!allVariantsSelected) {
        return 'Select all options to see availability';
      }
    }

    // Check if any variant or product has stock management enabled
    let hasStockManagement = false;
    if (product.variants && product.variants.length > 0) {
      hasStockManagement = product.variants.some(variant => variant.stock !== undefined);
    } else {
      hasStockManagement = product.physical?.stock !== undefined;
    }

    // If no stock management is enabled, don't show any stock info (unlimited stock)
    if (!hasStockManagement) {
      return '';
    }

    if (maxQuantity === 0) {
      return 'Out of stock';
    } else if (maxQuantity < 10) {
      return `Only ${maxQuantity} left in stock`;
    } else {
      return `${maxQuantity} available`;
    }
  };
  
  /**
   * Calculate VAT amount based on price - Updated to use tax data
   */
  export const calculateVAT = async (
    price: number, 
    countryCode?: string, 
    stateCode?: string
  ): Promise<number> => {
    if (!countryCode) {
      return 0;
    }
    
    return await calculateVATAmount(price, countryCode, stateCode);
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
   * Calculate total price including quantity, VAT, and shipping - Updated to use tax data
   */
  export const calculateTotalPrice = async (
    product: IProduct, 
    quantity: number, 
    shippingMethodName?: string,
    countryCode?: string,
    stateCode?: string
  ): Promise<{ subtotal: number; vat: number; shipping: number; total: number }> => {
    const unitPrice = (product as any).localPrice || product.price;
    const subtotal = unitPrice * quantity;
    const vat = await calculateVAT(subtotal, countryCode, stateCode);
    const shipping = calculateShippingFee(product, shippingMethodName);
    
    return {
      subtotal,
      vat,
      shipping,
      total: subtotal + vat + shipping,
    };
  };

  /**
   * Synchronous version of calculateTotalPrice for cases where VAT is already calculated
   */
  export const calculateTotalPriceSync = (
    product: IProduct, 
    quantity: number, 
    shippingMethodName?: string,
    preCalculatedVAT?: number
  ): { subtotal: number; vat: number; shipping: number; total: number } => {
    const unitPrice = (product as any).localPrice || product.price;
    const subtotal = unitPrice * quantity;
    const vat = preCalculatedVAT || 0;
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
    const unitPrice = (product as any).localPrice || product.price;
    const displayCurrency = (product as any).localCurrency || product.defaultCurrency;
    
    return {
      productId: product._id,
      productSlug: product.slug,
      productName: product.title,
      productType: product.type,
      productOwnerId: product.merchantId || '',
      quantity,
      unitPrice: unitPrice,
      totalPrice: subtotal,
      currency: displayCurrency,
      vatEnabled: true, // Always enabled now
      vatAmount: vatAmount,
      variants: variantSelections.length > 0 ? variantSelections : undefined,
    };
  };
  
  /**
   * Get main image URL from product
   */
  export const getMainImageUrl = (product: IProduct): string => {
    if (!product.images || product.images.length === 0) {
      return '';
    }
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
   * Generate a random transaction ID (matching original pattern)
   */
  export const generateTransactionId = (): string => {
    return `TX_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
  };

  /**
   * Check if quantity selection should be enabled for a product
   */
  export const isQuantitySelectionEnabled = (product: IProduct): boolean => {
    // Default to true if quantityEnabled is not set (backward compatibility)
    return product.quantityEnabled !== false;
  };

  /**
   * Get product display info for different product types
   */
  export const getProductDisplayInfo = (product: IProduct): {
    recurringText: string;
    trialText: string;
    stockText: string;
    hasImages: boolean;
    mainImageUrl: string;
  } => {
    let recurringText = '';
    let trialText = '';
    
    // Handle recurring subscription text for digital products
    if (product.type === 'digital' && product.digital?.recurring) {
      const { interval, hasTrial, trialDays } = product.digital.recurring;
      
      if (interval === 'monthly') {
        recurringText = '/month';
      } else if (interval === 'yearly') {
        recurringText = '/year';
      }

      if (hasTrial) {
        if (trialDays && trialDays > 0) {
          trialText = `${trialDays}-day free trial`;
        } else {
          trialText = 'Free trial';
        }
      }
    }

    const hasImages = product.images && product.images.length > 0;
    const mainImageUrl = getMainImageUrl(product);
    const stockText = getStockStatusText(product, []); // Empty selections for initial display

    return {
      recurringText,
      trialText,
      stockText,
      hasImages,
      mainImageUrl,
    };
  };

