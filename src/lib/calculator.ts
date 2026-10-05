import {
  CalculatorInputs,
  CalculationResult,
  FeeBreakdown,
  CurrencyCode,
} from '@/types/calculator';
import {
  COUNTRY_FEE_CONFIGS,
  ETSY_FIXED_LISTING_FEE_USD,
  ETSY_TRANSACTION_FEE_PERCENT,
  ETSY_CURRENCY_CONVERSION_PERCENT,
  SUPPORTED_CURRENCIES,
} from './constants';
import { convertCurrency, getExchangeMultiplier } from './currency';

/**
 * Calculates complete Etsy profit, itemized fees, margins, and health metrics.
 */
export function calculateEtsyProfit(
  inputs: CalculatorInputs,
  rates: Record<string, number> = {}
): CalculationResult {
  const {
    salePrice = 0,
    itemCost = 0,
    costCurrency = 'USD',
    listingCurrency = 'USD',
    exchangeRateOverride,
    shippingChargedToCustomer = 0,
    shippingActualCost = 0,
    packagingCost = 0,
    laborHours = 0,
    laborRatePerHour = 0,
    sellerCountry = 'US',
    offsiteAdsPercent = 0,
    etsyAdsCostPerSale = 0,
    discountPercent = 0,
    renewalsCount = 1,
  } = inputs;

  const countryConfig = COUNTRY_FEE_CONFIGS[sellerCountry] || COUNTRY_FEE_CONFIGS.US;

  // Multiplier: 1 Listing Currency = X Local Cost Currency
  const exchangeMultiplier = getExchangeMultiplier(
    listingCurrency,
    costCurrency,
    rates,
    exchangeRateOverride
  );

  // Convert a local cost value into the listing currency
  const toListingCurr = (localVal: number) => {
    if (exchangeMultiplier <= 0) return 0;
    return localVal / exchangeMultiplier;
  };

  // Convert a listing currency value to local currency
  const toLocalCurr = (listingVal: number) => {
    return listingVal * exchangeMultiplier;
  };

  // 1. Gross Revenue in Listing Currency
  const effectivePrice = Math.max(0, salePrice * (1 - (discountPercent || 0) / 100));
  const effectiveShippingCharged = Math.max(0, shippingChargedToCustomer);
  const grossRevenueListingCurr = effectivePrice + effectiveShippingCharged;

  // 2. Listing Fee ($0.20 USD per renewal) converted to listing currency
  const listingFeeInUSD = ETSY_FIXED_LISTING_FEE_USD * Math.max(1, renewalsCount);
  const listingFeeListingCurr = convertCurrency(listingFeeInUSD, 'USD', listingCurrency, rates);

  // 3. Etsy Transaction Fee (6.5% of order total: price + shipping)
  const transactionFeeListingCurr = grossRevenueListingCurr * ETSY_TRANSACTION_FEE_PERCENT;

  // 4. Payment Processing Fee (Country specific: % + fixed)
  // The fixed portion is in the country's native currency, convert to listing currency
  const fixedProcessingInListingCurr = convertCurrency(
    countryConfig.processingFixed,
    countryConfig.currency,
    listingCurrency,
    rates
  );
  const processingFeeListingCurr =
    grossRevenueListingCurr > 0
      ? grossRevenueListingCurr * countryConfig.processingPercent + fixedProcessingInListingCurr
      : 0;

  // 5. Regulatory Operating Fee (for UK, FR, IT, ES, TR, IN, CA)
  const regulatoryFeeListingCurr = grossRevenueListingCurr * countryConfig.regulatoryPercent;

  // 6. Offsite Ads Fee (0%, 12%, or 15% of order total)
  const offsiteAdsFeeListingCurr =
    grossRevenueListingCurr * ((offsiteAdsPercent || 0) / 100);

  // 7. Etsy 2.5% Currency Conversion Fee
  // Applies if the listing currency does not match the seller's country bank currency
  const isCurrencyMismatch = listingCurrency !== countryConfig.currency;
  const currencyConversionFeeListingCurr = isCurrencyMismatch
    ? grossRevenueListingCurr * ETSY_CURRENCY_CONVERSION_PERCENT
    : 0;

  // Total Etsy Fees in Listing Currency
  const totalEtsyFeesListingCurr =
    listingFeeListingCurr +
    transactionFeeListingCurr +
    processingFeeListingCurr +
    regulatoryFeeListingCurr +
    offsiteAdsFeeListingCurr +
    currencyConversionFeeListingCurr;

  // 8. Seller Costs Breakdown (converted to listing currency)
  const itemCostListingCurr = toListingCurr(itemCost);
  const shippingCostListingCurr = toListingCurr(shippingActualCost);
  const packagingCostListingCurr = toListingCurr(packagingCost);
  const laborCostListingCurr = toListingCurr(laborHours * laborRatePerHour);
  const marketingCostListingCurr = etsyAdsCostPerSale; // already in listing currency

  const totalCostsListingCurr =
    itemCostListingCurr +
    shippingCostListingCurr +
    packagingCostListingCurr +
    laborCostListingCurr +
    marketingCostListingCurr;

  // 9. Net Profit in Listing Currency
  const netProfitListingCurr = grossRevenueListingCurr - (totalEtsyFeesListingCurr + totalCostsListingCurr);

  // 10. Local Currency Totals (What seller sees in their own bank/wallet)
  const grossRevenueLocalCurr = toLocalCurr(grossRevenueListingCurr);
  const totalEtsyFeesLocalCurr = toLocalCurr(totalEtsyFeesListingCurr);
  const totalCostsLocalCurr = toLocalCurr(totalCostsListingCurr);
  const netProfitLocalCurr = toLocalCurr(netProfitListingCurr);

  // 11. Metrics
  const profitMarginPercent =
    grossRevenueListingCurr > 0 ? (netProfitListingCurr / grossRevenueListingCurr) * 100 : 0;

  const markupPercent =
    totalCostsListingCurr > 0 ? (netProfitListingCurr / totalCostsListingCurr) * 100 : 0;

  const totalDeductions = totalCostsListingCurr + totalEtsyFeesListingCurr;
  const roiPercent = totalDeductions > 0 ? (netProfitListingCurr / totalDeductions) * 100 : 0;

  // 12. Break-Even Price Calculation
  // Total Variable Fee % = 6.5% + processing% + regulatory% + offsiteAds% + (currencyFee% if mismatch)
  const variableFeeRate =
    ETSY_TRANSACTION_FEE_PERCENT +
    countryConfig.processingPercent +
    countryConfig.regulatoryPercent +
    (offsiteAdsPercent || 0) / 100 +
    (isCurrencyMismatch ? ETSY_CURRENCY_CONVERSION_PERCENT : 0);

  const flatFeesListingCurr = listingFeeListingCurr + fixedProcessingInListingCurr;
  const sellerDirectCosts =
    itemCostListingCurr +
    shippingCostListingCurr +
    packagingCostListingCurr +
    laborCostListingCurr +
    marketingCostListingCurr;

  // P_be = (SellerCosts + FlatFees - ShippingCharged * (1 - variableFeeRate)) / (1 - variableFeeRate)
  let breakEvenPriceListingCurr = 0;
  if (1 - variableFeeRate > 0) {
    const rawBreakEven =
      (sellerDirectCosts + flatFeesListingCurr - effectiveShippingCharged * (1 - variableFeeRate)) /
      (1 - variableFeeRate);
    breakEvenPriceListingCurr = Math.max(0, rawBreakEven);
  }
  const breakEvenPriceLocalCurr = toLocalCurr(breakEvenPriceListingCurr);

  // 13. Health assessment & recommendations
  const { status, message, recommendations } = assessProfitHealth(
    profitMarginPercent,
    netProfitListingCurr,
    totalEtsyFeesListingCurr,
    grossRevenueListingCurr,
    isCurrencyMismatch,
    countryConfig.name
  );

  const fees: FeeBreakdown = {
    listingFeeListingCurr,
    transactionFeeListingCurr,
    processingFeeListingCurr,
    regulatoryFeeListingCurr,
    offsiteAdsFeeListingCurr,
    currencyConversionFeeListingCurr,
    totalEtsyFeesListingCurr,
  };

  return {
    grossRevenueListingCurr,
    totalCostsListingCurr,
    itemCostListingCurr,
    shippingCostListingCurr,
    packagingCostListingCurr,
    laborCostListingCurr,
    marketingCostListingCurr,
    fees,
    netProfitListingCurr,

    effectiveExchangeRate: exchangeMultiplier,
    grossRevenueLocalCurr,
    totalEtsyFeesLocalCurr,
    totalCostsLocalCurr,
    netProfitLocalCurr,

    profitMarginPercent,
    markupPercent,
    roiPercent,
    breakEvenPriceListingCurr,
    breakEvenPriceLocalCurr,

    healthStatus: status,
    healthMessage: message,
    recommendations,
  };
}

