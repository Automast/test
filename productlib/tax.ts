// productlib/tax.ts
interface TaxRate {
  type: string;
  currency: string;
  rate: number;
  states?: Record<string, {
    rate: number;
    type: string;
  }>;
  before?: Record<string, {
    type: string;
    currency: string;
    rate: number;
  }>;
}

interface TaxData {
  [countryCode: string]: TaxRate;
}

let taxData: TaxData | null = null;

/**
 * Load tax data from tax.json file
 */
const loadTaxData = async (): Promise<TaxData> => {
  if (taxData) {
    return taxData;
  }

  try {
    console.log('[Tax] Loading tax data from /tax.json');
    
    // Try multiple paths to find the tax.json file
const possiblePaths = ['https://ituberus.github.io/OniStream/tax.json', '/productlib/tax.json', '/tax.json', '/api/tax.json', './tax.json', './productlib/tax.json'];
    let response: Response | null = null;
    
    for (const path of possiblePaths) {
      try {
        response = await fetch(path);
        if (response.ok) {
          console.log(`[Tax] Successfully loaded tax data from: ${path}`);
          break;
        }
      } catch (err) {
        console.log(`[Tax] Failed to load from ${path}, trying next...`);
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error('All tax data paths failed');
    }
    
    const responseText = await response.text();
    
    // Check if response is HTML (404 page) instead of JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('[Tax] Received HTML instead of JSON, tax.json file not found');
      throw new Error('tax.json file not found - received HTML page');
    }
    
    taxData = JSON.parse(responseText);
    console.log('[Tax] Tax data loaded successfully');
    return taxData;
  } catch (error) {
    console.error('[Tax] Error loading tax data:', error);
    // Return comprehensive fallback tax data
    return {
      "US": { 
        "type": "sales_tax", 
        "currency": "USD", 
        "rate": 0, 
        "states": { 
          "AL": { "rate": 0.04, "type": "sales_tax" },
          "AK": { "rate": 0, "type": "sales_tax" },
          "AZ": { "rate": 0.056, "type": "sales_tax" },
          "AR": { "rate": 0.065, "type": "sales_tax" },
          "CA": { "rate": 0.0725, "type": "sales_tax" },
          "CO": { "rate": 0.029, "type": "sales_tax" },
          "CT": { "rate": 0.0635, "type": "sales_tax" },
          "DE": { "rate": 0, "type": "sales_tax" },
          "FL": { "rate": 0.06, "type": "sales_tax" },
          "GA": { "rate": 0.04, "type": "sales_tax" },
          "HI": { "rate": 0.04, "type": "sales_tax" },
          "ID": { "rate": 0.06, "type": "sales_tax" },
          "IL": { "rate": 0.0625, "type": "sales_tax" },
          "IN": { "rate": 0.07, "type": "sales_tax" },
          "IA": { "rate": 0.06, "type": "sales_tax" },
          "KS": { "rate": 0.065, "type": "sales_tax" },
          "KY": { "rate": 0.06, "type": "sales_tax" },
          "LA": { "rate": 0.0445, "type": "sales_tax" },
          "ME": { "rate": 0.055, "type": "sales_tax" },
          "MD": { "rate": 0.06, "type": "sales_tax" },
          "MA": { "rate": 0.0625, "type": "sales_tax" },
          "MI": { "rate": 0.06, "type": "sales_tax" },
          "MN": { "rate": 0.06875, "type": "sales_tax" },
          "MS": { "rate": 0.07, "type": "sales_tax" },
          "MO": { "rate": 0.04225, "type": "sales_tax" },
          "MT": { "rate": 0, "type": "sales_tax" },
          "NE": { "rate": 0.055, "type": "sales_tax" },
          "NV": { "rate": 0.0685, "type": "sales_tax" },
          "NH": { "rate": 0, "type": "sales_tax" },
          "NJ": { "rate": 0.06625, "type": "sales_tax" },
          "NM": { "rate": 0.05125, "type": "sales_tax" },
          "NY": { "rate": 0.08, "type": "sales_tax" },
          "NC": { "rate": 0.0475, "type": "sales_tax" },
          "ND": { "rate": 0.05, "type": "sales_tax" },
          "OH": { "rate": 0.0575, "type": "sales_tax" },
          "OK": { "rate": 0.045, "type": "sales_tax" },
          "OR": { "rate": 0, "type": "sales_tax" },
          "PA": { "rate": 0.06, "type": "sales_tax" },
          "RI": { "rate": 0.07, "type": "sales_tax" },
          "SC": { "rate": 0.06, "type": "sales_tax" },
          "SD": { "rate": 0.045, "type": "sales_tax" },
          "TN": { "rate": 0.07, "type": "sales_tax" },
          "TX": { "rate": 0.0625, "type": "sales_tax" },
          "UT": { "rate": 0.0485, "type": "sales_tax" },
          "VT": { "rate": 0.06, "type": "sales_tax" },
          "VA": { "rate": 0.053, "type": "sales_tax" },
          "WA": { "rate": 0.065, "type": "sales_tax" },
          "WV": { "rate": 0.06, "type": "sales_tax" },
          "WI": { "rate": 0.05, "type": "sales_tax" },
          "WY": { "rate": 0.04, "type": "sales_tax" }
        } 
      },
      "CA": { 
        "type": "gst", 
        "currency": "CAD", 
        "rate": 0.05,
        "states": {
          "AB": { "rate": 0, "type": "gst_only" }, // 5% GST only
          "BC": { "rate": 0.07, "type": "gst_pst" }, // 5% GST + 7% PST = 12%
          "MB": { "rate": 0.07, "type": "gst_pst" }, // 5% GST + 7% PST = 12%
          "NB": { "rate": 0.10, "type": "hst" }, // 10% HST (replaces GST+PST)
          "NL": { "rate": 0.10, "type": "hst" }, // 10% HST
          "NT": { "rate": 0, "type": "gst_only" }, // 5% GST only
          "NS": { "rate": 0.10, "type": "hst" }, // 10% HST
          "NU": { "rate": 0, "type": "gst_only" }, // 5% GST only
          "ON": { "rate": 0.08, "type": "hst" }, // 13% HST (5% GST + 8% provincial portion)
          "PE": { "rate": 0.10, "type": "hst" }, // 10% HST
          "QC": { "rate": 0.09975, "type": "gst_qst" }, // 5% GST + 9.975% QST = 14.975%
          "SK": { "rate": 0.06, "type": "gst_pst" }, // 5% GST + 6% PST = 11%
          "YT": { "rate": 0, "type": "gst_only" } // 5% GST only
        }
      },
      "GB": { "type": "vat", "currency": "GBP", "rate": 0.2 },
      "DE": { "type": "vat", "currency": "EUR", "rate": 0.19 },
      "FR": { "type": "vat", "currency": "EUR", "rate": 0.2 },
      "AU": { "type": "gst", "currency": "AUD", "rate": 0.1 },
      "NZ": { "type": "gst", "currency": "NZD", "rate": 0.15 },
      "NG": { "type": "vat", "currency": "NGN", "rate": 0.075 },
      "BR": { "type": "vat", "currency": "BRL", "rate": 0.17 },
      "IN": { "type": "gst", "currency": "INR", "rate": 0.18 }
    };
  }
};

