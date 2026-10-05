'use client';

import React, { useMemo, useState } from 'react';
import { CurrencyCode, StudioPricingInputs, ShopCustomRule, ShippingRateCard } from '@/types/calculator';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import { calculateSellerPricing, SellerPricingResult } from '@/lib/pricingEngine';
import {
  DollarSign,
  Truck,
  Package,
  Sparkles,
  ShieldCheck,
  Receipt,
  Save,
  RotateCcw,
  AlertCircle,
  Tag,
  Clock,
  RefreshCw,
  X,
  Check,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface SavedRateBannerInfo {
  savedRate: number;
  liveRate: number;
  costCurrency: CurrencyCode;
  listingCurrency: CurrencyCode;
  onUpdateLive: () => void;
  onDismiss: () => void;
}

interface EtsyPricingStudioProps {
  studioInputs: StudioPricingInputs;
  setStudioInputs: React.Dispatch<React.SetStateAction<StudioPricingInputs>>;
  costCurrency: CurrencyCode;
  setCostCurrency: (curr: CurrencyCode) => void;
  listingCurrency: CurrencyCode;
  setListingCurrency: (curr: CurrencyCode) => void;
  exchangeRate: number;
  rules?: ShopCustomRule;
  savedRateBanner?: SavedRateBannerInfo | null;
  onSetCustomRate: (rate?: number) => void;
  onOpenInvoiceWithPricing: (pricing: SellerPricingResult, title: string) => void;
  onSaveToDb: (data: { title: string; pricing: SellerPricingResult; saveAsNew?: boolean }) => void;
  isSaving: boolean;
  editingListingId?: string | null;
  editingListingTitle?: string | null;
  hasUnsavedChanges?: boolean;
  onCancelEditing?: () => void;
  onResetAll?: () => void;
  shippingRates?: ShippingRateCard[];
  onNavigateToShipping?: () => void;
}

export const EtsyPricingStudio: React.FC<EtsyPricingStudioProps> = ({
  studioInputs,
  setStudioInputs,
  costCurrency,
  setCostCurrency,
  listingCurrency,
  setListingCurrency,
  exchangeRate,
  rules,
  savedRateBanner,
  onOpenInvoiceWithPricing,
  onSaveToDb,
  isSaving,
  editingListingId,
  editingListingTitle,
  hasUnsavedChanges = false,
  onCancelEditing,
  onResetAll,
  shippingRates = [],
  onNavigateToShipping,
}) => {
  const {
    productTitle = '',
    productCost = '',
    shippingCost = '',
    extraCost = '',
    platformFeePercent = 15,
    profitMarginPercent = '',
    discountPercent = '',
  } = studioInputs;

  // Shipping Rate Card Lookup State
  const [showShippingLookup, setShowShippingLookup] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [selectedWeightKg, setSelectedWeightKg] = useState<number | ''>('');

  const activeCardId = selectedCardId || shippingRates[0]?.id || shippingRates[0]?._id || '';
  const selectedCard = useMemo(
    () => shippingRates.find((c) => (c.id || c._id) === activeCardId) || shippingRates[0],
    [shippingRates, activeCardId]
  );

  const currentWeightKg =
    selectedWeightKg !== ''
      ? selectedWeightKg
      : selectedCard?.weightSlabs?.[0]?.weightKg ?? '';

  const selectedSlab = useMemo(
    () => selectedCard?.weightSlabs?.find((s) => s.weightKg === currentWeightKg),
    [selectedCard, currentWeightKg]
  );

  const calculatedShippingCost = useMemo(() => {
    if (!selectedSlab) return 0;
    const surcharge = selectedCard?.fuelSurchargePercent || 0;
    return Math.round(
      surcharge ? selectedSlab.costPKR * (1 + surcharge / 100) : selectedSlab.costPKR
    );
  }, [selectedSlab, selectedCard]);

  const costInfo = SUPPORTED_CURRENCIES[costCurrency] || SUPPORTED_CURRENCIES.PKR;
  const listingInfo = SUPPORTED_CURRENCIES[listingCurrency] || SUPPORTED_CURRENCIES.USD;

  const defaultRuleMargin = rules?.minProfitMargin ?? 30;
  const numProductCost = typeof productCost === 'number' ? productCost : 0;
  const numShippingCost = typeof shippingCost === 'number' ? shippingCost : 0;
  const numExtraCost = typeof extraCost === 'number' ? extraCost : 0;
  const numProfitMargin = typeof profitMarginPercent === 'number' ? profitMarginPercent : defaultRuleMargin;
  const numDiscount = typeof discountPercent === 'number' ? discountPercent : 0;

  // Real-time calculation
  const pricingResult = useMemo(() => {
    return calculateSellerPricing({
      productCostLocal: numProductCost,
      shippingCostLocal: numShippingCost,
      extraCostLocal: numExtraCost,
      platformFeePercent: platformFeePercent || 15,
      targetProfitMarginPercent: numProfitMargin,
      discountPercent: numDiscount,
      exchangeRate,
    });
  }, [
    numProductCost,
    numShippingCost,
    numExtraCost,
    platformFeePercent,
    numProfitMargin,
    numDiscount,
    exchangeRate,
  ]);

  // Reset All Fields: Clears all inputs and resets to Shop Rules defaults
  const handleResetAll = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      setStudioInputs({
        productTitle: '',
        productCost: '',
        shippingCost: '',
        extraCost: '',
        platformFeePercent: rules?.defaultPlatformFeePercent || 15,
        profitMarginPercent: defaultRuleMargin,
        discountPercent: rules?.defaultDiscountPercent ?? '',
      });
    }
  };

  const hasEnteredCosts = numProductCost > 0 || numShippingCost > 0;

  return (
    <div className="space-y-6">
      {/* Active Listing Status Bar */}
      {editingListingId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] shrink-0 border border-amber-300/60">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Unsaved Edits
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] shrink-0 border border-emerald-300/60">
                <Check className="w-3 h-3 text-emerald-600" />
                All Changes Saved
              </span>
            )}

            <span className="text-slate-600 truncate text-xs">
              Listing: <strong className="text-slate-900">{editingListingTitle || productTitle || 'Loaded Listing'}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onCancelEditing}
            className="text-xs font-bold text-slate-500 hover:text-orange-600 transition shrink-0 cursor-pointer self-start sm:self-auto underline decoration-slate-300"
            title="Start a new blank calculation instead"
          >
            + Start New Listing
          </button>
        </div>
      )}

      {/* Saved Rate Notification Banner */}
      {savedRateBanner && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-amber-950">
                  Using Original Saved Rate:
                </span>
                <span className="font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-200">
                  1 {savedRateBanner.listingCurrency} = {savedRateBanner.savedRate.toFixed(2)} {savedRateBanner.costCurrency}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Today&apos;s live market rate is <strong>1 {savedRateBanner.listingCurrency} = {savedRateBanner.liveRate.toFixed(2)} {savedRateBanner.costCurrency}</strong>. You can update or dismiss this banner.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={savedRateBanner.onUpdateLive}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update to Today&apos;s Rate ({savedRateBanner.liveRate.toFixed(2)})</span>
            </button>

            <button
              type="button"
              onClick={savedRateBanner.onDismiss}
              className="p-1.5 rounded-xl text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 transition cursor-pointer"
              title="Dismiss and keep saved rate"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Title Bar & Actions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Listing / Product Name
          </label>
          <input
            type="text"
            value={productTitle}
            onChange={(e) =>
              setStudioInputs((prev) => ({ ...prev, productTitle: e.target.value }))
            }
            placeholder="e.g. Handcrafted Leather Wallet, Vintage Brass Chess, Silk Scarf"
            className="w-full text-base font-bold text-slate-800 placeholder-slate-400 bg-transparent border-0 border-b border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-0 focus:outline-hidden py-1 transition"
          />
        </div>

        {/* Reset & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Clear all fields and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenInvoiceWithPricing(
                pricingResult,
                productTitle || 'Etsy Listing Cost & Profit Slip'
              )
            }
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-600" />
            <span>View & Print Slip</span>
          </button>

          {editingListingId ? (
            <>
              {hasUnsavedChanges ? (
                <button
                  type="button"
                  onClick={() => onSaveToDb({ title: productTitle, pricing: pricingResult, saveAsNew: false })}
                  disabled={isSaving || !hasEnteredCosts}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-40 cursor-pointer animate-in fade-in"
                  title="Update this listing in your library"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Updating...' : 'Update Listing'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold shadow-2xs cursor-default"
                  title="All changes already saved"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved ✓</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSaveToDb({ title: productTitle, pricing: pricingResult, saveAsNew: true })}
                disabled={isSaving || !hasEnteredCosts}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition disabled:opacity-40 cursor-pointer"
                title="Save as a separate new listing"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Save as New</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onSaveToDb({ title: productTitle, pricing: pricingResult })}
              disabled={isSaving || !hasEnteredCosts}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-40 cursor-pointer"
              title="Save listing to your library"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Listing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Live Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full max-w-full">
        {/* LEFT COLUMN: Inputs (7 cols) */}
        <div className="lg:col-span-7 min-w-0 max-w-full space-y-6">
          {/* STEP 1: Local Costs Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center">
                  1
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Your Costs in Local Currency
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input your production and shipping costs in {costInfo.name} ({costInfo.symbol})
                  </p>
                </div>
              </div>

              {/* Local Currency Selector */}
              <select
                aria-label="Local Cost Currency"
                value={costCurrency}
                onChange={(e) => setCostCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Making / Buying Cost */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 transition">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-600" />
                  <span>Product Making / Buying Cost</span>
                  <span className="text-[10px] text-slate-400 font-normal">({costInfo.symbol})</span>
                </label>
                <div className="relative flex items-center mt-2">
                  <span className="absolute left-3 text-lg font-bold text-slate-400 select-none">
                    {costInfo.symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={productCost}
                    onChange={(e) =>
                      setStudioInputs((prev) => ({
                        ...prev,
                        productCost: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g. 2500"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xl font-black text-slate-900 placeholder-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1.5 block">
                  Raw materials or manufacturer cost
                </span>
              </div>

              {/* International Shipping Cost */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10 transition">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    <Truck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>International Shipping Cost</span>
                    <span className="text-[10px] text-slate-400 font-normal">({costInfo.symbol})</span>
                  </label>

                  {/* Popover trigger button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowShippingLookup((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-orange-700 bg-orange-100/70 hover:bg-orange-100 border border-orange-200/80 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                      title="Quickly fill shipping cost from your saved courier rate cards"
                    >
                      <Truck className="w-3.5 h-3.5 text-orange-600" />
                      <span>Rate Cards</span>
                      {showShippingLookup ? (
                        <ChevronUp className="w-3 h-3 text-orange-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-orange-600" />
                      )}
                    </button>

                    {/* Floating Popover Dropdown */}
                    {showShippingLookup && (
                      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-40 animate-fade-in ring-1 ring-black/5">
                        {(!shippingRates || shippingRates.length === 0) ? (
                          <div>
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-800">Saved Courier Rates</span>
                              <button
                                type="button"
                                onClick={() => setShowShippingLookup(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">No saved rate cards yet</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Save your courier rate sheets in the Shipping Rates tab to automatically pull rates here.
                            </p>
                            {onNavigateToShipping && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowShippingLookup(false);
                                  onNavigateToShipping();
                                }}
                                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                              >
                                <span>Go to Shipping Rates Tab</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Popover Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                                  <Truck className="w-3.5 h-3.5 text-orange-600" />
                                </div>
                                <span className="text-xs font-bold text-slate-800">Saved Courier Rates</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {onNavigateToShipping && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowShippingLookup(false);
                                      onNavigateToShipping();
                                    }}
                                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Manage</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowShippingLookup(false)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                                  title="Close"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Select Courier & Zone */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Courier &amp; Zone
                              </label>
                              <select
                                value={activeCardId}
                                onChange={(e) => {
                                  setSelectedCardId(e.target.value);
                                  const card = shippingRates.find((c) => (c.id || c._id) === e.target.value);
                                  if (card && card.weightSlabs && card.weightSlabs.length > 0) {
                                    setSelectedWeightKg(card.weightSlabs[0].weightKg);
                                  }
                                }}
                                className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                              >
                                {shippingRates.map((c) => {
                                  const cId = c.id || c._id || '';
                                  return (
                                    <option key={cId} value={cId}>
                                      {c.courier} — {c.zoneLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Select Weight Slab */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Weight Slab
                              </label>
                              <select
                                value={currentWeightKg}
                                onChange={(e) => setSelectedWeightKg(parseFloat(e.target.value) || '')}
                                className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                              >
                                {(selectedCard?.weightSlabs || []).map((s) => (
                                  <option key={s.weightKg} value={s.weightKg}>
                                    {s.weightKg} kg — PKR {s.costPKR.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Price Preview & Action */}
                            {selectedSlab && (
                              <div className="bg-orange-50/70 border border-orange-200/70 rounded-xl p-3 flex items-center justify-between gap-2 mt-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900 block">
                                    Calculated Cost
                                  </span>
                                  <div className="text-base font-black text-slate-900 leading-tight">
                                    {costInfo.symbol} {calculatedShippingCost.toLocaleString()}
                                    {selectedCard?.fuelSurchargePercent ? (
                                      <span className="text-[10px] text-amber-700 font-bold ml-1.5 px-1.5 py-0.5 bg-amber-100 rounded">
                                        +{selectedCard.fuelSurchargePercent}% fuel
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStudioInputs((prev) => ({
                                      ...prev,
                                      shippingCost: calculatedShippingCost,
                                    }));
                                    setShowShippingLookup(false);
                                  }}
                                  className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-orange-500/20 cursor-pointer shrink-0"
                                >
                                  Apply Cost
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center mt-2">
                  <span className="absolute left-3 text-lg font-bold text-slate-400 select-none">
                    {costInfo.symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={shippingCost}
                    onChange={(e) =>
                      setStudioInputs((prev) => ({
                        ...prev,
                        shippingCost: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="e.g. 3500"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xl font-black text-slate-900 placeholder-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1.5 block">
                  Courier / DHL / Post office charge
                </span>
              </div>
            </div>

            {/* Packaging / Extra Cost */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Packaging & Extra Supplies (Optional)
                </span>
                <span className="text-[11px] text-slate-400">
                  Boxes, bubble wrap, stickers, thank you cards
                </span>
              </div>
              <div className="relative flex items-center w-full sm:w-44">
                <span className="absolute left-3 text-sm font-bold text-slate-400">
                  {costInfo.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={extraCost}
                  onChange={(e) =>
                    setStudioInputs((prev) => ({
                      ...prev,
                      extraCost: e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g. 200"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Total Cost Summary Bar */}
            {hasEnteredCosts ? (
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Total Money Spent on Product:</span>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400">
                    {costInfo.symbol}
                    {pricingResult.totalCostLocal.toLocaleString()} {costInfo.code}
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    (≈ {listingInfo.symbol}{pricingResult.totalCostUSD.toFixed(2)} {listingInfo.code})
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Enter your product and shipping costs above to calculate the Etsy listing price.</span>
              </div>
            )}
          </div>

          {/* STEP 2: Rules & Margins Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Platform Fee Rule & Desired Profit Margin
                </h3>
                <p className="text-xs text-slate-500">
                  Combined platform fee is set to 15% by default
                </p>
              </div>
            </div>

            {/* Rule 1: Platform Fee (Etsy + Payoneer Default 15%) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Etsy & Payoneer Combined Fee Rule</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={platformFeePercent}
                    onChange={(e) =>
                      setStudioInputs((prev) => ({
                        ...prev,
                        platformFeePercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>

              <input
                type="range"
                min="8"
                max="30"
                step="1"
                value={platformFeePercent}
                onChange={(e) =>
                  setStudioInputs((prev) => ({
                    ...prev,
                    platformFeePercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-orange-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Standard default: 15% (Etsy 6.5% transaction + processing + Payoneer)</span>
                <span className="font-bold text-orange-600">Active Rule: {platformFeePercent}%</span>
              </div>
            </div>

            {/* Rule 2: Your Profit Margin Target (%) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Your Desired Profit Margin (%)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 block">
                    Percentage of selling price you keep as pure net profit
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Custom:</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="85"
                      step="any"
                      value={profitMarginPercent}
                      onChange={(e) =>
                        setStudioInputs((prev) => ({
                          ...prev,
                          profitMarginPercent:
                            e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder={String(defaultRuleMargin)}
                      className="w-20 pl-2.5 pr-6 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-black text-emerald-900 text-left focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <span className="absolute right-2 text-xs font-bold text-emerald-700 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={numProfitMargin}
                onChange={(e) =>
                  setStudioInputs((prev) => ({
                    ...prev,
                    profitMarginPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />

              {/* Quick Margin Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {[15, 20, 25, 30, 35, 40, 50, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setStudioInputs((prev) => ({ ...prev, profitMarginPercent: m }))
                    }
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      numProfitMargin === m
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>

              {/* Margin Cash Yield Feedback */}
              {hasEnteredCosts && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between">
                  <span>Targeted Take-Home Cash:</span>
                  <span className="font-black text-emerald-900">
                    +{costInfo.symbol}{pricingResult.netProfitLocal.toLocaleString(undefined, { maximumFractionDigits: 0 })} {costInfo.code} (+{listingInfo.symbol}{pricingResult.netProfitUSD.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Discount Strategy (Strikethrough Price) */}
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 border-2 border-orange-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-orange-200/60">
              <span className="w-7 h-7 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span>Etsy Sale & Discount Strategy (Strikethrough Price)</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Set a higher list price so Etsy displays a sale badge, while you STILL pocket full profit!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                    Discount to Display on Etsy:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Buyers see a strikethrough badge (e.g. 25% OFF)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium">Custom Discount:</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="85"
                      step="any"
                      value={discountPercent}
                      onChange={(e) =>
                        setStudioInputs((prev) => ({
                          ...prev,
                          discountPercent:
                            e.target.value === '' ? '' : parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      className="w-20 pl-2.5 pr-6 py-1.5 bg-white border border-orange-300 rounded-xl text-sm font-black text-orange-900 text-left focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-2xs"
                    />
                    <span className="absolute right-2 text-xs font-bold text-orange-700 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={numDiscount}
                onChange={(e) =>
                  setStudioInputs((prev) => ({
                    ...prev,
                    discountPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-orange-600 cursor-pointer"
              />

              {/* Discount Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {[0, 10, 15, 20, 25, 30, 40, 50, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setStudioInputs((prev) => ({ ...prev, discountPercent: d }))
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      numDiscount === d
                        ? 'bg-orange-600 text-white shadow-2xs ring-2 ring-orange-400'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d === 0 ? 'No Sale (0%)' : `${d}% OFF`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Exact Etsy Prices (5 cols sticky) */}
        <div className="lg:col-span-5 min-w-0 max-w-full sticky top-24 space-y-6">
          {hasEnteredCosts ? (
            /* ACTIVE CALCULATION CARD */
            <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden space-y-5">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                  What to Enter on Etsy
                </span>
                <span className="text-xs font-bold text-slate-400">
                  1 {listingInfo.code} = {exchangeRate.toFixed(2)} {costInfo.code}
                </span>
              </div>

              {/* Strikethrough Listing Price (if discount is active) */}
              {numDiscount > 0 ? (
                <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
                  <span className="text-xs font-extrabold uppercase text-orange-900 block">
                    📌 Original Listing Price to Put on Etsy:
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {listingInfo.symbol}
                      {pricingResult.originalListingPriceUSD.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-slate-500">{listingInfo.code}</span>
                  </div>

                  {/* Strikethrough Box */}
                  <div className="mt-3 p-3 bg-white rounded-xl border border-orange-200/80 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Etsy Buyer Views:</span>
                      <div className="flex items-center space-x-2">
                        <span className="line-through text-slate-400 font-bold">
                          {listingInfo.symbol}
                          {pricingResult.originalListingPriceUSD.toFixed(2)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded">
                          {numDiscount}% OFF
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Customer Pays:</span>
                      <span className="text-xl font-black text-emerald-600">
                        {listingInfo.symbol}
                        {pricingResult.netSellingPriceUSD.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* No Discount -> Direct Selling Price */
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs font-extrabold uppercase text-slate-600 block mb-1">
                    🎯 Etsy Listing Selling Price:
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {listingInfo.symbol}
                      {pricingResult.netSellingPriceUSD.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-slate-500">{listingInfo.code}</span>
                  </div>
                </div>
              )}

              {/* YOUR TAKE-HOME PROFIT */}
              <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
                  💰 Your Net Take-Home Profit:
                </span>
                <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                  +{costInfo.symbol}
                  {pricingResult.netProfitLocal.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  <span className="text-lg font-bold text-emerald-100">{costInfo.code}</span>
                </div>
                <div className="text-xs font-medium text-emerald-100 mt-2 flex items-center justify-between border-t border-emerald-400/50 pt-2">
                  <span>In USD: +{listingInfo.symbol}{pricingResult.netProfitUSD.toFixed(2)}</span>
                  <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
                    {pricingResult.profitMarginPercent.toFixed(1)}% Margin
                  </span>
                </div>
              </div>

              {/* Cost & Fee Itemization */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Total Spent (Product + Shipping):</span>
                  <span className="font-bold text-slate-800 text-right truncate">
                    {costInfo.symbol}
                    {pricingResult.totalCostLocal.toLocaleString()} ({listingInfo.symbol}
                    {pricingResult.totalCostUSD.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Etsy + Payoneer Fee ({platformFeePercent}%):</span>
                  <span className="font-bold text-orange-600 text-right truncate">
                    -{listingInfo.symbol}
                    {pricingResult.platformFeeUSD.toFixed(2)} ({costInfo.symbol}
                    {pricingResult.platformFeeLocal.toFixed(0)})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Profit Margin:</span>
                  <span className="font-bold text-emerald-600 text-right truncate">
                    +{pricingResult.profitMarginPercent.toFixed(1)}% (+{costInfo.symbol}
                    {pricingResult.netProfitLocal.toLocaleString(undefined, { maximumFractionDigits: 0 })} / +{listingInfo.symbol}{pricingResult.netProfitUSD.toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Customer Pays on Etsy:</span>
                  <span className="font-extrabold text-slate-900 text-right">
                    {listingInfo.symbol}
                    {pricingResult.netSellingPriceUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-slate-500">
                  <span className="shrink-0">Break-Even Price (0% Profit):</span>
                  <span className="font-semibold text-slate-700 text-right">
                    {listingInfo.symbol}
                    {pricingResult.breakEvenSellingPriceUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Live Shop Rules Guardrail Check */}
              {rules && (
                <div className="pt-2 border-t border-slate-100">
                  {pricingResult.profitMarginPercent < rules.minProfitMargin ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Shop Rule Warning:</strong> Margin ({pricingResult.profitMarginPercent.toFixed(1)}%) is below your minimum rule ({rules.minProfitMargin}%).
                      </span>
                    </div>
                  ) : pricingResult.netProfitUSD < rules.minProfitAmountUSD ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Shop Rule Warning:</strong> Net profit (${pricingResult.netProfitUSD.toFixed(2)}) is below your minimum rule (${rules.minProfitAmountUSD.toFixed(2)}).
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Shop Rules Checked: Passed</span>
                      </span>
                      <span className="font-bold text-emerald-700">
                        {rules.minProfitMargin}% min margin • ${rules.minProfitAmountUSD} min profit
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE: Professional prompt when user hasn't typed costs yet */
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Ready to Calculate Your Pricing
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Enter your product cost and shipping cost in <strong>{costInfo.name}</strong> on the left to see your recommended Etsy listing price and net profit.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1.5 text-slate-600">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">
                  How it works:
                </span>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>Input costs in your local currency ({costInfo.code}).</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>Default 15% rule applied for Etsy & Payoneer fees.</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>Calculates exact price in {listingInfo.code} to guarantee your profit.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPLETE ITEMIZED PLATFORM FEE & COST BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-xs space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Complete Itemized Platform Fee & Cost Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Transparent line-by-line financial audit showing exactly where every cent goes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span>Platform Fee Rule:</span>
            <span className="font-extrabold text-orange-600">{platformFeePercent}% Combined</span>
          </div>
        </div>

        {hasEnteredCosts ? (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="pb-3 font-bold">Financial Line Item</th>
                  <th className="pb-3 font-bold">Rate / Category</th>
                  <th className="pb-3 font-bold text-right">In {listingInfo.code}</th>
                  <th className="pb-3 font-bold text-right">In {costInfo.code}</th>
                  <th className="pb-3 font-bold pl-4 hidden md:table-cell">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. REVENUE */}
                <tr className="bg-slate-50/60 font-semibold text-slate-900">
                  <td className="py-3 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Customer Order Revenue</span>
                  </td>
                  <td className="py-3 text-slate-500">Gross Price</td>
                  <td className="py-3 text-right font-black text-slate-900">
                    {listingInfo.symbol}{pricingResult.netSellingPriceUSD.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">
                    {costInfo.symbol}{pricingResult.netSellingPriceLocal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    {numDiscount > 0
                      ? `Listed at ${listingInfo.symbol}${pricingResult.originalListingPriceUSD.toFixed(2)} with ${numDiscount}% OFF sale discount`
                      : 'Amount charged to buyer on Etsy'}
                  </td>
                </tr>

                {/* 2. ETSY FEES */}
                <tr className="text-slate-700">
                  <td className="py-3 pl-4">Etsy Transaction Fee</td>
                  <td className="py-3 text-slate-500">6.5% Core Fee</td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{listingInfo.symbol}{(pricingResult.netSellingPriceUSD * 0.065).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{costInfo.symbol}{(pricingResult.netSellingPriceLocal * 0.065).toFixed(0)}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    Etsy charges 6.5% on item price + shipping
                  </td>
                </tr>

                <tr className="text-slate-700">
                  <td className="py-3 pl-4">Etsy Listing & Renewal Fee</td>
                  <td className="py-3 text-slate-500">Flat Fee</td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{listingInfo.symbol}0.20
                  </td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{costInfo.symbol}{(0.20 * exchangeRate).toFixed(0)}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    $0.20 charged per published/renewed listing
                  </td>
                </tr>

                <tr className="text-slate-700">
                  <td className="py-3 pl-4">Payment Processing & Payoneer Fee</td>
                  <td className="py-3 text-slate-500">Card & Withdrawal</td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{listingInfo.symbol}{Math.max(0, pricingResult.platformFeeUSD - (pricingResult.netSellingPriceUSD * 0.065 + 0.20)).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold text-orange-600">
                    -{costInfo.symbol}{Math.max(0, pricingResult.platformFeeLocal - ((pricingResult.netSellingPriceLocal * 0.065) + 0.20 * exchangeRate)).toFixed(0)}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    Card payment processing fee + Payoneer bank withdrawal margin
                  </td>
                </tr>

                {/* Platform Total */}
                <tr className="bg-orange-50/60 font-bold text-orange-950">
                  <td className="py-2.5 pl-2">Total Platform Deductions</td>
                  <td className="py-2.5 text-orange-800">{platformFeePercent}% Rule</td>
                  <td className="py-2.5 text-right font-black text-orange-700">
                    -{listingInfo.symbol}{pricingResult.platformFeeUSD.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-black text-orange-700">
                    -{costInfo.symbol}{pricingResult.platformFeeLocal.toFixed(0)}
                  </td>
                  <td className="py-2.5 pl-4 text-xs text-orange-800 hidden md:table-cell">
                    Combined Etsy + payment processing deduction
                  </td>
                </tr>

                {/* 3. SELLER COSTS */}
                <tr className="text-slate-700">
                  <td className="py-3 pl-4">Product Production / Buying Cost</td>
                  <td className="py-3 text-slate-500">Materials / Blank</td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    -{listingInfo.symbol}{(numProductCost / exchangeRate).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    -{costInfo.symbol}{numProductCost.toLocaleString()}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    Raw material cost paid in your local currency
                  </td>
                </tr>

                <tr className="text-slate-700">
                  <td className="py-3 pl-4">International Shipping Postage</td>
                  <td className="py-3 text-slate-500">Carrier Label</td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    -{listingInfo.symbol}{(numShippingCost / exchangeRate).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    -{costInfo.symbol}{numShippingCost.toLocaleString()}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                    DHL / FedEx / Courier shipping expense
                  </td>
                </tr>

                {numExtraCost > 0 && (
                  <tr className="text-slate-700">
                    <td className="py-3 pl-4">Packaging & Extra Supplies</td>
                    <td className="py-3 text-slate-500">Supplies</td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      -{listingInfo.symbol}{(numExtraCost / exchangeRate).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800">
                      -{costInfo.symbol}{numExtraCost.toLocaleString()}
                    </td>
                    <td className="py-3 pl-4 text-xs text-slate-500 hidden md:table-cell">
                      Boxes, bubble wrap, stickers, thank you notes
                    </td>
                  </tr>
                )}

                {/* Total Costs Row */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="py-2.5 pl-2">Total Direct Costs</td>
                  <td className="py-2.5 text-slate-600">Out-of-Pocket</td>
                  <td className="py-2.5 text-right font-black text-slate-900">
                    -{listingInfo.symbol}{pricingResult.totalCostUSD.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-black text-slate-900">
                    -{costInfo.symbol}{pricingResult.totalCostLocal.toLocaleString()}
                  </td>
                  <td className="py-2.5 pl-4 text-xs text-slate-600 hidden md:table-cell">
                    Total expenses paid by you to prepare and ship the order
                  </td>
                </tr>

                {/* 4. NET PROFIT (THE BOTTOM LINE) */}
                <tr className="bg-emerald-500 text-white font-black text-sm sm:text-base">
                  <td className="py-3.5 pl-3 rounded-l-xl">NET TAKE-HOME PROFIT</td>
                  <td className="py-3.5 text-emerald-100 text-xs sm:text-sm font-bold">
                    {pricingResult.profitMarginPercent.toFixed(1)}% Margin
                  </td>
                  <td className="py-3.5 text-right font-black">
                    +{listingInfo.symbol}{pricingResult.netProfitUSD.toFixed(2)}
                  </td>
                  <td className="py-3.5 text-right font-black">
                    +{costInfo.symbol}{pricingResult.netProfitLocal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3.5 pl-4 text-xs text-emerald-100 rounded-r-xl hidden md:table-cell font-semibold">
                    Net cash left in your pocket after all fees and expenses!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            Enter your product making cost and shipping cost above to see this complete breakdown populated in real time.
          </div>
        )}
      </div>
    </div>
  );
};

