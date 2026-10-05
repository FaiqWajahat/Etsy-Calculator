'use client';

import React, { useState } from 'react';
import { CalculatorInputs, CurrencyCode } from '@/types/calculator';
import { SUPPORTED_CURRENCIES, COUNTRY_FEE_CONFIGS } from '@/lib/constants';
import {
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  Percent,
  Truck,
  Box,
  Clock,
  Megaphone,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface QuickInputsProps {
  inputs: CalculatorInputs;
  onChange: (patch: Partial<CalculatorInputs>) => void;
  exchangeRate: number;
}

export const QuickInputs: React.FC<QuickInputsProps> = ({
  inputs,
  onChange,
  exchangeRate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const costInfo = SUPPORTED_CURRENCIES[inputs.costCurrency] || SUPPORTED_CURRENCIES.USD;
  const listingInfo = SUPPORTED_CURRENCIES[inputs.listingCurrency] || SUPPORTED_CURRENCIES.USD;

  // Approximate conversions for live helper text
  const salePriceInLocal = inputs.salePrice * exchangeRate;
  const itemCostInListing = exchangeRate > 0 ? inputs.itemCost / exchangeRate : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Title & Listing Type (Optional metadata) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Listing Name / Product (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Floral Ceramic Coffee Mug 11oz"
            value={inputs.listingType === 'digital' && !inputs.salePrice ? '' : undefined}
            onChange={(e) => {
              // Custom title handled in state
            }}
            id="listingTitleInput"
            className="w-full text-base font-semibold text-slate-800 placeholder-slate-400 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-orange-500 focus:ring-0 focus:outline-hidden px-0 py-1 transition"
          />
        </div>
      </div>

      {/* HERO SECTION: The 2 Core Beginner Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input 1: Sale Price (In Etsy Listing Currency e.g. USD) */}
        <div className="relative group bg-gradient-to-br from-orange-50/60 to-amber-50/30 border-2 border-orange-200/80 rounded-2xl p-4 sm:p-5 transition hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-extrabold">
                1
              </span>
              <span>Etsy Selling Price</span>
              <span className="text-orange-600 font-extrabold">({listingInfo.code})</span>
            </label>
            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Customer Pays
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xl font-bold text-orange-600 select-none">
              {listingInfo.symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="25.00"
              value={inputs.salePrice || ''}
              onChange={(e) => onChange({ salePrice: parseFloat(e.target.value) || 0 })}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-orange-300 rounded-xl text-2xl font-black text-slate-900 tracking-tight placeholder-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
          </div>

          {/* Dual Currency Helper Note */}
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>
              ≈{' '}
              <strong className="text-slate-800">
                {costInfo.symbol}
                {salePriceInLocal.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                })}
              </strong>{' '}
              in your local currency
            </span>
          </div>
        </div>

        {/* Input 2: Item Cost (In Seller's Local Currency e.g. PKR/INR/EUR) */}
        <div className="relative group bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 transition hover:border-slate-400 focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-500/10">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-extrabold">
                2
              </span>
              <span>Your Cost to Make / Buy</span>
              <span className="text-slate-600 font-extrabold">({costInfo.code})</span>
            </label>
            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Your Wallet
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xl font-bold text-slate-600 select-none">
              {costInfo.symbol}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="500"
              value={inputs.itemCost || ''}
              onChange={(e) => onChange({ itemCost: parseFloat(e.target.value) || 0 })}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-2xl font-black text-slate-900 tracking-tight placeholder-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-600 shadow-2xs"
            />
          </div>

          {/* Dual Currency Helper Note */}
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>
              ≈{' '}
              <strong className="text-slate-800">
                {listingInfo.symbol}
                {itemCostInListing.toFixed(2)}
              </strong>{' '}
              in {listingInfo.code}
            </span>
            <span className="text-[11px] text-slate-400">Materials / Blank / POD</span>
          </div>
        </div>
      </div>

      {/* Quick Discount / Sale Test Slider (Optional) */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Percent className="w-4 h-4 text-orange-600" />
          <span className="text-xs sm:text-sm font-semibold text-slate-800">
            Testing a Sale / Coupon Discount?
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Simulates how a shop discount impacts your profit)
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={inputs.discountPercent || 0}
            onChange={(e) => onChange({ discountPercent: parseInt(e.target.value, 10) || 0 })}
            className="w-32 accent-orange-600 cursor-pointer"
          />
          <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 min-w-14 text-center">
            {inputs.discountPercent || 0}% OFF
          </span>
        </div>
      </div>

      {/* Advanced / Optional Options Trigger Accordion */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-100/70 hover:bg-slate-100 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 transition"
        >
          <div className="flex items-center space-x-2">
            <Box className="w-4 h-4 text-slate-500" />
            <span>
              {showAdvanced
                ? 'Hide Extra Costs & Advanced Options'
                : 'Add Shipping, Packaging, Labor & Offsite Ads (Optional)'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>{showAdvanced ? 'Collapse' : 'Expand'}</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Advanced Section */}
        {showAdvanced && (
          <div className="mt-4 p-5 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Shipping & Packaging Costs ({costInfo.code})
            </h4>

            {/* Shipping & Packaging Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Shipping Charged to Customer */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <span>Shipping Charged to Buyer</span>
                  <span className="text-[10px] text-slate-400">({listingInfo.symbol})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                    {listingInfo.symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00 (Free)"
                    value={inputs.shippingChargedToCustomer || ''}
                    onChange={(e) =>
                      onChange({ shippingChargedToCustomer: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Etsy charges 6.5% on this too</p>
              </div>

              {/* Actual Postage / Label Cost */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <span>Actual Label Cost Paid by You</span>
                  <span className="text-[10px] text-slate-400">({costInfo.symbol})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                    {costInfo.symbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={inputs.shippingActualCost || ''}
                    onChange={(e) =>
                      onChange({ shippingActualCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">What carrier/post office charges</p>
              </div>

              {/* Packaging & Supplies */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <span>Boxes, Bubble Mailers & Bags</span>
                  <span className="text-[10px] text-slate-400">({costInfo.symbol})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                    {costInfo.symbol}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={inputs.packagingCost || ''}
                    onChange={(e) => onChange({ packagingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Stickers, thank you cards, tape</p>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Labor & Production Time (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Time to Make (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="0.5"
                    value={inputs.laborHours || ''}
                    onChange={(e) => onChange({ laborHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your Target Hourly Wage ({costInfo.symbol}/hr)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="20"
                    value={inputs.laborRatePerHour || ''}
                    onChange={(e) =>
                      onChange({ laborRatePerHour: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Etsy Ads & Offsite Ads Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Offsite Ads */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Etsy Offsite Ads Fee
                  </label>
                  <select
                    aria-label="Etsy Offsite Ads Fee"
                    value={inputs.offsiteAdsPercent || 0}
                    onChange={(e) =>
                      onChange({ offsiteAdsPercent: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  >
                    <option value={0}>Off (0% — No external ad fee)</option>
                    <option value={15}>15% (Shop sales under $10,000/yr)</option>
                    <option value={12}>12% (Mandatory if sales over $10,000/yr)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only charged when a buyer finds you via Google/Facebook ads
                  </p>
                </div>

                {/* On-site search ads budget per sale */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Etsy Search Ads Spend per Unit ({listingInfo.symbol})
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    placeholder="0.00"
                    value={inputs.etsyAdsCostPerSale || ''}
                    onChange={(e) =>
                      onChange({ etsyAdsCostPerSale: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Average PPC cost per completed sale</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