/**
 * Reverse Target Pricing: Solves for the required Etsy listing price.
 */
export function calculateReversePrice(
  target: { type: 'profit' | 'margin'; value: number },
  inputs: CalculatorInputs,
  rates: Record<string, number> = {}
): number {
  const {
    itemCost = 0,
    costCurrency = 'USD',
    listingCurrency = 'USD',
    exchangeRateOverride,
    shippingChargedToCustomer = 0,
    shippingActualCost = 0,
    packagingCost = 0,
    laborHours = 0,
    laborRatePerHour = 0,
    sellerCountry = 'US',
    offsiteAdsPercent = 0,
    etsyAdsCostPerSale = 0,
    discountPercent = 0,
    renewalsCount = 1,
  } = inputs;

  const countryConfig = COUNTRY_FEE_CONFIGS[sellerCountry] || COUNTRY_FEE_CONFIGS.US;
  const exchangeMultiplier = getExchangeMultiplier(
    listingCurrency,
    costCurrency,
    rates,
    exchangeRateOverride
  );

  const toListingCurr = (val: number) => (exchangeMultiplier > 0 ? val / exchangeMultiplier : 0);

  const listingFeeListingCurr = convertCurrency(
    ETSY_FIXED_LISTING_FEE_USD * Math.max(1, renewalsCount),
    'USD',
    listingCurrency,
    rates
  );

  const fixedProcessingListingCurr = convertCurrency(
    countryConfig.processingFixed,
    countryConfig.currency,
    listingCurrency,
    rates
  );

  const isCurrencyMismatch = listingCurrency !== countryConfig.currency;
  const variableFeeRate =
    ETSY_TRANSACTION_FEE_PERCENT +
    countryConfig.processingPercent +
    countryConfig.regulatoryPercent +
    (offsiteAdsPercent || 0) / 100 +
    (isCurrencyMismatch ? ETSY_CURRENCY_CONVERSION_PERCENT : 0);

  const sellerDirectCosts =
    toListingCurr(itemCost) +
    toListingCurr(shippingActualCost) +
    toListingCurr(packagingCost) +
    toListingCurr(laborHours * laborRatePerHour) +
    etsyAdsCostPerSale;

  const flatFees = listingFeeListingCurr + fixedProcessingListingCurr;
  const discountFactor = 1 - (discountPercent || 0) / 100;

  if (target.type === 'profit') {
    // target profit in listing currency
    const targetProfit = target.value;
    // GrossRevenue = (Costs + FlatFees + TargetProfit) / (1 - variableFeeRate)
    // SalePrice * discountFactor + ShippingCharged = GrossRevenue
    const numerator = sellerDirectCosts + flatFees + targetProfit - shippingChargedToCustomer * (1 - variableFeeRate);
    const denominator = discountFactor * (1 - variableFeeRate);
    return denominator > 0 ? Math.max(0, numerator / denominator) : 0;
  } else {
    // target margin percent (e.g. 40%)
    const margin = Math.min(95, Math.max(1, target.value)) / 100;
    // NetProfit / GrossRevenue = margin => GrossRevenue * (1 - margin - variableFeeRate) = Costs + FlatFees
    const netRate = 1 - margin - variableFeeRate;
    if (netRate <= 0) return 0;
    const grossRevenueNeeded = (sellerDirectCosts + flatFees) / netRate;
    const priceNeeded = (grossRevenueNeeded - shippingChargedToCustomer) / discountFactor;
    return Math.max(0, priceNeeded);
  }
}