/**
 * Get VAT rate for a specific country and optional state
 * Handles complex tax structures like Canada's GST + provincial tax
 */
export const getVATRate = async (countryCode: string, stateCode?: string): Promise<number> => {
  try {
    console.log(`[Tax] Getting VAT rate for country: ${countryCode}, state: ${stateCode}`);
    const data = await loadTaxData();
    
    if (!data[countryCode]) {
      console.warn(`[Tax] No tax data found for country: ${countryCode}`);
      return 0;
    }

    const countryTax = data[countryCode];
    
    // For countries with state-specific rates (like US, CA)
    if (stateCode && countryTax.states && countryTax.states[stateCode]) {
      const stateTax = countryTax.states[stateCode];
      let totalRate = 0;
      
      // Handle different tax systems
      if (countryCode === 'CA') {
        // Canadian tax system
        if (stateTax.type === 'hst') {
          // HST replaces both GST and provincial tax
          totalRate = stateTax.rate;
        } else if (stateTax.type === 'gst_pst' || stateTax.type === 'gst_qst') {
          // GST + provincial tax (PST/QST)
          totalRate = countryTax.rate + stateTax.rate; // Federal GST + Provincial tax
        } else if (stateTax.type === 'gst_only') {
          // GST only provinces
          totalRate = countryTax.rate; // Just federal GST
        } else {
          // Fallback
          totalRate = countryTax.rate + stateTax.rate;
        }
      } else {
        // For other countries (like US), just use state rate
        totalRate = stateTax.rate;
      }
      
      console.log(`[Tax] Using state rate for ${countryCode}-${stateCode}: ${totalRate} (type: ${stateTax.type})`);
      return totalRate;
    }

    // Return country-level rate (never use 'before' historical rates)
    const countryRate = countryTax.rate || 0;
    console.log(`[Tax] Using country rate for ${countryCode}: ${countryRate}`);
    return countryRate;
  } catch (error) {
    console.error('[Tax] Error getting VAT rate:', error);
    return 0;
  }
};

