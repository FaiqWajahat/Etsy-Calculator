'use client';

import React, { useState } from 'react';
import { SavedListingItem, CurrencyCode } from '@/types/calculator';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import {
  BookmarkCheck,
  Search,
  Trash2,
  ArrowUpRight,
  Package,
  Calendar,
  FileText,
  Copy,
  Check,
  X,
  Tags,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
  DollarSign,
  Info,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface SavedListingsDrawerProps {
  listings: SavedListingItem[];
  onLoadListing: (item: SavedListingItem) => void;
  onLoadListingToSeo?: (item: SavedListingItem) => void;
  onDeleteListing: (id: string) => void;
  listingCurrency: CurrencyCode;
}

export const SavedListingsDrawer: React.FC<SavedListingsDrawerProps> = ({
  listings,
  onLoadListing,
  onLoadListingToSeo,
  onDeleteListing,
  listingCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'pricing'>('all');
  const [pendingDeleteListing, setPendingDeleteListing] = useState<SavedListingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewAiItem, setPreviewAiItem] = useState<SavedListingItem | null>(null);
  const [copiedState, setCopiedState] = useState<{ id: string; field: string } | null>(null);
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({});

  const handleCopyField = (id: string, field: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedState({ id, field });
    setTimeout(() => setCopiedState(null), 2000);
  };

  const toggleDesc = (id: string) => {
    setExpandedDescIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteListing) return;
    setIsDeleting(true);
    try {
      const id = (pendingDeleteListing._id || pendingDeleteListing.id) as string;
      await onDeleteListing(id);
      setPendingDeleteListing(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Counts for filter pills
  const aiCount = listings.filter((item) =>
    Boolean(
      (item.listingTags && item.listingTags.length > 0) ||
      item.material ||
      item.fullDescription ||
      (item.alternativeTitles && item.alternativeTitles.length > 0)
    )
  ).length;

  const pricingCount = listings.filter((item) =>
    Boolean(item.inputs?.salePrice && Number(item.inputs.salePrice) > 0)
  ).length;

  const filtered = listings.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const titleMatch = (item.title || 'Untitled').toLowerCase().includes(q);
    const matMatch = (item.material || '').toLowerCase().includes(q);
    const tagMatch = item.listingTags && item.listingTags.some((t) => t.toLowerCase().includes(q));
    const descMatch = (item.fullDescription || '').toLowerCase().includes(q);
    const matchesSearch = !q || titleMatch || matMatch || tagMatch || descMatch;

    if (!matchesSearch) return false;

    const hasAiData = Boolean(
      (item.listingTags && item.listingTags.length > 0) ||
      item.material ||
      item.fullDescription ||
      (item.alternativeTitles && item.alternativeTitles.length > 0)
    );
    const hasPricingData = Boolean(
      item.inputs?.salePrice && Number(item.inputs.salePrice) > 0
    );

    if (filterType === 'ai') return hasAiData;
    if (filterType === 'pricing') return hasPricingData;
    return true;
  });

  const listingInfo = SUPPORTED_CURRENCIES[listingCurrency] || SUPPORTED_CURRENCIES.USD;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Row 1: Header Title & Subtitle */}
      <div className="flex items-center space-x-3 pb-1">
        <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <BookmarkCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Saved Listings Library
          </h2>
          <p className="text-xs text-slate-500">
            Browse, copy, and load your saved Etsy listings with full AI copywriting, 13 SEO tags, and pricing calculations
          </p>
        </div>
      </div>

      {/* Row 2: Next Line - Filter Tabs Toolbar & Search Box */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-4 border-y border-slate-100">
        {/* Quick Filters */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-semibold text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            All Listings ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ai')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'ai'
                ? 'bg-white text-purple-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Copy & Tags ({aiCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pricing')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterType === 'pricing'
                ? 'bg-white text-orange-700 shadow-xs font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-orange-600" />
            <span>Pricing ({pricingCount})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, material, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No saved listings found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || filterType !== 'all'
              ? 'No listings match your current search or filter. Try clearing the search query.'
              : 'Generate an AI listing in "Listing Helper & 13 Tags" or calculate prices in "Pricing Studio" and click "Save Listing".'}
          </p>
        </div>
      ) : (
        /* Listings Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const id = (item._id || item.id) as string;
            const res = item.results;
            const itemListingInfo =
              SUPPORTED_CURRENCIES[item.inputs?.listingCurrency || 'USD'] || SUPPORTED_CURRENCIES.USD;
            const tags = Array.isArray(item.listingTags) ? item.listingTags : [];
            const tagCount = tags.length;
            const hasDesc = Boolean(item.fullDescription?.trim());
            const hasPricing = Boolean(item.inputs?.salePrice && Number(item.inputs.salePrice) > 0);
            const hasAlts = Array.isArray(item.alternativeTitles) && item.alternativeTitles.length > 0;
            const isDescExpanded = Boolean(expandedDescIds[id]);
            const wordCount = hasDesc ? item.fullDescription!.trim().split(/\s+/).length : 0;

            return (
              <div
                key={id}
                className="bg-white border border-slate-200 hover:border-orange-300 rounded-3xl p-5 sm:p-6 transition shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3.5">
                  {/* Title & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition leading-snug">
                        {item.title || 'Untitled Etsy Listing'}
                      </h4>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {hasPricing && res?.profitMarginPercent !== undefined && (
                          <span
                            className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full ${
                              res.profitMarginPercent >= 35
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.profitMarginPercent >= 20
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {res.profitMarginPercent.toFixed(1)}% Margin
                          </span>
                        )}

                        {(hasDesc || tagCount > 0) && (
                          <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 shrink-0 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                            <span>AI SEO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Material Badge & Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                      {item.material && (
                        <span className="font-semibold text-slate-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <span>Material:</span>
                          <strong className="text-amber-950 font-bold">{item.material}</strong>
                        </span>
                      )}

                      <span className="text-slate-400">•</span>
                      <span>{item.title ? `${item.title.length}/140 chars` : ''}</span>

                      {item.createdAt && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 13 ETSY SEARCH TAGS SECTION */}
                  {tagCount > 0 && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                          <Tags className="w-3.5 h-3.5 text-amber-700" />
                          <span>13 Etsy Search Tags ({tagCount})</span>
                        </div>

                        {/* Copy All Tags Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyField(id, 'tags', tags.join(', '))}
                          className="text-3xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                          title="Copy all tags comma-separated for Etsy listing manager"
                        >
                          {copiedState?.id === id && copiedState?.field === 'tags' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied 13 Tags!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-amber-800" />
                              <span>Copy All 13 Tags</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="text-3xs font-semibold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRODUCT DESCRIPTION SECTION */}
                  {hasDesc && (
                    <div className="p-3 bg-purple-50/40 border border-purple-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-950">
                          <FileText className="w-3.5 h-3.5 text-purple-700" />
                          <span>Etsy Copywriting ({wordCount} words)</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Copy Description Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyField(id, 'desc', item.fullDescription!)}
                            className="text-3xs font-bold text-purple-900 hover:text-purple-950 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                            title="Copy full description for Etsy listing"
                          >
                            {copiedState?.id === id && copiedState?.field === 'desc' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-purple-800" />
                                <span>Copy Description</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleDesc(id)}
                            className="text-3xs font-semibold text-purple-700 hover:text-purple-900 px-1 py-0.5"
                          >
                            {isDescExpanded ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                      </div>

                      <p
                        className={`text-2xs text-slate-700 whitespace-pre-wrap leading-relaxed ${
                          isDescExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {item.fullDescription}
                      </p>
                    </div>
                  )}

                  {/* PERSONALIZATION INSTRUCTIONS (IF SAVED) */}
                  {item.personalizationInstructions && (
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-bold uppercase tracking-wider text-amber-800">
                          Personalization Box Guide
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyField(id, 'pers', item.personalizationInstructions!)}
                          className="text-3xs font-bold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
                        >
                          {copiedState?.id === id && copiedState?.field === 'pers' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-2xs text-slate-700 line-clamp-2">
                        {item.personalizationInstructions}
                      </p>
                    </div>
                  )}

                  {/* ALTERNATIVE TITLES (IF SAVED) */}
                  {hasAlts && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">
                        Alternative SEO Titles ({item.alternativeTitles!.length})
                      </span>
                      {item.alternativeTitles!.map((alt, altIdx) => (
                        <div
                          key={altIdx}
                          className="flex items-center justify-between text-2xs text-slate-700 gap-2 bg-white px-2 py-1 rounded-md border border-slate-100"
                        >
                          <span className="truncate">{alt}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyField(id, `alt-${altIdx}`, alt)}
                            className="text-3xs text-slate-400 hover:text-orange-600 shrink-0 inline-flex items-center gap-0.5"
                            title="Copy alternative title"
                          >
                            {copiedState?.id === id && copiedState?.field === `alt-${altIdx}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PRICING STATS (IF SAVED) */}
                  {hasPricing && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-3xs text-slate-400 block font-semibold">Sale Price</span>
                        <span className="font-bold text-slate-800">
                          {itemListingInfo.symbol}
                          {item.inputs?.salePrice?.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-400 block font-semibold">
                          {item.studioPricing ? 'Local Cost' : 'Etsy Fees'}
                        </span>
                        <span className="font-bold text-orange-600">
                          {item.studioPricing
                            ? `${item.inputs?.costCurrency || 'PKR'} ${(
                                (typeof item.studioPricing.productCost === 'number'
                                  ? item.studioPricing.productCost
                                  : 0) +
                                (typeof item.studioPricing.shippingCost === 'number'
                                  ? item.studioPricing.shippingCost
                                  : 0)
                              ).toLocaleString()}`
                            : `${itemListingInfo.symbol}${res?.fees?.totalEtsyFeesListingCurr?.toFixed(2)}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-3xs text-slate-400 block font-semibold">Take-Home</span>
                        <span className="font-extrabold text-emerald-600">
                          +{itemListingInfo.symbol}
                          {res?.netProfitListingCurr?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Load into Calculator & Pricing Studio */}
                    <button
                      type="button"
                      onClick={() => onLoadListing(item)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <span>Load in Studio</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Open in SEO Helper */}
                    {onLoadListingToSeo && (
                      <button
                        type="button"
                        onClick={() => onLoadListingToSeo(item)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3 text-purple-600" />
                        <span>SEO Helper</span>
                      </button>
                    )}

                    {/* View Full Modal */}
                    <button
                      type="button"
                      onClick={() => setPreviewAiItem(item)}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setPendingDeleteListing(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete saved listing"
                    aria-label="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal Before Deleting Listing */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteListing)}
        onClose={() => setPendingDeleteListing(null)}
        onConfirm={handleConfirmDelete}
        itemName={pendingDeleteListing?.title || 'Saved Listing'}
        itemType="listing"
        isDeleting={isDeleting}
      />

      {/* Detailed Full Listing Modal */}
      {previewAiItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 truncate max-w-sm">
                    {previewAiItem.title}
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Saved Etsy Listing Details (AI SEO, 13 Tags & Copywriting)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewAiItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Product Title Section */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Product Title ({previewAiItem.title?.length || 0}/140 chars)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyField('modal', 'title', previewAiItem.title)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    {copiedState?.id === 'modal' && copiedState?.field === 'title' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Title!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-900 font-semibold">{previewAiItem.title}</p>
                {previewAiItem.material && (
                  <p className="text-2xs text-slate-500 font-medium pt-1">
                    Material: <strong className="text-slate-800 font-semibold">{previewAiItem.material}</strong>
                  </p>
                )}
              </div>

              {/* 13 Search Tags Section */}
              {previewAiItem.listingTags && previewAiItem.listingTags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5 text-amber-600" />
                      <span>13 Search Tags ({previewAiItem.listingTags.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('modal', 'tags', previewAiItem.listingTags!.join(', '))}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      {copiedState?.id === 'modal' && copiedState?.field === 'tags' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied 13 Tags!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All Tags</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                    {previewAiItem.listingTags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-2xs font-semibold px-2.5 py-1 bg-white rounded-lg border border-amber-200 text-slate-800"
                      >
                        #{t} <span className="text-3xs text-slate-400">({t.length}/20)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Description Section */}
              {previewAiItem.fullDescription && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>Full Etsy Product Description</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('modal', 'desc', previewAiItem.fullDescription!)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      {copiedState?.id === 'modal' && copiedState?.field === 'desc' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied Description!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Description</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {previewAiItem.fullDescription}
                  </div>
                </div>
              )}

              {/* Personalization Section */}
              {previewAiItem.personalizationInstructions && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Personalization Box Guide
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyField('modal', 'pers', previewAiItem.personalizationInstructions!)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      {copiedState?.id === 'modal' && copiedState?.field === 'pers' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-slate-800">
                    {previewAiItem.personalizationInstructions}
                  </div>
                </div>
              )}

              {/* Alternative Titles */}
              {previewAiItem.alternativeTitles && previewAiItem.alternativeTitles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">
                    Alternative High-Ranking Titles
                  </span>
                  <div className="space-y-1.5">
                    {previewAiItem.alternativeTitles.map((alt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 gap-2"
                      >
                        <span>{alt}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyField('modal', `alt-${idx}`, alt)}
                          className="text-slate-400 hover:text-orange-600 shrink-0"
                          title="Copy alternative title"
                        >
                          {copiedState?.id === 'modal' && copiedState?.field === `alt-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoadListing(previewAiItem);
                    setPreviewAiItem(null);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                >
                  <span>Load in Pricing Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                {onLoadListingToSeo && (
                  <button
                    type="button"
                    onClick={() => {
                      onLoadListingToSeo(previewAiItem);
                      setPreviewAiItem(null);
                    }}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Open in SEO Helper</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewAiItem(null)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
