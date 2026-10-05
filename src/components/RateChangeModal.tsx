'use client';

import React from 'react';
import { ArrowRightLeft, Sparkles, Clock, RefreshCw, X } from 'lucide-react';

interface RateChangeModalProps {
  isOpen: boolean;
  listingTitle: string;
  costCurrency: string;
  listingCurrency: string;
  savedRate: number;
  liveRate: number;
  onApplyLiveRate: () => void;
  onKeepSavedRate: () => void;
  onClose: () => void;
}

export const RateChangeModal: React.FC<RateChangeModalProps> = ({
  isOpen,
  listingTitle,
  costCurrency,
  listingCurrency,
  savedRate,
  liveRate,
  onApplyLiveRate,
  onKeepSavedRate,
  onClose,
}) => {
  if (!isOpen) return null;

  const diff = liveRate - savedRate;
  const percentDiff = savedRate > 0 ? (diff / savedRate) * 100 : 0;
  const isHigher = diff > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Exchange Rate Changed</h3>
              <p className="text-[11px] text-slate-500">Currency rate has updated since last saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            The currency exchange rate for <strong>&ldquo;{listingTitle || 'Saved Listing'}&rdquo;</strong> has
            changed in the live Forex market. How would you like to load this listing?
          </p>

          {/* Rate Comparison Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Saved Rate Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Original Saved Rate</span>
              </span>
              <div className="text-lg font-black text-slate-800">
                {savedRate.toFixed(2)} <span className="text-xs font-semibold text-slate-500">{costCurrency}</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                1 {listingCurrency} = {savedRate.toFixed(2)} {costCurrency}
              </span>
            </div>

            {/* Live Today Rate Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-left space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Today&apos;s Live Rate</span>
              </span>
              <div className="text-lg font-black text-emerald-900">
                {liveRate.toFixed(2)} <span className="text-xs font-semibold text-emerald-700">{costCurrency}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium block">
                1 {listingCurrency} = {liveRate.toFixed(2)} {costCurrency}
              </span>
            </div>
          </div>

          {/* Difference Chip */}
          <div className="p-2.5 bg-slate-50 rounded-xl text-center text-xs font-semibold text-slate-600 border border-slate-100 flex items-center justify-center gap-1.5">
            <span>Market Change:</span>
            <span className={isHigher ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {isHigher ? '+' : ''}{diff.toFixed(2)} {costCurrency} ({isHigher ? '+' : ''}{percentDiff.toFixed(1)}%)
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            💡 If you keep the saved rate, you can still switch to today&apos;s live rate anytime using the top banner.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            {/* Option A: Keep Saved Rate */}
            <button
              type="button"
              onClick={onKeepSavedRate}
              className="w-full sm:w-1/2 py-2.5 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Keep Saved Rate ({savedRate.toFixed(2)})</span>
            </button>

            {/* Option B: Update to Live Rate (Primary) */}
            <button
              type="button"
              onClick={onApplyLiveRate}
              className="w-full sm:w-1/2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update to Today&apos;s Rate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
