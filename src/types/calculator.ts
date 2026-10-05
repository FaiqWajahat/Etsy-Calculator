export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'PKR'
  | 'PHP'
  | 'TRY'
  | 'JPY'
  | 'NZD'
  | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  defaultRateToUSD: number; // e.g. USD = 1, PKR = 278, EUR = 0.92, etc.
}

export type CountryCode = 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'IT' | 'ES' | 'TR' | 'IN' | 'OTHER';

export interface CountryFeeConfig {
  code: CountryCode;
  name: string;
  currency: CurrencyCode;
  flag: string;
  processingPercent: number; // e.g. 0.03 for 3%
  processingFixed: number; // e.g. 0.25
  regulatoryPercent: number; // e.g. 0.0032 for UK 0.32%
}

export type ListingType = 'physical' | 'digital' | 'pod';

export interface CalculatorInputs {
  // Essential inputs (Only 2 required for quick start!)
  salePrice: number; // In target listing currency (USD/EUR)
  itemCost: number;  // In local cost currency

  // Currencies
  costCurrency: CurrencyCode;       // Currency used for costs (e.g., PKR, INR, EUR)
  listingCurrency: CurrencyCode;    // Currency buyer pays (USD or EUR)
  exchangeRateOverride?: number;   // Optional manual exchange rate override

  // Optional seller costs (in local cost currency)
  shippingChargedToCustomer: number; // 0 if free shipping
  shippingActualCost: number;        // Carrier shipping label cost
  packagingCost: number;             // Boxes, bags, tags
  laborHours: number;                // Hours spent
  laborRatePerHour: number;          // Hourly rate in local currency

  // Optional Etsy & Marketing settings
  sellerCountry: CountryCode;
  offsiteAdsPercent: number;         // 0, 12, or 15
  etsyAdsCostPerSale: number;        // Ad spend allocated per unit sold
  discountPercent: number;           // Store promo discount (e.g. 10%)
  renewalsCount: number;             // Default 1 listing fee ($0.20)
  listingType: ListingType;
}

export interface FeeBreakdown {
  listingFeeListingCurr: number;
  transactionFeeListingCurr: number;
  processingFeeListingCurr: number;
  regulatoryFeeListingCurr: number;
  offsiteAdsFeeListingCurr: number;
  currencyConversionFeeListingCurr: number;
  totalEtsyFeesListingCurr: number;
}

export interface CalculationResult {
  // Listing Currency figures (USD/EUR)
  grossRevenueListingCurr: number;
  totalCostsListingCurr: number;
  itemCostListingCurr: number;
  shippingCostListingCurr: number;
  packagingCostListingCurr: number;
  laborCostListingCurr: number;
  marketingCostListingCurr: number;
  fees: FeeBreakdown;
  netProfitListingCurr: number;

  // Local Wallet Currency figures (PKR, INR, EUR, etc.)
  effectiveExchangeRate: number; // Rate applied (1 ListingCurr = X LocalCurr)
  grossRevenueLocalCurr: number;
  totalEtsyFeesLocalCurr: number;
  totalCostsLocalCurr: number;
  netProfitLocalCurr: number;

  // Metrics & Margins
  profitMarginPercent: number; // Net Profit / Gross Revenue * 100
  markupPercent: number;       // Net Profit / Total Costs * 100
  roiPercent: number;          // Net Profit / (Costs + Fees) * 100
  breakEvenPriceListingCurr: number; // Minimum price to have $0 profit
  breakEvenPriceLocalCurr: number;

  // Health assessment
  healthStatus: 'exceptional' | 'healthy' | 'moderate' | 'low' | 'loss';
  healthMessage: string;
  recommendations: string[];
}

export interface StudioPricingInputs {
  productTitle: string;
  productCost: number | '';
  shippingCost: number | '';
  extraCost: number | '';
  platformFeePercent: number;
  profitMarginPercent: number | '';
  discountPercent: number | '';
  savedExchangeRate?: number;
}

export interface CloudinarySlipItem {
  _id?: string;
  id?: string;
  title: string;
  cloudinaryUrl: string;
  publicId?: string;
  netSellingPriceUSD: number;
  originalPriceUSD?: number;
  discountPercent?: number;
  netProfitLocal: number;
  costCurrency: string;
  listingCurrency: string;
  createdAt: string;
}

export interface SavedListingItem {
  id?: string;
  _id?: string;
  title: string;
  sku?: string;
  category?: string;
  listingType?: ListingType;
  inputs: CalculatorInputs;
  studioPricing?: StudioPricingInputs;
  results: CalculationResult;
  listingTags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  cloudinarySlipUrl?: string;
  material?: string;
  fullDescription?: string;
  personalizationInstructions?: string;
  alternativeTitles?: string[];
  metaDescription?: string;
  bulletPoints?: string[];
}

export interface ShopCustomRule {
  minProfitMargin: number;    // Target margin % (applied as default in calculator, default 30%)
  minProfitAmountUSD: number; // Warn if dollar profit < this (default $5)
  defaultPlatformFeePercent?: number; // Combined Etsy & Payoneer fee rule % (default 15%)
  defaultDiscountPercent?: number;    // Default promotional discount % (default 0%)
  maxFeePercentage?: number;   // Deprecated / removed per user request
  freeShippingWarning?: boolean; // Deprecated / removed per user request
}

export interface ShippingWeightSlab {
  weightKg: number;   // e.g. 0.5, 1.0, 1.5, 2.0
  costPKR: number;    // actual cost in seller's local currency (PKR by default)
}

export interface ShippingRateCard {
  id?: string;
  _id?: string;
  courier: string;                // e.g. "DHL Express", "FedEx Economy", "Skynet"
  zoneLabel: string;             // e.g. "USA & Canada", "UK & Europe", "Gulf/UAE/Saudi"
  countries: string[];           // list of destination countries in this zone
  weightSlabs: ShippingWeightSlab[];
  currency: string;              // e.g. "PKR"
  fuelSurchargePercent?: number; // optional fuel surcharge %
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
