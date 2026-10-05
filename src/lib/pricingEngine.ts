export interface SellerPricingParams {
  productCostLocal: number;       // Product cost in PKR / local currency
  shippingCostLocal: number;      // International shipping in local currency
  extraCostLocal?: number;        // Packaging / extra in local currency
  platformFeePercent: number;     // Combined Etsy + Payoneer fee % (default 15%)
  etsyListingFeeUSD?: number;     // $0.20 USD listing fee
  targetProfitMarginPercent: number; // e.g. 35% or 40%
  discountPercent: number;        // e.g. 0% or 30% OFF
  exchangeRate: number;           // 1 USD = X Local Currency
}

export interface SellerPricingResult {
  // Costs
  totalCostLocal: number;
  totalCostUSD: number;

  // Final selling price customer actually pays
  netSellingPriceUSD: number;
  netSellingPriceLocal: number;

  // Strikethrough listing price to enter on Etsy (with discount)
  originalListingPriceUSD: number;
  originalListingPriceLocal: number;
  discountPercent: number;
  discountAmountUSD: number;

  // Platform cut (Etsy + Payoneer)
  platformFeePercent: number;
  platformFeeUSD: number;
  platformFeeLocal: number;

  // Net Take-Home Profit
  netProfitUSD: number;
  netProfitLocal: number;
  profitMarginPercent: number;
  markupPercent: number;

  // Break-even (0% profit)
  breakEvenSellingPriceUSD: number;
  breakEvenSellingPriceLocal: number;
  hasInput: boolean;
}

/**
 * Calculates the exact Etsy listing price based on local product cost, shipping,
 * platform fee rule (15%), profit margin target, and discount percentage.
 */
export function calculateSellerPricing(params: SellerPricingParams): SellerPricingResult {
  const {
    productCostLocal = 0,
    shippingCostLocal = 0,
    extraCostLocal = 0,
    platformFeePercent = 15,
    etsyListingFeeUSD = 0.20,
    targetProfitMarginPercent = 35,
    discountPercent = 0,
    exchangeRate = 278.5,
  } = params;

  // Total Local Cost & USD Equivalent
  const totalCostLocal = Math.max(0, (productCostLocal || 0) + (shippingCostLocal || 0) + (extraCostLocal || 0));
  const rate = exchangeRate > 0 ? exchangeRate : 278.5;
  const totalCostUSD = totalCostLocal / rate;

  const hasInput = totalCostLocal > 0;

  if (!hasInput) {
    return {
      totalCostLocal: 0,
      totalCostUSD: 0,
      netSellingPriceUSD: 0,
      netSellingPriceLocal: 0,
      originalListingPriceUSD: 0,
      originalListingPriceLocal: 0,
      discountPercent: discountPercent || 0,
      discountAmountUSD: 0,
      platformFeePercent: platformFeePercent || 15,
      platformFeeUSD: 0,
      platformFeeLocal: 0,
      netProfitUSD: 0,
      netProfitLocal: 0,
      profitMarginPercent: targetProfitMarginPercent || 0,
      markupPercent: 0,
      breakEvenSellingPriceUSD: 0,
      breakEvenSellingPriceLocal: 0,
      hasInput: false,
    };
  }

  // 2. Platform Fee & Margin Rates
  const feeRate = Math.max(0, Math.min(80, platformFeePercent)) / 100;
  const marginRate = Math.max(0, Math.min(80, targetProfitMarginPercent)) / 100;

  // Net Selling Price Formula:
  // NetSellingPrice - (NetSellingPrice * feeRate + listingFeeUSD) - TotalCostUSD = NetSellingPrice * marginRate
  // NetSellingPrice * (1 - feeRate - marginRate) = TotalCostUSD + listingFeeUSD
  const retentionFactor = 1 - feeRate - marginRate;

  let netSellingPriceUSD = 0;
  if (retentionFactor > 0) {
    netSellingPriceUSD = (totalCostUSD + etsyListingFeeUSD) / retentionFactor;
  } else {
    netSellingPriceUSD = (totalCostUSD + etsyListingFeeUSD) / 0.1;
  }

  // Break-even selling price (0% profit)
  const breakEvenRetention = 1 - feeRate;
  const breakEvenSellingPriceUSD =
    breakEvenRetention > 0 ? (totalCostUSD + etsyListingFeeUSD) / breakEvenRetention : totalCostUSD;
  const breakEvenSellingPriceLocal = breakEvenSellingPriceUSD * rate;

  // 3. Discount & Strikethrough Listing Price
  // If seller wants to offer e.g. 30% discount on Etsy:
  // OriginalListingPrice * (1 - discountPercent / 100) = NetSellingPrice
  const discountFactor = 1 - Math.min(90, Math.max(0, discountPercent)) / 100;
  const originalListingPriceUSD =
    discountFactor > 0 ? netSellingPriceUSD / discountFactor : netSellingPriceUSD;
  const discountAmountUSD = originalListingPriceUSD - netSellingPriceUSD;

  // 4. Platform Fees
  const platformFeeUSD = netSellingPriceUSD * feeRate + etsyListingFeeUSD;
  const platformFeeLocal = platformFeeUSD * rate;

  // 5. Net Profit
  const netProfitUSD = netSellingPriceUSD - platformFeeUSD - totalCostUSD;
  const netProfitLocal = netProfitUSD * rate;

  // Margin & Markup
  const calculatedMargin =
    netSellingPriceUSD > 0 ? (netProfitUSD / netSellingPriceUSD) * 100 : 0;
  const markupPercent =
    totalCostUSD > 0 ? (netProfitUSD / totalCostUSD) * 100 : 0;

  return {
    totalCostLocal,
    totalCostUSD,

    netSellingPriceUSD,
    netSellingPriceLocal: netSellingPriceUSD * rate,

    originalListingPriceUSD,
    originalListingPriceLocal: originalListingPriceUSD * rate,
    discountPercent,
    discountAmountUSD,

    platformFeePercent,
    platformFeeUSD,
    platformFeeLocal,

    netProfitUSD,
    netProfitLocal,
    profitMarginPercent: calculatedMargin,
    markupPercent,

    breakEvenSellingPriceUSD,
    breakEvenSellingPriceLocal,
    hasInput: true,
  };
}
