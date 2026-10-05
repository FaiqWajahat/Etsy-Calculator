'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalculatorInputs,
  CurrencyCode,
  CountryCode,
  SavedListingItem,
  ShopCustomRule,
  StudioPricingInputs,
  ShippingRateCard,
} from '@/types/calculator';
import { DEFAULT_RULES, SUPPORTED_CURRENCIES } from '@/lib/constants';
import { calculateEtsyProfit } from '@/lib/calculator';
import { Header } from '@/components/Header';
import { EtsyPricingStudio } from '@/components/EtsyPricingStudio';
import { ListingSeoHelper } from '@/components/ListingSeoHelper';
import { SavedListingsDrawer } from '@/components/SavedListingsDrawer';
import { PrintInvoiceModal } from '@/components/PrintInvoiceModal';
import { ShopRulesModal } from '@/components/ShopRulesModal';
import { RateChangeModal } from '@/components/RateChangeModal';
import { ShippingManager } from '@/components/ShippingManager';
import { SellerPricingResult } from '@/lib/pricingEngine';

export default function EtsyCalculatorPage() {
  // Navigation tabs: 'studio' (Default) | 'seo' | 'saved' | 'shipping'
  const [activeTab, setActiveTab] = useState<'studio' | 'seo' | 'saved' | 'shipping'>('studio');

  // Currencies & Exchange Rate (Defaulting to PKR for local costs, USD for Etsy listing)
  const [costCurrency, setCostCurrency] = useState<CurrencyCode>('PKR');
  const [listingCurrency, setListingCurrency] = useState<CurrencyCode>('USD');
  const [sellerCountry, setSellerCountry] = useState<CountryCode>('OTHER');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);

  // Rate change modal & top studio banner states
  const [pendingRateChange, setPendingRateChange] = useState<{
    item: SavedListingItem;
    savedRate: number;
    liveRate: number;
    costCurrency: CurrencyCode;
    listingCurrency: CurrencyCode;
  } | null>(null);

  const [savedRateBanner, setSavedRateBanner] = useState<{
    savedRate: number;
    liveRate: number;
    costCurrency: CurrencyCode;
    listingCurrency: CurrencyCode;
  } | null>(null);

  // Studio Pricing Inputs (Initialized with Shop Rules defaults)
  const [studioInputs, setStudioInputs] = useState<StudioPricingInputs>({
    productTitle: '',
    productCost: '',
    shippingCost: '',
    extraCost: '',
    platformFeePercent: DEFAULT_RULES.defaultPlatformFeePercent ?? 15,
    profitMarginPercent: DEFAULT_RULES.minProfitMargin ?? 30,
    discountPercent: DEFAULT_RULES.defaultDiscountPercent ?? 0,
  });

  // General Calculator Inputs (for Tab 2)
  const [inputs, setInputs] = useState<CalculatorInputs>({
    salePrice: 35.0,
    itemCost: 2000,
    costCurrency: 'PKR',
    listingCurrency: 'USD',
    shippingChargedToCustomer: 0,
    shippingActualCost: 3500,
    packagingCost: 200,
    laborHours: 0,
    laborRatePerHour: 0,
    sellerCountry: 'OTHER',
    offsiteAdsPercent: 0,
    etsyAdsCostPerSale: 0,
    discountPercent: 30,
    renewalsCount: 1,
    listingType: 'physical',
  });

  // Listing SEO & AI Copywriting States
  const [tags, setTags] = useState<string[]>(['handmade', 'gift', 'etsyfinds']);
  const [listingTitle, setListingTitle] = useState('My Handmade Product');
  const [aiMaterial, setAiMaterial] = useState<string>('');
  const [aiFullDescription, setAiFullDescription] = useState<string>('');
  const [aiPersonalizationInstructions, setAiPersonalizationInstructions] = useState<string>('');
  const [aiAlternativeTitles, setAiAlternativeTitles] = useState<string[]>([]);
  const [aiMetaDescription, setAiMetaDescription] = useState<string>('');
  const [aiBulletPoints, setAiBulletPoints] = useState<string[]>([]);

  // Database State (MongoDB)
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRateCard[]>([]);
  const [rules, setRules] = useState<ShopCustomRule>(DEFAULT_RULES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editingListingTitle, setEditingListingTitle] = useState<string | null>(null);

  interface SavedSnapshot {
    productTitle: string;
    productCost: number | '';
    shippingCost: number | '';
    extraCost: number | '';
    platformFeePercent: number;
    profitMarginPercent: number | '';
    discountPercent: number | '';
    costCurrency: string;
    listingCurrency: string;
    customRate?: number;
    material?: string;
    fullDescription?: string;
    tags?: string[];
  }
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(null);

  // Modals & Invoice snapshot
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [pricingStudioSnapshot, setPricingStudioSnapshot] = useState<SellerPricingResult | undefined>(
    undefined
  );
  const [activeInvoiceTitle, setActiveInvoiceTitle] = useState<string>(
    'Etsy Listing Cost & Profit Slip'
  );

  const handleOpenStudioInvoice = (pricing: SellerPricingResult, title: string) => {
    setPricingStudioSnapshot(pricing);
    setActiveInvoiceTitle(title || studioInputs.productTitle || 'Etsy Listing Cost & Profit Slip');
    setIsInvoiceOpen(true);
  };

  // Synchronize currency selection with inputs
  useEffect(() => {
    setInputs((prev) => ({
      ...prev,
      costCurrency,
      listingCurrency,
      sellerCountry,
      exchangeRateOverride: customRate,
    }));
  }, [costCurrency, listingCurrency, sellerCountry, customRate]);

  // Fetch Live Rates on Mount
  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data.success && data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (err) {
        console.warn('Could not fetch rates, fallback will be used:', err);
      }
    }
    loadRates();
  }, []);

  // Fetch Saved Listings on Mount
  const loadSavedListings = useCallback(async () => {
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      if (data.success && data.data) {
        setSavedListings(data.data);
      }
    } catch (err) {
      console.warn('Could not load saved listings:', err);
    }
  }, []);

  // Fetch Shipping Rate Cards on Mount
  const loadShippingRates = useCallback(async () => {
    try {
      const res = await fetch('/api/shipping-rates');
      const data = await res.json();
      if (data.success && data.data) {
        setShippingRates(
          (data.data as ShippingRateCard[]).map((r) => ({
            ...r,
            id: r._id?.toString() || r.id,
          }))
        );
      }
    } catch (err) {
      console.warn('Could not load shipping rates:', err);
    }
  }, []);

  // Fetch Rules & Data on Mount
  useEffect(() => {
    loadSavedListings();
    loadShippingRates();
    async function loadRules() {
      try {
        const res = await fetch('/api/rules');
        const data = await res.json();
        if (data.success && data.data) {
          setRules(data.data);
          setStudioInputs((prev) => ({
            ...prev,
            platformFeePercent: data.data.defaultPlatformFeePercent ?? prev.platformFeePercent,
            profitMarginPercent:
              prev.profitMarginPercent === '' ||
              prev.profitMarginPercent === (DEFAULT_RULES.minProfitMargin || 30)
                ? (data.data.minProfitMargin ?? 30)
                : prev.profitMarginPercent,
            discountPercent:
              prev.discountPercent === '' ||
              prev.discountPercent === (DEFAULT_RULES.defaultDiscountPercent || 0)
                ? (data.data.defaultDiscountPercent ?? prev.discountPercent)
                : prev.discountPercent,
          }));
        }
      } catch (err) {
        console.warn('Could not load rules:', err);
      }
    }
    loadRules();
  }, [loadSavedListings]);

  // Effective Exchange Rate calculation for UI display (1 Listing Curr = X Cost Curr)
  const effectiveExchangeRate = useMemo(() => {
    if (customRate && customRate > 0) return customRate;
    if (listingCurrency === costCurrency) return 1.0;

    const fromRate =
      exchangeRates[listingCurrency] || SUPPORTED_CURRENCIES[listingCurrency]?.defaultRateToUSD || 1;
    const toRate =
      exchangeRates[costCurrency] || SUPPORTED_CURRENCIES[costCurrency]?.defaultRateToUSD || 278.5;

    // Convert 1 unit of listing currency to cost currency
    const inUSD = 1 / fromRate;
    return inUSD * toRate;
  }, [customRate, listingCurrency, costCurrency, exchangeRates]);

  // Calculation output for full fee breakdown & invoices
  const calculationResult = useMemo(() => {
    return calculateEtsyProfit(inputs, exchangeRates);
  }, [inputs, exchangeRates]);

  // Handler to update inputs
  const handleInputChange = (patch: Partial<CalculatorInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  // Handler for 1-click presets
  const handleApplyPreset = (patch: Partial<CalculatorInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  const handleReset = () => {
    setEditingListingId(null);
    setEditingListingTitle(null);
    setSavedSnapshot(null);
    setCustomRate(undefined);
    setSavedRateBanner(null);
    setStudioInputs({
      productTitle: '',
      productCost: '',
      shippingCost: '',
      extraCost: '',
      platformFeePercent: rules?.defaultPlatformFeePercent ?? 15,
      profitMarginPercent: rules?.minProfitMargin ?? 30,
      discountPercent: rules?.defaultDiscountPercent ?? DEFAULT_RULES.defaultDiscountPercent ?? 0,
    });
    setInputs({
      salePrice: 35.0,
      itemCost: 2000,
      costCurrency,
      listingCurrency,
      shippingChargedToCustomer: 0,
      shippingActualCost: 3500,
      packagingCost: 200,
      laborHours: 0,
      laborRatePerHour: 0,
      sellerCountry,
      offsiteAdsPercent: 0,
      etsyAdsCostPerSale: 0,
      discountPercent: 30,
      renewalsCount: 1,
      listingType: 'physical',
    });
  };

  const handleCancelEditing = () => {
    setEditingListingId(null);
    setEditingListingTitle(null);
    setSavedSnapshot(null);
    setSaveToast('Switched to new listing mode');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Save or Update Pricing Studio calculation to MongoDB
  const handleSavePricingStudio = async (data: {
    title: string;
    pricing: SellerPricingResult;
    saveAsNew?: boolean;
  }) => {
    setIsSaving(true);
    try {
      const userEnteredTitle = (data.title || studioInputs.productTitle || '').trim();
      const savedTitle = userEnteredTitle || 'Etsy Pricing Calculation';
      const isUpdating = Boolean(editingListingId && !data.saveAsNew);

      const endpoint = isUpdating ? `/api/listings/${editingListingId}` : '/api/listings';
      const method = isUpdating ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: savedTitle,
          listingType: 'physical',
          studioPricing: {
            ...studioInputs,
            productTitle: userEnteredTitle,
            savedExchangeRate: effectiveExchangeRate,
          },
          inputs: {
            salePrice: data.pricing.netSellingPriceUSD,
            itemCost: data.pricing.totalCostLocal,
            costCurrency,
            listingCurrency,
            discountPercent: data.pricing.discountPercent,
            sellerCountry,
            exchangeRateOverride: customRate,
          },
          results: {
            effectiveExchangeRate,
            grossRevenueListingCurr: data.pricing.netSellingPriceUSD,
            netProfitListingCurr: data.pricing.netProfitUSD,
            netProfitLocalCurr: data.pricing.netProfitLocal,
            profitMarginPercent: data.pricing.profitMarginPercent,
            breakEvenPriceListingCurr: data.pricing.breakEvenSellingPriceUSD,
            fees: {
              totalEtsyFeesListingCurr: data.pricing.platformFeeUSD,
            },
          },
          listingTags: tags,
          material: aiMaterial,
          fullDescription: aiFullDescription,
          personalizationInstructions: aiPersonalizationInstructions,
          alternativeTitles: aiAlternativeTitles,
          metaDescription: aiMetaDescription,
          bulletPoints: aiBulletPoints,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (isUpdating) {
          setSaveToast(userEnteredTitle ? `Updated "${userEnteredTitle}" successfully!` : 'Listing updated successfully!');
          setEditingListingTitle(savedTitle);
        } else {
          setSaveToast(userEnteredTitle ? `Saved "${userEnteredTitle}" to library!` : 'Saved to library!');
          const newId = json.data?._id || json.data?.id;
          if (newId) {
            setEditingListingId(newId);
            setEditingListingTitle(savedTitle);
          }
        }

        setSavedSnapshot({
          productTitle: userEnteredTitle,
          productCost: studioInputs.productCost,
          shippingCost: studioInputs.shippingCost,
          extraCost: studioInputs.extraCost,
          platformFeePercent: studioInputs.platformFeePercent,
          profitMarginPercent: studioInputs.profitMarginPercent,
          discountPercent: studioInputs.discountPercent,
          costCurrency,
          listingCurrency,
          customRate,
          material: aiMaterial,
          fullDescription: aiFullDescription,
          tags: [...tags],
        });
        setSavedRateBanner(null);

        await loadSavedListings();
      } else {
        setSaveToast(json.error || 'Failed to save listing.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveToast('Saved locally.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Save Full Calculator / SEO to MongoDB
  const handleSaveListing = async () => {
    setIsSaving(true);
    try {
      const titleInput = document.getElementById('listingTitleInput') as HTMLInputElement | null;
      const title = titleInput?.value?.trim() || studioInputs.productTitle?.trim() || listingTitle || 'Etsy Calculation';
      const endpoint = editingListingId ? `/api/listings/${editingListingId}` : '/api/listings';
      const method = editingListingId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          listingType: inputs.listingType || 'physical',
          studioPricing: {
            ...studioInputs,
            productTitle: title,
            savedExchangeRate: effectiveExchangeRate,
          },
          inputs,
          results: calculationResult,
          listingTags: tags,
          material: aiMaterial,
          fullDescription: aiFullDescription,
          personalizationInstructions: aiPersonalizationInstructions,
          alternativeTitles: aiAlternativeTitles,
          metaDescription: aiMetaDescription,
          bulletPoints: aiBulletPoints,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!editingListingId && data.data?._id) {
          setEditingListingId(data.data._id);
          setEditingListingTitle(title);
        }
        setSaveToast(editingListingId ? `Updated "${title}" successfully!` : `Saved "${title}" to library!`);
        await loadSavedListings();
      } else {
        setSaveToast('Saved locally.');
      }
    } catch (err) {
      setSaveToast('Saved locally.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Core loader execution
  const executeLoadListing = (
    item: SavedListingItem,
    applySavedRate: boolean,
    rateToUse?: number
  ) => {
    const listingId = (item._id || item.id) as string;
    setEditingListingId(listingId || null);
    setEditingListingTitle(item.title || 'Saved Listing');

    const isDefaultListingTitle = (t?: string | null) => {
      if (!t) return true;
      const trimmed = t.trim().toLowerCase();
      return (
        trimmed === '' ||
        trimmed === 'etsy pricing calculation' ||
        trimmed === 'untitled etsy listing' ||
        trimmed === 'etsy calculation' ||
        trimmed === 'saved listing'
      );
    };

    const rawTitle = (item.studioPricing?.productTitle || '').trim();
    const isDefault = isDefaultListingTitle(rawTitle) && isDefaultListingTitle(item.title);
    const initialTitle = isDefault ? '' : (rawTitle || item.title || '');

    // 1. Restore Pricing Studio inputs with exact fields
    if (item.studioPricing) {
      setStudioInputs({
        ...item.studioPricing,
        productTitle: initialTitle,
      });
      setListingTitle(item.title || 'Etsy Pricing Calculation');
    } else if (item.inputs) {
      // Fallback for older saved listings
      setStudioInputs({
        productTitle: initialTitle,
        productCost: item.inputs.itemCost || '',
        shippingCost: item.inputs.shippingActualCost || '',
        extraCost: item.inputs.packagingCost || '',
        platformFeePercent: 15,
        profitMarginPercent: Math.round(item.results?.profitMarginPercent || 35),
        discountPercent: item.inputs.discountPercent || '',
      });
      setListingTitle(item.title || 'Etsy Pricing Calculation');
    }

    // 2. Restore Currencies & Country
    if (item.inputs) {
      setInputs((prev) => ({ ...prev, ...item.inputs }));
      if (item.inputs.costCurrency) setCostCurrency(item.inputs.costCurrency);
      if (item.inputs.listingCurrency) setListingCurrency(item.inputs.listingCurrency);
      if (item.inputs.sellerCountry) setSellerCountry(item.inputs.sellerCountry);
    }

    if (applySavedRate && rateToUse) {
      setCustomRate(rateToUse);
    } else {
      setCustomRate(undefined);
    }

    if (item.listingTags) setTags(item.listingTags);
    setAiMaterial(item.material || '');
    setAiFullDescription(item.fullDescription || '');
    setAiPersonalizationInstructions(item.personalizationInstructions || '');
    setAiAlternativeTitles(item.alternativeTitles || []);
    setAiMetaDescription(item.metaDescription || '');
    setAiBulletPoints(item.bulletPoints || []);

    const snap: SavedSnapshot = {
      productTitle: initialTitle,
      productCost: item.studioPricing?.productCost ?? item.inputs?.itemCost ?? '',
      shippingCost: item.studioPricing?.shippingCost ?? item.inputs?.shippingActualCost ?? '',
      extraCost: item.studioPricing?.extraCost ?? item.inputs?.packagingCost ?? '',
      platformFeePercent: item.studioPricing?.platformFeePercent ?? 15,
      profitMarginPercent: item.studioPricing?.profitMarginPercent ?? (item.results?.profitMarginPercent ? Math.round(item.results.profitMarginPercent) : ''),
      discountPercent: item.studioPricing?.discountPercent ?? item.inputs?.discountPercent ?? '',
      costCurrency: item.inputs?.costCurrency || costCurrency,
      listingCurrency: item.inputs?.listingCurrency || listingCurrency,
      customRate: applySavedRate ? rateToUse : undefined,
      material: item.material || '',
      fullDescription: item.fullDescription || '',
      tags: item.listingTags || [],
    };
    setSavedSnapshot(snap);

    setActiveTab('studio');
    setSaveToast(`Loaded "${item.title}" into calculator!`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Load a saved listing: prompts modal ONLY if currency exchange rate has changed
  const handleLoadSavedListing = async (item: SavedListingItem) => {
    const itemCostCurr = item.inputs?.costCurrency || costCurrency;
    const itemListingCurr = item.inputs?.listingCurrency || listingCurrency;

    // Ensure exchange rates are loaded before making any rate comparison
    let currentRates = exchangeRates;
    if (!currentRates || Object.keys(currentRates).length === 0) {
      try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data.success && data.rates) {
          currentRates = data.rates;
          setExchangeRates(data.rates);
        }
      } catch (err) {
        console.warn('Could not fetch rates during load:', err);
      }
    }

    // Determine what rate was active when this item was saved
    const studioPricingAny = item.studioPricing;
    const savedRate =
      (typeof studioPricingAny?.savedExchangeRate === 'number'
        ? studioPricingAny.savedExchangeRate
        : undefined) ||
      (typeof item.inputs?.exchangeRateOverride === 'number'
        ? item.inputs.exchangeRateOverride
        : undefined) ||
      (typeof item.results?.effectiveExchangeRate === 'number'
        ? item.results.effectiveExchangeRate
        : undefined) ||
      (item.results?.netProfitLocalCurr &&
      item.results?.netProfitListingCurr &&
      item.results.netProfitListingCurr > 0
        ? item.results.netProfitLocalCurr / item.results.netProfitListingCurr
        : undefined);

    // Calculate current live exchange rate for this currency pair
    const fromRate =
      currentRates[itemListingCurr] ||
      SUPPORTED_CURRENCIES[itemListingCurr]?.defaultRateToUSD ||
      1;
    const toRate =
      currentRates[itemCostCurr] ||
      SUPPORTED_CURRENCIES[itemCostCurr]?.defaultRateToUSD ||
      278.5;
    const liveRateToday = (1 / fromRate) * toRate;

    // Check if exchange rate has changed significantly (difference >= 0.5)
    // We compare rounded to 2 decimal places to avoid floating-point micro-variations
    const roundedSaved = savedRate !== undefined ? Math.round(savedRate * 100) / 100 : undefined;
    const roundedLive = Math.round(liveRateToday * 100) / 100;

    const hasRateChanged =
      roundedSaved !== undefined &&
      Object.keys(currentRates).length > 0 &&
      Math.abs(roundedSaved - roundedLive) >= 0.5;

    if (hasRateChanged) {
      // Prompt user with modal: Update to live rate OR keep saved rate
      setPendingRateChange({
        item,
        savedRate: roundedSaved!,
        liveRate: roundedLive,
        costCurrency: itemCostCurr,
        listingCurrency: itemListingCurr,
      });
    } else {
      // Rates match or no historical rate -> Load directly with live rate
      setSavedRateBanner(null);
      executeLoadListing(item, false);
    }
  };

  // Modal Action 1: User chooses to update to today's live rate
  const handleApplyLiveRate = () => {
    if (!pendingRateChange) return;
    setSavedRateBanner(null);
    executeLoadListing(pendingRateChange.item, false);
    setPendingRateChange(null);
  };

  // Modal Action 2: User chooses to keep saved rate -> Loads saved rate + shows banner
  const handleKeepSavedRate = () => {
    if (!pendingRateChange) return;
    executeLoadListing(pendingRateChange.item, true, pendingRateChange.savedRate);
    setSavedRateBanner({
      savedRate: pendingRateChange.savedRate,
      liveRate: pendingRateChange.liveRate,
      costCurrency: pendingRateChange.costCurrency,
      listingCurrency: pendingRateChange.listingCurrency,
    });
    setPendingRateChange(null);
  };

  // Load directly into SEO Helper
  const handleLoadSavedListingToSeo = (item: SavedListingItem) => {
    executeLoadListing(item, false);
    setActiveTab('seo');
  };

  // Modal Close Action: defaults to keeping saved rate safely
  const handleCloseRateModal = () => {
    handleKeepSavedRate();
  };

  // Banner Actions: user can update later or dismiss
  const handleBannerUpdateLive = () => {
    setCustomRate(undefined); // removes custom override, goes live
    setSavedRateBanner(null);
    setSaveToast('Updated to today\'s live market rate!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleBannerDismiss = () => {
    setSavedRateBanner(null);
  };

  // Sync AI Listing Helper Title, Tags & Full Description with Studio
  const handleApplySeoToStudio = (seoData: {
    title: string;
    tags: string[];
    material?: string;
    fullDescription?: string;
    personalizationInstructions?: string;
    alternativeTitles?: string[];
    metaDescription?: string;
    bulletPoints?: string[];
  }) => {
    if (seoData.title) {
      setStudioInputs((prev) => ({ ...prev, productTitle: seoData.title }));
      setListingTitle(seoData.title);
    }
    if (seoData.tags && seoData.tags.length > 0) {
      setTags(seoData.tags);
    }
    if (seoData.material !== undefined) setAiMaterial(seoData.material);
    if (seoData.fullDescription !== undefined) setAiFullDescription(seoData.fullDescription);
    if (seoData.personalizationInstructions !== undefined) setAiPersonalizationInstructions(seoData.personalizationInstructions);
    if (seoData.alternativeTitles) setAiAlternativeTitles(seoData.alternativeTitles);
    if (seoData.metaDescription !== undefined) setAiMetaDescription(seoData.metaDescription);
    if (seoData.bulletPoints) setAiBulletPoints(seoData.bulletPoints);

    setActiveTab('studio');
    setSaveToast('Title, 13 Tags & Full Description applied to Pricing Studio!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Delete a saved listing
  const handleDeleteListing = async (id: string) => {
    try {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      setSavedListings((prev) => prev.filter((i) => (i._id || i.id) !== id));
      if (editingListingId === id) {
        setEditingListingId(null);
        setEditingListingTitle(null);
      }
    } catch (err) {
      console.warn('Could not delete:', err);
    }
  };

  // Save Rules to MongoDB
  const handleSaveRules = async (updated: ShopCustomRule) => {
    setRules(updated);
    const newMargin = updated.minProfitMargin ?? 30;
    const newPlatformFee = updated.defaultPlatformFeePercent ?? 15;
    const newDiscount =
      updated.defaultDiscountPercent !== undefined ? updated.defaultDiscountPercent : 0;

    setStudioInputs((prev) => ({
      ...prev,
      platformFeePercent: newPlatformFee,
      profitMarginPercent: newMargin,
      discountPercent: newDiscount,
    }));

    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRules(data.data);
      }
      setSaveToast('Shop rules & default settings updated!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      console.warn('Could not persist rules:', err);
    }
  };

  // Check if current studio inputs have unsaved changes compared to the database snapshot
  const hasUnsavedChanges = useMemo(() => {
    // If not editing an existing listing, check if any cost was entered
    if (!editingListingId || !savedSnapshot) {
      return Boolean(
        (studioInputs.productCost && Number(studioInputs.productCost) > 0) ||
        (studioInputs.shippingCost && Number(studioInputs.shippingCost) > 0)
      );
    }

    const normNum = (val: unknown) => {
      if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) return 0;
      return Number(val);
    };

    const normMargin = (val: unknown) => {
      if (val === '' || val === null || val === undefined) return 35;
      return Number(val);
    };

    const isDefaultTitle = (t?: string | null) => {
      if (!t) return true;
      const trimmed = t.trim().toLowerCase();
      return (
        trimmed === '' ||
        trimmed === 'etsy pricing calculation' ||
        trimmed === 'untitled etsy listing' ||
        trimmed === 'etsy calculation' ||
        trimmed === 'saved listing'
      );
    };

    // Title comparison:
    // Listing name is not mandatory. If user didn't enter a title, both empty string and system default are treated as unchanged.
    const userTitle = (studioInputs.productTitle || '').trim();
    const savedTitle = (savedSnapshot.productTitle || '').trim();

    let titleChanged = false;
    if (isDefaultTitle(userTitle) && isDefaultTitle(savedTitle)) {
      titleChanged = false;
    } else {
      titleChanged = userTitle.toLowerCase() !== savedTitle.toLowerCase();
    }

    const prodCostChanged = normNum(studioInputs.productCost) !== normNum(savedSnapshot.productCost);
    const shipCostChanged = normNum(studioInputs.shippingCost) !== normNum(savedSnapshot.shippingCost);
    const extraCostChanged = normNum(studioInputs.extraCost) !== normNum(savedSnapshot.extraCost);
    const feeChanged = normNum(studioInputs.platformFeePercent || 15) !== normNum(savedSnapshot.platformFeePercent || 15);
    const marginChanged = normMargin(studioInputs.profitMarginPercent) !== normMargin(savedSnapshot.profitMarginPercent);
    const discountChanged = normNum(studioInputs.discountPercent) !== normNum(savedSnapshot.discountPercent);
    const costCurrChanged = (costCurrency || 'PKR') !== (savedSnapshot.costCurrency || 'PKR');
    const listCurrChanged = (listingCurrency || 'USD') !== (savedSnapshot.listingCurrency || 'USD');
    const customRateChanged = normNum(customRate) !== normNum(savedSnapshot.customRate);

    const tagsChanged =
      savedSnapshot.tags &&
      (tags.length !== savedSnapshot.tags.length ||
        !tags.every((t, i) => t === savedSnapshot.tags![i]));
    const descChanged =
      savedSnapshot.fullDescription !== undefined &&
      (aiFullDescription || '').trim() !== (savedSnapshot.fullDescription || '').trim();
    const matChanged =
      savedSnapshot.material !== undefined &&
      (aiMaterial || '').trim() !== (savedSnapshot.material || '').trim();

    return (
      titleChanged ||
      prodCostChanged ||
      shipCostChanged ||
      extraCostChanged ||
      feeChanged ||
      marginChanged ||
      discountChanged ||
      costCurrChanged ||
      listCurrChanged ||
      customRateChanged ||
      Boolean(tagsChanged) ||
      Boolean(descChanged) ||
      Boolean(matChanged)
    );
  }, [
    editingListingId,
    savedSnapshot,
    studioInputs,
    costCurrency,
    listingCurrency,
    customRate,
    tags,
    aiMaterial,
    aiFullDescription,
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Header with Navigation and Live Currency Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        costCurrency={costCurrency}
        setCostCurrency={setCostCurrency}
        listingCurrency={listingCurrency}
        setListingCurrency={setListingCurrency}
        sellerCountry={sellerCountry}
        setSellerCountry={setSellerCountry}
        exchangeRate={effectiveExchangeRate}
        isCustomRate={customRate !== undefined}
        onSetCustomRate={(rate) => setCustomRate(rate)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenInvoice={() => {
          setActiveInvoiceTitle(studioInputs.productTitle || 'Etsy Listing Cost & Profit Slip');
          setIsInvoiceOpen(true);
        }}
        savedCount={savedListings.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Save Toast Notification */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold animate-bounce flex items-center space-x-2">
            <span>✨ {saveToast}</span>
          </div>
        )}

        {/* TAB 1: PRICING & FEE STUDIO (THE CORE WORKFLOW WITH ITEMIZED BREAKDOWN) */}
        {activeTab === 'studio' && (
          <EtsyPricingStudio
            studioInputs={studioInputs}
            setStudioInputs={setStudioInputs}
            costCurrency={costCurrency}
            setCostCurrency={setCostCurrency}
            listingCurrency={listingCurrency}
            setListingCurrency={setListingCurrency}
            exchangeRate={effectiveExchangeRate}
            rules={rules}
            savedRateBanner={
              savedRateBanner
                ? {
                    ...savedRateBanner,
                    onUpdateLive: handleBannerUpdateLive,
                    onDismiss: handleBannerDismiss,
                  }
                : null
            }
            onSetCustomRate={(rate) => setCustomRate(rate)}
            onOpenInvoiceWithPricing={handleOpenStudioInvoice}
            onSaveToDb={handleSavePricingStudio}
            isSaving={isSaving}
            editingListingId={editingListingId}
            editingListingTitle={editingListingTitle}
            hasUnsavedChanges={hasUnsavedChanges}
            onCancelEditing={handleCancelEditing}
            onResetAll={handleReset}
            shippingRates={shippingRates}
            onNavigateToShipping={() => setActiveTab('shipping')}
          />
        )}

        {/* TAB 3: LISTING HELPER & 13 TAGS */}
        {activeTab === 'seo' && (
          <ListingSeoHelper
            initialTitle={studioInputs.productTitle || listingTitle}
            initialTags={tags}
            initialMaterial={aiMaterial}
            initialFullDescription={aiFullDescription}
            initialPersonalizationInstructions={aiPersonalizationInstructions}
            initialAlternativeTitles={aiAlternativeTitles}
            initialMetaDescription={aiMetaDescription}
            initialBulletPoints={aiBulletPoints}
            activeListingId={editingListingId}
            onTagsChange={(updatedTags) => setTags(updatedTags)}
            onApplyToStudio={handleApplySeoToStudio}
            onSeoStateChange={(updated) => {
              if (updated.title !== undefined) {
                setListingTitle(updated.title);
                setStudioInputs((prev) => ({ ...prev, productTitle: updated.title || '' }));
              }
              if (updated.tags) setTags(updated.tags);
              if (updated.material !== undefined) setAiMaterial(updated.material);
              if (updated.fullDescription !== undefined) setAiFullDescription(updated.fullDescription);
              if (updated.personalizationInstructions !== undefined) setAiPersonalizationInstructions(updated.personalizationInstructions);
              if (updated.alternativeTitles) setAiAlternativeTitles(updated.alternativeTitles);
              if (updated.metaDescription !== undefined) setAiMetaDescription(updated.metaDescription);
              if (updated.bulletPoints) setAiBulletPoints(updated.bulletPoints);
            }}
            onSaveToMainDb={handleSaveListing}
            savedListings={savedListings}
            onLoadSavedListing={handleLoadSavedListing}
          />
        )}

        {/* TAB 3: SHIPPING RATE MANAGER */}
        {activeTab === 'shipping' && (
          <ShippingManager
            exchangeRate={effectiveExchangeRate}
            listingCurrency={listingCurrency}
            onRatesUpdated={loadShippingRates}
          />
        )}

        {/* TAB 4: SAVED LISTINGS */}
        {activeTab === 'saved' && (
          <SavedListingsDrawer
            listings={savedListings}
            onLoadListing={handleLoadSavedListing}
            onLoadListingToSeo={handleLoadSavedListingToSeo}
            onDeleteListing={handleDeleteListing}
            listingCurrency={listingCurrency}
          />
        )}
      </main>

      {/* Rate Change Confirmation Modal */}
      {pendingRateChange && (
        <RateChangeModal
          isOpen={Boolean(pendingRateChange)}
          listingTitle={pendingRateChange.item.title || 'Saved Listing'}
          costCurrency={pendingRateChange.costCurrency}
          listingCurrency={pendingRateChange.listingCurrency}
          savedRate={pendingRateChange.savedRate}
          liveRate={pendingRateChange.liveRate}
          onApplyLiveRate={handleApplyLiveRate}
          onKeepSavedRate={handleKeepSavedRate}
          onClose={handleCloseRateModal}
        />
      )}

      {/* Invoice & Printable Slip Modal with Cloudinary Share & History */}
      <PrintInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setPricingStudioSnapshot(undefined);
        }}
        inputs={inputs}
        result={calculationResult}
        pricingStudioResult={pricingStudioSnapshot}
        listingTitle={activeInvoiceTitle}
      />

      {/* Custom Rules Modal */}
      <ShopRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={rules}
        onSaveRules={handleSaveRules}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            EtsyCalc Studio © 2026 • Designed for Etsy Sellers Worldwide • Accurate Local Currency, Fees & Strikethrough Pricing
          </p>
          <p className="text-slate-400">
            Automated Fee Engine • Real-time FX Rates • AI Listing SEO • Cloud Receipts
          </p>
        </div>
      </footer>
    </div>
  );
}
