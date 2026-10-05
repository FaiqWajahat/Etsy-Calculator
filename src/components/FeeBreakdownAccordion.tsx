'use client';

import React, { useState } from 'react';
import { CalculationResult, CurrencyCode, CountryCode } from '@/types/calculator';
import { SUPPORTED_CURRENCIES, COUNTRY_FEE_CONFIGS } from '@/lib/constants';
import { HelpCircle, ChevronDown, ChevronUp, DollarSign, Receipt, Info } from 'lucide-react';

interface FeeBreakdownAccordionProps {
  result: CalculationResult;
  listingCurrency: CurrencyCode;
  costCurrency: CurrencyCode;
  sellerCountry: CountryCode;
}

export const FeeBreakdownAccordion: React.FC<FeeBreakdownAccordionProps> = ({
  result,
  listingCurrency,
  costCurrency,
  sellerCountry,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const listingInfo = SUPPORTED_CURRENCIES[listingCurrency] || SUPPORTED_CURRENCIES.USD;
  const costInfo = SUPPORTED_CURRENCIES[costCurrency] || SUPPORTED_CURRENCIES.USD;
  const countryConfig = COUNTRY_FEE_CONFIGS[sellerCountry] || COUNTRY_FEE_CONFIGS.US;

  const fees = result.fees;
  const hasCurrencyFee = fees.currencyConversionFeeListingCurr > 0;
  const hasOffsiteAds = fees.offsiteAdsFeeListingCurr > 0;
  const hasRegulatoryFee = fees.regulatoryFeeListingCurr > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
      {/* Header with Total Fees Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-hidden"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Etsy Fees & Cost Itemization
            </h3>
            <p className="text-xs text-slate-500">
              Complete transparency on where every cent is deducted
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">Total Etsy Cut</span>
            <span className="text-base font-extrabold text-orange-600">
              {listingInfo.symbol}
              {fees.totalEtsyFeesListingCurr.toFixed(2)}
            </span>
          </div>
          <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
          {/* Etsy Fees Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Etsy Platform Fees
            </h4>

            <div className="space-y-2 text-xs sm:text-sm">
              {/* Listing Fee */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">Listing & Renewal Fee</span>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-60 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                      $0.20 USD charged per item when published and renews automatically every 4 months or after each sale.
                    </div>
                  </div>
                </div>
                <span className="font-bold text-slate-800">
                  {listingInfo.symbol}
                  {fees.listingFeeListingCurr.toFixed(2)}
                </span>
              </div>

              {/* Transaction Fee (6.5%) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">Transaction Fee (6.5%)</span>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-60 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                      Etsy charges 6.5% of the total amount charged to the buyer (Item Price + Shipping + Gift Wrap).
                    </div>
                  </div>
                </div>
                <span className="font-bold text-slate-800">
                  {listingInfo.symbol}
                  {fees.transactionFeeListingCurr.toFixed(2)}
                </span>
              </div>

              {/* Payment Processing Fee */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">
                    Payment Processing ({countryConfig.name})
                  </span>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-60 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                      Standard credit card processing rate for {countryConfig.name} ({(countryConfig.processingPercent * 100).toFixed(1)}% + {countryConfig.currency} {countryConfig.processingFixed}).
                    </div>
                  </div>
                </div>
                <span className="font-bold text-slate-800">
                  {listingInfo.symbol}
                  {fees.processingFeeListingCurr.toFixed(2)}
                </span>
              </div>

              {/* Regulatory Operating Fee (if applicable) */}
              {hasRegulatoryFee && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-700">
                      Regulatory Operating Fee ({(countryConfig.regulatoryPercent * 100).toFixed(2)}%)
                    </span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-60 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                        Required in {countryConfig.name} to cover local digital services regulations and compliance taxes.
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">
                    {listingInfo.symbol}
                    {fees.regulatoryFeeListingCurr.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Offsite Ads Fee (if applicable) */}
              {hasOffsiteAds && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 border border-orange-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-orange-900">Offsite Ads Fee</span>
                    <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.2 rounded font-bold">
                      Attributed Sale
                    </span>
                  </div>
                  <span className="font-bold text-orange-900">
                    {listingInfo.symbol}
                    {fees.offsiteAdsFeeListingCurr.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Currency Conversion Fee (if applicable) */}
              {hasCurrencyFee && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-amber-900">
                      Etsy Currency Conversion Fee (2.5%)
                    </span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 cursor-help" />
                      <div className="hidden group-hover:block absolute left-0 bottom-full mb-1.5 w-64 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                        Etsy charges 2.5% when your listing currency ({listingInfo.code}) differs from your bank account payout currency ({countryConfig.currency}).
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-amber-900">
                    {listingInfo.symbol}
                    {fees.currencyConversionFeeListingCurr.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Costs Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Your Product & Operational Costs
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Material / Item</span>
                <span className="font-bold text-slate-800 text-sm">
                  {listingInfo.symbol}
                  {result.itemCostListingCurr.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Shipping Label</span>
                <span className="font-bold text-slate-800 text-sm">
                  {listingInfo.symbol}
                  {result.shippingCostListingCurr.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Packaging Supplies</span>
                <span className="font-bold text-slate-800 text-sm">
                  {listingInfo.symbol}
                  {result.packagingCostListingCurr.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Labor & Ads</span>
                <span className="font-bold text-slate-800 text-sm">
                  {listingInfo.symbol}
                  {(result.laborCostListingCurr + result.marketingCostListingCurr).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