/**
 * Calculate VAT amount based on price, country, and optional state
 */
export const calculateVATAmount = async (
  price: number, 
  countryCode: string, 
  stateCode?: string
): Promise<number> => {
  console.log(`[Tax] Calculating VAT for price: ${price}, country: ${countryCode}, state: ${stateCode}`);
  const vatRate = await getVATRate(countryCode, stateCode);
  const vatAmount = parseFloat((price * vatRate).toFixed(2));
  console.log(`[Tax] VAT calculated: ${vatAmount} (rate: ${vatRate})`);
  return vatAmount;
};

/**
 * Get tax information for a country and state
 */
export const getTaxInfo = async (countryCode: string, stateCode?: string): Promise<{
  rate: number;
  type: string;
  currency: string;
  breakdown?: {
    federal?: { rate: number; type: string };
    provincial?: { rate: number; type: string };
  };
}> => {
  try {
    console.log(`[Tax] Getting tax info for country: ${countryCode}, state: ${stateCode}`);
    const data = await loadTaxData();
    
    if (!data[countryCode]) {
      console.warn(`[Tax] No tax info found for country: ${countryCode}`);
      return { rate: 0, type: 'none', currency: 'USD' };
    }

    const countryTax = data[countryCode];
    
    // For countries with state-specific rates
    if (stateCode && countryTax.states && countryTax.states[stateCode]) {
      const stateTax = countryTax.states[stateCode];
      let totalRate = 0;
      let taxType = stateTax.type;
      let breakdown: any = undefined;
      
      // Handle different tax systems
      if (countryCode === 'CA') {
        // Canadian tax system
        if (stateTax.type === 'hst') {
          // HST replaces both GST and provincial tax
          totalRate = stateTax.rate;
          taxType = 'HST';
        } else if (stateTax.type === 'gst_pst') {
          // GST + PST
          totalRate = countryTax.rate + stateTax.rate;
          taxType = 'GST + PST';
          breakdown = {
            federal: { rate: countryTax.rate, type: 'GST' },
            provincial: { rate: stateTax.rate, type: 'PST' }
          };
        } else if (stateTax.type === 'gst_qst') {
          // GST + QST (Quebec)
          totalRate = countryTax.rate + stateTax.rate;
          taxType = 'GST + QST';
          breakdown = {
            federal: { rate: countryTax.rate, type: 'GST' },
            provincial: { rate: stateTax.rate, type: 'QST' }
          };
        } else if (stateTax.type === 'gst_only') {
          // GST only provinces
          totalRate = countryTax.rate;
          taxType = 'GST';
        } else {
          // Fallback
          totalRate = countryTax.rate + stateTax.rate;
          taxType = stateTax.type;
        }
      } else {
        // For other countries (like US), just use state rate
        totalRate = stateTax.rate;
        taxType = stateTax.type;
      }
      
      const result = {
        rate: totalRate,
        type: taxType,
        currency: countryTax.currency,
        breakdown
      };
      console.log(`[Tax] State tax info for ${countryCode}-${stateCode}:`, result);
      return result;
    }

    // Return country-level info
    const result = {
      rate: countryTax.rate || 0,
      type: countryTax.type || 'none',
      currency: countryTax.currency || 'USD'
    };
    console.log(`[Tax] Country tax info for ${countryCode}:`, result);
    return result;
  } catch (error) {
    console.error('[Tax] Error getting tax info:', error);
    return { rate: 0, type: 'none', currency: 'USD' };
  }
};