function assessProfitHealth(
  margin: number,
  netProfit: number,
  etsyFees: number,
  grossRev: number,
  currencyMismatch: boolean,
  countryName: string
): {
  status: 'exceptional' | 'healthy' | 'moderate' | 'low' | 'loss';
  message: string;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  if (grossRev <= 0) {
    return {
      status: 'moderate',
      message: 'Enter your sale price and item cost to see your profit breakdown.',
      recommendations: ['Start with just your sale price and how much you paid to make it.'],
    };
  }

  if (netProfit < 0) {
    recommendations.push('🚨 Warning: You are currently losing money on every order!');
    recommendations.push('Increase your sale price or lower your material/shipping costs.');
    return {
      status: 'loss',
      message: 'Selling at a loss! Immediate price increase required.',
      recommendations,
    };
  }

  if (margin < 20) {
    recommendations.push('Margins below 20% are vulnerable to returns, customer refunds, and unexpected ads.');
    recommendations.push('Consider bundling or raising price by $3-$5 to build a safety buffer.');
    return {
      status: 'low',
      message: 'Low profit margin (<20%). High risk of unexpected losses.',
      recommendations,
    };
  }

  if (margin < 35) {
    recommendations.push('A solid margin. If you run occasional 15% sales, make sure your baseline price can absorb it.');
    return {
      status: 'moderate',
      message: 'Fair profit margin (20% – 35%). Good foundation.',
      recommendations,
    };
  }

  if (margin < 50) {
    recommendations.push('Healthy profit cushion. You have room for Etsy ads or discounts without losing money.');
    return {
      status: 'healthy',
      message: 'Healthy profit margin (35% – 50%). Great work!',
      recommendations,
    };
  }

  recommendations.push('Exceptional profit margin (>50%). Ideal for scalability and reinvesting into shop growth.');
  if (currencyMismatch) {
    recommendations.push(
      `Notice: Etsy charges a 2.5% currency conversion fee because your listing currency differs from your ${countryName} bank currency.`
    );
  }

  return {
    status: 'exceptional',
    message: 'Exceptional profit margin (>50%)! Prime for Etsy advertising.',
    recommendations,
  };
}
