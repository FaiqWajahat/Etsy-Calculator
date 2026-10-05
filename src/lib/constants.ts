import { CurrencyCode, CurrencyInfo, CountryCode, CountryFeeConfig, ShopCustomRule } from '@/types/calculator';

// Supported Currencies with fallback rates against USD (1 USD = X Local)
export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', defaultRateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', defaultRateToUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', defaultRateToUSD: 0.79 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', defaultRateToUSD: 1.36 },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', defaultRateToUSD: 1.52 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', defaultRateToUSD: 83.5 },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰', defaultRateToUSD: 278.5 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', defaultRateToUSD: 58.2 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', defaultRateToUSD: 33.1 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', defaultRateToUSD: 154.0 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', defaultRateToUSD: 1.64 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', defaultRateToUSD: 1.34 },
};

// Target Listing Currencies (Main currencies customers buy in on Etsy)
export const LISTING_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

// Country specific fees based on 2025/2026 Etsy Seller Policy
export const COUNTRY_FEE_CONFIGS: Record<CountryCode, CountryFeeConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    flag: '🇺🇸',
    processingPercent: 0.03, // 3%
    processingFixed: 0.25,  // $0.25
    regulatoryPercent: 0.0,
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    flag: '🇬🇧',
    processingPercent: 0.04, // 4%
    processingFixed: 0.20,  // £0.20
    regulatoryPercent: 0.0032, // 0.32% UK Digital Services tax
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    flag: '🇨🇦',
    processingPercent: 0.035, // 3.5%
    processingFixed: 0.25,   // $0.25 CAD
    regulatoryPercent: 0.004, // 0.40%
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    flag: '🇦🇺',
    processingPercent: 0.035, // 3.5%
    processingFixed: 0.25,   // $0.25 AUD
    regulatoryPercent: 0.0,
  },
  DE: {
    code: 'DE',
    name: 'Germany (EU)',
    currency: 'EUR',
    flag: '🇩🇪',
    processingPercent: 0.04, // 4%
    processingFixed: 0.30,  // €0.30
    regulatoryPercent: 0.0,
  },
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    flag: '🇫🇷',
    processingPercent: 0.04, // 4%
    processingFixed: 0.30,  // €0.30
    regulatoryPercent: 0.0047, // 0.47%
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    flag: '🇮🇹',
    processingPercent: 0.04, // 4%
    processingFixed: 0.30,  // €0.30
    regulatoryPercent: 0.0032, // 0.32%
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    flag: '🇪🇸',
    processingPercent: 0.04, // 4%
    processingFixed: 0.30,  // €0.30
    regulatoryPercent: 0.004, // 0.40%
  },
  TR: {
    code: 'TR',
    name: 'Turkey',
    currency: 'TRY',
    flag: '🇹🇷',
    processingPercent: 0.065, // 6.5%
    processingFixed: 3.0,    // 3.00 TRY
    regulatoryPercent: 0.0227, // 2.27%
  },
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    flag: '🇮🇳',
    processingPercent: 0.03, // 3%
    processingFixed: 15.0,  // ₹15
    regulatoryPercent: 0.005, // 0.5%
  },
  OTHER: {
    code: 'OTHER',
    name: 'Other International (PayPal / Payoneer)',
    currency: 'USD',
    flag: '🌐',
    processingPercent: 0.045, // 4.5% avg
    processingFixed: 0.30,
    regulatoryPercent: 0.0,
  },
};

export const ETSY_FIXED_LISTING_FEE_USD = 0.20; // $0.20 per listing / renewal
export const ETSY_TRANSACTION_FEE_PERCENT = 0.065; // 6.5% of total order
export const ETSY_CURRENCY_CONVERSION_PERCENT = 0.025; // 2.5% when listing currency != bank account currency

export const DEFAULT_RULES: ShopCustomRule = {
  minProfitMargin: 30, // 30% margin target
  minProfitAmountUSD: 5.0, // Minimum $5 profit per item
  defaultPlatformFeePercent: 15, // Combined Etsy + Payoneer fee %
  defaultDiscountPercent: 0, // Default promotional discount % (0% = full price)
};

export const QUICK_PRESETS = [
  {
    id: 'digital',
    label: 'Digital Download',
    icon: 'FileDown',
    description: 'Instant downloads (e.g. printables, templates, SVG, digital planners). $0 shipping, $0 packaging.',
    patch: {
      listingType: 'digital' as const,
      shippingChargedToCustomer: 0,
      shippingActualCost: 0,
      packagingCost: 0,
      laborHours: 0,
      laborRatePerHour: 0,
    },
  },
  {
    id: 'pod',
    label: 'Print on Demand (POD)',
    icon: 'Printer',
    description: 'Production partner (e.g. Printify, Printful). Base item + print costs, partner shipping.',
    patch: {
      listingType: 'pod' as const,
      packagingCost: 0, // Packaging included in partner fee
      laborHours: 0,
    },
  },
  {
    id: 'handmade',
    label: 'Handmade Craft',
    icon: 'Sparkles',
    description: 'Physical crafts made by you. Tracks raw materials, packaging, labor time, and postage.',
    patch: {
      listingType: 'physical' as const,
    },
  },
  {
    id: 'free-shipping',
    label: 'Free Shipping ($35+ Guarantee)',
    icon: 'Truck',
    description: 'Etsy favors listings with Free Shipping over $35 in search results. Shipping charged = $0.',
    patch: {
      shippingChargedToCustomer: 0,
    },
  },
];
