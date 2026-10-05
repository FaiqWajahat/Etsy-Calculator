'use client';

import React, { useState } from 'react';
import {
  CurrencyCode,
  CountryCode,
} from '@/types/calculator';
import {
  SUPPORTED_CURRENCIES,
  LISTING_CURRENCIES,
} from '@/lib/constants';
import {
  ArrowRightLeft,
  SlidersHorizontal,
  BookmarkCheck,
  Sparkles,
  Tags,
  Edit2,
  Check,
  Truck,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'seo' | 'saved' | 'shipping';
  setActiveTab: (tab: 'studio' | 'seo' | 'saved' | 'shipping') => void;
  costCurrency: CurrencyCode;
  setCostCurrency: (curr: CurrencyCode) => void;
  listingCurrency: CurrencyCode;
  setListingCurrency: (curr: CurrencyCode) => void;
  sellerCountry: CountryCode;
  setSellerCountry: (country: CountryCode) => void;
  exchangeRate: number;
  isCustomRate: boolean;
  onSetCustomRate: (rate?: number) => void;
  onOpenRules: () => void;
  onOpenInvoice: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  costCurrency,
  setCostCurrency,
  listingCurrency,
  setListingCurrency,
  sellerCountry,
  setSellerCountry,
  exchangeRate,
  isCustomRate,
  onSetCustomRate,
  onOpenRules,
  onOpenInvoice,
  savedCount,
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate.toString());

  const handleSaveRate = () => {
    const parsed = parseFloat(tempRate);
    if (!isNaN(parsed) && parsed > 0) {
      onSetCustomRate(parsed);
    } else {
      onSetCustomRate(undefined);
    }
    setIsEditingRate(false);
  };

  const costInfo = SUPPORTED_CURRENCIES[costCurrency];
  const listingInfo = SUPPORTED_CURRENCIES[listingCurrency];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar: Brand, Multi-Currency Bar & Utility Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3.5 gap-4 border-b border-slate-100">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Etsy<span className="text-orange-600">Calc</span> Studio
                </h1>
               
              </div>
              <p className="text-xs text-slate-500">
               Etsy profit, fee & listing optimizer
              </p>
            </div>
          </div>

          {/* Currency Conversion Bar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs text-slate-700">
            {/* Local Cost Currency Selector */}
            <div className="flex items-center gap-1.5 pl-1.5">
              <span className="text-slate-500 font-medium">My Cost:</span>
              <select
                aria-label="Cost Currency"
                value={costCurrency}
                onChange={(e) => setCostCurrency(e.target.value as CurrencyCode)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />

            {/* Etsy Listing Currency Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Etsy Sells in:</span>
              <select
                aria-label="Etsy Listing Currency"
                value={listingCurrency}
                onChange={(e) => setListingCurrency(e.target.value as CurrencyCode)}
                className="bg-orange-50 border border-orange-200 text-orange-900 rounded-lg px-2 py-1 font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                {LISTING_CURRENCIES.map((code) => {
                  const c = SUPPORTED_CURRENCIES[code];
                  return (
                    <option key={code} value={code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Live Exchange Rate Pill */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg">
              {isEditingRate ? (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-600">
                    1 {listingCurrency} =
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-16 px-1 py-0.5 border border-orange-300 rounded text-xs font-bold"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRate}
                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                    title="Apply rate"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-600">
                    1 {listingCurrency} = {exchangeRate.toFixed(2)} {costInfo.code}
                  </span>
                  {isCustomRate && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-medium">
                      Custom
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setTempRate(exchangeRate.toString());
                      setIsEditingRate(true);
                    }}
                    className="text-slate-400 hover:text-slate-600 ml-0.5"
                    title="Edit Exchange Rate"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Button: Shop Rules */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRules}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Shop Rules</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-4 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'studio'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>Pricing & Fee Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'seo'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Listing Helper & 13 Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'shipping'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Shipping Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'border-orange-600 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Saved Listings</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
