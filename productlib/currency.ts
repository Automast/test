// productlib/currency.ts
import { ICurrency } from './types';

// Define currencies with their properties
export const currencies: Record<string, ICurrency> = {
    USD: { code: 'USD', symbol: '$',  name: 'US Dollar',                   countries: ['US','EC','SV','PA','TL','PW','FM','MH','ZW'],                       pixSupported: false },
    EUR: { code: 'EUR', symbol: '€',  name: 'Euro',                        countries: ['DE','FR','IT','ES','PT','NL','BE','AT','GR','IE','FI','SK','SI','LT','LV','EE','CY','MT','LU','HR'], pixSupported: false },
    GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',               countries: ['GB'],                                                              pixSupported: false },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',             countries: ['CA'],                                                             pixSupported: false },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',           countries: ['AU'],                                                             pixSupported: false },
    NZD: { code: 'NZD', symbol: 'NZ$',name: 'New Zealand Dollar',          countries: ['NZ','CK','NU','PN','TK'],                                         pixSupported: false },
    JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',                countries: ['JP'],                                                             pixSupported: false },
    CNY: { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',                countries: ['CN'],                                                             pixSupported: false },
    HKD: { code: 'HKD', symbol: 'HK$',name: 'Hong Kong Dollar',            countries: ['HK'],                                                             pixSupported: false },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',            countries: ['SG'],                                                             pixSupported: false },
    INR: { code: 'INR', symbol: '₹',  name: 'Indian Rupee',                countries: ['IN'],                                                             pixSupported: false },
    PKR: { code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee',             countries: ['PK'],                                                             pixSupported: false },
    BDT: { code: 'BDT', symbol: '৳',  name: 'Bangladeshi Taka',            countries: ['BD'],                                                             pixSupported: false },
    IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah',           countries: ['ID'],                                                             pixSupported: false },
    MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit',           countries: ['MY'],                                                             pixSupported: false },
    THB: { code: 'THB', symbol: '฿',  name: 'Thai Baht',                   countries: ['TH'],                                                             pixSupported: false },
    VND: { code: 'VND', symbol: '₫',  name: 'Vietnamese Đồng',             countries: ['VN'],                                                             pixSupported: false },
    PHP: { code: 'PHP', symbol: '₱',  name: 'Philippine Peso',             countries: ['PH'],                                                             pixSupported: false },
    KRW: { code: 'KRW', symbol: '₩',  name: 'South Korean Won',            countries: ['KR'],                                                             pixSupported: false },
    TWD: { code: 'TWD', symbol: 'NT$',name: 'New Taiwan Dollar',           countries: ['TW'],                                                             pixSupported: false },
    SAR: { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal',                 countries: ['SA'],                                                             pixSupported: false },
    AED: { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham',                  countries: ['AE'],                                                             pixSupported: false },
    QAR: { code: 'QAR', symbol: '﷼',  name: 'Qatari Riyal',                countries: ['QA'],                                                             pixSupported: false },
    KWD: { code: 'KWD', symbol: 'د.ك',name: 'Kuwaiti Dinar',               countries: ['KW'],                                                             pixSupported: false },
    BHD: { code: 'BHD', symbol: 'ب.د',name: 'Bahraini Dinar',              countries: ['BH'],                                                             pixSupported: false },
    OMR: { code: 'OMR', symbol: '﷼',  name: 'Omani Rial',                  countries: ['OM'],                                                             pixSupported: false },
    JOD: { code: 'JOD', symbol: 'د.ا',name: 'Jordanian Dinar',             countries: ['JO'],                                                             pixSupported: false },
    EGP: { code: 'EGP', symbol: '£',  name: 'Egyptian Pound',              countries: ['EG'],                                                             pixSupported: false },
    MAD: { code: 'MAD', symbol: 'د.م.',name: 'Moroccan Dirham',            countries: ['MA'],                                                             pixSupported: false },
    DZD: { code: 'DZD', symbol: 'دج', name: 'Algerian Dinar',              countries: ['DZ'],                                                             pixSupported: false },
    TND: { code: 'TND', symbol: 'د.ت',name: 'Tunisian Dinar',              countries: ['TN'],                                                             pixSupported: false },
    NGN: { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',              countries: ['NG'],                                                             pixSupported: false },
    GHS: { code: 'GHS', symbol: '₵',  name: 'Ghanaian Cedi',               countries: ['GH'],                                                             pixSupported: false },
    KES: { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling',             countries: ['KE'],                                                             pixSupported: false },
    TZS: { code: 'TZS', symbol: 'TSh',name: 'Tanzanian Shilling',          countries: ['TZ'],                                                             pixSupported: false },
    ZAR: { code: 'ZAR', symbol: 'R',  name: 'South African Rand',          countries: ['ZA','LS','SZ','NA'],                                              pixSupported: false },
    XOF: { code: 'XOF', symbol: 'CFA',name: 'West African CFA Franc',      countries: ['BJ','BF','CI','GW','ML','NE','SN','TG'],                           pixSupported: false },
    XAF: { code: 'XAF', symbol: 'CFA',name: 'Central African CFA Franc',   countries: ['CM','CF','TD','CG','GQ','GA'],                                     pixSupported: false },
    XPF: { code: 'XPF', symbol: '₣',  name: 'CFP Franc',                   countries: ['PF','NC','WF'],                                                   pixSupported: false },
    GYD: { code: 'GYD', symbol: 'G$', name: 'Guyanese Dollar',             countries: ['GY'],                                                             pixSupported: false },
    ARS: { code: 'ARS', symbol: 'AR$',name: 'Argentine Peso',              countries: ['AR'],                                                             pixSupported: false },
    CLP: { code: 'CLP', symbol: 'CLP$',name: 'Chilean Peso',               countries: ['CL'],                                                             pixSupported: false },
    COP: { code: 'COP', symbol: 'COL$',name: 'Colombian Peso',             countries: ['CO'],                                                             pixSupported: false },
    PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol',                countries: ['PE'],                                                             pixSupported: false },
    UYU: { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso',              countries: ['UY'],                                                             pixSupported: false },
    PYG: { code: 'PYG', symbol: '₲',  name: 'Paraguayan Guarani',          countries: ['PY'],                                                             pixSupported: false },
    BOB: { code: 'BOB', symbol: 'Bs.',name: 'Bolivian Boliviano',          countries: ['BO'],                                                             pixSupported: false },
    BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real',              countries: ['BR'],                                                             pixSupported: true  },
    MXN: { code: 'MXN', symbol: 'MX$',name: 'Mexican Peso',                countries: ['MX'],                                                             pixSupported: false },
    CRC: { code: 'CRC', symbol: '₡',  name: 'Costa Rican Colón',           countries: ['CR'],                                                             pixSupported: false },
    DOP: { code: 'DOP', symbol: 'RD$',name: 'Dominican Peso',              countries: ['DO'],                                                             pixSupported: false },
    HNL: { code: 'HNL', symbol: 'L',  name: 'Honduran Lempira',            countries: ['HN'],                                                             pixSupported: false },
    GTQ: { code: 'GTQ', symbol: 'Q',  name: 'Guatemalan Quetzal',          countries: ['GT'],                                                             pixSupported: false },
    NIO: { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba',          countries: ['NI'],                                                             pixSupported: false },
    BZD: { code: 'BZD', symbol: 'BZ$',name: 'Belize Dollar',               countries: ['BZ'],                                                             pixSupported: false },
    HTG: { code: 'HTG', symbol: 'G',  name: 'Haitian Gourde',              countries: ['HT'],                                                             pixSupported: false },
    BSD: { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar',             countries: ['BS'],                                                             pixSupported: false },
    KYD: { code: 'KYD', symbol: 'CI$',name: 'Cayman Islands Dollar',       countries: ['KY'],                                                             pixSupported: false },
    BMD: { code: 'BMD', symbol: 'BD$',name: 'Bermudian Dollar',            countries: ['BM'],                                                             pixSupported: false },
    TTD: { code: 'TTD', symbol: 'TT$',name: 'Trinidad and Tobago Dollar',  countries: ['TT'],                                                             pixSupported: false },
    XCD: { code: 'XCD', symbol: 'EC$',name: 'East Caribbean Dollar',       countries: ['AG','DM','GD','KN','LC','VC','AI','MS'],                           pixSupported: false },
    CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',                 countries: ['CH','LI'],                                                        pixSupported: false },
    SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona',               countries: ['SE'],                                                             pixSupported: false },
    NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone',             countries: ['NO','SJ'],                                                        pixSupported: false },
    DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone',                countries: ['DK','GL','FO'],                                                   pixSupported: false },
    PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty',                countries: ['PL'],                                                             pixSupported: false },
    CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna',                countries: ['CZ'],                                                             pixSupported: false },
    HUF: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint',            countries: ['HU'],                                                             pixSupported: false },
    RON: { code: 'RON', symbol: 'lei',name: 'Romanian Leu',                countries: ['RO'],                                                             pixSupported: false },
    BGN: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev',               countries: ['BG'],                                                             pixSupported: false },
    RSD: { code: 'RSD', symbol: 'дин',name: 'Serbian Dinar',               countries: ['RS'],                                                             pixSupported: false },
    RUB: { code: 'RUB', symbol: '₽',  name: 'Russian Ruble',               countries: ['RU'],                                                             pixSupported: false },
    TRY: { code: 'TRY', symbol: '₺',  name: 'Turkish Lira',                countries: ['TR','CY'],                                                        pixSupported: false },
    UAH: { code: 'UAH', symbol: '₴',  name: 'Ukrainian Hryvnia',           countries: ['UA'],                                                             pixSupported: false },
    BYN: { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble',            countries: ['BY'],                                                             pixSupported: false },
    KZT: { code: 'KZT', symbol: '₸',  name: 'Kazakhstani Tenge',           countries: ['KZ'],                                                             pixSupported: false },
    UZS: { code: 'UZS', symbol: "so'm",name: 'Uzbekistani Soʻm',           countries: ['UZ'],                                                             pixSupported: false },
    AZN: { code: 'AZN', symbol: '₼',  name: 'Azerbaijani Manat',           countries: ['AZ'],                                                             pixSupported: false },
    GEL: { code: 'GEL', symbol: '₾',  name: 'Georgian Lari',               countries: ['GE'],                                                             pixSupported: false },
    AMD: { code: 'AMD', symbol: '֏',  name: 'Armenian Dram',               countries: ['AM'],                                                             pixSupported: false },
    IRR: { code: 'IRR', symbol: '﷼',  name: 'Iranian Rial',                countries: ['IR'],                                                             pixSupported: false },
    IQD: { code: 'IQD', symbol: 'ع.د',name: 'Iraqi Dinar',                 countries: ['IQ'],                                                             pixSupported: false },
    LBP: { code: 'LBP', symbol: 'ل.ل',name: 'Lebanese Pound',              countries: ['LB'],                                                             pixSupported: false },
    SYP: { code: 'SYP', symbol: '£',  name: 'Syrian Pound',                countries: ['SY'],                                                             pixSupported: false },
    YER: { code: 'YER', symbol: '﷼',  name: 'Yemeni Rial',                 countries: ['YE'],                                                             pixSupported: false },
    AFN: { code: 'AFN', symbol: '؋',  name: 'Afghan Afghani',              countries: ['AF'],                                                             pixSupported: false },
    NPR: { code: 'NPR', symbol: '₨',  name: 'Nepalese Rupee',              countries: ['NP'],                                                             pixSupported: false },
    BTN: { code: 'BTN', symbol: 'Nu.',name: 'Bhutanese Ngultrum',          countries: ['BT'],                                                             pixSupported: false },
    LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee',            countries: ['LK'],                                                             pixSupported: false },
    MMK: { code: 'MMK', symbol: 'K',  name: 'Myanmar Kyat',                countries: ['MM'],                                                             pixSupported: false },
    KHR: { code: 'KHR', symbol: '៛',  name: 'Cambodian Riel',              countries: ['KH'],                                                             pixSupported: false },
    LAK: { code: 'LAK', symbol: '₭',  name: 'Lao Kip',                     countries: ['LA'],                                                             pixSupported: false },
    MNT: { code: 'MNT', symbol: '₮',  name: 'Mongolian Tögrög',            countries: ['MN'],                                                             pixSupported: false },
    PGK: { code: 'PGK', symbol: 'K',  name: 'Papua New Guinean Kina',      countries: ['PG'],                                                             pixSupported: false },
    SBD: { code: 'SBD', symbol: 'SI$',name: 'Solomon Islands Dollar',      countries: ['SB'],                                                             pixSupported: false },
    VUV: { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu',                countries: ['VU'],                                                             pixSupported: false },
    WST: { code: 'WST', symbol: 'WS$',name: 'Samoan Tala',                 countries: ['WS'],                                                             pixSupported: false },
    TOP: { code: 'TOP', symbol: 'T$', name: "Tongan Pa'anga",              countries: ['TO'],                                                             pixSupported: false },
    FJD: { code: 'FJD', symbol: 'FJ$',name: 'Fijian Dollar',               countries: ['FJ'],                                                             pixSupported: false },
    MGA: { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary',             countries: ['MG'],                                                             pixSupported: false },
    MUR: { code: 'MUR', symbol: 'Rs', name: 'Mauritian Rupee',             countries: ['MU'],                                                             pixSupported: false },
    SCR: { code: 'SCR', symbol: 'Rs', name: 'Seychellois Rupee',           countries: ['SC'],                                                             pixSupported: false },
    MZN: { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical',          countries: ['MZ'],                                                             pixSupported: false },
    ZMW: { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha',              countries: ['ZM'],                                                             pixSupported: false },
    MWK: { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha',             countries: ['MW'],                                                             pixSupported: false },
    GNF: { code: 'GNF', symbol: 'FG', name: 'Guinean Franc',               countries: ['GN'],                                                             pixSupported: false },
    RWF: { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc',               countries: ['RW'],                                                             pixSupported: false },
    BIF: { code: 'BIF', symbol: 'FBu',name: 'Burundian Franc',             countries: ['BI'],                                                             pixSupported: false },
    UGX: { code: 'UGX', symbol: 'USh',name: 'Ugandan Shilling',            countries: ['UG'],                                                             pixSupported: false },
    SSP: { code: 'SSP', symbol: '£',  name: 'South Sudanese Pound',        countries: ['SS'],                                                             pixSupported: false },
    SDG: { code: 'SDG', symbol: '£',  name: 'Sudanese Pound',              countries: ['SD'],                                                             pixSupported: false },
    MOP: { code: 'MOP', symbol: 'MOP$',name: 'Macanese Pataca',            countries: ['MO'],                                                             pixSupported: false },
    CUP: { code: 'CUP', symbol: '₱',  name: 'Cuban Peso',                  countries: ['CU'],                                                             pixSupported: false },
    BWP: { code: 'BWP', symbol: 'P',  name: 'Botswanan Pula',              countries: ['BW'],                                                             pixSupported: false },
    NAD: { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar',             countries: ['NA'],                                                             pixSupported: false },
    ETB: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr',              countries: ['ET'],                                                             pixSupported: false },
    KPW: { code: 'KPW', symbol: '₩',  name: 'North Korean Won',            countries: ['KP'],                                                             pixSupported: false },
    SLE: { code: 'SLE', symbol: 'Le', name: 'Sierra Leonean Leone',        countries: ['SL'],                                                             pixSupported: false },
    GMD: { code: 'GMD', symbol: 'D',  name: 'Gambian Dalasi',              countries: ['GM'],                                                             pixSupported: false },
    CVE: { code: 'CVE', symbol: '$',  name: 'Cape Verdean Escudo',         countries: ['CV'],                                                             pixSupported: false },
    DJF: { code: 'DJF', symbol: 'Fdj',name: 'Djiboutian Franc',            countries: ['DJ'],                                                             pixSupported: false },
    ERN: { code: 'ERN', symbol: 'Nfk',name: 'Eritrean Nakfa',              countries: ['ER'],                                                             pixSupported: false },
    KMF: { code: 'KMF', symbol: 'CF', name: 'Comorian Franc',             countries: ['KM'],                                                             pixSupported: false },
    TMT: { code: 'TMT', symbol: 'm',  name: 'Turkmenistani Manat',         countries: ['TM'],                                                             pixSupported: false },
    TJS: { code: 'TJS', symbol: 'ЅM', name: 'Tajikistani Somoni',          countries: ['TJ'],                                                             pixSupported: false },
    MRU: { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya',         countries: ['MR'],                                                             pixSupported: false },
    STN: { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', countries: ['ST'],                                                             pixSupported: false },
    PAB: { code: 'PAB', symbol: 'B/.',name: 'Panamanian Balboa',           countries: ['PA'],                                                             pixSupported: false },
};

// Free Exchange Rate API
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/';

/**
 * Get the currency for a country code
 */
export const getCurrencyForCountry = (countryCode: string): string => {
  for (const [code, currency] of Object.entries(currencies)) {
    if (currency.countries.includes(countryCode)) {
      return code;
    }
  }
  return 'USD'; // Default to USD if not found
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number, currencyCode: string): string => {
  const currency = currencies[currencyCode] || currencies.USD;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

// Fallback rates for common currency pairs (as of May 2025)
const fallbackRates: Record<string, Record<string, number>> = {
  USD: { 
    BRL: 5.88, 
    EUR: 0.93, 
    GBP: 0.79, 
    CAD: 1.36, 
    AUD: 1.51, 
    JPY: 154.32,
    NGN: 1465.00, // Nigerian Naira
    GHS: 15.75,  // Ghanaian Cedi
    KES: 130.50, // Kenyan Shilling
    ZAR: 18.25,  // South African Rand
    INR: 83.95,  // Indian Rupee
    PHP: 57.20,  // Philippine Peso
    MXN: 16.80,  // Mexican Peso
  },
  // Add inverse rates for common conversions back to USD
  BRL: { USD: 0.17 },
  EUR: { USD: 1.08 },
  GBP: { USD: 1.27 },
  NGN: { USD: 0.00068 },
};

/**
 * Convert price from one currency to another
 */
export const convertPrice = async (
  price: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> => {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return price;
  }
  
  try {
    console.log(`Converting ${price} from ${fromCurrency} to ${toCurrency}`);
    const response = await fetch(`${EXCHANGE_RATE_API}${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      const convertedPrice = price * data.rates[toCurrency];
      console.log(`Converted to ${convertedPrice} ${toCurrency} using API rate ${data.rates[toCurrency]}`);
      return parseFloat(convertedPrice.toFixed(2));
    }
    
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  } catch (error) {
    console.error('Currency conversion error:', error);
    
    // Try direct conversion using fallback rates
    if (fallbackRates[fromCurrency]?.[toCurrency]) {
      const convertedPrice = price * fallbackRates[fromCurrency][toCurrency];
      console.log(`Converted to ${convertedPrice} ${toCurrency} using fallback rate ${fallbackRates[fromCurrency][toCurrency]}`);
      return parseFloat(convertedPrice.toFixed(2));
    }
    
    // Try indirect conversion through USD
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      try {
        // Convert from source currency to USD
        let usdAmount = price;
        if (fallbackRates[fromCurrency]?.USD) {
          usdAmount = price * fallbackRates[fromCurrency].USD;
        } else if (fallbackRates.USD?.[fromCurrency]) {
          usdAmount = price / fallbackRates.USD[fromCurrency];
        }
        
        // Convert from USD to target currency
        if (fallbackRates.USD?.[toCurrency]) {
          const convertedPrice = usdAmount * fallbackRates.USD[toCurrency];
          console.log(`Converted to ${convertedPrice} ${toCurrency} via USD using fallback rates`);
          return parseFloat(convertedPrice.toFixed(2));
        }
      } catch (indirectError) {
        console.error('Indirect conversion error:', indirectError);
      }
    }
    
    // Default to original price if conversion fails
    console.warn(`Falling back to original price due to conversion failure`);
    return price;
  }
};

/**
 * Convert all price components using the same conversion rate
 */
export const convertPriceComponents = (
  unitPrice: number,
  convertedUnitPrice: number,
  components: { subtotal: number; vat: number; shipping: number; total: number }
): { subtotal: number; vat: number; shipping: number; total: number } => {
  // Calculate the conversion rate based on the unit price conversion
  const conversionRate = convertedUnitPrice / unitPrice;
  
  // Convert each component using the same rate
  return {
    subtotal: parseFloat((components.subtotal * conversionRate).toFixed(2)),
    vat: parseFloat((components.vat * conversionRate).toFixed(2)),
    shipping: parseFloat((components.shipping * conversionRate).toFixed(2)),
    total: parseFloat(((components.subtotal + components.vat + components.shipping) * conversionRate).toFixed(2))
  };
};

/**
 * Check if PIX payment is supported for a currency
 */
export const isPixSupported = (currencyCode: string): boolean => {
  return currencies[currencyCode]?.pixSupported || false;
};

/**
 * Get user country from IP (simplified version - would use a real geolocation API)
 */
export const getUserCountry = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.country.is');
      const data = await response.json();
      console.log('User country detected:', data.country);
      return data.country;
    } catch (error) {
      console.error('Failed to get user country:', error);
      return 'US'; // Default to US if geolocation fails
    }
  };

/**
 * Get user currency based on their location
 */
export const getUserCurrency = async (): Promise<string> => {
  const country = await getUserCountry();
  const currency = getCurrencyForCountry(country);
  console.log(`User currency for country ${country}: ${currency}`);
  return currency;
};