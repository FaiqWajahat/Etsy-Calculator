'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CalculationResult, CalculatorInputs, CloudinarySlipItem } from '@/types/calculator';
import { SellerPricingResult } from '@/lib/pricingEngine';
import { SUPPORTED_CURRENCIES, COUNTRY_FEE_CONFIGS } from '@/lib/constants';
import {
  Printer,
  Share2,
  X,
  Check,
  Receipt,
  AlertCircle,
  Copy,
  Loader2,
  ExternalLink,
  Cloud,
  Trash2,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: CalculatorInputs;
  result?: CalculationResult;
  pricingStudioResult?: SellerPricingResult;
  listingTitle?: string;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  inputs,
  result,
  pricingStudioResult,
  listingTitle = 'Etsy Listing Cost & Profit Slip',
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cloudinary slips history
  const [slipsHistory, setSlipsHistory] = useState<CloudinarySlipItem[]>([]);
  const [isLoadingSlips, setIsLoadingSlips] = useState(false);
  const [pendingDeleteSlip, setPendingDeleteSlip] = useState<CloudinarySlipItem | null>(null);
  const [isDeletingSlip, setIsDeletingSlip] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const listingInfo = SUPPORTED_CURRENCIES[inputs.listingCurrency] || SUPPORTED_CURRENCIES.USD;
  const costInfo = SUPPORTED_CURRENCIES[inputs.costCurrency] || SUPPORTED_CURRENCIES.PKR;
  const countryConfig = COUNTRY_FEE_CONFIGS[inputs.sellerCountry] || COUNTRY_FEE_CONFIGS.US;

  // Use pricingStudioResult if provided, else fallback to standard result
  const isStudioMode = Boolean(pricingStudioResult);

  const displaySellingPrice = isStudioMode
    ? pricingStudioResult!.netSellingPriceUSD
    : result?.grossRevenueListingCurr || inputs.salePrice;

  const displayOriginalPrice = isStudioMode
    ? pricingStudioResult!.originalListingPriceUSD
    : inputs.salePrice;

  const displayDiscount = isStudioMode
    ? pricingStudioResult!.discountPercent
    : inputs.discountPercent || 0;

  const displayTotalCostLocal = isStudioMode
    ? pricingStudioResult!.totalCostLocal
    : result?.totalCostsLocalCurr || inputs.itemCost;

  const displayTotalCostUSD = isStudioMode
    ? pricingStudioResult!.totalCostUSD
    : result?.totalCostsListingCurr || 0;

  const displayPlatformFeeUSD = isStudioMode
    ? pricingStudioResult!.platformFeeUSD
    : result?.fees.totalEtsyFeesListingCurr || 0;

  const displayNetProfitLocal = isStudioMode
    ? pricingStudioResult!.netProfitLocal
    : result?.netProfitLocalCurr || 0;

  const displayNetProfitUSD = isStudioMode
    ? pricingStudioResult!.netProfitUSD
    : result?.netProfitListingCurr || 0;

  const displayMargin = isStudioMode
    ? pricingStudioResult!.profitMarginPercent
    : result?.profitMarginPercent || 0;

  const displayBreakEven = isStudioMode
    ? pricingStudioResult!.breakEvenSellingPriceUSD
    : result?.breakEvenPriceListingCurr || 0;

  // Fetch Cloudinary Slips from MongoDB
  const fetchSlipsHistory = useCallback(async () => {
    setIsLoadingSlips(true);
    try {
      const res = await fetch('/api/slips');
      const data = await res.json();
      if (data.success && data.data) {
        setSlipsHistory(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch slips history:', err);
    } finally {
      setIsLoadingSlips(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSlipsHistory();
    }
  }, [isOpen, fetchSlipsHistory]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareCloudinary = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw crisp receipt graphic on canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 650, 760);

        // Header accent bar
        ctx.fillStyle = '#f1641e';
        ctx.fillRect(0, 0, 650, 10);

        // Brand & Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('EtsyCalc Studio — Cost & Pricing Slip', 40, 50);

        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(listingTitle || 'Handmade Product Pricing Analysis', 40, 75);
        ctx.fillText(
          `Date: ${new Date().toLocaleDateString()} | Currency: ${listingInfo.code} & ${costInfo.code}`,
          40,
          95
        );

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 115);
        ctx.lineTo(610, 115);
        ctx.stroke();

        // 1. Costs
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('1. YOUR COSTS (LOCAL CURRENCY)', 40, 145);
        ctx.fillStyle = '#475569';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Total Money Spent:`, 40, 175);
        ctx.fillText(
          `${costInfo.symbol}${displayTotalCostLocal.toLocaleString()} ${costInfo.code}`,
          480,
          175
        );
        ctx.fillText(`Cost in ${listingInfo.code}:`, 40, 200);
        ctx.fillText(`${listingInfo.symbol}${displayTotalCostUSD.toFixed(2)}`, 480, 200);

        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(40, 220);
        ctx.lineTo(610, 220);
        ctx.stroke();

        // 2. Etsy Pricing & Discount
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('2. ETSY LISTING & SELLING PRICES', 40, 250);
        ctx.fillStyle = '#475569';
        ctx.font = '14px sans-serif';

        if (displayDiscount > 0) {
          ctx.fillText(`Original Listing Price on Etsy:`, 40, 280);
          ctx.fillText(`${listingInfo.symbol}${displayOriginalPrice.toFixed(2)}`, 480, 280);
          ctx.fillText(`Sale Discount:`, 40, 305);
          ctx.fillText(`${displayDiscount}% OFF`, 480, 305);
        }

        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Customer Pays on Etsy:`, 40, 335);
        ctx.fillText(
          `${listingInfo.symbol}${displaySellingPrice.toFixed(2)} ${listingInfo.code}`,
          480,
          335
        );

        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(40, 355);
        ctx.lineTo(610, 355);
        ctx.stroke();

        // 3. Platform Cut
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('3. PLATFORM DEDUCTIONS', 40, 385);
        ctx.fillStyle = '#475569';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Etsy & Payoneer Combined Cut:`, 40, 415);
        ctx.fillText(`-${listingInfo.symbol}${displayPlatformFeeUSD.toFixed(2)}`, 480, 415);
        ctx.fillText(`Break-Even Selling Price:`, 40, 440);
        ctx.fillText(`${listingInfo.symbol}${displayBreakEven.toFixed(2)}`, 480, 440);

        // 4. Net Profit Banner
        ctx.fillStyle = '#10b981';
        ctx.fillRect(40, 475, 570, 80);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('NET TAKE-HOME PROFIT', 60, 505);
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(
          `+${costInfo.symbol}${displayNetProfitLocal.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })} ${costInfo.code}`,
          60,
          540
        );
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`Margin: ${displayMargin.toFixed(1)}%`, 450, 515);
        ctx.font = '14px sans-serif';
        ctx.fillText(
          `(+${listingInfo.symbol}${displayNetProfitUSD.toFixed(2)} ${listingInfo.code})`,
          450,
          540
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText('Generated by EtsyCalc Studio • Designed for Global Sellers', 40, 720);
      }

      const base64Data = canvas.toDataURL('image/png');

      const response = await fetch('/api/share-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      const data = await response.json();
      if (data.success && data.url) {
        setShareUrl(data.url);

        // Automatically persist Cloudinary slip in MongoDB history
        await fetch('/api/slips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: listingTitle || 'Etsy Pricing Slip',
            cloudinaryUrl: data.url,
            publicId: data.publicId || '',
            netSellingPriceUSD: displaySellingPrice,
            originalPriceUSD: displayOriginalPrice,
            discountPercent: displayDiscount,
            netProfitLocal: displayNetProfitLocal,
            costCurrency: costInfo.code,
            listingCurrency: listingInfo.code,
          }),
        });

        // Refresh history list
        fetchSlipsHistory();
      } else {
        setUploadError(data.message || 'Could not generate share link.');
      }
    } catch (err: unknown) {
      console.error('Share error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error sharing';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = (url: string, id?: string) => {
    navigator.clipboard.writeText(url);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteSlip = async (id: string) => {
    try {
      await fetch(`/api/slips?id=${id}`, { method: 'DELETE' });
      setSlipsHistory((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.warn('Could not delete slip:', err);
    }
  };

  const handleConfirmDeleteSlip = async () => {
    if (!pendingDeleteSlip) return;
    setIsDeletingSlip(true);
    try {
      const slipId = (pendingDeleteSlip._id || pendingDeleteSlip.id) as string;
      await handleDeleteSlip(slipId);
      setPendingDeleteSlip(null);
    } finally {
      setIsDeletingSlip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header with Tabs */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Selector */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'current'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Current Calculation Slip</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span>Cloudinary Uploaded Slips</span>
              {slipsHistory.length > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-orange-700 rounded-full text-[10px] font-black">
                  {slipsHistory.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition self-end sm:self-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB 1: CURRENT CALCULATION SLIP */}
        {activeTab === 'current' && (
          <>
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto" ref={printAreaRef}>
              {/* Slip Header */}
              <div className="border-b-2 border-dashed border-slate-200 pb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
                      EtsyCalc Studio
                    </span>
                    <h4 className="text-xl font-black text-slate-900 mt-0.5">
                      {listingTitle || 'Listing Pricing Slip'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Local Currency: {costInfo.code} ({costInfo.symbol}) • Listing Currency:{' '}
                      {listingInfo.code} • Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold uppercase text-slate-400 block">
                      Break-Even Price
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {listingInfo.symbol}
                      {displayBreakEven.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Costs Section */}
              <div className="space-y-2 text-xs sm:text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  1. Your Costs in Local Currency
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Total Money Spent on Product:</span>
                  <span className="font-bold text-slate-900">
                    {costInfo.symbol}
                    {displayTotalCostLocal.toLocaleString()} {costInfo.code}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Cost in {listingInfo.code}:</span>
                  <span>
                    {listingInfo.symbol}
                    {displayTotalCostUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pricing & Discount Section */}
              <div className="space-y-2 text-xs sm:text-sm border-t border-dashed border-slate-200 pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 block mb-1">
                  2. Etsy Listing & Sale Pricing
                </span>

                {displayDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Original Strikethrough Price on Etsy:</span>
                      <span className="font-semibold text-slate-900 line-through">
                        {listingInfo.symbol}
                        {displayOriginalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Display Sale Discount:</span>
                      <span className="font-bold text-rose-600">{displayDiscount}% OFF</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>What Etsy Customer Pays:</span>
                  <span className="text-base text-slate-900">
                    {listingInfo.symbol}
                    {displaySellingPrice.toFixed(2)} {listingInfo.code}
                  </span>
                </div>
              </div>

              {/* Platform Deductions */}
              <div className="space-y-2 text-xs sm:text-sm border-t border-dashed border-slate-200 pt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  3. Platform Deductions
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Etsy & Payoneer Combined Fees:</span>
                  <span className="font-semibold text-orange-600">
                    -{listingInfo.symbol}
                    {displayPlatformFeeUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Profit Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Net Take-Home Profit
                  </span>
                  <div className="text-3xl font-black text-emerald-700">
                    +{costInfo.symbol}
                    {displayNetProfitLocal.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    <span className="text-sm font-semibold text-emerald-600">
                      {costInfo.code}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-800 mt-1">
                    ≈ +{listingInfo.symbol}
                    {displayNetProfitUSD.toFixed(2)} {listingInfo.code}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 block">Profit Margin</span>
                  <span className="text-2xl font-black text-emerald-800">
                    {displayMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Cloudinary Shared Link Display */}
              {shareUrl && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-2 no-print">
                  <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Shareable Cloudinary Slip Created & Saved!</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(shareUrl)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white border border-orange-200 rounded-lg text-slate-600 hover:text-orange-600 transition"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-600 flex items-center gap-1 no-print">
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-xs text-slate-500">
                Click Share to create a hosted Cloudinary image link that never expires.
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleShareCloudinary}
                  disabled={isUploading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  ) : (
                    <Share2 className="w-4 h-4 text-orange-600" />
                  )}
                  <span>{isUploading ? 'Uploading to Cloudinary...' : 'Upload & Share Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ALL CLOUDINARY UPLOADED SLIPS HISTORY */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Cloudinary Uploaded Slips ({slipsHistory.length})
                </h4>
                <p className="text-xs text-slate-500">
                  All invoice slips you have uploaded to Cloudinary CDN with shareable links
                </p>
              </div>
              <button
                type="button"
                onClick={fetchSlipsHistory}
                disabled={isLoadingSlips}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold"
              >
                {isLoadingSlips ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {slipsHistory.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Cloud className="w-8 h-8 text-slate-400 mx-auto" />
                <h5 className="text-sm font-bold text-slate-700">No Cloudinary slips uploaded yet</h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When you calculate a product and click <strong>"Upload & Share Link"</strong>, your slip will be stored on Cloudinary and listed here permanently.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {slipsHistory.map((slip) => {
                  const slipId = (slip._id || slip.id) as string;
                  const isThisCopied = copiedId === slipId;

                  return (
                    <div
                      key={slipId}
                      className="bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 transition shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 line-clamp-1">
                              {slip.title || 'Etsy Pricing Slip'}
                            </h5>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(slip.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">
                                Profit: +{slip.costCurrency} {slip.netProfitLocal?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPendingDeleteSlip(slip)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition cursor-pointer"
                          title="Delete from list"
                          aria-label="Delete slip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Cloudinary Link Box with Copy Button */}
                      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          readOnly
                          value={slip.cloudinaryUrl}
                          className="flex-1 text-xs font-mono text-slate-600 bg-transparent focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyLink(slip.cloudinaryUrl, slipId)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition cursor-pointer"
                        >
                          {isThisCopied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{isThisCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={slip.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-500 hover:text-orange-600 transition"
                          title="Open image in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Deleting Slip */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteSlip)}
        onClose={() => setPendingDeleteSlip(null)}
        onConfirm={handleConfirmDeleteSlip}
        itemName={pendingDeleteSlip?.title || 'Cloud Invoice Slip'}
        itemType="invoice"
        isDeleting={isDeletingSlip}
      />
    </div>
  );
};
